import { useEffect, useRef, useState, useMemo } from "react";
import { Search, MoreVertical, Paperclip, Smile, Send, Share, Info, Trash2, Pencil, Check, X, Reply, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useChat, useConversation } from "@/hooks/useChat";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Message, ChatUser } from "@/types/chat";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageReactionTrigger,
  MessageReactionBadges,
  ComposerEmojiButton,
} from "./EmojiReactionPicker";

/** Text with search query term highlighting */
function HighlightedText({
  text,
  query,
  isActiveMatch = false,
}: {
  text: string;
  query: string;
  isActiveMatch?: boolean;
}) {
  if (!query || !query.trim()) return <>{text}</>;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));

  return (
    <>
      {parts.map((part, i) => {
        if (part.toLowerCase() === query.toLowerCase()) {
          return (
            <mark
              key={i}
              className={`rounded-xs px-0.5 transition-all ${
                isActiveMatch
                  ? "bg-amber-400 text-amber-950 font-bold ring-2 ring-amber-500 shadow-xs"
                  : "bg-amber-300/80 dark:bg-amber-500/40 text-foreground font-medium"
              }`}
            >
              {part}
            </mark>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

/** Quoted replied message preview inside a message bubble */
function QuotedReplyPreview({
  replyToId,
  allMessages,
  users,
  currentUserId,
  onJumpToMessage,
  isMe,
}: {
  replyToId?: string;
  allMessages: Message[];
  users: ChatUser[];
  currentUserId?: string;
  onJumpToMessage?: (id: string) => void;
  isMe: boolean;
}) {
  if (!replyToId) return null;
  const original = allMessages.find((m) => m.id === replyToId);
  const sender = original
    ? original.senderId === currentUserId
      ? "You"
      : users.find((u) => u.id === original.senderId)?.name || "User"
    : "Replied message";

  const previewText =
    original?.content ||
    (original?.type === "candidate" ? "Candidate shared" : "Message unavailable");

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (onJumpToMessage) onJumpToMessage(replyToId);
      }}
      className={`text-left w-full mb-1.5 px-2.5 py-1.5 rounded-lg text-xs border-l-3 transition-colors cursor-pointer select-none group/quote ${
        isMe
          ? "bg-primary-foreground/15 border-l-primary-foreground/90 hover:bg-primary-foreground/25 text-primary-foreground"
          : "bg-muted/70 border-l-primary hover:bg-muted text-foreground"
      }`}
      title="Click to jump to original message"
    >
      <div className="flex items-center gap-1 font-semibold text-[11px] mb-0.5 opacity-90">
        <Reply size={10} className="shrink-0 opacity-80" />
        <span className="truncate">{sender}</span>
      </div>
      <p className="line-clamp-2 text-[11px] opacity-80 leading-relaxed break-all">
        {previewText}
      </p>
    </button>
  );
}

/** Reply preview banner docked above the composer (WhatsApp / Teams / Instagram style) */
function ReplyComposerBanner({
  replyingTo,
  users,
  currentUserId,
  onCancel,
}: {
  replyingTo: Message | null;
  users: ChatUser[];
  currentUserId?: string;
  onCancel: () => void;
}) {
  if (!replyingTo) return null;

  const senderName =
    replyingTo.senderId === currentUserId
      ? "You"
      : users.find((u) => u.id === replyingTo.senderId)?.name || "User";

  const previewText =
    replyingTo.content ||
    (replyingTo.type === "candidate" ? "Candidate shared" : "Message");

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 bg-muted/70 border border-b-0 border-border rounded-t-xl animate-in slide-in-from-bottom-2 duration-150">
      <div className="flex items-center gap-2.5 min-w-0 border-l-3 border-primary pl-2.5">
        <Reply size={15} className="text-primary shrink-0" />
        <div className="min-w-0 flex flex-col">
          <span className="text-xs font-semibold text-primary truncate">
            Replying to {senderName}
          </span>
          <span className="text-[11px] text-muted-foreground truncate max-w-md">
            {previewText}
          </span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0 rounded-full"
        onClick={onCancel}
        title="Cancel reply (Esc)"
      >
        <X size={13} />
      </Button>
    </div>
  );
}

/** Animated three-dot typing indicator, like WhatsApp / Teams */
function TypingIndicator({ names }: { names: string[] }) {
  if (names.length === 0) return null;
  const label =
    names.length === 1
      ? `${names[0]} is typing`
      : names.length === 2
        ? `${names[0]} and ${names[1]} are typing`
        : `${names[0]} and ${names.length - 1} others are typing`;

  return (
    <div
      className="flex items-center gap-2 px-4 py-1.5 animate-in slide-in-from-bottom-1 duration-200"
      aria-live="polite"
      aria-label={label}
    >
      <div className="flex -space-x-1.5">
        {names.slice(0, 2).map((name) => (
          <Avatar key={name} className="h-5 w-5 border border-background">
            <AvatarFallback className="text-[8px] bg-muted text-muted-foreground">
              {name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>
      <div className="flex items-center gap-0.5 bg-surface border border-border/60 rounded-full px-3 py-2 shadow-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" style={{ animation: "typingBounce 1.2s ease-in-out infinite", animationDelay: "0ms" }} />
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" style={{ animation: "typingBounce 1.2s ease-in-out infinite", animationDelay: "200ms" }} />
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" style={{ animation: "typingBounce 1.2s ease-in-out infinite", animationDelay: "400ms" }} />
      </div>
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function ExpandableMessage({
  content,
  searchQuery = "",
  isActiveMatch = false,
}: {
  content: string;
  searchQuery?: string;
  isActiveMatch?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = content.length > 300;

  if (!isLong) {
    return (
      <HighlightedText
        text={content}
        query={searchQuery}
        isActiveMatch={isActiveMatch}
      />
    );
  }

  return (
    <div className="flex flex-col">
      <span className={!expanded ? "line-clamp-4" : ""}>
        <HighlightedText
          text={content}
          query={searchQuery}
          isActiveMatch={isActiveMatch}
        />
      </span>
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs font-semibold mt-1 self-start hover:opacity-80 transition-opacity"
      >
        {expanded ? "Show less" : "Read more..."}
      </button>
    </div>
  );
}

/** Inline edit textarea for editing a message */
function InlineEditForm({
  initialContent,
  onSave,
  onCancel,
  isMe,
}: {
  initialContent: string;
  onSave: (newContent: string) => void;
  onCancel: () => void;
  isMe: boolean;
}) {
  const [value, setValue] = useState(initialContent);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
    if (textareaRef.current) {
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && value.trim() !== initialContent.trim()) {
        onSave(value.trim());
      } else {
        onCancel();
      }
    }
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className={`w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring min-h-[40px] max-h-32 ${
          isMe
            ? "bg-primary/90 text-primary-foreground border-primary-foreground/20 placeholder:text-primary-foreground/50"
            : "bg-surface border-border"
        }`}
        rows={1}
      />
      <div className="flex items-center gap-1 justify-end">
        <span className="text-[10px] text-muted-foreground mr-1">Esc to cancel · Enter to save</span>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={onCancel} title="Cancel">
          <X size={12} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-accent hover:text-accent"
          onClick={() => {
            if (value.trim() && value.trim() !== initialContent.trim()) {
              onSave(value.trim());
            } else {
              onCancel();
            }
          }}
          title="Save"
        >
          <Check size={12} />
        </Button>
      </div>
    </div>
  );
}

interface MessageAreaProps {
  conversationId: string;
  isDetailsOpen: boolean;
  onToggleDetails: () => void;
  onBack?: () => void;
}

export function MessageArea({
  conversationId,
  isDetailsOpen,
  onToggleDetails,
  onBack,
}: MessageAreaProps) {
  const {
    conversation,
    messages,
    sendMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
    typingUsers,
    sendTypingEvent,
  } = useConversation(conversationId);
  const { users, markAsRead, currentUser, deleteConversation } = useChat();
  const [inputValue, setInputValue] = useState("");
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (conversationId) {
      markAsRead(conversationId);
    }
  }, [conversationId, markAsRead, messages.length]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    if (!isSearchOpen) {
      scrollToBottom();
    }
  }, [messages.length, conversationId]);

  useEffect(() => {
    if (typingUsers && typingUsers.length > 0) scrollToBottom();
  }, [typingUsers?.length]);

  // Compute matching messages in conversation
  const matchingMessageIds = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return messages
      .filter((m) => (m.content || "").toLowerCase().includes(q))
      .map((m) => m.id);
  }, [messages, searchQuery]);

  const jumpToMessage = (msgId: string) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMsgId(msgId);
      setTimeout(() => setHighlightedMsgId(null), 2000);
    }
  };

  useEffect(() => {
    if (matchingMessageIds.length > 0) {
      const targetIdx = matchingMessageIds.length - 1;
      setActiveMatchIndex(targetIdx);
      const targetId = matchingMessageIds[targetIdx];
      if (targetId) jumpToMessage(targetId);
    } else {
      setActiveMatchIndex(0);
    }
  }, [matchingMessageIds.length, searchQuery]);

  const handleNextMatch = () => {
    if (matchingMessageIds.length === 0) return;
    const nextIdx = (activeMatchIndex + 1) % matchingMessageIds.length;
    setActiveMatchIndex(nextIdx);
    const targetId = matchingMessageIds[nextIdx];
    if (targetId) jumpToMessage(targetId);
  };

  const handlePrevMatch = () => {
    if (matchingMessageIds.length === 0) return;
    const prevIdx = (activeMatchIndex - 1 + matchingMessageIds.length) % matchingMessageIds.length;
    setActiveMatchIndex(prevIdx);
    const targetId = matchingMessageIds[prevIdx];
    if (targetId) jumpToMessage(targetId);
  };

  const handleOpenSearch = () => {
    setIsSearchOpen(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    }, 50);
  };

  const handleCloseSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  // Keyboard shortcut: Ctrl+F / Cmd+F to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        handleOpenSearch();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!conversation) return null;

  const handleInputChange = (val: string) => {
    setInputValue(val);
    if (val.trim() && sendTypingEvent) {
      sendTypingEvent(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => { sendTypingEvent(false); }, 3000);
    } else if (!val.trim() && sendTypingEvent) {
      sendTypingEvent(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleInsertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setInputValue((prev) => prev + emoji);
      return;
    }
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const nextVal = inputValue.substring(0, start) + emoji + inputValue.substring(end);
    setInputValue(nextVal);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  const handleStartReply = (msg: Message) => {
    setReplyingTo(msg);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;
    sendMessage(inputValue, "text", undefined, replyingTo?.id);
    setInputValue("");
    setReplyingTo(null);
    if (sendTypingEvent) {
      sendTypingEvent(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && replyingTo) {
      e.preventDefault();
      setReplyingTo(null);
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDeleteConversation = () => {
    if (confirm("Are you sure you want to delete this chat conversation?")) {
      deleteConversation(conversationId);
      toast.success("Chat conversation deleted");
      if (onBack) onBack();
    }
  };

  const handleDeleteMessage = (msgId: string) => {
    if (confirm("Are you sure you want to delete this message?")) {
      deleteMessage(msgId);
      toast.success("Message deleted");
    }
  };

  const handleEditMessage = (msgId: string, newContent: string) => {
    editMessage(msgId, newContent);
    setEditingMsgId(null);
    toast.success("Message edited");
  };

  const activeTypingUsers = (typingUsers || [])
    .filter(id => id !== currentUser?.id)
    .map(id => users.find(u => u.id === id)?.name || "Unknown User");

  // Header details
  let headerName = conversation.name || "Conversation";
  let headerSubtitle = "";
  let headerOtherUser: ChatUser | undefined;

  if (conversation.type === "direct") {
    const otherUserId = conversation.memberIds.find((id) => id !== currentUser?.id);
    headerOtherUser = users.find((u) => u.id === otherUserId);
    if (headerOtherUser) {
      headerName = headerOtherUser.name;
      const statusLabel =
        headerOtherUser.status === "online" ? "Online"
          : headerOtherUser.status === "away" ? "Away"
            : headerOtherUser.status === "dnd" ? "Do not disturb"
              : "Offline";
      
      if (activeTypingUsers.length > 0) {
        headerSubtitle = "typing...";
      } else {
        headerSubtitle = `${headerOtherUser.role.replace(/_/g, " ")} • ${statusLabel}`;
      }
    } else {
      headerName = conversation.name || "Direct Chat";
      headerSubtitle = "Recruiter • Offline";
    }
  } else if (conversation.type === "group") {
    if (activeTypingUsers.length > 0) {
      headerSubtitle = `${activeTypingUsers.join(", ")} ${activeTypingUsers.length === 1 ? 'is' : 'are'} typing...`;
    } else {
      headerSubtitle = `${conversation.memberIds.length} members`;
    }
  } else if (conversation.type === "candidate_discussion") {
    headerName = `🔒 ${conversation.name?.replace("Candidate Discussion: ", "") || "Candidate"} — Internal Discussion`;
    if (activeTypingUsers.length > 0) {
      headerSubtitle = `${activeTypingUsers.join(", ")} ${activeTypingUsers.length === 1 ? 'is' : 'are'} typing...`;
    } else {
      headerSubtitle = "Private hiring team conversation";
    }
  }

  const isOnline = headerOtherUser?.status === "online";
  const presenceDotClass =
    headerOtherUser?.status === "online" ? "bg-emerald-500"
      : headerOtherUser?.status === "away" ? "bg-amber-400"
        : headerOtherUser?.status === "dnd" ? "bg-rose-500"
          : "bg-slate-400";

  // Group messages by sender
  const groupedMessages: { sender: ChatUser; messages: Message[] }[] = [];
  let currentGroup: { sender: ChatUser; messages: Message[] } | null = null;

  messages.forEach((msg) => {
    let sender = users.find((u) => u.id === msg.senderId);
    if (!sender) {
      if (currentUser && msg.senderId === currentUser.id) {
        sender = currentUser;
      } else {
        sender = { id: msg.senderId, name: "Unknown User", role: "recruiter", email: "", status: "offline" };
      }
    }
    if (currentGroup && currentGroup.sender.id === sender.id) {
      currentGroup.messages.push(msg);
    } else {
      if (currentGroup) groupedMessages.push(currentGroup);
      currentGroup = { sender, messages: [msg] };
    }
  });
  if (currentGroup) groupedMessages.push(currentGroup);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background relative">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border bg-surface/50 backdrop-blur-sm z-10 shrink-0">
        <div className="flex-1 min-w-0 flex items-center gap-2">
          {onBack && (
            <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden mr-1" onClick={onBack}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Button>
          )}
          <div className="flex-1 min-w-0 flex items-center gap-2.5">
            {conversation.type === "direct" && (
              <div className="relative shrink-0">
                <Avatar className="h-9 w-9 border border-border/50">
                  {headerOtherUser?.avatar ? (
                    <img src={headerOtherUser.avatar} alt={headerOtherUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <AvatarFallback className="text-xs bg-muted font-medium">
                      {(headerOtherUser?.name || headerName).substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                  {isOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
                  <span className={`relative inline-flex rounded-full h-3 w-3 border-2 border-background ${presenceDotClass} transition-colors duration-300`} title={headerSubtitle} />
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{headerName}</h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                {conversation.type === "direct" && (
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${presenceDotClass} shrink-0`} />
                )}
                <span className="capitalize">{headerSubtitle}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 ml-4 shrink-0 text-muted-foreground">
          <Button
            variant={isSearchOpen ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={isSearchOpen ? handleCloseSearch : handleOpenSearch}
            title="Search in conversation (Ctrl+F)"
          >
            <Search size={16} />
          </Button>
          <Button
            variant={isDetailsOpen ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={onToggleDetails}
            title={isDetailsOpen ? "Hide conversation details" : "Show conversation details"}
          >
            <Info size={16} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="More options"><MoreVertical size={16} /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onToggleDetails}>
                <Info size={14} className="mr-2" /><span>{isDetailsOpen ? "Hide Details" : "Conversation Details"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleOpenSearch}>
                <Search size={14} className="mr-2" /><span>Search Conversation</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDeleteConversation} className="text-destructive focus:text-destructive">
                <Trash2 size={14} className="mr-2" /><span>Delete Chat</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* In-Conversation Search Bar */}
      {isSearchOpen && (
        <div className="px-4 py-2 bg-surface border-b border-border flex items-center justify-between gap-2 animate-in slide-in-from-top-2 duration-150 z-20 shrink-0 shadow-xs">
          <div className="flex-1 max-w-md flex items-center gap-2 bg-muted/60 border border-border/80 rounded-lg px-2.5 py-1.5 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary">
            <Search size={14} className="text-muted-foreground shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (e.shiftKey) handlePrevMatch();
                  else handleNextMatch();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  handleCloseSearch();
                }
              }}
              placeholder="Search messages in this chat..."
              className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <span className="text-[11px] font-medium text-muted-foreground shrink-0 px-1">
                {matchingMessageIds.length > 0
                  ? `${activeMatchIndex + 1} of ${matchingMessageIds.length}`
                  : "No matches"}
              </span>
            )}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-muted-foreground hover:text-foreground p-0.5 rounded-sm"
                title="Clear query"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={handlePrevMatch}
              disabled={matchingMessageIds.length <= 1}
              title="Previous match (Shift+Enter)"
            >
              <ChevronUp size={15} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={handleNextMatch}
              disabled={matchingMessageIds.length <= 1}
              title="Next match (Enter)"
            >
              <ChevronDown size={15} />
            </Button>
            <div className="h-4 w-px bg-border mx-1" />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={handleCloseSearch}
              title="Close search (Esc)"
            >
              <X size={15} />
            </Button>
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-6 pb-4 max-w-3xl mx-auto">
          {groupedMessages.map((group, groupIdx) => {
            const isMe = group.sender.id === currentUser?.id;
            return (
              <div key={groupIdx} className={`flex gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                <Avatar className="h-8 w-8 shrink-0 mt-1">
                  {group.sender.avatar ? (
                    <img src={group.sender.avatar} alt={group.sender.name} className="w-full h-full object-cover" />
                  ) : (
                    <AvatarFallback className={`text-xs ${isMe ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      {group.sender.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className={`flex-1 min-w-0 flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  <div className={`flex items-baseline gap-2 mb-1 ${isMe ? "flex-row-reverse" : ""}`}>
                    <span className="font-medium text-sm">{isMe ? "You" : group.sender.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {group.messages[0]?.createdAt
                        ? new Date(group.messages[0].createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : ""}
                    </span>
                  </div>
                  <div className={`space-y-1 w-full flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    {group.messages.map((msg) => (
                      <div
                        key={msg.id}
                        id={`msg-${msg.id}`}
                        className={`group/msg relative flex items-start max-w-[85%] rounded-xl transition-all duration-300 ${
                          highlightedMsgId === msg.id || (matchingMessageIds[activeMatchIndex] === msg.id && isSearchOpen)
                            ? "ring-2 ring-amber-500 ring-offset-2 bg-amber-500/10 p-1"
                            : ""
                        } ${isMe ? "flex-row-reverse" : "flex-row"}`}
                      >
                        {editingMsgId === msg.id ? (
                          <div className="w-full min-w-[200px]">
                            <InlineEditForm
                              initialContent={msg.content || ""}
                              onSave={(newContent) => handleEditMessage(msg.id, newContent)}
                              onCancel={() => setEditingMsgId(null)}
                              isMe={isMe}
                            />
                          </div>
                        ) : (
                          <>
                            <div className="flex flex-col max-w-full">
                              <div
                                onDoubleClick={() => handleStartReply(msg)}
                                className={`text-sm px-3 py-2 rounded-xl border ${
                                  isMe
                                    ? "bg-primary text-primary-foreground border-primary rounded-tr-sm"
                                    : "bg-surface border-border/50 rounded-tl-sm shadow-sm"
                                }`}
                              >
                                {/* Quoted Reply if message is a reply */}
                                {msg.replyTo && (
                                  <QuotedReplyPreview
                                    replyToId={msg.replyTo}
                                    allMessages={messages}
                                    users={users}
                                    currentUserId={currentUser?.id}
                                    onJumpToMessage={jumpToMessage}
                                    isMe={isMe}
                                  />
                                )}
                                {msg.content && (
                                  <ExpandableMessage
                                    content={msg.content}
                                    searchQuery={isSearchOpen ? searchQuery : ""}
                                    isActiveMatch={matchingMessageIds[activeMatchIndex] === msg.id}
                                  />
                                )}
                              </div>
                              {/* Edited label — like WhatsApp / Teams */}
                              {msg.edited && (
                                <span className={`text-[9px] text-muted-foreground mt-0.5 flex items-center gap-0.5 ${isMe ? "self-end mr-1" : "self-start ml-1"}`}>
                                  <Pencil size={8} className="opacity-60" />
                                  edited
                                </span>
                              )}
                              {/* Message Emoji Reactions */}
                              <MessageReactionBadges
                                reactions={msg.reactions}
                                currentUserId={currentUser?.id}
                                users={users}
                                onToggleReaction={(emoji) => toggleReaction(msg.id, emoji)}
                                isMe={isMe}
                              />
                            </div>

                            {/* Message Actions */}
                            <div
                              className={`opacity-0 group-hover/msg:opacity-100 transition-opacity flex items-center bg-surface border border-border rounded-md shadow-sm absolute -top-3 z-10 ${
                                isMe ? "right-1/2 -translate-x-4 md:right-auto md:translate-x-0 md:-left-36" : "-right-4 md:-right-36"
                              }`}
                            >
                              <Button
                                onClick={() => handleStartReply(msg)}
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                title="Reply"
                              >
                                <Reply size={13} />
                              </Button>
                              <MessageReactionTrigger
                                onReact={(emoji) => toggleReaction(msg.id, emoji)}
                                align={isMe ? "end" : "start"}
                              />
                              {isMe && msg.content && (
                                <Button onClick={() => setEditingMsgId(msg.id)} variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" title="Edit message">
                                  <Pencil size={13} />
                                </Button>
                              )}
                              <Button onClick={() => handleDeleteMessage(msg.id)} variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" title="Delete message">
                                <Trash2 size={13} />
                              </Button>
                            </div>
                          </>
                        )}

                        {/* Status for own messages */}
                        {isMe && editingMsgId !== msg.id && (
                          <div className="absolute -left-5 bottom-1 text-[10px] text-muted-foreground">
                            {msg.status === "sending" ? "..." : msg.status === "sent" ? "✓" : msg.status === "delivered" ? "✓✓" : "✓✓"}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Typing indicator */}
      {activeTypingUsers.length > 0 && (
        <div className="px-0 pb-0 border-t border-border/40 bg-background">
          <TypingIndicator names={activeTypingUsers} />
        </div>
      )}

      {/* Composer */}
      <div className="p-4 bg-background border-t border-border mt-auto relative">
        <div className="max-w-3xl mx-auto flex flex-col rounded-xl border border-border bg-surface/50 focus-within:ring-1 focus-within:ring-ring focus-within:border-ring transition-all overflow-hidden">
          {/* Active Reply Banner */}
          <ReplyComposerBanner
            replyingTo={replyingTo}
            users={users}
            currentUserId={currentUser?.id}
            onCancel={() => setReplyingTo(null)}
          />

          <div className="p-2 flex flex-col gap-2">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={replyingTo ? "Type your reply..." : "Type a message..."}
              className="w-full resize-none bg-transparent px-2 py-1 text-sm outline-none max-h-32 min-h-[40px]"
              rows={1}
            />
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-foreground" title="Attach file">
                  <Paperclip size={15} />
                </Button>
                <ComposerEmojiButton onSelectEmoji={handleInsertEmoji} />
                <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-foreground flex items-center justify-center gap-1 w-auto px-2" title="Share candidate">
                  <Share size={13} />
                  <span className="text-xs font-medium">Candidate</span>
                </Button>
              </div>
              <Button size="sm" className="h-7 px-3 gap-1" onClick={handleSend} disabled={!inputValue.trim()}>
                <Send size={12} />
                <span className="text-xs">{replyingTo ? "Reply" : "Send"}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
