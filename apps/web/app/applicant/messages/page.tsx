/** @format */
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Search,
  Send,
  Paperclip,
  MoreVertical,
  Circle,
  CheckCheck,
  ChevronLeft,
  Briefcase,
  Phone,
  Video,
  Info,
  ArrowLeft,
  X,
} from "lucide-react";
import styles from "../styles/messages.module.css";

// ─── Types ────────────────────────────────────────────────
interface Message {
  id: string;
  from: "me" | "them";
  text: string;
  time: string;
  read: boolean;
}

interface Conversation {
  id: string;
  name: string;
  role: string;
  company: string;
  logo: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  online: boolean;
  jobTitle: string;
  messages: Message[];
}

// ─── Mock data ────────────────────────────────────────────
const CONVERSATIONS: Conversation[] = [
  {
    id: "1",
    name: "Sarah Chen",
    role: "Senior Recruiter",
    company: "Stripe",
    logo: "ST",
    lastMessage: "Looking forward to speaking with you!",
    lastTime: "2m",
    unread: 2,
    online: true,
    jobTitle: "Senior Frontend Engineer",
    messages: [
      {
        id: "1",
        from: "them",
        text: "Hi! I came across your profile and I'm impressed by your experience with React and TypeScript.",
        time: "10:02 AM",
        read: true,
      },
      {
        id: "2",
        from: "me",
        text: "Thank you Sarah! I'm very interested in the Senior Frontend Engineer role at Stripe.",
        time: "10:15 AM",
        read: true,
      },
      {
        id: "3",
        from: "them",
        text: "Great to hear! Could you tell me a bit about your experience with large-scale frontend architecture?",
        time: "10:18 AM",
        read: true,
      },
      {
        id: "4",
        from: "me",
        text: "Of course. At my current company I led the migration from a legacy codebase to a modern React/TypeScript stack, serving over 2 million users.",
        time: "10:22 AM",
        read: true,
      },
      {
        id: "5",
        from: "them",
        text: "That's exactly the kind of experience we're looking for. I'd love to schedule a call to discuss further.",
        time: "10:45 AM",
        read: true,
      },
      {
        id: "6",
        from: "them",
        text: "Looking forward to speaking with you!",
        time: "10:46 AM",
        read: false,
      },
    ],
  },
  {
    id: "2",
    name: "James Miller",
    role: "Engineering Manager",
    company: "Vercel",
    logo: "VC",
    lastMessage: "We'd like to move you to the next round.",
    lastTime: "1h",
    unread: 1,
    online: false,
    jobTitle: "React Developer",
    messages: [
      {
        id: "1",
        from: "them",
        text: "Hi! Thanks for your application to the React Developer role. Our team reviewed your profile and we're impressed.",
        time: "Yesterday",
        read: true,
      },
      {
        id: "2",
        from: "me",
        text: "Thank you James, I'm really excited about the opportunity to work at Vercel.",
        time: "Yesterday",
        read: true,
      },
      {
        id: "3",
        from: "them",
        text: "We'd like to move you to the next round.",
        time: "1h ago",
        read: false,
      },
    ],
  },
  {
    id: "3",
    name: "Priya Patel",
    role: "Talent Acquisition",
    company: "Linear",
    logo: "LN",
    lastMessage: "Let me know if you have any questions about the role.",
    lastTime: "3h",
    unread: 0,
    online: true,
    jobTitle: "UI Engineer",
    messages: [
      {
        id: "1",
        from: "them",
        text: "Hello! I noticed you applied for our UI Engineer position. Would you be available for a quick intro call this week?",
        time: "3h ago",
        read: true,
      },
      {
        id: "2",
        from: "me",
        text: "Hi Priya! Yes, I'd be happy to chat. I'm free Thursday afternoon or Friday morning.",
        time: "2h ago",
        read: true,
      },
      {
        id: "3",
        from: "them",
        text: "Let me know if you have any questions about the role.",
        time: "2h ago",
        read: true,
      },
    ],
  },
  {
    id: "4",
    name: "Tom Wright",
    role: "CTO",
    company: "Notion",
    logo: "NT",
    lastMessage: "Thanks for your time today.",
    lastTime: "2d",
    unread: 0,
    online: false,
    jobTitle: "Full Stack Engineer",
    messages: [
      {
        id: "1",
        from: "them",
        text: "Hi! We're looking for a Full Stack Engineer to join our small team. Your background is a great fit.",
        time: "2d ago",
        read: true,
      },
      {
        id: "2",
        from: "me",
        text: "Hi Tom, I love Notion and would be thrilled to contribute to the team.",
        time: "2d ago",
        read: true,
      },
      {
        id: "3",
        from: "them",
        text: "Thanks for your time today.",
        time: "2d ago",
        read: true,
      },
    ],
  },
];

export default function MessagesPage() {
  const [convos, setConvos] = useState(CONVERSATIONS);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const active = convos.find((c) => c.id === activeId) ?? null;

  // auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeId, active?.messages.length]);

  // mark as read on open
  useEffect(() => {
    if (!activeId) return;
    setConvos((p) =>
      p.map((c) =>
        c.id === activeId
          ? {
              ...c,
              unread: 0,
              messages: c.messages.map((m) => ({ ...m, read: true })),
            }
          : c,
      ),
    );
  }, [activeId]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || !activeId) return;
    const msg: Message = {
      id: Date.now().toString(),
      from: "me",
      text,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      read: true,
    };
    setConvos((p) =>
      p.map((c) =>
        c.id === activeId
          ? {
              ...c,
              messages: [...c.messages, msg],
              lastMessage: text,
              lastTime: "now",
            }
          : c,
      ),
    );
    setInput("");
    inputRef.current?.focus();
  }, [input, activeId]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filtered = convos.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase()),
  );

  const totalUnread = convos.reduce((a, c) => a + c.unread, 0);

  return (
    <div className={styles.page}>
      <div className={`${styles.layout} ${active ? styles.layoutActive : ""}`}>
        {/* ── Sidebar list ── */}
        <div
          className={`${styles.sidebar} ${active ? styles.sidebarHidden : ""}`}
        >
          <div className={styles.sidebarHeader}>
            <div className={styles.sidebarTitle}>
              <h1>Messages</h1>
              {totalUnread > 0 && (
                <span className={styles.unreadBadge}>{totalUnread}</span>
              )}
            </div>
            <div className={styles.searchBox}>
              <Search size={13} className={styles.searchIcon} />
              <input
                className={styles.searchInput}
                placeholder="Search conversations…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  className={styles.searchClear}
                  onClick={() => setSearch("")}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          <div className={styles.convoList}>
            {filtered.length === 0 ? (
              <div className={styles.emptySearch}>No conversations found</div>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  className={`${styles.convoItem} ${activeId === c.id ? styles.convoActive : ""}`}
                  onClick={() => setActiveId(c.id)}
                >
                  <div className={styles.avatarWrap}>
                    <div className={styles.avatar}>{c.logo}</div>
                    {c.online && <span className={styles.onlineDot} />}
                  </div>
                  <div className={styles.convoInfo}>
                    <div className={styles.convoTop}>
                      <span className={styles.convoName}>{c.name}</span>
                      <span className={styles.convoTime}>{c.lastTime}</span>
                    </div>
                    <p className={styles.convoCompany}>
                      {c.role} · {c.company}
                    </p>
                    <p
                      className={`${styles.convoLast} ${c.unread > 0 ? styles.convoLastUnread : ""}`}
                    >
                      {c.lastMessage}
                    </p>
                  </div>
                  {c.unread > 0 && (
                    <span className={styles.convoUnread}>{c.unread}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Chat window ── */}
        {active ? (
          <div className={styles.chat}>
            {/* Chat header */}
            <div className={styles.chatHeader}>
              <button
                className={styles.backBtn}
                onClick={() => {
                  setActiveId(null);
                  setShowInfo(false);
                }}
              >
                <ChevronLeft size={18} />
              </button>
              <div className={styles.chatAvatarWrap}>
                <div className={styles.chatAvatar}>{active.logo}</div>
                {active.online && <span className={styles.chatOnlineDot} />}
              </div>
              <div className={styles.chatHeaderInfo}>
                <p className={styles.chatName}>{active.name}</p>
                <p className={styles.chatSub}>
                  {active.role} · {active.company}
                </p>
              </div>
              <div className={styles.chatHeaderActions}>
                <div className={styles.jobChip}>
                  <Briefcase size={11} /> {active.jobTitle}
                </div>
                <button className={styles.headerBtn}>
                  <Phone size={15} />
                </button>
                <button className={styles.headerBtn}>
                  <Video size={15} />
                </button>
                <button
                  className={styles.headerBtn}
                  onClick={() => setShowInfo((p) => !p)}
                >
                  <Info size={15} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className={styles.messages}>
              <div className={styles.dateSep}>Today</div>
              {active.messages.map((msg, i) => {
                const isMe = msg.from === "me";
                const isLast = i === active.messages.length - 1;
                return (
                  <div
                    key={msg.id}
                    className={`${styles.msgRow} ${isMe ? styles.msgRowMe : ""}`}
                  >
                    {!isMe && (
                      <div className={styles.msgAvatar}>{active.logo}</div>
                    )}
                    <div
                      className={`${styles.bubble} ${isMe ? styles.bubbleMe : styles.bubbleThem}`}
                    >
                      <p className={styles.bubbleText}>{msg.text}</p>
                      <div className={styles.bubbleMeta}>
                        <span>{msg.time}</span>
                        {isMe && (
                          <CheckCheck
                            size={12}
                            style={{
                              color: msg.read
                                ? "var(--color-secondary)"
                                : "var(--text-muted)",
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className={styles.inputArea}>
              <button className={styles.inputBtn}>
                <Paperclip size={16} />
              </button>
              <div className={styles.inputWrap}>
                <textarea
                  ref={inputRef}
                  className={styles.input}
                  placeholder="Type a message…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  rows={1}
                />
              </div>
              <button
                className={`${styles.sendBtn} ${input.trim() ? styles.sendBtnActive : ""}`}
                onClick={handleSend}
                disabled={!input.trim()}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        ) : (
          /* Empty state on desktop */
          <div className={styles.chatEmpty}>
            <div className={styles.chatEmptyIcon}>💬</div>
            <h2>Your messages</h2>
            <p>
              Select a conversation to start messaging with recruiters and
              employers
            </p>
          </div>
        )}

        {/* ── Info panel ── */}
        {showInfo && active && (
          <div className={styles.infoPanel}>
            <div className={styles.infoPanelHeader}>
              <span>Info</span>
              <button
                className={styles.headerBtn}
                onClick={() => setShowInfo(false)}
              >
                <X size={14} />
              </button>
            </div>
            <div className={styles.infoAvatar}>{active.logo}</div>
            <p className={styles.infoName}>{active.name}</p>
            <p className={styles.infoRole}>{active.role}</p>
            <p className={styles.infoCompany}>{active.company}</p>
            <div className={styles.infoSection}>
              <p className={styles.infoSectionTitle}>Applied for</p>
              <div className={styles.infoJobChip}>
                <Briefcase size={12} /> {active.jobTitle}
              </div>
            </div>
            <div className={styles.infoSection}>
              <p className={styles.infoSectionTitle}>Status</p>
              <span
                className={`${styles.infoStatus} ${active.online ? styles.infoOnline : ""}`}
              >
                <Circle
                  size={8}
                  style={{
                    fill: active.online
                      ? "var(--status-success)"
                      : "var(--text-muted)",
                  }}
                />
                {active.online ? "Online now" : "Offline"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
