import { Sidebar } from "@/components/Sidebar";
import { PortalTopBar } from "@/components/common/PortalTopBar";
import { PortalBottomWave } from "@/components/common/PortalPageHeader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f7f6] text-slate-900 font-sans print:block print:h-auto print:overflow-visible print:bg-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:overflow-visible">
        <PortalTopBar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar print:p-0 print:overflow-visible">
          {children}
          <PortalBottomWave />
        </main>
      </div>
    </div>
  );
}
