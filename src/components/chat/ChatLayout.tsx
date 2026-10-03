import { useState, useEffect } from "react";
import { ChatSidebar } from "./ChatSidebar.tsx";
import { MessageArea } from "./MessageArea.tsx";
import { DetailsPanel } from "./DetailsPanel.tsx";
import { useMediaQuery } from "@/hooks/useMediaQuery.ts";
import { getRouteApi } from "@tanstack/react-router";

const routeApi = getRouteApi("/_workspace/chat");

export function ChatLayout() {
  const { c } = routeApi.useSearch();
  const navigate = routeApi.useNavigate();
  const activeConversationId = c || null;
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isTablet = useMediaQuery("(min-width: 768px)");

  // Keep details panel closed by default and do not auto-open on conversation selection
  const handleSelectConversation = (id: string | null) => {
    navigate({ search: (prev: any) => ({ ...prev, c: id || undefined }) });
    if (!isDesktop) {
      setIsDetailsOpen(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] -m-4 sm:-m-6 overflow-hidden rounded-xl border border-border bg-background shadow-sm relative">
      <div
        className={`shrink-0 h-full ${activeConversationId ? "hidden md:block" : "w-full md:w-auto"} transition-all duration-300 z-20`}
      >
        <ChatSidebar
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
        />
      </div>

      {activeConversationId ? (
        <div
          className={`flex-1 flex overflow-hidden relative ${!activeConversationId ? "hidden md:flex" : "flex"}`}
        >
          <MessageArea
            conversationId={activeConversationId}
            isDetailsOpen={isDetailsOpen}
            onToggleDetails={() => setIsDetailsOpen((prev) => !prev)}
            onBack={() => handleSelectConversation(null)}
          />
          {isDetailsOpen && (
            <>
              {/* Mobile/Tablet Backdrop Overlay */}
              <div
                className="fixed inset-0 bg-background/70 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-200"
                onClick={() => setIsDetailsOpen(false)}
                aria-hidden="true"
              />

              {/* Details Panel Container */}
              <div
                className={`h-full ${
                  isDesktop
                    ? "relative w-72 shrink-0 border-l border-border bg-card/60 flex flex-col z-10 transition-all duration-200"
                    : "fixed inset-y-0 right-0 z-50 w-full sm:w-80 max-w-[85vw] bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
                }`}
              >
                <DetailsPanel
                  conversationId={activeConversationId}
                  onClose={() => setIsDetailsOpen(false)}
                />
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center bg-surface/30">
          <div className="flex size-16 items-center justify-center rounded-full bg-accent/20 text-accent mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold">Select a conversation</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-[250px]">
            Choose a conversation or start a new internal discussion.
          </p>
        </div>
      )}
    </div>
  );
}
