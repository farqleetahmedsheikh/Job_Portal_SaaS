/** @format */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { API_BASE } from "../constants";
import { api } from "../lib";
import { SOCKET_SERVER_ORIGIN } from "../lib/socket";

export type MessageType =
  | "user"
  | "system"
  | "status_update"
  | "interview_update"
  | "offer_update";

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string | null;
  type?: MessageType;
  text: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  isDeleted: boolean;
  sender?: {
    id: string;
    fullName: string;
    avatar?: string | null;
    avatarUrl?: string | null;
  } | null;
}

export interface Conversation {
  id: string;
  job_id?: string | null;
  company_id?: string | null;
  application_id?: string | null;
  employer_id?: string | null;
  applicant_id?: string | null;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string | null;
  other_user_role: string;
  last_message: string | null;
  last_message_type?: MessageType | null;
  last_message_metadata?: Record<string, unknown> | null;
  last_message_at: string | null;
  last_message_sender_id: string | null;
  unread_count: number;
  job_title: string | null;
  company_name?: string | null;
  company_logo_url?: string | null;
  application_status?: string | null;
  archived_by_employer?: boolean;
  archived_by_applicant?: boolean;
}

const EV = {
  JOIN: "join_conversation",
  LEAVE: "leave_conversation",
  SEND: "send_message",
  TYPING: "typing",
  STOP_TYPING: "stop_typing",
  MARK_READ: "mark_read",
  NEW_MESSAGE: "new_message",
  TYPING_IND: "typing_indicator",
  ERROR: "ws_error",
} as const;

const TYPING_DEBOUNCE = 1500;

export function useChat(currentUserId: string) {
  const socketRef = useRef<Socket | null>(null);
  const activeConvIdRef = useRef<string | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [loadingInbox, setLoadingInbox] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const refreshInbox = useCallback(async () => {
    setLoadingInbox(true);
    setError(null);
    try {
      const data = await api<Conversation[]>(`${API_BASE}/messaging/inbox`);
      setConversations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load messages");
    } finally {
      setLoadingInbox(false);
    }
  }, []);

  useEffect(() => {
    activeConvIdRef.current = activeConvId;
  }, [activeConvId]);

  useEffect(() => {
    if (!currentUserId) return;

    const socket = io(`${SOCKET_SERVER_ORIGIN}/chat`, {
      withCredentials: true,
      transports: ["websocket"],
    });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on(EV.NEW_MESSAGE, (msg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        const optimisticIndex = prev.findIndex(
          (m) =>
            m.id.startsWith("opt-") &&
            m.senderId === msg.senderId &&
            m.text === msg.text,
        );
        if (optimisticIndex >= 0) {
          const next = [...prev];
          next[optimisticIndex] = msg;
          return next;
        }
        return [...prev, msg];
      });

      setConversations((prev) =>
        prev.map((c) =>
          c.id === msg.conversationId
            ? {
                ...c,
                last_message: msg.text,
                last_message_type: msg.type ?? "user",
                last_message_at: msg.createdAt,
                last_message_sender_id: msg.senderId,
                unread_count:
                  activeConvIdRef.current === c.id
                    ? 0
                    : c.unread_count + (msg.senderId !== currentUserId ? 1 : 0),
              }
            : c,
        ),
      );
    });

    socket.on(
      EV.TYPING_IND,
      ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          if (isTyping) {
            next.add(userId);
          } else {
            next.delete(userId);
          }
          return next;
        });
      },
    );

    socket.on(EV.ERROR, (err: { message?: string }) => {
      setSendError(err.message ?? "Message failed to send");
      setSending(false);
    });

    socketRef.current = socket;
    return () => {
      socket.disconnect();
    };
  }, [currentUserId]);

  useEffect(() => {
    void refreshInbox();
  }, [refreshInbox]);

  const openConversation = useCallback(async (convId: string) => {
    const socket = socketRef.current;

    if (activeConvIdRef.current && activeConvIdRef.current !== convId) {
      socket?.emit(EV.LEAVE, { conversationId: activeConvIdRef.current });
    }

    setActiveConvId(convId);
    setLoadingMessages(true);
    setSendError(null);
    setTypingUsers(new Set());

    try {
      const history = await api<ChatMessage[]>(
        `${API_BASE}/messaging/conversations/${convId}/messages`,
      );
      setMessages(history);
      socket?.emit(EV.JOIN, { conversationId: convId });
      socket?.emit(EV.MARK_READ, { conversationId: convId });
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, unread_count: 0 } : c)),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load conversation",
      );
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const startConversation = useCallback(
    async (otherUserId: string) => {
      const existing = conversations.find(
        (c) => c.other_user_id === otherUserId,
      );
      if (existing) {
        await openConversation(existing.id);
        return;
      }

      try {
        const conv = await api<{ id: string }>(
          `${API_BASE}/messaging/conversations`,
          "POST",
          { recipientId: otherUserId },
        );
        await refreshInbox();
        await openConversation(conv.id);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not start conversation",
        );
      }
    },
    [conversations, openConversation, refreshInbox],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const body = text.trim();
      if (!activeConvId || !body || sending) return;

      const socket = socketRef.current;
      setSending(true);
      setSendError(null);

      if (isTypingRef.current) {
        socket?.emit(EV.STOP_TYPING, { conversationId: activeConvId });
        isTypingRef.current = false;
      }

      if (socket?.connected) {
        const optimistic: ChatMessage = {
          id: `opt-${Date.now()}`,
          conversationId: activeConvId,
          senderId: currentUserId,
          type: "user",
          text: body,
          createdAt: new Date().toISOString(),
          isDeleted: false,
          sender: { id: currentUserId, fullName: "You", avatar: null },
        };
        setMessages((prev) => [...prev, optimistic]);
        socket.emit(EV.SEND, { conversationId: activeConvId, text: body });
        setSending(false);
        return;
      }

      try {
        const message = await api<ChatMessage>(
          `${API_BASE}/messaging/conversations/${activeConvId}/messages`,
          "POST",
          { text: body },
        );
        setMessages((prev) => [...prev, message]);
        await refreshInbox();
      } catch (err) {
        setSendError(err instanceof Error ? err.message : "Message failed");
      } finally {
        setSending(false);
      }
    },
    [activeConvId, currentUserId, refreshInbox, sending],
  );

  const markRead = useCallback(async (convId: string) => {
    try {
      await api(`${API_BASE}/messaging/conversations/${convId}/read`, "PATCH");
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, unread_count: 0 } : c)),
      );
    } catch {
      /* read state is best-effort */
    }
  }, []);

  const archiveConversation = useCallback(
    async (convId: string, archived = true) => {
      await api(
        `${API_BASE}/messaging/conversations/${convId}/archive`,
        "PATCH",
        { archived },
      );
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConvId === convId) {
        setActiveConvId(null);
        setMessages([]);
      }
    },
    [activeConvId],
  );

  const handleTyping = useCallback(() => {
    const socket = socketRef.current;
    if (!socket?.connected || !activeConvId) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit(EV.TYPING, { conversationId: activeConvId });
    }

    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit(EV.STOP_TYPING, { conversationId: activeConvId });
    }, TYPING_DEBOUNCE);
  }, [activeConvId]);

  return {
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
    markRead,
    archiveConversation,
    handleTyping,
  };
}
