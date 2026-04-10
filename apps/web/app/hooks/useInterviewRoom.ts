/** @format */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

export type CallState = "idle" | "connecting" | "connected" | "ended" | "error";

export interface Participant {
  userId: string;
  name: string;
  stream: MediaStream | null;
  audioEnabled: boolean;
  videoEnabled: boolean;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9000";
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

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
  const [remoteUser, setRemoteUser] = useState<{
    userId: string;
    name: string;
  } | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);

  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Get user media ──────────────────────────────────────────────────────────
  const getMedia = useCallback(async (video = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
        video: video ? { width: 1280, height: 720, facingMode: "user" } : false,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (e: any) {
      // Try audio-only if camera fails
      if (video) {
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
      setRemoteStream(stream);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        setCallState("connected");
        timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
      }
      if (
        pc.connectionState === "disconnected" ||
        pc.connectionState === "failed"
      ) {
        setCallState("ended");
        if (timerRef.current) clearInterval(timerRef.current);
      }
    };

    pcRef.current = pc;
    return pc;
  }, [interviewId]);

  // ── Connect socket & join room ──────────────────────────────────────────────
  useEffect(() => {
    const socket = io(`${SOCKET_URL}/interview`, {
      withCredentials: true,
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      socket.emit("interview:join", {
        interviewId,
        userId: currentUserId,
        name: currentUserName,
      });
    });

    // Someone else joined — we initiate the call
    socket.on(
      "interview:user-joined",
      async ({ userId, name }: { userId: string; name: string }) => {
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

    // We received an offer — answer it
    socket.on("interview:offer", async ({ offer, userId, name }: any) => {
      setRemoteUser({ userId, name });
      setCallState("connecting");

      const stream = localStreamRef.current ?? (await getMedia());
      const pc = createPeerConnection();
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("interview:answer", { interviewId, answer });
    });

    socket.on("interview:answer", async ({ answer }: any) => {
      await pcRef.current?.setRemoteDescription(
        new RTCSessionDescription(answer),
      );
    });

    socket.on("interview:ice-candidate", async ({ candidate }: any) => {
      try {
        await pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (_) {}
    });

    socket.on("interview:user-left", () => {
      setCallState("ended");
      setRemoteStream(null);
      if (timerRef.current) clearInterval(timerRef.current);
    });

    socket.on("interview:participants", ({ participants }: any) => {
      const other = participants.find((p: any) => p.userId !== currentUserId);
      if (other) setRemoteUser(other);
    });

    socketRef.current = socket;
    return () => {
      socket.disconnect();
      pcRef.current?.close();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [
    interviewId,
    currentUserId,
    currentUserName,
    createPeerConnection,
    getMedia,
  ]);

  // ── Join call ───────────────────────────────────────────────────────────────
  const joinCall = useCallback(
    async (withVideo = true) => {
      setError(null);
      try {
        await getMedia(withVideo);
        setVideoEnabled(withVideo);
        setCallState("connecting");
      } catch (e: any) {
        setError(e.message);
      }
    },
    [getMedia],
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
      // restore camera
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      const camStream = localStreamRef.current;
      if (camStream && pcRef.current) {
        const sender = pcRef.current
          .getSenders()
          .find((s) => s.track?.kind === "video");
        const camTrack = camStream.getVideoTracks()[0];
        if (sender && camTrack) sender.replaceTrack(camTrack);
      }
      setIsScreenSharing(false);
      return;
    }

    try {
      const screen = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      screenStreamRef.current = screen;
      const screenTrack = screen.getVideoTracks()[0];

      if (pcRef.current) {
        const sender = pcRef.current
          .getSenders()
          .find((s) => s.track?.kind === "video");
        if (sender) sender.replaceTrack(screenTrack);
      }

      screenTrack.onended = () => toggleScreenShare();
      setIsScreenSharing(true);
    } catch (_) {}
  }, [isScreenSharing]);

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
  }, [interviewId]);

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
    joinCall,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    endCall,
  };
}
