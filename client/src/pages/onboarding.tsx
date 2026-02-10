import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Shield, CreditCard, BellRing, Lock, ArrowRight, CheckCircle2, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { queryClient, apiRequest } from "@/lib/queryClient";

const features = [
  {
    icon: CreditCard,
    title: "Track All Subscriptions",
    description: "See your monthly and yearly spending across all services in one place.",
  },
  {
    icon: BellRing,
    title: "Local Notifications",
    description: "Get browser alerts before renewals - processed entirely on your device.",
  },
  {
    icon: Lock,
    title: "100% Private",
    description: "Your data never leaves your device. No accounts, no cloud, no tracking.",
  },
];

export default function Onboarding() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);

  const completeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/onboarding/complete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/app-state"] });
      navigate("/app");
    },
  });

  if (step === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center space-y-8">
          <div className="space-y-4">
            <Badge variant="outline" className="gap-1.5 text-sm px-3 py-1">
              <WifiOff className="w-3.5 h-3.5" />
              Works Offline
            </Badge>
            <h1 className="text-4xl font-bold text-foreground" data-testid="text-onboarding-title">
              Welcome to SubClean
            </h1>
            <p className="text-lg text-muted-foreground">
              Track subscriptions privately. Your data stays on your device - always.
            </p>
          </div>

          <div className="space-y-4">
            {features.map((feature, index) => (
              <Card key={index} className="text-left">
                <CardContent className="flex items-start gap-4 p-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button 
            size="lg" 
            className="w-full" 
            onClick={() => setStep(1)}
            data-testid="button-get-started"
          >
            Get Started
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center space-y-8">
        <div className="space-y-4">
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="text-privacy-title">
            Your Data, Your Device
          </h1>
          <p className="text-muted-foreground">
            Everything stays local. No servers, no accounts, no data sharing.
          </p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
              <div className="text-left">
                <p className="font-medium text-foreground">No account required</p>
                <p className="text-sm text-muted-foreground">
                  Start using SubClean immediately - no sign-up, no email, no passwords.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
              <div className="text-left">
                <p className="font-medium text-foreground">No data leaves your device</p>
                <p className="text-sm text-muted-foreground">
                  Your financial data is never uploaded, synced, or shared with anyone.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
              <div className="text-left">
                <p className="font-medium text-foreground">Local notifications only</p>
                <p className="text-sm text-muted-foreground">
                  Renewal reminders work right in your browser - no external services involved.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button 
            size="lg" 
            className="w-full"
            onClick={() => completeMutation.mutate()}
            disabled={completeMutation.isPending}
            data-testid="button-manual-mode"
          >
            {completeMutation.isPending ? "Setting up..." : "Start Tracking"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <p className="text-xs text-muted-foreground">
            Add your subscriptions manually or import from CSV.
          </p>
        </div>
      </div>
    </div>
  );
}
