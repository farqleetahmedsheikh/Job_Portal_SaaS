/** @format */
"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Monitor,
  MonitorOff,
  MessageSquare,
  Users,
  Clock,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useInterviewRoom } from "../../../../hooks/useInterviewRoom";
import { useUser } from "../../../../store/session.store";
import styles from "../../../styles/interview-room.module.css";

// ── Video tile ───────────────────────────────────────────────────────────────
function VideoTile({
  stream,
  muted = false,
  label,
  noVideo,
  avatarText,
}: {
  stream: MediaStream | null;
  muted?: boolean;
  label: string;
  noVideo?: boolean;
  avatarText?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const hasVideo =
    stream && stream.getVideoTracks().some((t) => t.enabled) && !noVideo;

  return (
    <div className={styles.videoTile}>
      {hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className={styles.videoEl}
        />
      ) : (
        <div className={styles.videoAvatar}>
          <div className={styles.avatarCircle}>{avatarText ?? label[0]}</div>
        </div>
      )}
      <div className={styles.videoLabel}>{label}</div>
    </div>
  );
}

// ── Lobby (pre-join) ─────────────────────────────────────────────────────────
function Lobby({
  onJoinVideo,
  onJoinAudio,
  error,
  interviewTitle,
}: {
  onJoinVideo: () => void;
  onJoinAudio: () => void;
  error: string | null;
  interviewTitle: string;
}) {
  return (
    <div className={styles.lobby}>
      <div className={styles.lobbyCard}>
        <div className={styles.lobbyIcon}>
          <Video size={28} />
        </div>
        <h1 className={styles.lobbyTitle}>Ready to join?</h1>
        <p className={styles.lobbySub}>{interviewTitle}</p>
        {error && <p className={styles.lobbyError}>{error}</p>}
        <div className={styles.lobbyActions}>
          <button className={styles.joinVideoBtn} onClick={onJoinVideo}>
            <Video size={16} /> Join with camera
          </button>
          <button className={styles.joinAudioBtn} onClick={onJoinAudio}>
            <Mic size={16} /> Join audio only
          </button>
        </div>
        <p className={styles.lobbyHint}>
          Make sure your camera and microphone are allowed in the browser.
        </p>
      </div>
    </div>
  );
}

// ── Ended screen ─────────────────────────────────────────────────────────────
function EndedScreen({
  duration,
  formatDuration,
  onLeave,
}: {
  duration: number;
  formatDuration: (s: number) => string;
  onLeave: () => void;
}) {
  return (
    <div className={styles.lobby}>
      <div className={styles.lobbyCard}>
        <div className={styles.endedIcon}>✓</div>
        <h1 className={styles.lobbyTitle}>Interview ended</h1>
        <p className={styles.lobbySub}>Duration: {formatDuration(duration)}</p>
        <button className={styles.joinVideoBtn} onClick={onLeave}>
          Back to dashboard
        </button>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function InterviewRoomPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useUser();

  const [showChat, setShowChat] = useState(false);
  const [chatMsg, setChatMsg] = useState("");
  const [messages, setMessages] = useState<
    { from: string; text: string; time: string }[]
  >([]);

  const {
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
  } = useInterviewRoom(id, user?.id ?? "", user?.fullName ?? "You");

  const handleLeave = () => {
    endCall();
    router.push(
      user?.role === "employer"
        ? "/employer/interviews"
        : "/applicant/interviews",
    );
  };

  // ── Lobby ──────────────────────────────────────────────────────────────────
  if (callState === "idle") {
    return (
      <Lobby
        interviewTitle="Interview Session"
        error={error}
        onJoinVideo={() => joinCall(true)}
        onJoinAudio={() => joinCall(false)}
      />
    );
  }

  // ── Ended ──────────────────────────────────────────────────────────────────
  if (callState === "ended") {
    return (
      <EndedScreen
        duration={duration}
        formatDuration={formatDuration}
        onLeave={handleLeave}
      />
    );
  }

  return (
    <div className={styles.room}>
      {/* ── Top bar ── */}
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <span className={styles.roomTitle}>Interview Room</span>
          {callState === "connected" && (
            <span className={styles.liveBadge}>
              <span className={styles.liveDot} /> LIVE
            </span>
          )}
        </div>
        <div className={styles.topCenter}>
          {callState === "connected" && (
            <div className={styles.timer}>
              <Clock size={13} />
              {formatDuration(duration)}
            </div>
          )}
          {callState === "connecting" && (
            <span className={styles.connectingText}>Connecting…</span>
          )}
        </div>
        <div className={styles.topRight}>
          <div className={styles.connStatus}>
            {callState === "connected" ? (
              <Wifi size={14} />
            ) : (
              <WifiOff size={14} />
            )}
          </div>
        </div>
      </div>

      {/* ── Video grid ── */}
      <div
        className={`${styles.videoGrid} ${remoteStream ? styles.videoGridTwo : styles.videoGridOne}`}
      >
        {/* Remote */}
        {remoteStream ? (
          <VideoTile
            stream={remoteStream}
            label={remoteUser?.name ?? "Participant"}
            avatarText={remoteUser?.name?.[0]}
          />
        ) : (
          <div className={styles.waitingTile}>
            <Users
              size={32}
              style={{ color: "rgba(255,255,255,0.3)", marginBottom: 12 }}
            />
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
              Waiting for the other participant…
            </p>
          </div>
        )}

        {/* Local (picture-in-picture) */}
        <div className={styles.localTile}>
          <VideoTile
            stream={localStream}
            muted
            label="You"
            noVideo={!videoEnabled}
            avatarText={user?.fullName?.[0]}
          />
        </div>
      </div>

      {/* ── Chat panel ── */}
      {showChat && (
        <div className={styles.chatPanel}>
          <div className={styles.chatHeader}>
            <span>In-call chat</span>
            <button
              onClick={() => setShowChat(false)}
              className={styles.chatClose}
            >
              ✕
            </button>
          </div>
          <div className={styles.chatMessages}>
            {messages.length === 0 ? (
              <p className={styles.chatEmpty}>No messages yet</p>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={styles.chatMsg}>
                  <span className={styles.chatFrom}>{m.from}</span>
                  <span className={styles.chatText}>{m.text}</span>
                  <span className={styles.chatTime}>{m.time}</span>
                </div>
              ))
            )}
          </div>
          <div className={styles.chatInput}>
            <input
              value={chatMsg}
              onChange={(e) => setChatMsg(e.target.value)}
              placeholder="Type a message…"
              onKeyDown={(e) => {
                if (e.key === "Enter" && chatMsg.trim()) {
                  setMessages((p) => [
                    ...p,
                    {
                      from: user?.fullName ?? "You",
                      text: chatMsg.trim(),
                      time: new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      }),
                    },
                  ]);
                  setChatMsg("");
                }
              }}
            />
          </div>
        </div>
      )}

      {/* ── Controls ── */}
      <div className={styles.controls}>
        <div className={styles.controlsInner}>
          {/* Left controls */}
          <div className={styles.controlsLeft}>
            <button
              className={`${styles.ctrlBtn} ${!audioEnabled ? styles.ctrlBtnOff : ""}`}
              onClick={toggleAudio}
              title={audioEnabled ? "Mute" : "Unmute"}
            >
              {audioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
              <span>{audioEnabled ? "Mute" : "Unmute"}</span>
            </button>

            <button
              className={`${styles.ctrlBtn} ${!videoEnabled ? styles.ctrlBtnOff : ""}`}
              onClick={toggleVideo}
              title={videoEnabled ? "Stop video" : "Start video"}
            >
              {videoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
              <span>{videoEnabled ? "Stop video" : "Start video"}</span>
            </button>

            <button
              className={`${styles.ctrlBtn} ${isScreenSharing ? styles.ctrlBtnActive : ""}`}
              onClick={toggleScreenShare}
              title="Share screen"
            >
              {isScreenSharing ? (
                <MonitorOff size={20} />
              ) : (
                <Monitor size={20} />
              )}
              <span>{isScreenSharing ? "Stop share" : "Share screen"}</span>
            </button>
          </div>

          {/* Center — end call */}
          <button
            className={styles.endBtn}
            onClick={handleLeave}
            title="End call"
          >
            <PhoneOff size={22} />
          </button>

          {/* Right controls */}
          <div className={styles.controlsRight}>
            <button
              className={`${styles.ctrlBtn} ${showChat ? styles.ctrlBtnActive : ""}`}
              onClick={() => setShowChat((p) => !p)}
              title="Chat"
            >
              <MessageSquare size={20} />
              <span>Chat</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
