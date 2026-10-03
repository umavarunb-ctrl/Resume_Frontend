import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChatUser, ConversationType } from "@/types/chat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { chatService } from "@/services/chatService";

interface CreateChatDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  type: ConversationType;
  users: ChatUser[];
  currentUserId: string;
  onCreated: (conversationId: string) => void;
}

export function CreateChatDialog({
  isOpen,
  onOpenChange,
  type,
  users,
  currentUserId,
  onCreated,
}: CreateChatDialogProps) {
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Reset state when opened
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setSelectedUserIds(new Set());
      setGroupName("");
      setSearchQuery("");
      // Fetch initial empty search if you want default users, or just let local filter handle it
      chatService.searchUsers(""); 
    }
    onOpenChange(open);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        chatService.searchUsers(searchQuery.trim());
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredUsers = users.filter((u) => {
    if (u.id === currentUserId) return false;
    if (!searchQuery.trim()) return true;
    return u.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleToggleUser = (userId: string) => {
    const newSet = new Set(selectedUserIds);
    if (newSet.has(userId)) {
      newSet.delete(userId);
    } else {
      if (type === "direct") {
        newSet.clear();
      }
      newSet.add(userId);
    }
    setSelectedUserIds(newSet);
  };

  const handleCreate = async () => {
    if (selectedUserIds.size === 0) return;
    if (type !== "direct" && !groupName.trim() && type !== "candidate_discussion") {
      // For standard groups, name might be optional but good to have.
      // If we want to enforce it: return;
    }

    const memberIds = [currentUserId, ...Array.from(selectedUserIds)];
    let finalName = groupName;
    if (type === "candidate_discussion" && !finalName) {
      finalName = "Internal Discussion";
    }

    const conversation = await chatService.createConversation(type, memberIds, finalName);
    onCreated(conversation.id);
    handleOpenChange(false);
  };

  const isCreateDisabled =
    selectedUserIds.size === 0 || (type === "group" && selectedUserIds.size < 1);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {type === "direct" && "New Message"}
            {type === "group" && "Create Group"}
            {type === "candidate_discussion" && "New Internal Discussion"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          {type !== "direct" && (
            <div className="space-y-2">
              <Input
                placeholder={type === "candidate_discussion" ? "Discussion Topic (e.g. Frontend Role)" : "Group Name"}
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Input
              placeholder="Search people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <ScrollArea className="h-[200px] border rounded-md p-2">
            {filteredUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center p-4">No users found.</p>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <label
                    key={user.id}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedUserIds.has(user.id)}
                      onCheckedChange={() => handleToggleUser(user.id)}
                    />
                    <div className="relative shrink-0">
                      <Avatar className="h-8 w-8">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <AvatarFallback className="text-xs">
                            {user.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background ${
                          user.status === "online"
                            ? "bg-emerald-500"
                            : user.status === "away"
                              ? "bg-amber-400"
                              : user.status === "dnd"
                                ? "bg-rose-500"
                                : "bg-slate-400"
                        }`}
                      />
                    </div>
                    <div className="flex-1 flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{user.name}</span>
                        {user.status === "online" && (
                          <span className="text-[10px] text-emerald-600 font-medium">Online</span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground capitalize">
                        {user.role.replace("_", " ")}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreateDisabled}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
