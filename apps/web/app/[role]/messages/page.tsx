/** @format */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Archive,
  ArrowLeft,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Inbox,
  MessageSquare,
  RefreshCcw,
  Search,
  Send,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import type { ChatMessage, Conversation } from "../../hooks/useChat";
import { useChat } from "../../hooks/useChat";
import { timeAgo } from "../../lib";
import { useUser } from "../../store/session.store";
import styles from "../../styles/messages.module.css";

function toInitials(name = "") {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return initials || "?";
}

function formatRole(role?: string | null) {
  if (!role) return "Hiring contact";
  return role.replace(/_/g, " ");
}

function formatStatus(status?: string | null) {
  if (!status) return "";
  return status.replace(/_/g, " ");
}

function formatDay(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function isSameDay(a?: string, b?: string) {
  if (!a || !b) return false;
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function avatarUrl(conv: Conversation) {
  return conv.other_user_avatar ?? conv.company_logo_url ?? null;
}

function conversationContext(conv: Conversation) {
  if (conv.job_title && conv.company_name) {
    return `${conv.job_title} • ${conv.company_name}`;
  }
  return conv.job_title ?? conv.company_name ?? formatRole(conv.other_user_role);
}

function messagePreview(conv: Conversation, currentUserId: string) {
  if (!conv.last_message) return "No messages yet";
  const prefix =
    conv.last_message_type && conv.last_message_type !== "user"
      ? "Update: "
      : conv.last_message_sender_id === currentUserId
        ? "You: "
        : "";
  return `${prefix}${conv.last_message}`;
}

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
  const avatar = avatarUrl(conv);

  return (
    <button
      className={`${styles.convItem} ${active ? styles.convItemActive : ""}`}
      onClick={onClick}
      type="button"
    >
      <span className={styles.convAvatar}>
        {avatar ? (
          <Image
            width={42}
            height={42}
            src={avatar}
            alt={conv.other_user_name}
            className={styles.avatarImage}
          />
        ) : (
          toInitials(conv.other_user_name)
        )}
      </span>

      <span className={styles.convInfo}>
        <span className={styles.convTopLine}>
          <span className={styles.convName}>{conv.other_user_name}</span>
          {conv.last_message_at ? (
            <span className={styles.convTime}>
              {timeAgo(conv.last_message_at)}
            </span>
          ) : null}
        </span>
        <span className={styles.convContext}>{conversationContext(conv)}</span>
        <span className={styles.convPreview}>
          {messagePreview(conv, currentUserId)}
        </span>
      </span>

      {conv.unread_count > 0 ? (
        <span className={styles.unreadBadge}>{conv.unread_count}</span>
      ) : (
        <ChevronRight size={16} className={styles.convArrow} />
      )}
    </button>
  );
}

function ConversationSkeletons() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className={styles.convSkeleton}>
          <span className={`${styles.skeleton} ${styles.skeletonAvatar}`} />
          <span className={styles.skeletonStack}>
            <span className={`${styles.skeleton} ${styles.skeletonLineLg}`} />
            <span className={`${styles.skeleton} ${styles.skeletonLineMd}`} />
            <span className={`${styles.skeleton} ${styles.skeletonLineSm}`} />
          </span>
        </div>
      ))}
    </>
  );
}

function RoleEmptyState({ role }: { role: string }) {
  const isEmployer = role === "employer";
  const actions = isEmployer
    ? [
        { label: "View applicants", href: "/employer/applicants" },
        { label: "Post a job", href: "/employer/jobs" },
        { label: "Browse Talent Database", href: "/employer/talent" },
      ]
    : [
        { label: "Browse jobs", href: "/applicant/browse-jobs" },
        { label: "View applications", href: "/applicant/applications" },
      ];

  return (
    <div className={styles.emptyList}>
      <span className={styles.emptyIcon}>
        {isEmployer ? <Users size={22} /> : <Inbox size={22} />}
      </span>
      <h2>
        {isEmployer ? "No candidate conversations yet" : "No messages yet"}
      </h2>
      <p>
        {isEmployer
          ? "Conversations begin when candidates apply, when you message applicants, or when interviews are scheduled."
          : "Messages from employers will appear here when your applications move forward or interviews are scheduled."}
      </p>
      <div className={styles.emptyActions}>
        {actions.map((action, index) => (
          <Link
            key={action.href}
            className={index === 0 ? styles.primaryLink : styles.secondaryLink}
            href={action.href}
          >
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function ChatEmptyState({ hasConversations }: { hasConversations: boolean }) {
  return (
    <div className={styles.emptyPanel}>
      <span className={styles.emptyHeroIcon}>
        <MessageSquare size={28} />
      </span>
      <h2>
        {hasConversations
          ? "Select a conversation"
          : "Your hiring conversations will appear here"}
      </h2>
      <p>
        {hasConversations
          ? "Choose a conversation to view messages, interview updates, and hiring decisions."
          : "HiringFly keeps candidate communication, interview updates, and status changes in one place."}
      </p>
    </div>
  );
}

function SystemMessage({ msg }: { msg: ChatMessage }) {
  const icon =
    msg.type === "interview_update" ? (
      <CalendarDays size={14} />
    ) : msg.type === "status_update" ? (
      <CheckCircle2 size={14} />
    ) : (
      <Bell size={14} />
    );

  return (
    <div className={styles.systemMessage}>
      <span className={styles.systemIcon}>{icon}</span>
      <span>{msg.text}</span>
      <time>{timeAgo(msg.createdAt)}</time>
    </div>
  );
}

function MessageBubble({
  msg,
  isOwn,
}: {
  msg: ChatMessage;
  isOwn: boolean;
}) {
  if (msg.type && msg.type !== "user") return <SystemMessage msg={msg} />;
  if (!msg.senderId) return <SystemMessage msg={msg} />;

  const senderName = msg.sender?.fullName ?? "HiringFly user";
  const senderAvatar = msg.sender?.avatarUrl ?? msg.sender?.avatar ?? null;

  return (
    <div className={`${styles.msgGroup} ${isOwn ? styles.msgGroupOwn : ""}`}>
      {!isOwn ? (
        <span className={styles.msgAvatar}>
          {senderAvatar ? (
            <Image
              width={30}
              height={30}
              src={senderAvatar}
              alt={senderName}
              className={styles.avatarImage}
            />
          ) : (
            toInitials(senderName)
          )}
        </span>
      ) : null}
      <div className={styles.msgContent}>
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

function MessageSkeletons() {
  return (
    <>
      {[44, 64, 38, 52].map((width, index) => (
        <div
          key={width}
          className={`${styles.msgGroup} ${
            index % 2 === 1 ? styles.msgGroupOwn : ""
          }`}
        >
          <span
            className={`${styles.skeleton} ${styles.messageSkeleton}`}
            style={{ width: `${width}%` }}
          />
        </div>
      ))}
    </>
  );
}

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

export default function MessagesPage() {
  const user = useUser();
  const role = user?.role ?? "applicant";
  const currentUserId = user?.id ?? "";
  const searchParams = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const didAutoOpen = useRef(false);

  const {
    conversations,
    messages,
    activeConvId,
    typingUsers,
    connected,
    loadingInbox,
    loadingMessages,
    sending,
    error,
    sendError,
    refreshInbox,
    openConversation,
    startConversation,
    sendMessage,
    archiveConversation,
    handleTyping,
  } = useChat(currentUserId);

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [inputText, setInputText] = useState("");
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  useEffect(() => {
    if (loadingInbox || didAutoOpen.current) return;
    const to = searchParams.get("to");
    if (to) {
      didAutoOpen.current = true;
      void startConversation(to).then(() => setMobileChatOpen(true));
    }
  }, [loadingInbox, searchParams, startConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers.size]);

  const filteredConvs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return conversations.filter((conv) => {
      if (activeFilter === "unread" && conv.unread_count < 1) return false;
      if (activeFilter === "applicants" && conv.other_user_role !== "applicant") {
        return false;
      }
      if (activeFilter === "employers" && conv.other_user_role !== "employer") {
        return false;
      }
      if (!q) return true;
      return [
        conv.other_user_name,
        conv.company_name,
        conv.job_title,
        conv.last_message,
      ].some((value) => `${value ?? ""}`.toLowerCase().includes(q));
    });
  }, [activeFilter, conversations, search]);

  const activeConv = useMemo(
    () => conversations.find((conv) => conv.id === activeConvId) ?? null,
    [activeConvId, conversations],
  );

  const unreadTotal = conversations.reduce(
    (sum, conv) => sum + (conv.unread_count ?? 0),
    0,
  );
  const isEmployer = role === "employer";
  const isSomeoneTyping = typingUsers.size > 0;

  const filters = useMemo(
    () => [
      { id: "all", label: "All" },
      { id: "unread", label: `Unread${unreadTotal ? ` (${unreadTotal})` : ""}` },
      { id: isEmployer ? "applicants" : "employers", label: isEmployer ? "Applicants" : "Employers" },
    ],
    [isEmployer, unreadTotal],
  );

  const selectConversation = useCallback(
    async (conv: Conversation) => {
      await openConversation(conv.id);
      setMobileChatOpen(true);
    },
    [openConversation],
  );

  const handleSend = useCallback(async () => {
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText("");
    await sendMessage(text);
  }, [inputText, sendMessage]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        void handleSend();
      }
    },
    [handleSend],
  );

  const actionLinks = activeConv
    ? [
        {
          label: isEmployer ? "View application" : "View applications",
          href: isEmployer ? "/employer/applicants" : "/applicant/applications",
          icon: <UserRound size={15} />,
          show: Boolean(activeConv.application_id),
        },
        {
          label: "View job",
          href: isEmployer ? "/employer/jobs" : "/applicant/browse-jobs",
          icon: <BriefcaseBusiness size={15} />,
          show: Boolean(activeConv.job_id),
        },
        {
          label: "Schedule interview",
          href: "/employer/interviews",
          icon: <CalendarDays size={15} />,
          show: isEmployer,
        },
      ].filter((action) => action.show)
    : [];

  return (
    <div
      className={`${styles.page} ${
        mobileChatOpen ? styles.mobileChatOpen : ""
      }`}
    >
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHead}>
          <div className={styles.titleRow}>
            <div>
              <p className={styles.eyebrow}>Communication center</p>
              <h1 className={styles.sidebarTitle}>Messages</h1>
            </div>
            <button
              className={styles.iconButton}
              type="button"
              onClick={() => void refreshInbox()}
              aria-label="Refresh conversations"
            >
              <RefreshCcw size={16} />
            </button>
          </div>

          <div className={styles.liveBadge}>
            <span className={connected ? styles.liveDot : styles.idleDot} />
            {connected ? "Live updates on" : "Refreshes safely"}
          </div>

          <div className={styles.searchWrap}>
            <Search size={15} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Search name, role, job, or message"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className={styles.filterTabs}>
            {filters.map((filter) => (
              <button
                key={filter.id}
                className={
                  activeFilter === filter.id ? styles.filterTabActive : ""
                }
                type="button"
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {error ? <div className={styles.errorStrip}>{error}</div> : null}
        </div>

        <div className={styles.convList}>
          {loadingInbox ? (
            <ConversationSkeletons />
          ) : conversations.length === 0 ? (
            <RoleEmptyState role={role} />
          ) : filteredConvs.length === 0 ? (
            <div className={styles.emptySearch}>
              <Search size={22} />
              <h2>No conversations match your search.</h2>
              <p>Try a candidate name, company name, job title, or message.</p>
            </div>
          ) : (
            filteredConvs.map((conv) => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                active={conv.id === activeConvId}
                currentUserId={currentUserId}
                onClick={() => void selectConversation(conv)}
              />
            ))
          )}
        </div>
      </aside>

      <section className={styles.chatPanel}>
        {!activeConv ? (
          <ChatEmptyState hasConversations={conversations.length > 0} />
        ) : (
          <>
            <header className={styles.chatHeader}>
              <button
                className={styles.mobileBack}
                type="button"
                onClick={() => setMobileChatOpen(false)}
                aria-label="Back to conversations"
              >
                <ArrowLeft size={18} />
              </button>

              <span className={styles.chatHeaderAvatar}>
                {avatarUrl(activeConv) ? (
                  <Image
                    src={avatarUrl(activeConv)!}
                    alt={activeConv.other_user_name}
                    width={44}
                    height={44}
                    className={styles.avatarImage}
                  />
                ) : (
                  toInitials(activeConv.other_user_name)
                )}
              </span>

              <div className={styles.chatHeaderInfo}>
                <div className={styles.chatTitleLine}>
                  <h2>{activeConv.other_user_name}</h2>
                  {activeConv.application_status ? (
                    <span className={styles.statusBadge}>
                      {formatStatus(activeConv.application_status)}
                    </span>
                  ) : null}
                </div>
                <p>
                  {isSomeoneTyping
                    ? "Typing..."
                    : conversationContext(activeConv)}
                </p>
              </div>

              <div className={styles.headerActions}>
                {actionLinks.map((action) => (
                  <Link
                    key={action.label}
                    className={styles.headerAction}
                    href={action.href}
                  >
                    {action.icon}
                    <span>{action.label}</span>
                  </Link>
                ))}
                <button
                  className={styles.headerIconAction}
                  type="button"
                  onClick={() => void archiveConversation(activeConv.id)}
                  aria-label="Archive conversation"
                >
                  <Archive size={16} />
                </button>
              </div>
            </header>

            <div className={styles.messages}>
              {loadingMessages ? (
                <MessageSkeletons />
              ) : messages.length === 0 ? (
                <div className={styles.emptyThread}>
                  <Sparkles size={24} />
                  <h2>Start the conversation</h2>
                  <p>
                    Keep hiring context, interview details, and decisions in
                    this thread.
                  </p>
                </div>
              ) : (
                messages
                  .filter((message) => !message.isDeleted)
                  .map((message, index, visibleMessages) => {
                    const previous = visibleMessages[index - 1];
                    const showDay = !isSameDay(
                      previous?.createdAt,
                      message.createdAt,
                    );

                    return (
                      <div key={message.id} className={styles.messageBlock}>
                        {showDay ? (
                          <div className={styles.dateSeparator}>
                            <span>{formatDay(message.createdAt)}</span>
                          </div>
                        ) : null}
                        <MessageBubble
                          msg={message}
                          isOwn={message.senderId === currentUserId}
                        />
                      </div>
                    );
                  })
              )}

              {isSomeoneTyping ? <TypingIndicator /> : null}
              <div ref={messagesEndRef} />
            </div>

            <footer className={styles.inputArea}>
              {sendError ? <div className={styles.sendError}>{sendError}</div> : null}
              <div className={styles.composer}>
                <textarea
                  className={styles.msgInput}
                  placeholder="Type a message. Enter sends, Shift+Enter adds a line."
                  value={inputText}
                  rows={1}
                  onChange={(event) => {
                    setInputText(event.target.value);
                    handleTyping();
                  }}
                  onKeyDown={handleKeyDown}
                  disabled={sending}
                />
                <button
                  className={styles.sendBtn}
                  onClick={() => void handleSend()}
                  disabled={!inputText.trim() || sending}
                  type="button"
                  aria-label="Send message"
                >
                  <Send size={16} />
                </button>
              </div>
            </footer>
          </>
        )}
      </section>
    </div>
  );
}
