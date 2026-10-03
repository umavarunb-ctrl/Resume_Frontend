import { useSyncExternalStore, useMemo, useEffect } from "react";
import { chatService } from "../services/chatService";

// SSR-safe empty snapshots — the chat store only lives in the browser
const emptyArray: never[] = [];
const emptyMap = new Map<string, Set<string>>();

export function useChat() {
  const conversations = useSyncExternalStore(
    chatService.subscribe.bind(chatService),
    () => chatService.getConversations(),
    () => emptyArray,
  );

  const users = useSyncExternalStore(
    chatService.subscribe.bind(chatService),
    () => chatService.getUsers(),
    () => emptyArray,
  );

  const unreadCount = useSyncExternalStore(
    chatService.subscribe.bind(chatService),
    () => chatService.getUnreadCount(),
    () => 0,
  );

  const currentUser = chatService.getCurrentUser();

  const typingState = useSyncExternalStore(
    chatService.subscribe.bind(chatService),
    () => chatService.getTypingState(),
    () => emptyMap,
  );

  return {
    conversations,
    users,
    unreadCount,
    currentUser,
    typingState,
    markAsRead: (id: string) => chatService.markAsRead(id),
    toggleFavorite: (id: string) => chatService.toggleFavorite(id),
    togglePinConversation: (id: string) => chatService.togglePinConversation(id),
    createConversation: chatService.createConversation.bind(chatService),
    createOrGetCandidateDiscussion: chatService.createOrGetCandidateDiscussion.bind(chatService),
    deleteConversation: (id: string) => chatService.deleteConversation(id),
  };
}

export function useConversation(conversationId?: string) {
  const allMessages = useSyncExternalStore(
    chatService.subscribe.bind(chatService),
    () => chatService.getMessagesState(),
    () => emptyArray,
  );

  const allConversations = useSyncExternalStore(
    chatService.subscribe.bind(chatService),
    () => chatService.getConversations(),
    () => emptyArray,
  );

  const typingState = useSyncExternalStore(
    chatService.subscribe.bind(chatService),
    () => chatService.getTypingState(),
    () => emptyMap,
  );

  useEffect(() => {
    if (!conversationId) return;

    chatService.getMessages(conversationId);
    chatService.subscribeToConversation(conversationId);

    return () => {
      chatService.unsubscribeFromConversation(conversationId);
    };
  }, [conversationId]);

  const messages = useMemo(() => {
    if (!conversationId) return [];
    return allMessages.filter((m) => m.conversationId === conversationId);
  }, [allMessages, conversationId]);

  const conversation = useMemo(() => {
    if (!conversationId) return undefined;
    return allConversations.find((c) => c.id === conversationId);
  }, [allConversations, conversationId]);

  const typingUsers = useMemo(() => {
    if (!conversationId) return [];
    const set = typingState.get(conversationId);
    return set ? Array.from(set) : [];
  }, [typingState, conversationId]);

  return {
    messages,
    conversation,
    typingUsers,
    sendMessage: (
      content: string,
      type: "text" | "file" | "candidate" = "text",
      candidateId?: string,
      replyTo?: string,
    ) => {
      if (!conversationId) return;
      return chatService.sendMessage(conversationId, content, type, candidateId, replyTo);
    },
    editMessage: (msgId: string, newContent: string) => {
      chatService.editMessage(msgId, newContent);
    },
    deleteMessage: (msgId: string) => {
      chatService.deleteMessage(msgId);
    },
    toggleReaction: (msgId: string, emoji: string) => {
      chatService.toggleReaction(msgId, emoji);
    },
    sendTypingEvent: (isTyping: boolean) => {
      if (!conversationId) return;
      chatService.sendTypingEvent(conversationId, isTyping);
    },
  };
}
