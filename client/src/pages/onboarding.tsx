import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Shield, CreditCard, Bell, PiggyBank, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { queryClient, apiRequest } from "@/lib/queryClient";

const features = [
  {
    icon: CreditCard,
    title: "Track All Subscriptions",
    description: "See your monthly and yearly spending across all services in one place.",
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    description: "Get alerts for unused subscriptions and upcoming renewals.",
  },
  {
    icon: PiggyBank,
    title: "Save Money",
    description: "Identify subscriptions you're not using and track your savings.",
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
      navigate("/");
    },
  });

  if (step === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center space-y-8">
          <div className="space-y-4">
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <PiggyBank className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground" data-testid="text-onboarding-title">
              Welcome to SubClean
            </h1>
            <p className="text-lg text-muted-foreground">
              Take control of your subscriptions. Track spending, cancel unused services, and save money.
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
            Your Data, Your Control
          </h1>
          <p className="text-muted-foreground">
            We prioritize your privacy. All subscription data is stored locally and never shared with third parties.
          </p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
              <div className="text-left">
                <p className="font-medium text-foreground">Read-only access</p>
                <p className="text-sm text-muted-foreground">
                  We only read your subscription data - we never make changes to your accounts.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
              <div className="text-left">
                <p className="font-medium text-foreground">No data selling</p>
                <p className="text-sm text-muted-foreground">
                  Your financial data is never sold or shared with advertisers.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
              <div className="text-left">
                <p className="font-medium text-foreground">Delete anytime</p>
                <p className="text-sm text-muted-foreground">
                  Remove all your data with a single click whenever you want.
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
            {completeMutation.isPending ? "Setting up..." : "Continue with Manual Mode"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <p className="text-xs text-muted-foreground">
            You can add subscriptions manually to start tracking your spending.
          </p>
        </div>
      </div>
    </div>
  );
}
