import { ChatUser, Conversation, Message, Notification } from "../types/chat";

export const MOCK_CURRENT_USER_ID = "u1";

export const mockUsers: ChatUser[] = [
  {
    id: "u1",
    name: "Dana Okafor",
    role: "senior_recruiter",
    email: "dana@meridian.com",
    status: "online",
  },
  {
    id: "u2",
    name: "Sarah Johnson",
    role: "senior_recruiter",
    email: "sarah@meridian.com",
    status: "online",
  },
  {
    id: "u3",
    name: "Rahul Sharma",
    role: "recruiter",
    email: "rahul@meridian.com",
    status: "away",
  },
  {
    id: "u4",
    name: "Priya Kumar",
    role: "hiring_manager",
    email: "priya@meridian.com",
    status: "dnd",
  },
  { id: "u5", name: "David Wilson", role: "admin", email: "david@meridian.com", status: "offline" },
  {
    id: "u6",
    name: "Michael Chang",
    role: "recruiter",
    email: "michael@meridian.com",
    status: "online",
  },
  {
    id: "u7",
    name: "Elena Rodriguez",
    role: "hiring_manager",
    email: "elena@meridian.com",
    status: "offline",
  },
  {
    id: "u8",
    name: "James Smith",
    role: "recruiter",
    email: "james@meridian.com",
    status: "online",
  },
];

export const mockConversations: Conversation[] = [
  {
    id: "c1",
    type: "group",
    name: "Python Hiring Team",
    memberIds: ["u1", "u2", "u3", "u4", "u5"],
    unreadCount: 2,
    isFavorite: true,
    isPinned: false,
    isArchived: false,
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "c2",
    type: "group",
    name: "Hiring Leadership",
    memberIds: ["u1", "u2", "u4", "u5", "u7"],
    unreadCount: 0,
    isFavorite: true,
    isPinned: true,
    isArchived: false,
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "c3",
    type: "direct",
    memberIds: ["u1", "u2"],
    unreadCount: 1,
    isFavorite: false,
    isPinned: false,
    isArchived: false,
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "c4",
    type: "direct",
    memberIds: ["u1", "u3"],
    unreadCount: 0,
    isFavorite: false,
    isPinned: false,
    isArchived: false,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "c5",
    type: "candidate_discussion",
    memberIds: ["u1", "u2", "u4"],
    candidateId: "can1", // Rahul Kumar
    unreadCount: 1,
    isFavorite: false,
    isPinned: false,
    isArchived: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: "c6",
    type: "group",
    name: "Java Hiring Team",
    memberIds: ["u1", "u6", "u7", "u8"],
    unreadCount: 0,
    isFavorite: false,
    isPinned: false,
    isArchived: false,
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "c7",
    type: "direct",
    memberIds: ["u1", "u4"],
    unreadCount: 0,
    isFavorite: false,
    isPinned: false,
    isArchived: false,
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "c8",
    type: "candidate_discussion",
    memberIds: ["u1", "u3", "u6"],
    candidateId: "can2", // Ananya Sharma
    unreadCount: 0,
    isFavorite: false,
    isPinned: false,
    isArchived: false,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

export const mockMessages: Message[] = [
  {
    id: "m1",
    conversationId: "c3",
    senderId: "u2",
    type: "text",
    content: "Can you review the Python candidate?",
    status: "read",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "m2",
    conversationId: "c3",
    senderId: "u1",
    type: "text",
    content: "Sure, let me take a look right now.",
    replyTo: "m1",
    status: "read",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1.5).toISOString(),
  },
  {
    id: "m3",
    conversationId: "c3",
    senderId: "u2",
    type: "text",
    content: "His FastAPI experience looks very solid.",
    status: "delivered",
    createdAt: new Date().toISOString(),
  },
  // Candidate discussion for can1
  {
    id: "m4",
    conversationId: "c5",
    senderId: "u2",
    type: "text",
    content: "I reviewed Rahul's resume. His FastAPI experience looks strong.",
    status: "read",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "m5",
    conversationId: "c5",
    senderId: "u4",
    type: "text",
    content:
      "Agreed. His MongoDB experience is also relevant. What do you think about his system-design experience?",
    status: "read",
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: "m6",
    conversationId: "c5",
    senderId: "u2",
    type: "text",
    content: "Should we move him to the technical round?",
    status: "delivered",
    reactions: [{ emoji: "👍", userIds: ["u4"] }],
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
];

export const mockNotifications: Notification[] = [
  {
    id: "n1",
    type: "mention",
    content: "Sarah mentioned you in Python Hiring Team",
    conversationId: "c1",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "n2",
    type: "new_message",
    content: "New message from Sarah Johnson",
    conversationId: "c3",
    isRead: false,
    createdAt: new Date().toISOString(),
  },
];

// Enrich conversations with lastMessage
export const getEnrichedConversations = () => {
  return mockConversations.map((conv) => {
    const convMessages = mockMessages.filter((m) => m.conversationId === conv.id);
    const lastMessage = convMessages[convMessages.length - 1];
    return { ...conv, ...(lastMessage ? { lastMessage } : {}) };
  });
};
