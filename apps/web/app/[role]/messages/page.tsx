/* eslint-disable @next/next/no-img-element */
/** @format */
"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { MessageSquare, Search, Send } from "lucide-react";
import { useUser } from "../../store/session.store";
import { useChat } from "../../hooks/useChat";
import { timeAgo } from "../../lib";
import { useSearchParams } from "next/navigation";
import type { Conversation, ChatMessage } from "../../hooks/useChat";
import styles from "../../styles/messages.module.css";

// ── Helpers ───────────────────────────────────────────────────────────────────
function toInitials(name: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

// ── ConversationItem ──────────────────────────────────────────────────────────
function ConversationItem({
  conv,
  active,
  currentUserId,
  onClick,
}: {
  conv: Conversation;
  active: boolean;
  currentUserId: string;
  onClick: () => void;
}) {
  const isOwn = conv.last_message_sender_id === currentUserId;
  console.log("Convo-------->", conv);
  return (
    <div
      className={`${styles.convItem} ${active ? styles.convItemActive : ""}`}
      onClick={onClick}
    >
      <div className={styles.convAvatar}>
        {conv.other_user_avatar ? (
          <img
            src={conv.other_user_avatar}
            alt={conv.other_user_name}
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
        ) : (
          toInitials(conv.other_user_name)
        )}
      </div>
      <div className={styles.convInfo}>
        <p className={styles.convName}>
          <span>{conv.other_user_name}</span>
          {conv.last_message_at && (
            <span className={styles.convTime}>
              {timeAgo(conv.last_message_at)}
            </span>
          )}
        </p>
        <p className={styles.convPreview}>
          {conv.last_message
            ? `${isOwn ? "You: " : ""}${conv.last_message}`
            : "No messages yet"}
        </p>
      </div>
      {conv.unread_count > 0 && (
        <span className={styles.unreadBadge}>{conv.unread_count}</span>
      )}
    </div>
  );
}

// ── MessageBubble ─────────────────────────────────────────────────────────────
function MessageBubble({ msg, isOwn }: { msg: ChatMessage; isOwn: boolean }) {
  return (
    <div className={`${styles.msgGroup} ${isOwn ? styles.msgGroupOwn : ""}`}>
      {!isOwn && (
        <div className={styles.msgAvatar}>
          {msg.sender.avatar ? (
            <img
              src={msg.sender.avatar}
              alt={msg.sender.fullName}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          ) : (
            toInitials(msg.sender.fullName)
          )}
        </div>
      )}
      <div>
        <div
          className={`${styles.msgBubble} ${isOwn ? styles.msgBubbleOwn : ""}`}
        >
          {msg.text}
        </div>
        <p className={`${styles.msgTime} ${isOwn ? styles.msgTimeOwn : ""}`}>
          {timeAgo(msg.createdAt)}
        </p>
      </div>
    </div>
  );
}

// ── TypingIndicator ───────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className={styles.msgGroup}>
      <div className={styles.typingIndicator}>
        <span className={styles.typingDot} />
        <span className={styles.typingDot} />
        <span className={styles.typingDot} />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function MessagesPage() {
  const user = useUser();
  const currentUserId = user?.id ?? "";

  const {
    conversations,
    messages,
    activeConvId,
    typingUsers,
    connected,
    loadingInbox,
    loadingMessages,
    openConversation,
    startConversation,
    sendMessage,
    handleTyping,
  } = useChat(currentUserId);
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const didAutoOpen = useRef(false);
  useEffect(() => {
    if (loadingInbox || didAutoOpen.current) return;
    const to = searchParams.get("to");
    if (to) {
      didAutoOpen.current = true;
      startConversation(to); // ← was openConversation(to)
    }
  }, [loadingInbox]); // ← wait for inbox before checking existing convs

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers.size]);

  const filteredConvs = useMemo(() => {
    if (!search) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(
      (c) =>
        c.other_user_name.toLowerCase().includes(q) ||
        c.last_message?.toLowerCase().includes(q),
    );
  }, [conversations, search]);

  const activeConv = useMemo(
    () => conversations.find((c) => c.id === activeConvId) ?? null,
    [conversations, activeConvId],
  );

  const isSomeoneTyping = typingUsers.size > 0;

  const handleSend = useCallback(() => {
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText("");
  }, [inputText, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className={styles.page}>
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHead}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <h1 className={styles.sidebarTitle}>Messages</h1>
            <span className={styles.connBadge}>
              <span
                className={`${styles.connDot} ${connected ? styles.connOnline : styles.connOffline}`}
              />
              {connected ? "Online" : "Offline"}
            </span>
          </div>
          <div className={styles.searchWrap}>
            <Search size={13} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Search conversations…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.convList}>
          {loadingInbox ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={styles.convItem}>
                <div
                  className={`${styles.skeleton}`}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    flexShrink: 0,
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <div
                    className={styles.skeleton}
                    style={{ height: 13, width: "60%" }}
                  />
                  <div
                    className={styles.skeleton}
                    style={{ height: 11, width: "80%" }}
                  />
                </div>
              </div>
            ))
          ) : filteredConvs.length === 0 ? (
            <div
              style={{
                padding: "24px 16px",
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: 13,
              }}
            >
              {search ? `No results for "${search}"` : "No conversations yet"}
            </div>
          ) : (
            filteredConvs.map((conv) => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                active={conv.id === activeConvId}
                currentUserId={currentUserId}
                onClick={() => openConversation(conv.id)}
              />
            ))
          )}
        </div>
      </aside>

      {/* ── Chat panel ───────────────────────────────────────────────────── */}
      <div className={styles.chatPanel}>
        {!activeConv ? (
          <div className={styles.emptyPanel}>
            <MessageSquare size={40} />
            <p>Select a conversation</p>
            <span>Choose a conversation from the list to start chatting</span>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className={styles.chatHeader}>
              <div className={styles.chatHeaderAvatar}>
                {activeConv.other_user_avatar ? (
                  <img
                    src={activeConv.other_user_avatar}
                    alt={activeConv.other_user_name}
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  toInitials(activeConv.other_user_name)
                )}
              </div>
              <div className={styles.chatHeaderInfo}>
                <p className={styles.chatHeaderName}>
                  {activeConv.other_user_name}
                </p>
                <p className={styles.chatHeaderSub}>
                  {isSomeoneTyping ? (
                    <>
                      <span className={styles.onlineDot} />
                      typing...
                    </>
                  ) : activeConv.job_title ? (
                    `Re: ${activeConv.job_title}`
                  ) : (
                    activeConv.other_user_role
                  )}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className={styles.messages}>
              {loadingMessages ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className={
                      i % 2 === 0
                        ? styles.msgGroup
                        : `${styles.msgGroup} ${styles.msgGroupOwn}`
                    }
                  >
                    <div
                      className={styles.skeleton}
                      style={{
                        height: 40,
                        width: `${30 + Math.random() * 30}%`,
                        borderRadius: 16,
                      }}
                    />
                  </div>
                ))
              ) : messages.length === 0 ? (
                <div className={styles.emptyPanel} style={{ flex: 1 }}>
                  <MessageSquare size={32} />
                  <p>No messages yet</p>
                  <span>Say hello!</span>
                </div>
              ) : (
                messages
                  .filter((m) => !m.isDeleted)
                  .map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      msg={msg}
                      isOwn={msg.senderId === currentUserId}
                    />
                  ))
              )}

              {isSomeoneTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className={styles.inputArea}>
              <textarea
                className={styles.msgInput}
                placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
                value={inputText}
                rows={1}
                onChange={(e) => {
                  setInputText(e.target.value);
                  handleTyping();
                }}
                onKeyDown={handleKeyDown}
              />
              <button
                className={styles.sendBtn}
                onClick={handleSend}
                disabled={!inputText.trim()}
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
