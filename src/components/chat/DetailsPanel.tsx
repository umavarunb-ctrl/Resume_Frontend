import { X, User, Users, FileText, Pin, Mail, Phone, ExternalLink } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface DetailsPanelProps {
  conversationId: string;
  onClose?: () => void;
}

export function DetailsPanel({ conversationId, onClose }: DetailsPanelProps) {
  const { conversations, users, currentUser } = useChat();

  const conversation = conversations.find((c) => c.id === conversationId);
  if (!conversation) return null;

  const members = conversation.memberIds
    .map((id) => users.find((u) => u.id === id))
    .filter(Boolean) as typeof users;

  let title = conversation.name || "Details";
  let subtitle = "";

  if (conversation.type === "direct") {
    const otherUser = members.find((m) => m.id !== currentUser?.id);
    if (otherUser) {
      title = "Profile";
      subtitle = otherUser.name;
    }
  } else if (conversation.type === "group") {
    title = "Group Details";
    subtitle = conversation.name || "";
  } else if (conversation.type === "candidate_discussion") {
    title = "Candidate Context";
  }

  return (
    <div className="w-full h-full flex flex-col bg-card overflow-hidden">
      <div className="h-16 flex items-center justify-between px-4 border-b border-border shrink-0 bg-muted/20">
        <h3 className="font-semibold text-sm truncate flex-1">{title}</h3>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 ml-2 text-muted-foreground hover:text-foreground shrink-0 rounded-full"
            onClick={onClose}
            title="Close details panel"
          >
            <X size={16} />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Profile / Header Section */}
          <div className="flex flex-col items-center text-center space-y-3">
            <Avatar className="h-16 w-16">
              {conversation.type === "direct" && members.find((m) => m.id !== currentUser?.id)?.avatar ? (
                <img 
                  src={members.find((m) => m.id !== currentUser?.id)?.avatar} 
                  alt={subtitle} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <AvatarFallback className="text-xl bg-accent/20 text-accent-foreground">
                  {conversation.type === "candidate_discussion"
                    ? "C"
                    : conversation.type === "group"
                      ? subtitle.substring(0, 2).toUpperCase()
                      : subtitle.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <h4 className="font-semibold">{subtitle || title}</h4>
              {conversation.type === "direct" && (
                <p className="text-xs text-muted-foreground mt-1 capitalize">
                  {members.find((m) => m.id !== currentUser?.id)?.role.replace("_", " ")}
                </p>
              )}
              {conversation.type === "candidate_discussion" && (
                <div className="mt-2 text-xs text-muted-foreground flex flex-col items-center gap-1">
                  <span>Python Developer</span>
                  <span>4.2 years experience</span>
                  <div className="flex gap-1 mt-2 flex-wrap justify-center">
                    <span className="px-1.5 py-0.5 bg-secondary rounded text-[10px]">Python</span>
                    <span className="px-1.5 py-0.5 bg-secondary rounded text-[10px]">FastAPI</span>
                    <span className="px-1.5 py-0.5 bg-secondary rounded text-[10px]">AWS</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-3 h-7 text-xs">
                    <ExternalLink size={12} className="mr-1" />
                    View Candidate
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Members (for group/candidate) */}
          {conversation.type !== "direct" && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Members ({members.length})
              </h4>
              <div className="space-y-2">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center gap-2">
                    <div className="relative shrink-0">
                      <Avatar className="h-6 w-6">
                        {member.avatar ? (
                          <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          <AvatarFallback className="text-[10px] bg-muted font-medium">
                            {member.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-background ${
                          member.status === "online"
                            ? "bg-emerald-500"
                            : member.status === "away"
                              ? "bg-amber-400"
                              : member.status === "dnd"
                                ? "bg-rose-500"
                                : "bg-slate-400"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-medium truncate">{member.name}</p>
                        {member.status === "online" && (
                          <span className="text-[9px] text-emerald-600 font-semibold">• Online</span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {member.role.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Shared Files */}
          <div className="space-y-3 pt-2 border-t border-border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              Shared Files
              <Button variant="link" className="h-auto p-0 text-[10px]">
                View all
              </Button>
            </h4>
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 group cursor-pointer hover:bg-accent/5 p-1 rounded transition-colors"
                >
                  <div className="h-8 w-8 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <FileText size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                      Resume_Document_{i}.pdf
                    </p>
                    <p className="text-[10px] text-muted-foreground">PDF • 2.4 MB</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pinned Messages */}
          <div className="space-y-3 pt-2 border-t border-border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Pin size={12} />
              Pinned Messages
            </h4>
            <div className="space-y-2">
              <div className="text-xs p-2 rounded bg-accent/10 border border-accent/20 text-muted-foreground line-clamp-2">
                "Schedule the technical round for tomorrow if possible."
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
