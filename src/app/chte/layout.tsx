import { Sidebar } from "@/components/Sidebar";
import { PortalTopBar } from "@/components/common/PortalTopBar";
import { PortalBottomWave } from "@/components/common/PortalPageHeader";

export default function ChteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 print:block print:h-auto print:overflow-visible print:bg-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:overflow-visible">
        <PortalTopBar />
        <main className="flex-1 overflow-y-auto custom-scrollbar print:p-0 print:overflow-visible">
          {children}
          <PortalBottomWave theme="dark" />
        </main>
      </div>
    </div>
  );
}
