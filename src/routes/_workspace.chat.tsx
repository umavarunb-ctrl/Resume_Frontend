import { createFileRoute } from "@tanstack/react-router";
import { ChatLayout } from "@/components/chat/ChatLayout";

export const Route = createFileRoute("/_workspace/chat")({
  validateSearch: (search: Record<string, unknown>): { c?: string } => {
    return {
      ...(typeof search["c"] === "string" ? { c: search["c"] } : {}),
    };
  },
  component: ChatLayout,
});
