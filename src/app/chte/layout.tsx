import { Sidebar } from "@/components/Sidebar";

export default function ChteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 print:block print:h-auto print:overflow-visible">
      <Sidebar />
      <main className="flex-1 overflow-y-auto print:p-0 print:overflow-visible">{children}</main>
    </div>
  );
}
