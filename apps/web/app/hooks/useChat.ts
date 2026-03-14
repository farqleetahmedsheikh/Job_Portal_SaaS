/** @format */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { api } from "../lib";
import { API_BASE } from "../constants";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
  isDeleted: boolean;
  sender: {
    id: string;
    fullName: string;
    avatar: string | null;
  };
}

export interface Conversation {
  id: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar: string | null;
  otherUserRole: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  lastMessageSenderId: string | null;
  unreadCount: number;
  jobTitle: string | null;
}

// ── Event names (must match backend WS_EVENTS) ────────────────────────────────
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

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9000";

// ── Typing debounce ───────────────────────────────────────────────────────────
const TYPING_DEBOUNCE = 1500; // ms

export function useChat(currentUserId: string) {
  const socketRef = useRef<Socket | null>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [loadingInbox, setLoadingInbox] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [connected, setConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  // ── Connect socket ─────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = io(`${SOCKET_URL}/chat`, {
      withCredentials: true, // sends httpOnly cookie
      transports: ["websocket"],
    });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    // New message arrives
    socket.on(EV.NEW_MESSAGE, (msg: ChatMessage) => {
      setMessages((prev) => {
        // Deduplicate — optimistic msg might already be in list
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      // Bump conversation's last message in inbox
      setConversations((prev) =>
        prev.map((c) =>
          c.id === msg.conversationId
            ? {
                ...c,
                lastMessage: msg.text,
                lastMessageAt: msg.createdAt,
                lastMessageSenderId: msg.senderId,
                // Only increment unread if not the active conversation
                unreadCount:
                  activeConvId === c.id
                    ? 0
                    : c.unreadCount + (msg.senderId !== currentUserId ? 1 : 0),
              }
            : c,
        ),
      );
    });

    // Typing indicator
    socket.on(
      EV.TYPING_IND,
      ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          isTyping ? next.add(userId) : next.delete(userId);
          return next;
        });
      },
    );

    socket.on(EV.ERROR, (err: { message: string }) => {
      console.error("[WS]", err.message);
    });

    socketRef.current = socket;
    return () => {
      socket.disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch inbox ────────────────────────────────────────────────────────────
  useEffect(() => {
    setLoadingInbox(true);
    api<Conversation[]>(`${API_BASE}/messaging/inbox`, "GET")
      .then((data) => setConversations(data))
      .catch(console.error)
      .finally(() => setLoadingInbox(false));
  }, []);

  // ── Open conversation ──────────────────────────────────────────────────────
  const openConversation = useCallback(
    async (convId: string) => {
      const socket = socketRef.current;
      if (!socket) return;

      // Leave previous room
      if (activeConvId && activeConvId !== convId) {
        socket.emit(EV.LEAVE, { conversationId: activeConvId });
      }

      setActiveConvId(convId);
      setLoadingMessages(true);
      setTypingUsers(new Set());

      try {
        // Fetch history via REST (reliable, pageable later)
        const history = await api<ChatMessage[]>(
          `${API_BASE}/messaging/conversations/${convId}/messages`,
          "GET",
        );
        setMessages(history);

        // Join socket room
        socket.emit(EV.JOIN, { conversationId: convId });

        // Mark as read
        socket.emit(EV.MARK_READ, { conversationId: convId });
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c)),
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingMessages(false);
      }
    },
    [activeConvId],
  );

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    (text: string) => {
      const socket = socketRef.current;
      if (!socket || !activeConvId || !text.trim()) return;

      // Optimistic message
      const optimistic: ChatMessage = {
        id: `opt-${Date.now()}`,
        conversationId: activeConvId,
        senderId: currentUserId,
        text: text.trim(),
        createdAt: new Date().toISOString(),
        isDeleted: false,
        sender: { id: currentUserId, fullName: "You", avatar: null },
      };
      setMessages((prev) => [...prev, optimistic]);

      // Stop typing
      if (isTypingRef.current) {
        socket.emit(EV.STOP_TYPING, { conversationId: activeConvId });
        isTypingRef.current = false;
      }

      socket.emit(EV.SEND, { conversationId: activeConvId, text: text.trim() });
    },
    [activeConvId, currentUserId],
  );

  // ── Typing ─────────────────────────────────────────────────────────────────
  const handleTyping = useCallback(() => {
    const socket = socketRef.current;
    if (!socket || !activeConvId) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit(EV.TYPING, { conversationId: activeConvId });
    }

    // Reset debounce timer
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit(EV.STOP_TYPING, { conversationId: activeConvId });
    }, TYPING_DEBOUNCE);
  }, [activeConvId]);

  return {
    // data
    conversations,
    messages,
    activeConvId,
    typingUsers,
    // state
    connected,
    loadingInbox,
    loadingMessages,
    // actions
    openConversation,
    sendMessage,
    handleTyping,
  };
}
