import { Switch, Route, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset
} from "@/components/ui/sidebar";
import { Home, CreditCard, PiggyBank, Bell, Menu, BarChart3, Settings } from "lucide-react";
import Onboarding from "@/pages/onboarding";
import HomePage from "@/pages/home";
import Subscriptions from "@/pages/subscriptions";
import SubscriptionDetail from "@/pages/subscription-detail";
import Savings from "@/pages/savings";
import Alerts from "@/pages/alerts";
import Analytics from "@/pages/analytics";
import SettingsPage from "@/pages/settings";
import NotFound from "@/pages/not-found";
import type { AppState } from "@shared/schema";

const navItems = [
  { title: "Home", href: "/", icon: Home },
  { title: "Subscriptions", href: "/subscriptions", icon: CreditCard },
  { title: "Analytics", href: "/analytics", icon: BarChart3 },
  { title: "Savings", href: "/savings", icon: PiggyBank },
  { title: "Alerts", href: "/alerts", icon: Bell },
  { title: "Settings", href: "/settings", icon: Settings },
];

function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <PiggyBank className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">SubClean</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton 
                asChild 
                isActive={location === item.href || (item.href !== "/" && location.startsWith(item.href))}
              >
                <Link href={item.href} data-testid={`nav-${item.title.toLowerCase()}`}>
                  <item.icon className="w-4 h-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}

function MainLayout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "14rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1">
          <header className="flex items-center justify-between gap-4 p-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <SidebarTrigger data-testid="button-sidebar-toggle">
              <Menu className="w-5 h-5" />
            </SidebarTrigger>
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  const { data: appState, isLoading } = useQuery<AppState>({
    queryKey: ["/api/app-state"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!appState?.onboardingComplete) {
    return <Onboarding />;
  }

  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/subscriptions" component={Subscriptions} />
        <Route path="/subscriptions/:id" component={SubscriptionDetail} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/savings" component={Savings} />
        <Route path="/alerts" component={Alerts} />
        <Route path="/settings" component={SettingsPage} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
