import { useState, useMemo } from "react";
import { Search, Plus, User, Users, Lock, ChevronDown, Trash2, MoreVertical, Pin, PinOff } from "lucide-react";
import { toast } from "sonner";
import { useChat } from "@/hooks/useChat";
import { Conversation, ChatUser } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateChatDialog } from "./CreateChatDialog";

interface ChatSidebarProps {
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
}

export function ChatSidebar({ activeConversationId, onSelectConversation }: ChatSidebarProps) {
  const { conversations, users, currentUser, typingState, deleteConversation, togglePinConversation } = useChat();
  const [searchQuery, setSearchQuery] = useState("");
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createDialogType, setCreateDialogType] = useState<"direct" | "group" | "candidate_discussion">("direct");

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;

    return conversations.filter((c) => {
      // Basic search by name or member names
      if (c.name && c.name.toLowerCase().includes(searchQuery.toLowerCase())) return true;
      const members = c.memberIds
        .map((id) => users.find((u) => u.id === id))
        .filter(Boolean) as ChatUser[];
      if (members.some((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase())))
        return true;
      return false;
    });
  }, [conversations, searchQuery, users]);

  const pinned = filteredConversations.filter((c) => c.isPinned);
  const favorites = filteredConversations.filter((c) => c.isFavorite && !c.isPinned);
  const directMessages = filteredConversations.filter((c) => c.type === "direct" && !c.isFavorite && !c.isPinned);
  const groups = filteredConversations.filter((c) => c.type === "group" && !c.isFavorite && !c.isPinned);
  const candidateDiscussions = filteredConversations.filter(
    (c) => c.type === "candidate_discussion" && !c.isFavorite && !c.isPinned,
  );

  const handleDelete = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this conversation?")) {
      deleteConversation(conversationId);
      toast.success("Conversation deleted");
      if (activeConversationId === conversationId) {
        const remaining = conversations.filter(c => c.id !== conversationId);
        if (remaining.length > 0 && remaining[0]) {
          onSelectConversation(remaining[0].id);
        }
      }
    }
  };

  const handleTogglePin = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    togglePinConversation(conversationId);
  };

  return (
    <div className="w-80 h-full shrink-0 border-r border-border flex flex-col bg-surface/50">
      <div className="p-4 border-b border-border space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Chat</h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Plus size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => { setCreateDialogType("direct"); setCreateDialogOpen(true); }}>
                <User className="mr-2 h-4 w-4" />
                <span>New Direct Message</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setCreateDialogType("group"); setCreateDialogOpen(true); }}>
                <Users className="mr-2 h-4 w-4" />
                <span>New Group</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setCreateDialogType("candidate_discussion"); setCreateDialogOpen(true); }}>
                <Lock className="mr-2 h-4 w-4" />
                <span>New Internal Discussion</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full h-9 rounded-md border border-border bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-4">
          {pinned.length > 0 && (
            <Section title="Pinned">
              {pinned.map((c) => (
                <ConversationItem
                  key={c.id}
                  conversation={c}
                  isActive={c.id === activeConversationId}
                  onClick={() => onSelectConversation(c.id)}
                  onDelete={(e) => handleDelete(e, c.id)}
                  onTogglePin={(e) => handleTogglePin(e, c.id)}
                  users={users}
                  currentUserId={currentUser?.id || ""}
                  typingUsers={typingState.get(c.id) ? Array.from(typingState.get(c.id)!) : []}
                />
              ))}
            </Section>
          )}

          {favorites.length > 0 && (
            <Section title="Favorites">
              {favorites.map((c) => (
                <ConversationItem
                  key={c.id}
                  conversation={c}
                  isActive={c.id === activeConversationId}
                  onClick={() => onSelectConversation(c.id)}
                  onDelete={(e) => handleDelete(e, c.id)}
                  onTogglePin={(e) => handleTogglePin(e, c.id)}
                  users={users}
                  currentUserId={currentUser?.id || ""}
                  typingUsers={typingState.get(c.id) ? Array.from(typingState.get(c.id)!) : []}
                />
              ))}
            </Section>
          )}

          {directMessages.length > 0 && (
            <Section title="Direct Messages">
              {directMessages.map((c) => (
                <ConversationItem
                  key={c.id}
                  conversation={c}
                  isActive={c.id === activeConversationId}
                  onClick={() => onSelectConversation(c.id)}
                  onDelete={(e) => handleDelete(e, c.id)}
                  onTogglePin={(e) => handleTogglePin(e, c.id)}
                  users={users}
                  currentUserId={currentUser?.id || ""}
                  typingUsers={typingState.get(c.id) ? Array.from(typingState.get(c.id)!) : []}
                />
              ))}
            </Section>
          )}

          {groups.length > 0 && (
            <Section title="Groups">
              {groups.map((c) => (
                <ConversationItem
                  key={c.id}
                  conversation={c}
                  isActive={c.id === activeConversationId}
                  onClick={() => onSelectConversation(c.id)}
                  onDelete={(e) => handleDelete(e, c.id)}
                  onTogglePin={(e) => handleTogglePin(e, c.id)}
                  users={users}
                  currentUserId={currentUser?.id || ""}
                  typingUsers={typingState.get(c.id) ? Array.from(typingState.get(c.id)!) : []}
                />
              ))}
            </Section>
          )}

          {candidateDiscussions.length > 0 && (
            <Section title="Candidate Discussions">
              {candidateDiscussions.map((c) => (
                <ConversationItem
                  key={c.id}
                  conversation={c}
                  isActive={c.id === activeConversationId}
                  onClick={() => onSelectConversation(c.id)}
                  onDelete={(e) => handleDelete(e, c.id)}
                  onTogglePin={(e) => handleTogglePin(e, c.id)}
                  users={users}
                  currentUserId={currentUser?.id || ""}
                  typingUsers={typingState.get(c.id) ? Array.from(typingState.get(c.id)!) : []}
                />
              ))}
            </Section>
          )}
        </div>
      </ScrollArea>

      <CreateChatDialog
        isOpen={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        type={createDialogType}
        users={users}
        currentUserId={currentUser?.id || ""}
        onCreated={onSelectConversation}
      />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
      >
        {title}
        <ChevronDown size={12} className={`transition-transform ${isOpen ? "" : "-rotate-90"}`} />
      </button>
      {isOpen && <div className="space-y-0.5">{children}</div>}
    </div>
  );
}

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onTogglePin: (e: React.MouseEvent) => void;
  users: ChatUser[];
  currentUserId: string;
  typingUsers: string[];
}

function ConversationItem({
  conversation,
  isActive,
  onClick,
  onDelete,
  onTogglePin,
  users,
  currentUserId,
  typingUsers,
}: ConversationItemProps) {
  let name = conversation.name || "Conversation";
  let fallback = "C";
  let statusColor = "";
  let isOnline = false;
  let avatarUrl: string | undefined = undefined;

  if (conversation.type === "direct") {
    const otherUserId = conversation.memberIds.find((id) => id !== currentUserId);
    const otherUser = users.find((u) => u.id === otherUserId);
    if (otherUser) {
      name = otherUser.name;
      fallback = otherUser.name.substring(0, 2).toUpperCase();
      isOnline = otherUser.status === "online";
      avatarUrl = otherUser.avatar;
      statusColor =
        otherUser.status === "online"
          ? "bg-emerald-500"
          : otherUser.status === "away"
            ? "bg-amber-500"
            : otherUser.status === "dnd"
              ? "bg-rose-500"
              : "bg-slate-400";
    } else {
      name = "Direct Chat";
      fallback = "U";
      statusColor = "bg-slate-400";
    }
  } else if (conversation.type === "group") {
    fallback = name.substring(0, 2).toUpperCase();
  } else if (conversation.type === "candidate_discussion") {
    name = conversation.name?.replace("Candidate Discussion: ", "") || "Candidate";
    fallback = name.substring(0, 2).toUpperCase();
  }

  const { lastMessage } = conversation;

  // Format timestamp
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div
      onClick={onClick}
      className={`group/item w-full flex items-center gap-3 px-2 py-2 rounded-md transition-colors text-left cursor-pointer relative
        ${isActive ? "bg-accent/15" : "hover:bg-accent/5"}
      `}
    >
      <div className="relative shrink-0">
        <Avatar className="h-9 w-9 rounded-md border border-border/50">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <AvatarFallback
              className={`rounded-md text-xs font-medium ${conversation.type === "candidate_discussion" ? "bg-primary/10 text-primary" : "bg-muted"}`}
            >
              {fallback}
            </AvatarFallback>
          )}
        </Avatar>
        {conversation.type === "direct" && statusColor && (
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
            {isOnline && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-3 w-3 border-2 border-background ${statusColor}`}
            />
          </span>
        )}
        {conversation.type === "candidate_discussion" && (
          <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border border-background bg-slate-800 flex items-center justify-center">
            <Lock size={8} className="text-white" />
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
          <span
            className={`truncate text-sm ${conversation.unreadCount > 0 ? "font-semibold" : "font-medium"}`}
          >
            {name}
          </span>
          {lastMessage && (
            <span
              className={`text-[10px] ${conversation.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}
            >
              {formatTime(lastMessage.createdAt)}
            </span>
          )}
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-2 items-center mt-0.5">
          <span
            className={`truncate text-xs ${conversation.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}
          >
            {(() => {
              const activeTypers = typingUsers.filter(id => id !== currentUserId);
              if (activeTypers.length > 0) {
                return (
                  <span className="text-emerald-500 font-medium">
                    {activeTypers.length === 1 ? "typing..." : `${activeTypers.length} people typing...`}
                  </span>
                );
              }
              
              return lastMessage
                ? (() => {
                    const content = lastMessage.content ?? "📎 Attachment";
                    if (lastMessage.senderId === currentUserId) {
                      return `You: ${content}`;
                    }
                    // For group and candidate_discussion, show the sender's name
                    if (conversation.type === "group" || conversation.type === "candidate_discussion") {
                      const sender = users.find((u) => u.id === lastMessage.senderId);
                      const senderName = sender ? sender.name.split(" ")[0] : "Someone";
                      return `${senderName}: ${content}`;
                    }
                    return content;
                  })()
                : conversation.unreadCount > 0
                  ? "New messages"
                  : "No messages yet";
            })()}
          </span>

          <div className="flex items-center gap-1 shrink-0">
            {conversation.unreadCount > 0 && (
              <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
              </span>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button
                  className="opacity-0 group-hover/item:opacity-100 p-1 text-muted-foreground hover:text-foreground transition-opacity rounded hover:bg-accent focus:opacity-100"
                >
                  <MoreVertical size={14} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={onTogglePin}>
                  {conversation.isPinned ? (
                    <>
                      <PinOff className="mr-2 h-4 w-4" />
                      <span>Unpin</span>
                    </>
                  ) : (
                    <>
                      <Pin className="mr-2 h-4 w-4" />
                      <span>Pin</span>
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
