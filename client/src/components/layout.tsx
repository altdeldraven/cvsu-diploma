import { Link, useLocation } from "wouter";
import { useUser, useLogout } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  ScrollText, 
  LogOut, 
  UserCircle,
  Info,
  Menu,
  X,
  ShieldCheck
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import logoImage from "@assets/logo-image_1772160673349.png";

interface LayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: LayoutProps) {
  const { user } = useUser();
  const { mutate: logout } = useLogout();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  const isAdmin = user?.role === "admin";

  const navigation = [
    { 
      name: "Dashboard", 
      href: isAdmin ? "/admin" : "/student", 
      icon: LayoutDashboard,
      show: true 
    },
    { 
      name: "Students", 
      href: "/admin/students", 
      icon: Users,
      show: isAdmin 
    },
    { 
      name: "Diplomas", 
      href: "/admin/diplomas", 
      icon: ScrollText,
      show: isAdmin 
    },
    { 
      name: "Settings", 
      href: "/admin/settings", 
      icon: ShieldCheck,
      show: isAdmin 
    },
    {
      name: "Profile",
      href: "/profile",
      icon: UserCircle,
      show: true
    },
    {
      name: "About",
      href: "/about",
      icon: Info,
      show: true
    }
  ];

  const NavContent = () => (
    <div className="flex flex-col h-full bg-[#004d01] text-white">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img src={logoImage} alt="CvSU Logo" className="h-10 w-10 object-contain rounded" />
          <div>
            <h1 className="font-serif font-bold text-white text-sm leading-tight">CvSU-Trece Martires City Campus</h1>
            <p className="text-xs text-white/60 uppercase tracking-wider">
              {isAdmin ? "Registrar Office" : "Student Portal"}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navigation.filter(item => item.show).map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href} data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, "-")}`} className={cn(
              "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors group",
              isActive 
                ? "bg-white/10 text-accent" 
                : "text-white/70 hover:bg-white/5 hover:text-white"
            )}>
              <item.icon className={cn("h-5 w-5", isActive ? "text-accent" : "text-white/50 group-hover:text-white")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="px-4 py-3 mb-2">
          <p className="text-sm font-medium text-white">{user?.firstName || user?.username}</p>
          <p className="text-xs text-white/50 truncate">{user?.email}</p>
        </div>
        <Button 
          variant="destructive" 
          className="w-full justify-start gap-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border-none"
          onClick={() => logout()}
          data-testid="button-sign-out"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 fixed inset-y-0 z-50 shadow-xl">
        <NavContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden fixed top-4 left-4 z-50">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64 border-r-0">
          <NavContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-6 md:p-8 lg:p-12 animate-in fade-in duration-500">
        <div className="max-w-6xl mx-auto space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
