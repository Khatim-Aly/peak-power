import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Home, 
  ShoppingBag, 
  Heart, 
  User, 
  Package, 
  BarChart3, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Bell,
  ChevronRight,
  Store,
  Shield,
  Tag
} from "lucide-react";
import { useAuth, AppRole } from "@/contexts/AuthContext";

import ThemeToggle from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: number;
}

const getNavItems = (role: AppRole | null): NavItem[] => {
  const baseItems: NavItem[] = [
    { label: 'Overview', icon: Home, href: '/dashboard' },
  ];

  if (role === 'admin') {
    return [
      ...baseItems,
      { label: 'Users', icon: Users, href: '/dashboard/users' },
      { label: 'Merchants', icon: Store, href: '/dashboard/merchants' },
      { label: 'All Orders', icon: Package, href: '/dashboard/orders' },
      { label: 'Analytics', icon: BarChart3, href: '/dashboard/analytics' },
      { label: 'Requests', icon: Bell, href: '/dashboard/requests' },
      { label: 'Promo Codes', icon: Tag, href: '/dashboard/promo-codes' },
      { label: 'Settings', icon: Settings, href: '/dashboard/settings' },
    ];
  }

  if (role === 'merchant') {
    return [
      ...baseItems,
      { label: 'Orders', icon: Package, href: '/dashboard/orders' },
      { label: 'Products', icon: ShoppingBag, href: '/dashboard/products' },
      { label: 'Analytics', icon: BarChart3, href: '/dashboard/analytics' },
      { label: 'Settings', icon: Settings, href: '/dashboard/settings' },
    ];
  }

  // User role
  return [
    ...baseItems,
    { label: 'My Orders', icon: Package, href: '/dashboard/orders' },
    { label: 'Favorites', icon: Heart, href: '/dashboard/favorites' },
    { label: 'Requests', icon: Bell, href: '/dashboard/requests' },
    { label: 'Shop', icon: ShoppingBag, href: '/product' },
    { label: 'Profile', icon: User, href: '/dashboard/profile' },
  ];
};

const getRoleIcon = (role: AppRole | null) => {
  switch (role) {
    case 'admin': return Shield;
    case 'merchant': return Store;
    default: return User;
  }
};

const getRoleBadge = (role: AppRole | null) => {
  switch (role) {
    case 'admin': return { label: 'Admin', variant: 'destructive' as const };
    case 'merchant': return { label: 'Merchant', variant: 'secondary' as const };
    default: return { label: 'Customer', variant: 'outline' as const };
  }
};

export const DashboardLayout = ({ children, title, subtitle }: DashboardLayoutProps) => {
  const { user, profile, role, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = getNavItems(role);
  const RoleIcon = getRoleIcon(role);
  const roleBadge = getRoleBadge(role);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-4 h-16">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <Link to="/" className="font-serif text-xl font-bold text-gold">
            PeakPower
          </Link>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-card border-r border-border z-50 p-6"
            >
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <SidebarContent
                navItems={navItems}
                currentPath={location.pathname}
                profile={profile}
                role={role}
                RoleIcon={RoleIcon}
                roleBadge={roleBadge}
                onSignOut={handleSignOut}
                onNavClick={() => setSidebarOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-72 bg-card border-r border-border flex-col p-6">
        <SidebarContent
          navItems={navItems}
          currentPath={location.pathname}
          profile={profile}
          role={role}
          RoleIcon={RoleIcon}
          roleBadge={roleBadge}
          onSignOut={handleSignOut}
        />
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 pt-16 lg:pt-0">
        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between px-8 h-20 border-b border-border bg-background/50 backdrop-blur-sm">
          <div>
            <h1 className="text-2xl font-serif font-bold">{title}</h1>
            {subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />
            <ThemeToggle />
          </div>
        </header>

        {/* Page Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-4 lg:p-8"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};

interface SidebarContentProps {
  navItems: NavItem[];
  currentPath: string;
  profile: any;
  role: AppRole | null;
  RoleIcon: React.ElementType;
  roleBadge: { label: string; variant: 'destructive' | 'secondary' | 'outline' };
  onSignOut: () => void;
  onNavClick?: () => void;
}

const SidebarContent = ({
  navItems,
  currentPath,
  profile,
  role,
  RoleIcon,
  roleBadge,
  onSignOut,
  onNavClick,
}: SidebarContentProps) => (
  <>
    {/* Logo */}
    <Link to="/" className="flex items-center gap-2 mb-8">
      <span className="font-serif text-2xl font-bold text-gold">PeakPower</span>
    </Link>

    {/* User Card */}
    <div className="bg-muted/50 rounded-2xl p-4 mb-6">
      <div className="flex items-center gap-3">
        <Avatar className="w-12 h-12 border-2 border-gold">
          <AvatarImage src={profile?.avatar_url || ''} />
          <AvatarFallback className="bg-gold/20 text-gold">
            {profile?.full_name?.[0] || profile?.email?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">
            {profile?.full_name || 'User'}
          </p>
          <Badge variant={roleBadge.variant} className="mt-1">
            <RoleIcon className="w-3 h-3 mr-1" />
            {roleBadge.label}
          </Badge>
        </div>
      </div>
    </div>

    {/* Navigation */}
    <nav className="flex-1 space-y-1">
      {navItems.map((item) => {
        const isActive = currentPath === item.href;
        return (
          <Link
            key={item.href}
            to={item.href}
            onClick={onNavClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              isActive
                ? 'bg-gold/10 text-gold'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <Badge variant="secondary" className="text-xs">
                {item.badge}
              </Badge>
            )}
            {isActive && <ChevronRight className="w-4 h-4" />}
          </Link>
        );
      })}
    </nav>

    {/* Sign Out */}
    <Button
      variant="ghost"
      className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive mt-4"
      onClick={onSignOut}
    >
      <LogOut className="w-5 h-5" />
      Sign Out
    </Button>
  </>
);
