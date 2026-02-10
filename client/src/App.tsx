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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, CreditCard, PiggyBank, Bell, Menu, BarChart3, Settings, Shield, WifiOff, Lock, BellRing, ArrowRight, CheckCircle2 } from "lucide-react";
import { SiGithub } from "react-icons/si";
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
  { title: "Home", href: "/app", icon: Home },
  { title: "Subscriptions", href: "/subscriptions", icon: CreditCard },
  { title: "Analytics", href: "/analytics", icon: BarChart3 },
  { title: "Savings", href: "/savings", icon: PiggyBank },
  { title: "Alerts", href: "/alerts", icon: Bell },
  { title: "Settings", href: "/settings", icon: Settings },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <PiggyBank className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">SubClean</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button asChild variant="ghost" size="icon" data-testid="button-github">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                <SiGithub className="w-5 h-5" />
              </a>
            </Button>
          </div>
        </div>
      </nav>

      <main className="pt-24">
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <Badge variant="outline" className="gap-1.5 text-sm px-3 py-1" data-testid="badge-offline">
                <WifiOff className="w-3.5 h-3.5" />
                100% Offline - No Internet Required
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Track Subscriptions.
                <span className="text-primary"> Keep Data Private.</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg">
                Your subscription data stays on your device. No accounts, no cloud sync, 
                no sharing your financial information with anyone. Ever.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild className="text-lg px-8" data-testid="button-get-started">
                  <Link href="/app">
                    Get Started
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground pt-4">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-green-500" />
                  <span>Your data stays local</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span>No account needed</span>
                </div>
                <div className="flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-green-500" />
                  <span>Local notifications</span>
                </div>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="bg-card rounded-2xl shadow-2xl p-6 border">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-semibold text-lg">Monthly Spending</h3>
                    <Badge variant="outline" className="gap-1 shrink-0">
                      <WifiOff className="w-3 h-3" />
                      Offline
                    </Badge>
                  </div>
                  <div className="text-4xl font-bold">$127.99</div>
                  <div className="text-sm text-green-500">-$42.00 since last month</div>
                  <div className="space-y-3 pt-4">
                    <div className="flex items-center justify-between gap-4 p-3 bg-muted/50 rounded-lg">
                      <span>Netflix</span>
                      <span className="font-medium">$15.99/mo</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 p-3 bg-muted/50 rounded-lg">
                      <span>Spotify</span>
                      <span className="font-medium">$9.99/mo</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                      <span className="text-red-500">Unused Gym App</span>
                      <span className="font-medium text-red-500">$29.99/mo</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold text-center mb-12">Why SubClean?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card rounded-xl p-6 border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">100% Private</h3>
              <p className="text-muted-foreground">
                All data stays on your device. No sign-ups, no cloud storage, no third-party access to your financial data.
              </p>
            </div>
            <div className="bg-card rounded-xl p-6 border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <BellRing className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Local Notifications</h3>
              <p className="text-muted-foreground">
                Get browser notifications before renewals. "Netflix charges tomorrow" - all processed locally, nothing leaves your device.
              </p>
            </div>
            <div className="bg-card rounded-xl p-6 border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <PiggyBank className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Save Money</h3>
              <p className="text-muted-foreground">
                See exactly how much you're spending and saving. Track your progress as you cut unnecessary costs.
              </p>
            </div>
          </div>
        </section>

        <footer className="border-t py-8">
          <div className="max-w-6xl mx-auto px-6 flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span>SubClean - Your data stays on your device</span>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover-elevate p-1 rounded-md">
              <SiGithub className="w-4 h-4" />
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}

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
        <div className="mt-3 pt-3 border-t">
          <Badge variant="outline" className="gap-1 text-xs">
            <WifiOff className="w-3 h-3" />
            Offline Mode
          </Badge>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton 
                asChild 
                isActive={location === item.href || (item.href !== "/app" && location.startsWith(item.href))}
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
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button asChild variant="ghost" size="icon" data-testid="button-github-header">
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                  <SiGithub className="w-4 h-4" />
                </a>
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function AppContent() {
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
        <Route path="/app" component={HomePage} />
        <Route path="/subscriptions" component={Subscriptions} />
        <Route path="/subscriptions/:id" component={SubscriptionDetail} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/savings" component={Savings} />
        <Route path="/alerts" component={Alerts} />
        <Route path="/settings" component={SettingsPage} />
        <Route component={HomePage} />
      </Switch>
    </MainLayout>
  );
}

function Router() {
  const [location] = useLocation();

  if (location === "/") {
    return <LandingPage />;
  }

  return <AppContent />;
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
