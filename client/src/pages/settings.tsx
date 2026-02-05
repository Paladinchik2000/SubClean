import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Settings as SettingsIcon, Download, Globe, Bell, Smartphone, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { currencies, currencySymbols, settingsSchema, type Settings } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useEffect } from "react";

export default function SettingsPage() {
  const { toast } = useToast();
  const { data: settings, isLoading } = useQuery<Settings>({
    queryKey: ["/api/settings"],
  });

  const form = useForm<Settings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      defaultCurrency: "USD",
      emailNotifications: false,
      pushoverNotifications: false,
      renewalReminderDays: 7,
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset(settings);
    }
  }, [settings, form]);

  const pushoverNotifications = form.watch("pushoverNotifications");

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Partial<Settings>) => {
      const res = await apiRequest("PATCH", "/api/settings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/app-state"] });
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: Settings) => {
    updateSettingsMutation.mutate(data);
  };

  const handleExport = (format: 'json' | 'csv') => {
    window.location.href = `/api/export/${format}`;
    toast({
      title: "Export started",
      description: `Your data is being exported as ${format.toUpperCase()}.`,
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-settings-title">
        <SettingsIcon className="w-6 h-6" />
        Settings
      </h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Currency & Region
              </CardTitle>
              <CardDescription>
                Set your preferred currency for displaying subscription costs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="defaultCurrency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Currency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-currency">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency} value={currency}>
                            {currencySymbols[currency]} {currency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Configure how you want to be reminded about upcoming renewals.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="renewalReminderDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reminder Days Before Renewal</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={30}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 7)}
                        data-testid="input-reminder-days"
                      />
                    </FormControl>
                    <FormDescription>
                      Get notified this many days before a subscription renews.
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emailNotifications"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Email Notifications</FormLabel>
                      <FormDescription>
                        Receive renewal reminders via email.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-email-notifications"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pushoverNotifications"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <FormLabel>Pushover Notifications</FormLabel>
                        <Smartphone className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <FormDescription>
                        Receive push notifications on your mobile device.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-pushover-notifications"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {pushoverNotifications && (
                <FormField
                  control={form.control}
                  name="pushoverUserKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pushover User Key</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Enter your Pushover user key"
                          {...field}
                          value={field.value || ""}
                          data-testid="input-pushover-key"
                        />
                      </FormControl>
                      <FormDescription>
                        Get your user key from the Pushover app or website.
                      </FormDescription>
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Data Export
              </CardTitle>
              <CardDescription>
                Export your subscription data for backup or analysis.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => handleExport('json')}
                data-testid="button-export-json"
              >
                <Download className="w-4 h-4 mr-2" />
                Export as JSON
              </Button>
              <Button 
                type="button"
                variant="outline" 
                onClick={() => handleExport('csv')}
                data-testid="button-export-csv"
              >
                <Download className="w-4 h-4 mr-2" />
                Export as CSV
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              type="submit"
              disabled={updateSettingsMutation.isPending}
              data-testid="button-save-settings"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
