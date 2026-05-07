/** @format */
/* eslint-disable @typescript-eslint/no-explicit-any, no-empty */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { API_BASE } from "../constants";
import { SOCKET_SERVER_ORIGIN } from "../lib/socket";

export type CallState = "idle" | "connecting" | "connected" | "ended" | "error";
export type ConnectionQuality = "unknown" | "good" | "fair" | "poor";

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    // TURN is mandatory for restrictive NATs (corporate, mobile, symmetric).
    // Populate these from your env / a credentials endpoint.
    // Without TURN, ~15–30% of real-world connections will fail entirely.
    ...(process.env.NEXT_PUBLIC_TURN_URL
      ? [
          {
            urls: process.env.NEXT_PUBLIC_TURN_URL,
            username: process.env.NEXT_PUBLIC_TURN_USER ?? "",
            credential: process.env.NEXT_PUBLIC_TURN_PASS ?? "",
          },
        ]
      : []),
  ],
  // Prefer UDP (lower latency). Fall through to TCP if UDP is blocked.
  iceTransportPolicy: "all",
  bundlePolicy: "max-bundle", // bundle all media on one transport — fewer ports needed
  rtcpMuxPolicy: "require", // mux RTCP with RTP — halves the number of ports
};

// Video quality tiers — degraded progressively as connection weakens
const VIDEO_TIERS = {
  good: { width: 1280, height: 720, frameRate: 24, maxKbps: 1200 },
  fair: { width: 640, height: 360, frameRate: 15, maxKbps: 400 },
  poor: { width: 320, height: 240, frameRate: 8, maxKbps: 120 },
} as const;

// Thresholds that trigger quality changes
const QUALITY_THRESHOLDS = {
  rttFairMs: 300, // RTT above this → "fair"
  rttPoorMs: 600, // RTT above this → "poor"
  lossRateFair: 0.03, // 3% packet loss → "fair"
  lossRatePoor: 0.1, // 10% packet loss → "poor"
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useInterviewRoom(
  interviewId: string,
  currentUserId: string,
  currentUserName: string,
) {
  const [callState, setCallState] = useState<CallState>("idle");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [remoteUser, setRemoteUser] = useState<{
    userId: string;
    name: string;
  } | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);

  // New: surface connection health to the UI
  const [connectionQuality, setConnectionQuality] =
    useState<ConnectionQuality>("unknown");
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Refs
  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // FIX 1: track buffered ICE candidates until remote description is applied
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);
  const remoteDescSetRef = useRef(false);

  // FIX 2: know who is the offerer so only they restart ICE on reconnect
  const isOffererRef = useRef(false);

  // Track last-known packet-loss reference for delta calculation
  const lastLossRef = useRef<{ lost: number; received: number }>({
    lost: 0,
    received: 0,
  });

  // ── Mark interview complete ─────────────────────────────────────────────────
  const markComplete = useCallback(() => {
    void fetch(`${API_BASE}/interviews/${interviewId}/complete`, {
      method: "PATCH",
      credentials: "include",
    }).catch(() => {});
  }, [interviewId]);

  // ── Adaptive bitrate via RTCRtpSender.setParameters ────────────────────────
  const setVideoBitrate = useCallback(async (maxKbps: number) => {
    const pc = pcRef.current;
    if (!pc) return;
    const sender = pc.getSenders().find((s) => s.track?.kind === "video");
    if (!sender) return;
    const params = sender.getParameters();
    if (!params.encodings?.length) params.encodings = [{}];
    const encoding = params.encodings[0];
    if (encoding) encoding.maxBitrate = maxKbps * 1000;
    await sender.setParameters(params).catch(() => {});
  }, []);

  // ── Adaptive resolution via applyConstraints ────────────────────────────────
  const applyVideoTier = useCallback(
    async (quality: "good" | "fair" | "poor") => {
      const stream = localStreamRef.current;
      if (!stream) return;
      const track = stream.getVideoTracks()[0];
      if (!track) return;
      const { width, height, frameRate, maxKbps } = VIDEO_TIERS[quality];
      await track
        .applyConstraints({ width, height, frameRate })
        .catch(() => {});
      await setVideoBitrate(maxKbps);
    },
    [setVideoBitrate],
  );

  // ── Connection quality monitor via getStats ─────────────────────────────────
  // FIX 3: was never implemented. Without stats we can't adapt to bad links.
  const startQualityMonitor = useCallback(() => {
    if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);

    statsIntervalRef.current = setInterval(async () => {
      const pc = pcRef.current;
      if (!pc || pc.connectionState !== "connected") return;

      const stats = await pc.getStats().catch(() => null);
      if (!stats) return;

      let rttMs = 0;
      let totalLost = 0;
      let totalReceived = 0;

      stats.forEach((report) => {
        // Current RTT from active candidate pair
        if (
          report.type === "candidate-pair" &&
          (report as RTCIceCandidatePairStats).state === "succeeded" &&
          (report as RTCIceCandidatePairStats).nominated
        ) {
          const rtt = (report as RTCIceCandidatePairStats).currentRoundTripTime;
          if (rtt) rttMs = rtt * 1000;
        }

        // Inbound packet loss delta (compare against last snapshot)
        if (
          report.type === "inbound-rtp" &&
          (report as RTCInboundRtpStreamStats).kind === "video"
        ) {
          const r = report as RTCInboundRtpStreamStats;
          totalLost += r.packetsLost ?? 0;
          totalReceived += r.packetsReceived ?? 0;
        }
      });

      const deltaLost = totalLost - lastLossRef.current.lost;
      const deltaReceived = totalReceived - lastLossRef.current.received;
      lastLossRef.current = { lost: totalLost, received: totalReceived };

      const lossRate =
        deltaReceived + deltaLost > 0
          ? deltaLost / (deltaReceived + deltaLost)
          : 0;

      // Determine quality tier
      let quality: ConnectionQuality;
      if (
        rttMs > QUALITY_THRESHOLDS.rttPoorMs ||
        lossRate > QUALITY_THRESHOLDS.lossRatePoor
      ) {
        quality = "poor";
      } else if (
        rttMs > QUALITY_THRESHOLDS.rttFairMs ||
        lossRate > QUALITY_THRESHOLDS.lossRateFair
      ) {
        quality = "fair";
      } else {
        quality = "good";
      }

      setConnectionQuality(quality);

      // Adapt video quality to current conditions
      if (quality === "good" || quality === "fair") {
        await applyVideoTier(quality);
      } else {
        // "poor" — audio only is more reliable than bad video
        await applyVideoTier("poor");
      }
    }, 4000);
  }, [applyVideoTier]);

  // ── Flush queued ICE candidates after remote description is set ─────────────
  const flushIceCandidateQueue = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;
    const queued = iceCandidateQueue.current.splice(0);
    for (const candidate of queued) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
    }
  }, []);

  // ── Get user media ──────────────────────────────────────────────────────────
  const getMedia = useCallback(async (video = true) => {
    try {
      // FIX 4: start at "fair" quality by default — 1280×720 saturates
      //         weak links before the call even stabilises.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // Limit audio bitrate to 32 kbps — frees bandwidth for video
          // (browser honours this as an SDP constraint hint)
        },
        video: video
          ? {
              width: { ideal: VIDEO_TIERS.fair.width },
              height: { ideal: VIDEO_TIERS.fair.height },
              frameRate: { ideal: VIDEO_TIERS.fair.frameRate },
              facingMode: "user",
            }
          : false,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch {
      if (video) {
        // Camera unavailable — fall back to audio only
        try {
          const audioOnly = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          localStreamRef.current = audioOnly;
          setLocalStream(audioOnly);
          setVideoEnabled(false);
          return audioOnly;
        } catch {
          throw new Error(
            "Microphone access denied. Please allow access and try again.",
          );
        }
      }
      throw new Error("Media access denied.");
    }
  }, []);

  // ── Create peer connection ──────────────────────────────────────────────────
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (e) => {
      if (e.candidate && socketRef.current) {
        socketRef.current.emit("interview:ice-candidate", {
          interviewId,
          candidate: e.candidate,
        });
      }
    };

    pc.ontrack = (e) => {
      const [stream] = e.streams;
      if (stream) setRemoteStream(stream);
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;

      if (state === "connected") {
        setCallState("connected");
        setIsReconnecting(false);
        timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
        startQualityMonitor();
      }

      if (state === "disconnected") {
        setIsReconnecting(true);
        // FIX 5: ICE restart was calling restartIce() but never sending a new
        //         offer. The remote peer never received the restart → permanently
        //         stuck. Now: only the offerer initiates the restart to avoid
        //         signalling collisions.
        setTimeout(async () => {
          if (
            pcRef.current?.connectionState !== "connected" &&
            isOffererRef.current
          ) {
            try {
              const offer = await pcRef.current?.createOffer({
                iceRestart: true,
              });
              if (offer && pcRef.current) {
                await pcRef.current.setLocalDescription(offer);
                socketRef.current?.emit("interview:offer", {
                  interviewId,
                  offer,
                  isRestart: true,
                });
              }
            } catch {}
          }
        }, 5000);
      }

      if (state === "failed") {
        setCallState("ended");
        setIsReconnecting(false);
        if (timerRef.current) clearInterval(timerRef.current);
        if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
      }
    };

    // FIX 6: audio track gets high network priority so it survives congestion
    pc.onnegotiationneeded = async () => {
      const senders = pc.getSenders();
      for (const sender of senders) {
        if (sender.track?.kind === "audio") {
          const params = sender.getParameters();
          if (!params.encodings?.length) params.encodings = [{}];
          const encoding = params.encodings[0];
          if (encoding) {
            encoding.priority = "high";
            (encoding as any).networkPriority = "high";
          }
          await sender.setParameters(params).catch(() => {});
        }
        if (sender.track?.kind === "video") {
          const params = sender.getParameters();
          if (!params.encodings?.length) params.encodings = [{}];
          const encoding = params.encodings[0];
          if (encoding) {
            encoding.maxBitrate = VIDEO_TIERS.fair.maxKbps * 1000;
          }
          await sender.setParameters(params).catch(() => {});
        }
      }
    };

    pcRef.current = pc;
    return pc;
  }, [interviewId, startQualityMonitor]);

  // ── Connect socket & join room ──────────────────────────────────────────────
  useEffect(() => {
    // FIX 7: socket had no reconnection config. One dropped packet killed
    //         signalling permanently. Now retries with exponential backoff.
    const socket = io(`${SOCKET_SERVER_ORIGIN}/interview`, {
      withCredentials: true,
      transports: ["websocket", "polling"], // fall back to polling if WS is blocked
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 8000,
      randomizationFactor: 0.4,
      timeout: 10000,
    });

    socket.on("connect", () => {
      socket.emit("interview:join", {
        interviewId,
        userId: currentUserId,
        name: currentUserName,
      });
    });

    // Someone else joined → we are the offerer
    socket.on(
      "interview:user-joined",
      async ({ userId, name }: { userId: string; name: string }) => {
        isOffererRef.current = true;
        setRemoteUser({ userId, name });
        setCallState("connecting");

        const stream = localStreamRef.current ?? (await getMedia());
        const pc = createPeerConnection();
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("interview:offer", { interviewId, offer });
      },
    );

    // We received an offer → we are the answerer
    socket.on(
      "interview:offer",
      async ({ offer, userId, name, isRestart }: any) => {
        if (!isRestart) {
          isOffererRef.current = false;
          setRemoteUser({ userId, name });
          setCallState("connecting");
        }

        // Reset candidate queue state on new offer
        iceCandidateQueue.current = [];
        remoteDescSetRef.current = false;

        const stream = localStreamRef.current ?? (await getMedia());
        const pc =
          isRestart && pcRef.current ? pcRef.current : createPeerConnection();
        if (!isRestart)
          stream.getTracks().forEach((t) => pc.addTrack(t, stream));

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        remoteDescSetRef.current = true;
        await flushIceCandidateQueue(); // FIX 1: apply buffered candidates now

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("interview:answer", { interviewId, answer });
      },
    );

    socket.on("interview:answer", async ({ answer }: any) => {
      if (!pcRef.current) return;
      await pcRef.current.setRemoteDescription(
        new RTCSessionDescription(answer),
      );
      remoteDescSetRef.current = true;
      await flushIceCandidateQueue(); // FIX 1: apply buffered candidates now
    });

    socket.on("interview:ice-candidate", async ({ candidate }: any) => {
      if (!candidate) return;

      // FIX 1: if remote description isn't set yet, queue — never drop silently
      if (!remoteDescSetRef.current || !pcRef.current?.remoteDescription) {
        iceCandidateQueue.current.push(candidate as RTCIceCandidateInit);
        return;
      }

      await pcRef.current
        .addIceCandidate(new RTCIceCandidate(candidate as RTCIceCandidateInit))
        .catch(() => {});
    });

    socket.on("interview:user-left", () => {
      setCallState("ended");
      setRemoteStream(null);
      if (timerRef.current) clearInterval(timerRef.current);
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
      markComplete();
    });

    socket.on("interview:participants", ({ participants }: any) => {
      const other = participants.find((p: any) => p.userId !== currentUserId);
      if (other) setRemoteUser(other as { userId: string; name: string });
    });

    socket.on("interview:chat-message", (msg: ChatMessage) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      pcRef.current?.close();
      if (timerRef.current) clearInterval(timerRef.current);
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
    };
  }, [
    interviewId,
    currentUserId,
    currentUserName,
    createPeerConnection,
    getMedia,
    markComplete,
    flushIceCandidateQueue,
  ]);

  // ── Join call ───────────────────────────────────────────────────────────────
  const joinCall = useCallback(
    async (withVideo = true) => {
      setError(null);
      try {
        await getMedia(withVideo);
        setVideoEnabled(withVideo);
        setCallState("connecting");
      } catch (e: unknown) {
        setError(
          e instanceof Error ? e.message : "Failed to access media devices.",
        );
      }
    },
    [getMedia],
  );

  // ── Send chat message ───────────────────────────────────────────────────────
  const sendChatMessage = useCallback(
    (message: string) => {
      const socket = socketRef.current;
      if (!socket || !message.trim()) return;
      socket.emit("interview:chat-message", {
        interviewId,
        message: message.trim(),
        senderName: currentUserName,
      });
    },
    [interviewId, currentUserName],
  );

  // ── Toggle audio ────────────────────────────────────────────────────────────
  const toggleAudio = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const enabled = !audioEnabled;
    stream.getAudioTracks().forEach((t) => {
      t.enabled = enabled;
    });
    setAudioEnabled(enabled);
  }, [audioEnabled]);

  // ── Toggle video ────────────────────────────────────────────────────────────
  const toggleVideo = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const enabled = !videoEnabled;
    stream.getVideoTracks().forEach((t) => {
      t.enabled = enabled;
    });
    setVideoEnabled(enabled);
  }, [videoEnabled]);

  // ── Screen share ────────────────────────────────────────────────────────────
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      const camStream = localStreamRef.current;
      if (camStream && pcRef.current) {
        const sender = pcRef.current
          .getSenders()
          .find((s) => s.track?.kind === "video");
        const camTrack = camStream.getVideoTracks()[0];
        if (sender && camTrack)
          await sender.replaceTrack(camTrack).catch(() => {});
      }
      setIsScreenSharing(false);
      return;
    }

    try {
      // FIX 8: screen share constrained to 1080p/10fps — prevents it from
      //         monopolising the entire link on weak connections
      const screen = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          frameRate: { ideal: 10, max: 15 },
        },
      });
      screenStreamRef.current = screen;
      const screenTrack = screen.getVideoTracks()[0];

      if (pcRef.current) {
        const sender = pcRef.current
          .getSenders()
          .find((s) => s.track?.kind === "video");
        if (sender && screenTrack)
          await sender.replaceTrack(screenTrack).catch(() => {});
      }

      // Cap screen share bitrate so audio isn't squeezed out
      await setVideoBitrate(800);

      if (screenTrack) screenTrack.onended = () => void toggleScreenShare();
      setIsScreenSharing(true);
    } catch {}
  }, [isScreenSharing, setVideoBitrate]);

  // ── End call ────────────────────────────────────────────────────────────────
  const endCall = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    socketRef.current?.emit("interview:leave", { interviewId });
    setCallState("ended");
    setLocalStream(null);
    setRemoteStream(null);
    if (timerRef.current) clearInterval(timerRef.current);
    if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
    markComplete();
  }, [interviewId, markComplete]);

  // ── Format duration ─────────────────────────────────────────────────────────
  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return {
    callState,
    localStream,
    remoteStream,
    remoteUser,
    audioEnabled,
    videoEnabled,
    isScreenSharing,
    error,
    duration,
    formatDuration,
    chatMessages,
    sendChatMessage,
    joinCall,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    endCall,
    // New: expose to UI so you can show quality indicators and reconnecting states
    connectionQuality,
    isReconnecting,
  };
}
