import { type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { ThemeProvider } from "@/lib/theme";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <div className="dark min-h-screen bg-[#030711] text-slate-100">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,.12),transparent_34%),radial-gradient(circle_at_85%_10%,rgba(168,85,247,.10),transparent_28%)]" />
        <div className="relative flex min-h-screen">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <Header />
            <main className="flex-1 space-y-4 p-4 xl:p-5">{children}</main>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
