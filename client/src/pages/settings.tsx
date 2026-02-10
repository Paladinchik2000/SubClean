import { useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Settings as SettingsIcon, Download, Globe, Bell, Save, Upload, Check, X, BellRing, WifiOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { requestNotificationPermission, getNotificationStatus } from "@/lib/notifications";

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export default function SettingsPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState(getNotificationStatus());

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

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationStatus(getNotificationStatus());
    if (granted) {
      toast({
        title: "Notifications enabled",
        description: "You'll receive local reminders before subscription renewals.",
      });
    } else {
      toast({
        title: "Notifications blocked",
        description: "Please enable notifications in your browser settings.",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error("CSV file must have at least a header row and one data row");
      }

      const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
      const nameIdx = headers.findIndex(h => h === 'name' || h === 'service' || h === 'subscription');
      const costIdx = headers.findIndex(h => h === 'cost' || h === 'price' || h === 'amount');
      const cycleIdx = headers.findIndex(h => h === 'billing' || h === 'billing cycle' || h === 'cycle' || h === 'frequency');
      const categoryIdx = headers.findIndex(h => h === 'category' || h === 'type');
      const currencyIdx = headers.findIndex(h => h === 'currency');

      if (nameIdx === -1 || costIdx === -1) {
        throw new Error("CSV must have 'Name' and 'Cost' columns");
      }

      const results: ImportResult = { success: 0, failed: 0, errors: [] };
      const billingCycleMap: Record<string, string> = {
        'monthly': 'monthly', 'month': 'monthly', 'm': 'monthly',
        'yearly': 'yearly', 'annual': 'yearly', 'year': 'yearly', 'y': 'yearly',
        'weekly': 'weekly', 'week': 'weekly', 'w': 'weekly',
        'quarterly': 'quarterly', 'quarter': 'quarterly', 'q': 'quarterly',
      };

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const name = values[nameIdx];
        const costStr = values[costIdx]?.replace(/[^0-9.]/g, '');
        const cost = parseFloat(costStr);

        if (!name || isNaN(cost) || cost <= 0) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: Invalid name or cost`);
          continue;
        }

        const cycleRaw = cycleIdx !== -1 ? values[cycleIdx]?.toLowerCase() : 'monthly';
        const billingCycle = billingCycleMap[cycleRaw] || 'monthly';
        const category = categoryIdx !== -1 ? values[categoryIdx]?.toLowerCase() : 'other';
        const currency = currencyIdx !== -1 ? values[currencyIdx]?.toUpperCase() : 'USD';

        try {
          await apiRequest("POST", "/api/subscriptions", {
            name,
            cost: Math.round(cost * 100),
            currency,
            billingCycle,
            category: ['streaming', 'music', 'gaming', 'productivity', 'fitness', 'news', 'cloud', 'food', 'other'].includes(category) ? category : 'other',
            startDate: new Date(),
          });
          results.success++;
        } catch {
          results.failed++;
          results.errors.push(`Row ${i + 1}: Failed to import "${name}"`);
        }
      }

      setImportResult(results);
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      
      toast({
        title: "Import complete",
        description: `${results.success} subscription(s) imported successfully.`,
      });
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to parse CSV file",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
                Configure local browser notifications for upcoming renewals.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">Browser Notifications</p>
                    <Badge variant="outline" className="gap-1 text-xs">
                      <WifiOff className="w-3 h-3" />
                      Local Only
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {notificationStatus === "granted" 
                      ? "Notifications are enabled. You'll receive local reminders."
                      : notificationStatus === "denied"
                      ? "Notifications are blocked. Enable them in your browser settings."
                      : "Enable browser notifications to get renewal reminders."}
                  </p>
                </div>
                {notificationStatus === "granted" ? (
                  <Badge variant="outline" className="shrink-0 gap-1 text-green-600 border-green-200 dark:text-green-400 dark:border-green-800">
                    <BellRing className="w-3 h-3" />
                    Enabled
                  </Badge>
                ) : (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleEnableNotifications}
                    data-testid="button-enable-notifications"
                  >
                    <BellRing className="w-4 h-4 mr-2" />
                    Enable
                  </Button>
                )}
              </div>

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
                      Get notified this many days before a subscription renews. All notifications are processed locally on your device.
                    </FormDescription>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Data Export & Import
              </CardTitle>
              <CardDescription>
                Export your subscription data for backup or import from CSV.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
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
              </div>
              
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Import from CSV</p>
                <p className="text-sm text-muted-foreground mb-3">
                  CSV must have "Name" and "Cost" columns. Optional: "Billing Cycle", "Category", "Currency".
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  data-testid="input-import-csv"
                />
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={handleImportClick}
                  disabled={isImporting}
                  data-testid="button-import-csv"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isImporting ? "Importing..." : "Import from CSV"}
                </Button>

                {importResult && (
                  <Alert className="mt-3" variant={importResult.failed > 0 ? "destructive" : "default"}>
                    <AlertDescription>
                      <div className="flex items-center gap-2">
                        {importResult.failed === 0 ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                        <span>
                          {importResult.success} imported, {importResult.failed} failed
                        </span>
                      </div>
                      {importResult.errors.length > 0 && (
                        <ul className="mt-2 text-xs space-y-1">
                          {importResult.errors.slice(0, 3).map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                          {importResult.errors.length > 3 && (
                            <li>...and {importResult.errors.length - 3} more errors</li>
                          )}
                        </ul>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
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
