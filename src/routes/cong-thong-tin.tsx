import { createFileRoute } from "@tanstack/react-router";
import { Portal } from "@/components/portal";
import { Page } from "@/components/shell";

const TABS = ["board", "order", "watch", "pay", "emissions", "claims", "log", "leads"] as const;
type PortalTab = (typeof TABS)[number];

export const Route = createFileRoute("/cong-thong-tin")({
  validateSearch: (search: Record<string, unknown>): { tab?: PortalTab; code?: string } => {
    const tab = search.tab;
    const code = typeof search.code === "string" ? search.code.trim().slice(0, 40) : "";
    const next: { tab?: PortalTab; code?: string } = {};
    if (typeof tab === "string" && (TABS as readonly string[]).includes(tab)) next.tab = tab as PortalTab;
    if (code) next.code = code;
    return next;
  },
  component: PortalPage,
});

function PortalPage() {
  const { tab, code } = Route.useSearch();
  return (
    <Page>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <Portal initialTab={tab} trackCode={code} />
      </div>
    </Page>
  );
}
