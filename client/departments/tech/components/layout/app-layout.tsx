import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, FolderKanban } from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-[80vh] min-h-[600px] overflow-hidden bg-background border rounded-xl shadow-sm">
      {/* Desktop sidebar — hidden below md */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile sidebar — slide-in Sheet */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent
          side="left"
          className="p-0 w-64 max-w-[80vw] [&>button:first-of-type]:hidden"
        >
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 border-b px-3 h-14 bg-sidebar flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent flex-shrink-0"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <FolderKanban className="h-5 w-5 text-sidebar-primary flex-shrink-0" />
          <span className="font-semibold text-sidebar-primary-foreground truncate">Agile Flow</span>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 md:p-8">
          <div className="mx-auto max-w-6xl w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
