import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_workspace/candidates")({
  component: CandidatesLayout,
});

function CandidatesLayout() {
  return <Outlet />;
}
