import React, { useState, useMemo } from "react";
import { Search, Smile, Plus, Sparkles, Heart, ThumbsUp, Briefcase, PartyPopper } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Reaction, ChatUser } from "@/types/chat";

export const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "🎉", "🚀", "👏", "💯"];

interface EmojiCategory {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  emojis: { emoji: string; name: string }[];
}

export const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: "frequent",
    name: "Quick Reactions",
    icon: ThumbsUp,
    emojis: [
      { emoji: "👍", name: "thumbs up approve yes" },
      { emoji: "👎", name: "thumbs down disapprove no" },
      { emoji: "❤️", name: "red heart love like" },
      { emoji: "🔥", name: "fire lit hot amazing" },
      { emoji: "🎉", name: "party popper celebration congrats" },
      { emoji: "🚀", name: "rocket launch speed fast" },
      { emoji: "👏", name: "clapping hands applause bravo" },
      { emoji: "🙌", name: "raising hands praise hurray" },
      { emoji: "💯", name: "hundred points perfect score" },
      { emoji: "✨", name: "sparkles shiny magical stars" },
      { emoji: "👀", name: "eyes look seeing review" },
      { emoji: "🤝", name: "handshake agree deal partner" },
      { emoji: "🙏", name: "folded hands please thank you namaste" },
      { emoji: "✅", name: "check mark done complete approved" },
    ],
  },
  {
    id: "smileys",
    name: "Smileys & Emotion",
    icon: Smile,
    emojis: [
      { emoji: "😀", name: "grinning face smile happy" },
      { emoji: "😃", name: "grinning face big eyes happy" },
      { emoji: "😄", name: "grinning face smiling eyes joyful" },
      { emoji: "😁", name: "beaming face smiling eyes grin" },
      { emoji: "😆", name: "grinning squinting face haha" },
      { emoji: "😅", name: "grinning face with sweat relief phew" },
      { emoji: "😂", name: "face with tears of joy lol laughing" },
      { emoji: "🤣", name: "rolling on floor laughing rofl" },
      { emoji: "😊", name: "smiling face with smiling eyes warm" },
      { emoji: "😇", name: "smiling face with halo angel innocent" },
      { emoji: "🙂", name: "slightly smiling face pleasant" },
      { emoji: "🙃", name: "upside down face silly sarcasm" },
      { emoji: "😉", name: "winking face wink joke" },
      { emoji: "😌", name: "relieved face peaceful calm" },
      { emoji: "😍", name: "smiling face with heart eyes love adore" },
      { emoji: "🥰", name: "smiling face with hearts loving warm" },
      { emoji: "😘", name: "face blowing a kiss love kiss" },
      { emoji: "😋", name: "face savoring food delicious yum" },
      { emoji: "😛", name: "face with tongue playful" },
      { emoji: "😜", name: "winking face with tongue wacky joke" },
      { emoji: "🤪", name: "zany face crazy wild goofy" },
      { emoji: "🤩", name: "star struck excited impressed" },
      { emoji: "🥳", name: "partying face celebration birthday" },
      { emoji: "😎", name: "smiling face with sunglasses cool awesome" },
      { emoji: "🤓", name: "nerd face smart geek developer" },
      { emoji: "🧐", name: "face with monocle curious investigating" },
      { emoji: "🤔", name: "thinking face pondering wondering" },
      { emoji: "🫡", name: "saluting face respect yes sir" },
      { emoji: "🤫", name: "shushing face quiet secret hush" },
      { emoji: "🤭", name: "face with hand over mouth oops chuckle" },
      { emoji: "🥱", name: "yawning face tired sleepy bored" },
      { emoji: "😴", name: "sleeping face zzz goodnight" },
      { emoji: "😮", name: "face with open mouth surprise wow" },
      { emoji: "😯", name: "hushed face stunned" },
      { emoji: "😲", name: "astonished face shocked amazed" },
      { emoji: "😳", name: "flushed face blush embarrassed" },
      { emoji: "🥺", name: "pleading face puppy eyes please" },
      { emoji: "😢", name: "crying face sad tear" },
      { emoji: "😭", name: "loudly crying face bawling heartbroken" },
      { emoji: "😱", name: "face screaming in fear horror omg" },
      { emoji: "🤯", name: "exploding head mind blown shocked" },
      { emoji: "😤", name: "face with steam from nose proud triumph" },
      { emoji: "😡", name: "pouting face angry mad" },
      { emoji: "🤬", name: "face with symbols on mouth swearing furious" },
      { emoji: "💪", name: "flexed biceps muscle strong power" },
      { emoji: "🎯", name: "bullseye target goal hit direct" },
    ],
  },
  {
    id: "work",
    name: "Recruiting & Work",
    icon: Briefcase,
    emojis: [
      { emoji: "💼", name: "briefcase portfolio job work" },
      { emoji: "📄", name: "document page resume cv file" },
      { emoji: "📊", name: "bar chart stats analytics growth" },
      { emoji: "📈", name: "chart increasing positive trend metrics" },
      { emoji: "📋", name: "clipboard checklist task audit" },
      { emoji: "📌", name: "pushpin bookmark pin notice" },
      { emoji: "💡", name: "light bulb idea insight solution" },
      { emoji: "💻", name: "laptop computer tech coding" },
      { emoji: "🧑‍💻", name: "technologist software engineer developer coder" },
      { emoji: "👩‍💼", name: "office worker recruiter manager hiring" },
      { emoji: "⭐", name: "star high rating favorite gold" },
      { emoji: "🌟", name: "glowing star exceptional top candidate" },
      { emoji: "🏆", name: "trophy winner award success top" },
      { emoji: "🥇", name: "first place medal champion best" },
      { emoji: "📞", name: "telephone call interview phone screen" },
      { emoji: "📅", name: "calendar schedule date meeting" },
      { emoji: "⏰", name: "alarm clock reminder urgent deadline" },
      { emoji: "⏳", name: "hourglass pending waiting in progress" },
      { emoji: "💬", name: "speech balloon chat talk discussion" },
      { emoji: "🔍", name: "magnifying glass search find sourcing" },
    ],
  },
  {
    id: "symbols",
    name: "Hearts & Symbols",
    icon: Heart,
    emojis: [
      { emoji: "❤️", name: "red heart love" },
      { emoji: "🧡", name: "orange heart" },
      { emoji: "💛", name: "yellow heart" },
      { emoji: "💚", name: "green heart" },
      { emoji: "💙", name: "blue heart" },
      { emoji: "💜", name: "purple heart" },
      { emoji: "🖤", name: "black heart" },
      { emoji: "🤍", name: "white heart" },
      { emoji: "🤎", name: "brown heart" },
      { emoji: "💔", name: "broken heart sad rejected" },
      { emoji: "💖", name: "sparkling heart adore" },
      { emoji: "💓", name: "beating heart pulse" },
      { emoji: "✨", name: "sparkles glitter magic" },
      { emoji: "⚡", name: "high voltage fast lightning energy" },
      { emoji: "🔥", name: "fire flame lit trending" },
      { emoji: "🌟", name: "glowing star radiant" },
      { emoji: "☀️", name: "sun sunny brightness day" },
      { emoji: "🌈", name: "rainbow colorful pride" },
      { emoji: "💥", name: "collision bang impact boom" },
      { emoji: "🔔", name: "bell notification alert ring" },
    ],
  },
  {
    id: "celebrate",
    name: "Celebration & Fun",
    icon: PartyPopper,
    emojis: [
      { emoji: "🎉", name: "party popper celebration offer accepted" },
      { emoji: "🎊", name: "confetti ball festive event" },
      { emoji: "🥳", name: "partying face celebrate hire" },
      { emoji: "🍾", name: "bottle with popping cork champagne celebrate" },
      { emoji: "🥂", name: "clinking glasses cheers toast" },
      { emoji: "🍻", name: "clinking beer mugs cheers celebration" },
      { emoji: "🎈", name: "balloon birthday celebration" },
      { emoji: "🎁", name: "wrapped gift bonus present" },
      { emoji: "🍰", name: "shortcake cake dessert celebration" },
      { emoji: "🍕", name: "pizza food team lunch" },
      { emoji: "☕", name: "hot beverage coffee tea morning break" },
    ],
  },
];

/** Full searchable emoji picker panel */
export function EmojiPickerPanel({
  onSelectEmoji,
  onClose,
}: {
  onSelectEmoji: (emoji: string) => void;
  onClose?: () => void;
}) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("frequent");

  const filteredEmojis = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase().trim();
    const results: { emoji: string; name: string }[] = [];
    const seen = new Set<string>();

    EMOJI_CATEGORIES.forEach((cat) => {
      cat.emojis.forEach((item) => {
        if (!seen.has(item.emoji) && (item.name.includes(q) || item.emoji.includes(q))) {
          seen.add(item.emoji);
          results.push(item);
        }
      });
    });
    return results;
  }, [search]);

  return (
    <div className="w-[300px] flex flex-col bg-popover text-popover-foreground rounded-lg border border-border shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
      {/* Search Bar */}
      <div className="p-2.5 border-b border-border/60">
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-muted/60 border border-border/40 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary">
          <Search size={14} className="text-muted-foreground shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search emojis..."
            className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            autoFocus
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-[10px] text-muted-foreground hover:text-foreground shrink-0"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Category selector pills if not searching */}
      {!search.trim() && (
        <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border/40 bg-muted/20 overflow-x-auto no-scrollbar">
          {EMOJI_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                title={cat.name}
                className={`p-1.5 rounded-md transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon size={14} />
              </button>
            );
          })}
        </div>
      )}

      {/* Emoji Grid */}
      <ScrollArea className="h-56 p-2">
        {filteredEmojis ? (
          <div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              Search Results ({filteredEmojis.length})
            </div>
            {filteredEmojis.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                No emojis found for "{search}"
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {filteredEmojis.map((item, idx) => (
                  <button
                    key={`${item.emoji}-${idx}`}
                    onClick={() => {
                      onSelectEmoji(item.emoji);
                      onClose?.();
                    }}
                    title={item.name}
                    className="h-8 w-8 rounded-md flex items-center justify-center text-lg hover:bg-muted/80 hover:scale-120 transition-all cursor-pointer select-none"
                  >
                    {item.emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {EMOJI_CATEGORIES.filter((cat) => !activeCategory || cat.id === activeCategory).map(
              (cat) => (
                <div key={cat.id}>
                  <div className="text-[11px] font-semibold text-muted-foreground px-1 mb-1.5 flex items-center justify-between">
                    <span>{cat.name}</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {cat.emojis.map((item, idx) => (
                      <button
                        key={`${item.emoji}-${idx}`}
                        onClick={() => {
                          onSelectEmoji(item.emoji);
                          onClose?.();
                        }}
                        title={item.name}
                        className="h-8 w-8 rounded-md flex items-center justify-center text-lg hover:bg-muted/80 hover:scale-120 transition-all cursor-pointer select-none"
                      >
                        {item.emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

/** Quick reaction popup bar (WhatsApp / Slack style) on hover */
export function MessageReactionTrigger({
  onReact,
  align = "start",
}: {
  onReact: (emoji: string) => void;
  align?: "start" | "end" | "center";
}) {
  const [open, setOpen] = useState(false);
  const [showFullPicker, setShowFullPicker] = useState(false);

  const handleSelect = (emoji: string) => {
    onReact(emoji);
    setOpen(false);
    setShowFullPicker(false);
  };

  return (
    <Popover open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) setShowFullPicker(false);
    }}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          title="Add reaction"
        >
          <Smile size={14} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        side="top"
        sideOffset={6}
        className="p-1 w-auto rounded-full bg-surface border border-border/80 shadow-lg backdrop-blur-md"
      >
        {showFullPicker ? (
          <EmojiPickerPanel onSelectEmoji={handleSelect} onClose={() => setOpen(false)} />
        ) : (
          <div className="flex items-center gap-0.5 px-1 py-0.5">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleSelect(emoji)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-base hover:bg-muted/80 hover:scale-125 transition-transform duration-150 cursor-pointer select-none"
              >
                {emoji}
              </button>
            ))}
            <div className="h-4 w-px bg-border mx-0.5" />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
              onClick={() => setShowFullPicker(true)}
              title="More emojis"
            >
              <Plus size={14} />
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** Reaction pills/badges rendered underneath a message */
export function MessageReactionBadges({
  reactions,
  currentUserId,
  users,
  onToggleReaction,
  isMe,
}: {
  reactions?: Reaction[] | undefined;
  currentUserId?: string | undefined;
  users: ChatUser[];
  onToggleReaction: (emoji: string) => void;
  isMe: boolean;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  if (!reactions || reactions.length === 0) return null;

  const validReactions = reactions.filter((r) => r.userIds && r.userIds.length > 0);
  if (validReactions.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
      {validReactions.map((reaction) => {
        const hasReacted = currentUserId ? reaction.userIds.includes(currentUserId) : false;
        
        // Tooltip showing names of reactors
        const reactorNames = reaction.userIds.map((uid) => {
          if (uid === currentUserId) return "You";
          const user = users.find((u) => u.id === uid);
          return user ? user.name : "Someone";
        });
        const tooltipText =
          reactorNames.length === 1
            ? `${reactorNames[0]} reacted`
            : `${reactorNames.slice(0, -1).join(", ")} and ${reactorNames[reactorNames.length - 1]} reacted`;

        return (
          <button
            key={reaction.emoji}
            onClick={() => onToggleReaction(reaction.emoji)}
            title={tooltipText}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all duration-150 cursor-pointer select-none group/badge ${
              hasReacted
                ? "bg-primary/15 border-primary/40 text-primary font-medium hover:bg-primary/25 shadow-2xs"
                : "bg-surface/80 border-border/60 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            }`}
          >
            <span className="text-sm group-hover/badge:scale-115 transition-transform duration-100">
              {reaction.emoji}
            </span>
            <span className="text-[11px] font-medium">{reaction.userIds.length}</span>
          </button>
        );
      })}

      {/* Quick plus button to add another reaction to this message */}
      <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
        <PopoverTrigger asChild>
          <button
            title="Add reaction"
            className="inline-flex items-center justify-center h-5 w-5 rounded-full border border-dashed border-border/70 text-muted-foreground hover:text-foreground hover:border-border bg-surface/40 hover:bg-muted/50 transition-colors"
          >
            <Plus size={10} />
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align={isMe ? "end" : "start"}
          sideOffset={4}
          className="p-0 border-0 bg-transparent shadow-none w-auto"
        >
          <EmojiPickerPanel
            onSelectEmoji={(emoji) => {
              onToggleReaction(emoji);
              setPickerOpen(false);
            }}
            onClose={() => setPickerOpen(false)}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

/** Emoji button in composer toolbar to insert emoji into input text */
export function ComposerEmojiButton({
  onSelectEmoji,
}: {
  onSelectEmoji: (emoji: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 hover:text-foreground"
          title="Insert emoji"
        >
          <Smile size={15} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        sideOffset={8}
        className="p-0 border-0 bg-transparent shadow-none w-auto"
      >
        <EmojiPickerPanel
          onSelectEmoji={(emoji) => {
            onSelectEmoji(emoji);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}
