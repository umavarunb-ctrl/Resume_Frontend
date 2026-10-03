export type ChatUserRole = "recruiter" | "senior_recruiter" | "hiring_manager" | "admin";

export type PresenceStatus = "online" | "away" | "dnd" | "offline";

export interface ChatUser {
  id: string;
  name: string;
  role: ChatUserRole;
  avatar?: string;
  email: string;
  status: PresenceStatus;
}

export type ConversationType = "direct" | "group" | "candidate_discussion";

export type MessageType = "text" | "file" | "candidate" | "system";

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string; // e.g., 'application/pdf', 'image/png'
  size: number; // in bytes
}

export interface Reaction {
  emoji: string;
  userIds: string[];
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  content?: string | undefined;
  candidateId?: string | undefined; // ID of candidate if type === 'candidate'
  attachment?: Attachment | undefined;
  replyTo?: string | undefined; // Message ID this replies to
  reactions?: Reaction[] | undefined;
  status: "sending" | "sent" | "delivered" | "read";
  edited?: boolean | undefined;
  pinned?: boolean | undefined;
  createdAt: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  name?: string;
  memberIds: string[];
  candidateId?: string;
  unreadCount: number;
  isFavorite: boolean;
  isPinned: boolean;
  isArchived: boolean;
  lastMessage?: Message;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  type: "mention" | "new_message" | "candidate_shared" | "added_to_group";
  content: string;
  conversationId: string;
  isRead: boolean;
  createdAt: string;
}
