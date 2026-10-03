import { Conversation, Message, ChatUser, Notification, PresenceStatus } from "../types/chat";
import config from "@/lib/config";

type Listener = () => void;

class ChatService {
  private conversations: Conversation[] = [];
  private messages: Message[] = [];
  private users: ChatUser[] = [];
  private notifications: Notification[] = [];
  private listeners: Set<Listener> = new Set();
  
  private ws: WebSocket | null = null;
  private isInitialized = false;
  private fetchedConversations = new Set<string>(); // Keep track of which conversations' messages we fetched
  private typingState = new Map<string, Set<string>>(); // conversationId -> set of userIds typing
  private typingTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private presencePollInterval: ReturnType<typeof setInterval> | null = null;
  private fetchingUserIds = new Set<string>();

  constructor() {
    this.users = [];
    if (typeof window !== "undefined") {
      this.init();
    }
  }

  async init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Seed the current logged-in user immediately so self-sent messages resolve
    this.seedCurrentUser();

    await this.fetchConversations();
    // After conversations load, resolve all member UUIDs to real user profiles
    await this.fetchConversationMembers();
    this.connectWebSocket();

    // Periodic presence refresh every 12s so online status stays fresh even without WS push
    if (!this.presencePollInterval) {
      this.presencePollInterval = setInterval(() => {
        this.fetchConversationMembers();
      }, 12000);
    }
  }

  async reconnect() {
    this.seedCurrentUser();
    if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
      await this.fetchConversations();
      await this.fetchConversationMembers();
      this.connectWebSocket();
    }
  }

  private seedCurrentUser() {
    try {
      const saved = localStorage.getItem("archivum_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.id) {
          const me: ChatUser = {
            id: parsed.id,
            name: parsed.name || "Me",
            role: parsed.role || "recruiter",
            avatar: parsed.profilePicture || undefined,
            email: parsed.email || "",
            status: "online",
          };
          this.mergeUser(me);
        }
      }
    } catch {
      // ignore
    }
  }

  updateUserStatus(userId: string, status: PresenceStatus) {
    if (!userId) return;
    let changed = false;
    this.users = this.users.map((u) => {
      if (u.id === userId) {
        if (u.status !== status) {
          changed = true;
          return { ...u, status };
        }
      }
      return u;
    });

    if (changed) {
      this.notify();
    }
  }

  private mergeUser(user: ChatUser) {
    const existingIndex = this.users.findIndex((u) => u.id === user.id);
    if (existingIndex > -1) {
      const existing = this.users[existingIndex];
      if (existing) {
        // Keep real-time online status if we previously received a live event
        const status =
          existing.status === "online" && user.status === "offline"
            ? "online"
            : user.status;
        this.users = [
          ...this.users.slice(0, existingIndex),
          { ...existing, ...user, status },
          ...this.users.slice(existingIndex + 1),
        ];
      }
    } else {
      this.users = [...this.users, user];
    }
    this.notify();
  }

  async fetchUser(userId: string): Promise<ChatUser | null> {
    if (!userId || this.fetchingUserIds.has(userId)) return null;
    this.fetchingUserIds.add(userId);

    const token = this.getToken();
    if (!token) {
      this.fetchingUserIds.delete(userId);
      return null;
    }

    try {
      // 1. Try /chat/users/:id
      let res = await fetch(`${config.apiUrl}/chat/users/${userId}`, {
        headers: this.getAuthHeaders(),
      });

      // 2. Fallback to /users/:id
      if (!res.ok) {
        res = await fetch(`${config.apiUrl}/users/${userId}`, {
          headers: this.getAuthHeaders(),
        });
      }

      if (res.ok) {
        const data = await res.json();
        const user = this.mapUser(data);
        this.mergeUser(user);
        return user;
      }
    } catch (e) {
      console.warn(`Failed to fetch user ${userId}`, e);
    } finally {
      this.fetchingUserIds.delete(userId);
    }
    return null;
  }

  async fetchConversationMembers() {
    const allMemberIds = new Set<string>();
    this.conversations.forEach((c) => c.memberIds.forEach((id) => allMemberIds.add(id)));

    const currentUserId = this.getCurrentUser()?.id;
    const targetIds = Array.from(allMemberIds).filter((id) => id && id !== currentUserId);

    if (targetIds.length === 0) return;

    await Promise.all(targetIds.map((id) => this.fetchUser(id)));
  }

  private getToken() {
    return localStorage.getItem("archivum_token");
  }

  private getAuthHeaders() {
    const token = this.getToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  }

  // --- Mappers ---
  private mapConversation(apiData: any): Conversation {
    const mapped: Conversation = {
      id: apiData.id,
      type: apiData.type,
      memberIds: apiData.member_ids || apiData.memberIds || [],
      unreadCount: apiData.unread_count ?? apiData.unreadCount ?? 0,
      isFavorite: false,
      isPinned: false,
      isArchived: apiData.is_archived || false,
      createdAt: apiData.created_at || apiData.createdAt,
      updatedAt: apiData.updated_at || apiData.updatedAt,
    };
    if (apiData.name) mapped.name = apiData.name;
    if (apiData.candidate_id || apiData.candidateId) mapped.candidateId = apiData.candidate_id || apiData.candidateId;
    const rawLast = apiData.last_message || apiData.lastMessage || apiData.latest_message || apiData.latestMessage;
    if (rawLast) mapped.lastMessage = this.mapMessage(rawLast);
    return mapped;
  }

  private mapMessage(apiData: any): Message {
    let reactions: { emoji: string; userIds: string[] }[] = [];
    if (Array.isArray(apiData.reactions)) {
      const reactionMap = new Map<string, Set<string>>();
      apiData.reactions.forEach((r: any) => {
        const e = r.emoji;
        if (!e) return;
        if (!reactionMap.has(e)) reactionMap.set(e, new Set());
        if (Array.isArray(r.userIds)) {
          r.userIds.forEach((u: string) => reactionMap.get(e)!.add(u));
        } else if (Array.isArray(r.users)) {
          r.users.forEach((u: any) => reactionMap.get(e)!.add(typeof u === "string" ? u : u.id));
        } else if (r.user_id || r.userId) {
          reactionMap.get(e)!.add(r.user_id || r.userId);
        }
      });
      reactions = Array.from(reactionMap.entries()).map(([emoji, userSet]) => ({
        emoji,
        userIds: Array.from(userSet),
      }));
    }

    return {
      id: apiData.id,
      conversationId: apiData.conversation_id || apiData.conversationId,
      senderId: apiData.sender_id || apiData.senderId,
      type: apiData.type || "text",
      content: apiData.content || undefined,
      replyTo: apiData.reply_to || apiData.replyTo || undefined,
      candidateId: apiData.candidate_id || apiData.candidateId || undefined,
      reactions: reactions,
      status: "read", // API returns persisted messages
      edited: apiData.is_edited || apiData.edited || false,
      pinned: apiData.is_pinned || apiData.pinned || false,
      createdAt: apiData.created_at || apiData.createdAt,
    };
  }

  private mapUser(apiData: any): ChatUser {
    let status: PresenceStatus = "offline";
    const rawStatus = (apiData.status || "").toLowerCase();
    if (["online", "away", "dnd", "offline"].includes(rawStatus)) {
      status = rawStatus as PresenceStatus;
    } else if (apiData.is_online === true || apiData.online === true) {
      status = "online";
    }

    return {
      id: apiData.id,
      name: apiData.full_name || apiData.name || "Unknown User",
      role: apiData.role || "recruiter",
      avatar: apiData.profile_picture || apiData.avatar || undefined,
      email: apiData.email || "",
      status,
    };
  }

  // --- Core API Calls ---

  async searchUsers(query: string) {
    if (!query.trim()) return [];
    try {
      const res = await fetch(`${config.apiUrl}/chat/users/search?q=${encodeURIComponent(query)}`, { headers: this.getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        const usersArray = Array.isArray(data) ? data : (data.users || data.items || []);
        if (usersArray.length > 0) {
          const newUsers = usersArray.map((u: any) => this.mapUser(u));
          newUsers.forEach((u: ChatUser) => this.mergeUser(u));
          return newUsers;
        }
      }
    } catch (e) {
      console.error("Failed to search users", e);
    }
    return [];
  }

  async fetchConversations() {
    try {
      const res = await fetch(`${config.apiUrl}/chat/conversations`, { headers: this.getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        const convList = data.conversations || data.items || (Array.isArray(data) ? data : []);
        this.conversations = convList.map((c: any) => this.mapConversation(c));
        this.notify();

        // Fetch messages for all conversations immediately so sidebar previews populate on reload
        await this.fetchAllConversationMessages();
      }
    } catch (e) {
      console.error("Failed to fetch conversations", e);
    }
  }

  async fetchAllConversationMessages() {
    if (this.conversations.length === 0) return;
    await Promise.allSettled(
      this.conversations.map((c) => this.fetchMessagesIfNeeded(c.id))
    );
  }

  async fetchMessagesIfNeeded(conversationId: string) {
    if (this.fetchedConversations.has(conversationId)) return;

    try {
      const res = await fetch(`${config.apiUrl}/chat/conversations/${conversationId}/messages`, { headers: this.getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        const rawMsgs = data.messages || data.items || (Array.isArray(data) ? data : []);
        const apiMessages = rawMsgs.map((m: any) => this.mapMessage(m));

        const otherMessages = this.messages.filter(m => m.conversationId !== conversationId);
        this.messages = [...otherMessages, ...apiMessages].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        this.fetchedConversations.add(conversationId);

        // Seed or update lastMessage on the conversation
        const last = apiMessages[apiMessages.length - 1];
        if (last) {
          this.conversations = this.conversations.map((c) =>
            c.id === conversationId ? { ...c, lastMessage: last } : c,
          );
        }

        this.notify();
      }
    } catch (e) {
      console.error("Failed to fetch messages", e);
    }
  }

  // --- WebSocket Connection ---

  private activeConversationId: string | null = null;

  private connectWebSocket() {
    const token = this.getToken();
    if (!token) return;

    // Convert http/https to ws/wss
    let baseUrl = config.apiUrl.startsWith("http") ? config.apiUrl : window.location.origin + config.apiUrl;
    baseUrl = baseUrl.replace("http://", "ws://").replace("https://", "wss://");
    
    const wsUrl = `${baseUrl}/chat/ws?token=${token}`;
    
    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        const currentUserId = this.getCurrentUser()?.id;
        // Announce this user as online to the backend
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(
            JSON.stringify({
              event: "presence.online",
              type: "presence.online",
              action: "presence.online",
              user_id: currentUserId,
              status: "online",
            }),
          );
        }
        if (this.activeConversationId) {
          this.subscribeToConversation(this.activeConversationId);
        }

        // Start ping keepalive
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ event: "ping", type: "ping" }));
          }
        }, 25000);
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          this.handleWebSocketEvent(payload);
        } catch (e) {
          console.error("Failed to parse WS message", e);
        }
      };

      this.ws.onclose = () => {
        if (this.pingInterval) {
          clearInterval(this.pingInterval);
          this.pingInterval = null;
        }
        setTimeout(() => this.connectWebSocket(), 4000);
      };

      // Announce offline / online when tab/window is hidden or focused
      const sendPresence = (isOnline: boolean) => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          const currentUserId = this.getCurrentUser()?.id;
          this.ws.send(
            JSON.stringify({
              event: isOnline ? "presence.online" : "presence.offline",
              type: isOnline ? "presence.online" : "presence.offline",
              action: isOnline ? "presence.online" : "presence.offline",
              user_id: currentUserId,
              status: isOnline ? "online" : "offline",
            }),
          );
        }
      };

      window.addEventListener("beforeunload", () => sendPresence(false));
      document.addEventListener("visibilitychange", () => {
        sendPresence(document.visibilityState !== "hidden");
      });
    } catch (e) {
      console.error("WebSocket connection failed", e);
    }
  }

  subscribeToConversation(conversationId: string) {
    if (this.activeConversationId && this.activeConversationId !== conversationId) {
      this.unsubscribeFromConversation(this.activeConversationId);
    }
    
    this.activeConversationId = conversationId;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        event: "subscribe",
        conversation_id: conversationId
      }));
    }
  }

  unsubscribeFromConversation(conversationId: string) {
    if (this.activeConversationId === conversationId) {
      this.activeConversationId = null;
    }
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        event: "unsubscribe",
        conversation_id: conversationId
      }));
    }
  }

  sendTypingEvent(conversationId: string, isTyping: boolean) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        event: isTyping ? "typing.started" : "typing.stopped",
        conversation_id: conversationId
      }));
    }
  }

  private handleWebSocketEvent(payload: any) {
    if (!payload) return;
    const event = (payload.event || payload.type || payload.action || "").toLowerCase();
    const data = payload.data || payload.payload || payload;
    const convId =
      payload.conversation_id ||
      payload.conversationId ||
      data?.conversation_id ||
      data?.conversationId;
    const userId =
      data?.user_id ||
      data?.userId ||
      data?.sender_id ||
      data?.senderId ||
      data?.id ||
      payload.user_id ||
      payload.userId ||
      payload.sender_id ||
      payload.senderId ||
      payload.id ||
      data?.user?.id ||
      payload.user?.id;
    
    switch (event) {
      case "message.created":
      case "message_created":
      case "message.sent":
      case "new_message": {
        const msgObj = data?.message || (data?.content !== undefined ? data : null);
        if (msgObj) {
          const newMsg = this.mapMessage(msgObj);
          if (!this.messages.some(m => m.id === newMsg.id)) {
            this.messages = [...this.messages, newMsg];
          }
          // Clear typing status for this sender once message is created
          if (convId && newMsg.senderId) {
            const key = `${convId}:${newMsg.senderId}`;
            if (this.typingTimeouts.has(key)) {
              clearTimeout(this.typingTimeouts.get(key));
              this.typingTimeouts.delete(key);
            }
            const currentTyping = this.typingState.get(convId);
            if (currentTyping && currentTyping.has(newMsg.senderId)) {
              const updated = new Set(currentTyping);
              updated.delete(newMsg.senderId);
              this.typingState = new Map(this.typingState);
              this.typingState.set(convId, updated);
            }
          }
          // The sender is active and online right now
          if (newMsg.senderId) {
            this.updateUserStatus(newMsg.senderId, "online");
          }
          // Update lastMessage + unreadCount on the conversation in real-time
          this.conversations = this.conversations.map((c) => {
            if (c.id !== newMsg.conversationId) return c;
            const isActiveConv = this.activeConversationId === c.id;
            const updated: Conversation = {
              ...c,
              lastMessage: newMsg,
              updatedAt: newMsg.createdAt,
              unreadCount: isActiveConv ? c.unreadCount : (c.unreadCount || 0) + 1,
            };
            return updated;
          });
          // Bubble the conversation to the top (most recent first)
          const convIdx = this.conversations.findIndex(c => c.id === newMsg.conversationId);
          if (convIdx > 0) {
            const conv = this.conversations[convIdx];
            if (conv) {
              this.conversations = this.conversations.filter((_, i) => i !== convIdx);
              this.conversations = [conv, ...this.conversations];
            }
          }
          this.notify();
        }
        break;
      }
      case "message.updated":
      case "message_updated":
      case "message.edited":
      case "message_edited": {
        const rawMsg = data?.message || (data?.id ? data : null);
        if (rawMsg) {
          const updatedMsg = this.mapMessage(rawMsg);
          this.messages = this.messages.map(m => m.id === updatedMsg.id ? updatedMsg : m);
          // Also update lastMessage on the conversation if applicable
          this.conversations = this.conversations.map(c => {
            if (c.lastMessage && c.lastMessage.id === updatedMsg.id) {
              return { ...c, lastMessage: updatedMsg };
            }
            return c;
          });
          this.notify();
        }
        break;
      }
      case "message.deleted":
      case "message_deleted":
        if (data?.message_id || data?.id) {
          const delId = data.message_id || data.id;
          this.messages = this.messages.filter(m => m.id !== delId);
          this.notify();
        }
        break;
      case "reaction.added":
      case "reaction_added":
      case "reaction.toggled":
      case "reaction_toggled":
      case "reaction.removed":
      case "reaction_removed":
      case "message.reaction": {
        const msgId = data?.message_id || data?.messageId || payload.message_id || payload.messageId;
        const emoji = data?.emoji || payload.emoji;
        const reactingUserId = data?.user_id || data?.userId || payload.user_id || payload.userId;
        if (reactingUserId) this.updateUserStatus(reactingUserId, "online");

        if (msgId && emoji && reactingUserId) {
          const isRemoval = event.includes("removed");
          this.messages = this.messages.map((m) => {
            if (m.id !== msgId) return m;
            let reactions = m.reactions ? m.reactions.map((r) => ({ ...r, userIds: [...r.userIds] })) : [];
            const existing = reactions.find((r) => r.emoji === emoji);

            if (isRemoval) {
              if (existing) {
                existing.userIds = existing.userIds.filter((u) => u !== reactingUserId);
                reactions = reactions.filter((r) => r.userIds.length > 0);
              }
            } else {
              if (existing) {
                if (!existing.userIds.includes(reactingUserId)) {
                  existing.userIds.push(reactingUserId);
                }
              } else {
                reactions.push({ emoji, userIds: [reactingUserId] });
              }
            }
            return { ...m, reactions };
          });
          this.notify();
        } else if (msgId && Array.isArray(data?.reactions)) {
          this.messages = this.messages.map((m) => {
            if (m.id !== msgId) return m;
            return { ...m, reactions: data.reactions };
          });
          this.notify();
        }
        break;
      }
      case "typing.started":
      case "typing_started":
      case "user.typing":
      case "typing":
        if (convId && userId) {
          const currentTyping = this.typingState.get(convId) || new Set<string>();
          const newTyping = new Set(currentTyping);
          newTyping.add(userId);
          this.typingState = new Map(this.typingState);
          this.typingState.set(convId, newTyping);
          // Typer is definitely online
          this.updateUserStatus(userId, "online");

          // Auto-clear typing indicator after 5 seconds if typing.stopped isn't sent
          const key = `${convId}:${userId}`;
          if (this.typingTimeouts.has(key)) {
            clearTimeout(this.typingTimeouts.get(key));
          }
          const timeout = setTimeout(() => {
            const current = this.typingState.get(convId);
            if (current && current.has(userId)) {
              const updated = new Set(current);
              updated.delete(userId);
              this.typingState = new Map(this.typingState);
              this.typingState.set(convId, updated);
              this.notify();
            }
            this.typingTimeouts.delete(key);
          }, 5000);
          this.typingTimeouts.set(key, timeout);

          this.notify();
        }
        break;
      case "typing.stopped":
      case "typing_stopped":
        if (convId && userId) {
          const key = `${convId}:${userId}`;
          if (this.typingTimeouts.has(key)) {
            clearTimeout(this.typingTimeouts.get(key));
            this.typingTimeouts.delete(key);
          }
          const currentTyping = this.typingState.get(convId);
          if (currentTyping) {
            const newTyping = new Set(currentTyping);
            newTyping.delete(userId);
            this.typingState = new Map(this.typingState);
            this.typingState.set(convId, newTyping);
            this.notify();
          }
        }
        break;

      // --- Presence events ---
      case "user.online":
      case "user_online":
      case "presence.online":
      case "presence_online":
      case "user.connected":
      case "user_connected":
      case "online":
      case "connected":
        if (userId) {
          this.updateUserStatus(userId, "online");
        }
        break;

      case "user.offline":
      case "user_offline":
      case "presence.offline":
      case "presence_offline":
      case "user.disconnected":
      case "user_disconnected":
      case "offline":
      case "disconnected":
        if (userId) {
          this.updateUserStatus(userId, "offline");
        }
        break;

      case "user.away":
      case "presence.away":
      case "away":
        if (userId) {
          this.updateUserStatus(userId, "away");
        }
        break;

      case "user.dnd":
      case "presence.dnd":
      case "dnd":
        if (userId) {
          this.updateUserStatus(userId, "dnd");
        }
        break;

      case "presence":
      case "user.presence":
      case "user_presence":
      case "presence.update":
      case "presence_update":
      case "user.status":
      case "status.change":
      case "status_change": {
        const rawStatus = (
          data?.status ||
          payload.status ||
          (data?.is_online || payload.is_online ? "online" : "offline") ||
          ""
        ).toLowerCase();
        const finalStatus: PresenceStatus =
          rawStatus === "online" || rawStatus === "active"
            ? "online"
            : rawStatus === "away" || rawStatus === "idle"
              ? "away"
              : rawStatus === "dnd" || rawStatus === "busy"
                ? "dnd"
                : "offline";
        if (userId) {
          this.updateUserStatus(userId, finalStatus);
        }
        break;
      }

      case "presence.list":
      case "online_users":
      case "users.online": {
        const onlineIds: string[] = Array.isArray(data?.user_ids)
          ? data.user_ids
          : Array.isArray(data)
            ? data.map((x: any) => (typeof x === "string" ? x : x.id || x.user_id))
            : [];
        if (onlineIds.length > 0) {
          const onlineSet = new Set(onlineIds);
          this.users = this.users.map((u) => ({
            ...u,
            status: onlineSet.has(u.id) ? ("online" as const) : u.status,
          }));
          this.notify();
        }
        break;
      }
    }
  }

  // --- React State Subscriptions ---

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // --- Getters ---

  getConversations() {
    return this.conversations;
  }

  getConversation(id: string) {
    return this.conversations.find((c) => c.id === id);
  }

  getMessages(conversationId: string) {
    // Lazily fetch messages if not loaded
    if (!this.fetchedConversations.has(conversationId)) {
      this.fetchMessagesIfNeeded(conversationId);
    }
    return this.messages.filter((m) => m.conversationId === conversationId);
  }

  getMessagesState() {
    return this.messages;
  }

  getUsers() {
    return this.users;
  }

  getTypingState() {
    return this.typingState;
  }

  getTypingUsers(conversationId: string): string[] {
    const typingSet = this.typingState.get(conversationId);
    return typingSet ? Array.from(typingSet) : [];
  }

  getUser(id: string): ChatUser | undefined {
    const user = this.users.find((u) => u.id === id);
    if (!user && id) {
      this.fetchUser(id);
    }
    return user;
  }

  getCurrentUser(): ChatUser {
    try {
      const saved = localStorage.getItem("archivum_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) {
          return {
            id: parsed.id,
            name: parsed.name,
            role: parsed.role || "recruiter",
            avatar: parsed.profilePicture || undefined,
            email: parsed.email,
            status: "online"
          } as ChatUser;
        }
      }
    } catch (e) {}
    
    return {
      id: "anonymous",
      name: "Recruiter",
      role: "recruiter",
      email: "",
      status: "online"
    };
  }

  getUnreadCount() {
    return this.conversations.reduce((acc, curr) => acc + (curr.unreadCount || 0), 0);
  }

  // --- Mutations (Updating backend, then optimistic UI) ---

  async sendMessage(
    conversationId: string,
    content: string,
    type: Message["type"] = "text",
    candidateId?: string,
    replyTo?: string,
  ) {
    // Optimistic UI
    const tempId = `temp_${Date.now()}`;
    const tempMessage: Message = {
      id: tempId,
      conversationId,
      senderId: this.getCurrentUser().id,
      type,
      ...(content ? { content } : {}),
      ...(candidateId ? { candidateId } : {}),
      ...(replyTo ? { replyTo } : {}),
      status: "sending",
      createdAt: new Date().toISOString(),
    };
    
    this.messages = [...this.messages, tempMessage];
    this.conversations = this.conversations.map((c) => {
      if (c.id === conversationId) {
        return { ...c, lastMessage: tempMessage, updatedAt: tempMessage.createdAt };
      }
      return c;
    });
    this.notify();

    try {
      const res = await fetch(`${config.apiUrl}/chat/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          content,
          type,
          candidate_id: candidateId || null,
          reply_to: replyTo || null,
        })
      });

      if (res.ok) {
        const data = await res.json();
        const finalMsg = this.mapMessage(data);
        
        // If the WebSocket already added the final message before this POST request finished
        if (this.messages.some(m => m.id === finalMsg.id && m.id !== tempId)) {
          this.messages = this.messages.filter(m => m.id !== tempId);
        } else {
          // Otherwise substitute the temp message with the final message
          this.messages = this.messages.map(m => m.id === tempId ? finalMsg : m);
        }
        
        this.conversations = this.conversations.map((c) => {
          if (c.id === conversationId) {
            return { ...c, lastMessage: finalMsg, updatedAt: finalMsg.createdAt };
          }
          return c;
        });

        this.notify();
      } else {
        // Handle failure (e.g., mark as failed in UI)
        this.messages = this.messages.filter(m => m.id !== tempId);
        this.notify();
      }
    } catch (e) {
      console.error("Failed to send message", e);
      this.messages = this.messages.filter(m => m.id !== tempId);
      this.notify();
    }
    return tempMessage;
  }

  async markAsRead(conversationId: string) {
    const convIndex = this.conversations.findIndex((c) => c.id === conversationId);
    if (convIndex > -1) {
      const conv = this.conversations[convIndex];
      if (conv && conv.unreadCount > 0) {
        // Optimistic UI
        const updatedConv: Conversation = { ...conv, unreadCount: 0 };
        this.conversations = [
          ...this.conversations.slice(0, convIndex),
          updatedConv,
          ...this.conversations.slice(convIndex + 1),
        ];
        this.notify();

        // API Call
        try {
          await fetch(`${config.apiUrl}/chat/conversations/${conversationId}/read`, {
            method: "POST",
            headers: this.getAuthHeaders()
          });
        } catch (e) {
          console.error("Failed to mark read", e);
        }
      }
    }
  }

  async toggleReaction(messageId: string, emoji: string) {
    const currentUserId = this.getCurrentUser().id;

    // Optimistic UI update
    this.messages = this.messages.map((m) => {
      if (m.id !== messageId) return m;

      let reactions = m.reactions ? m.reactions.map((r) => ({ ...r, userIds: [...r.userIds] })) : [];
      const existingIndex = reactions.findIndex((r) => r.emoji === emoji);

      if (existingIndex > -1) {
        const existing = reactions[existingIndex];
        if (existing) {
          if (existing.userIds.includes(currentUserId)) {
            existing.userIds = existing.userIds.filter((uid) => uid !== currentUserId);
            if (existing.userIds.length === 0) {
              reactions.splice(existingIndex, 1);
            }
          } else {
            existing.userIds.push(currentUserId);
          }
        }
      } else {
        reactions.push({ emoji, userIds: [currentUserId] });
      }

      return { ...m, reactions };
    });
    this.notify();

    try {
      await fetch(`${config.apiUrl}/chat/messages/${messageId}/reactions`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ emoji }),
      });
    } catch (e) {
      console.error("Failed to toggle reaction", e);
    }
  }

  async createConversation(type: "direct" | "group" | "candidate_discussion", memberIds: string[], name?: string) {
    try {
      const res = await fetch(`${config.apiUrl}/chat/conversations`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          type,
          name: name || null,
          member_ids: memberIds,
          candidate_id: null
        })
      });

      if (res.ok) {
        const data = await res.json();
        const newConv = this.mapConversation(data);
        this.conversations = [newConv, ...this.conversations];
        this.notify();
        // Resolve names for any new members not yet in the user cache
        this.fetchConversationMembers();
        return newConv;
      }
      
      const errorText = await res.text();
      throw new Error(`Failed to create conversation: ${res.status} ${errorText}`);
    } catch (e) {
      console.error("Failed to create conversation API call", e);
      throw e;
    }
  }

  // Retain UI-only toggles for favorites/pins
  toggleFavorite(conversationId: string) {
    const convIndex = this.conversations.findIndex((c) => c.id === conversationId);
    const conv = this.conversations[convIndex];
    if (convIndex > -1 && conv) {
      this.conversations = [
        ...this.conversations.slice(0, convIndex),
        { ...conv, isFavorite: !conv.isFavorite },
        ...this.conversations.slice(convIndex + 1),
      ];
      this.notify();
    }
  }

  togglePinConversation(conversationId: string) {
    const convIndex = this.conversations.findIndex((c) => c.id === conversationId);
    const conv = this.conversations[convIndex];
    if (convIndex > -1 && conv) {
      this.conversations = [
        ...this.conversations.slice(0, convIndex),
        { ...conv, isPinned: !conv.isPinned },
        ...this.conversations.slice(convIndex + 1),
      ];
      this.notify();
    }
  }

  createOrGetCandidateDiscussion(candidateId: string, candidateName: string) {
    // ... we can adapt this to hit createConversation if needed.
    const existing = this.conversations.find(
      (c) => c.type === "candidate_discussion" && c.candidateId === candidateId,
    );
    if (existing) return existing;

    return this.createConversation("candidate_discussion", [this.getCurrentUser().id, "u2", "u4"], `Candidate Discussion: ${candidateName}`);
  }

  async editMessage(messageId: string, newContent: string) {
    // Optimistic UI update
    this.messages = this.messages.map((m) => {
      if (m.id === messageId) {
        return { ...m, content: newContent, edited: true };
      }
      return m;
    });

    // Also update lastMessage on conversation if the edited message is the last one
    this.conversations = this.conversations.map((c) => {
      if (c.lastMessage && c.lastMessage.id === messageId) {
        return { ...c, lastMessage: { ...c.lastMessage, content: newContent, edited: true } };
      }
      return c;
    });

    this.notify();

    try {
      await fetch(`${config.apiUrl}/chat/messages/${messageId}`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ content: newContent }),
      });
    } catch (e) {
      console.error("Failed to edit message", e);
    }
  }

  async deleteMessage(messageId: string) {
    // Optimistic UI update
    this.messages = this.messages.filter((m) => m.id !== messageId);
    
    // Update lastMessage on affected conversation if deleted message was the last one
    this.conversations = this.conversations.map((c) => {
      if (c.lastMessage && c.lastMessage.id === messageId) {
        const remainingMsgs = this.messages.filter((m) => m.conversationId === c.id);
        const newLast = remainingMsgs[remainingMsgs.length - 1];
        const updated: Conversation = { ...c };
        if (newLast) {
          updated.lastMessage = newLast;
        } else {
          delete updated.lastMessage;
        }
        return updated;
      }
      return c;
    });

    this.notify();

    try {
      await fetch(`${config.apiUrl}/chat/messages/${messageId}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      });
    } catch (e) {
      console.error("Failed to delete message", e);
    }
  }

  async deleteConversation(conversationId: string) {
    // Optimistic UI update
    this.conversations = this.conversations.filter((c) => c.id !== conversationId);
    this.messages = this.messages.filter((m) => m.conversationId !== conversationId);
    this.notify();

    try {
      await fetch(`${config.apiUrl}/chat/conversations/${conversationId}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      });
    } catch (e) {
      console.error("Failed to delete conversation", e);
    }
  }
}

export const chatService = new ChatService();
