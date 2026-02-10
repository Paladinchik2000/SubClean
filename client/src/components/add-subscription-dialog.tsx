import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, AlertTriangle, ArrowLeft } from "lucide-react";
import { matchServiceIcon } from "@/lib/service-icons";
import { servicePresets, type ServicePreset } from "@/lib/service-presets";
import { ServiceIcon } from "@/components/service-icon";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { billingCycles, categories, currencies, currencySymbols, type Currency, type SubscriptionWithUsage } from "@shared/schema";
import { getCategoryLabel, getBillingCycleLabel } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  cost: z.string().min(1, "Cost is required").refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    "Cost must be a positive number"
  ),
  currency: z.enum(currencies).default("USD"),
  billingCycle: z.enum(billingCycles),
  category: z.enum(categories),
  startDate: z.string().min(1, "Start date is required"),
  isTrial: z.boolean().default(false),
  trialEndDate: z.string().optional(),
  cancelInstructions: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddSubscriptionDialogProps {
  onAdd: (data: {
    name: string;
    cost: number;
    currency?: Currency;
    billingCycle: string;
    category: string;
    startDate: Date;
    trialEndDate?: Date | null;
    cancelInstructions?: string;
    notes?: string;
  }) => void;
  isPending?: boolean;
  defaultCurrency?: Currency;
  existingSubscriptions?: SubscriptionWithUsage[];
}

type DialogView = "presets" | "form";

export function AddSubscriptionDialog({ onAdd, isPending, defaultCurrency = "USD", existingSubscriptions = [] }: AddSubscriptionDialogProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<DialogView>("presets");
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [presetSearch, setPresetSearch] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      cost: "",
      currency: defaultCurrency,
      billingCycle: "monthly",
      category: "other",
      startDate: new Date().toISOString().split("T")[0],
      isTrial: false,
      trialEndDate: "",
      cancelInstructions: "",
      notes: "",
    },
  });

  const isTrial = form.watch("isTrial");
  const watchedName = form.watch("name");

  const matchedIcon = useMemo(() => {
    if (watchedName.trim().length < 2) return null;
    return matchServiceIcon(watchedName);
  }, [watchedName]);

  const filteredPresets = useMemo(() => {
    if (!presetSearch.trim()) return servicePresets;
    const q = presetSearch.toLowerCase();
    return servicePresets.filter(p => p.name.toLowerCase().includes(q));
  }, [presetSearch]);

  useEffect(() => {
    if (!open) {
      setView("presets");
      setPresetSearch("");
      setDuplicateWarning(null);
    }
  }, [open]);

  useEffect(() => {
    if (watchedName.trim().length >= 3) {
      const normalizedInput = watchedName.toLowerCase().trim();
      const duplicate = existingSubscriptions.find(sub => {
        const normalizedExisting = sub.name.toLowerCase().trim();
        return normalizedExisting === normalizedInput || 
               normalizedExisting.includes(normalizedInput) || 
               normalizedInput.includes(normalizedExisting);
      });
      if (duplicate && duplicate.status !== "cancelled") {
        setDuplicateWarning(`Similar subscription found: "${duplicate.name}"`);
      } else {
        setDuplicateWarning(null);
      }
    } else {
      setDuplicateWarning(null);
    }
  }, [watchedName, existingSubscriptions]);

  const selectPreset = (preset: ServicePreset) => {
    form.reset({
      name: preset.name,
      cost: (preset.cost / 100).toFixed(2),
      currency: preset.currency as Currency,
      billingCycle: preset.billingCycle,
      category: preset.category,
      startDate: new Date().toISOString().split("T")[0],
      isTrial: false,
      trialEndDate: "",
      cancelInstructions: "",
      notes: "",
    });
    setView("form");
  };

  const goToCustomForm = () => {
    form.reset({
      name: "",
      cost: "",
      currency: defaultCurrency,
      billingCycle: "monthly",
      category: "other",
      startDate: new Date().toISOString().split("T")[0],
      isTrial: false,
      trialEndDate: "",
      cancelInstructions: "",
      notes: "",
    });
    setView("form");
  };

  const onSubmit = (values: FormValues) => {
    onAdd({
      name: values.name,
      cost: Math.round(parseFloat(values.cost) * 100),
      currency: values.currency,
      billingCycle: values.billingCycle,
      category: values.category,
      startDate: new Date(values.startDate),
      trialEndDate: values.isTrial && values.trialEndDate ? new Date(values.trialEndDate) : null,
      cancelInstructions: values.cancelInstructions || undefined,
      notes: values.notes || undefined,
    });
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-subscription">
          <Plus className="w-4 h-4 mr-2" />
          Add Subscription
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        {view === "presets" ? (
          <>
            <DialogHeader>
              <DialogTitle>Add Subscription</DialogTitle>
              <DialogDescription>
                Choose a popular service or add a custom subscription.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Search services..."
                value={presetSearch}
                onChange={(e) => setPresetSearch(e.target.value)}
                data-testid="input-preset-search"
              />
              <div className="grid grid-cols-3 gap-2 max-h-[340px] overflow-y-auto pr-1">
                {filteredPresets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    className="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card hover-elevate active-elevate-2 text-center transition-colors"
                    onClick={() => selectPreset(preset)}
                    data-testid={`preset-${preset.name.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <ServiceIcon name={preset.name} category={preset.category} size="sm" />
                    <span className="text-xs font-medium leading-tight line-clamp-2">{preset.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      ${(preset.cost / 100).toFixed(2)}/{preset.billingCycle === "monthly" ? "mo" : preset.billingCycle === "yearly" ? "yr" : preset.billingCycle === "quarterly" ? "qtr" : "wk"}
                    </span>
                  </button>
                ))}
              </div>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={goToCustomForm}
                data-testid="button-custom-subscription"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Custom Subscription
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setView("presets")}
                  data-testid="button-back-to-presets"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <DialogTitle>{watchedName || "Add Subscription"}</DialogTitle>
                  <DialogDescription>
                    Fill in the details for your subscription.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {duplicateWarning && (
                  <Alert variant="destructive" className="py-2" data-testid="alert-duplicate-warning">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="ml-2">
                      {duplicateWarning}
                    </AlertDescription>
                  </Alert>
                )}

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Name</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input 
                            placeholder="Netflix, Spotify, etc." 
                            {...field} 
                            className={matchedIcon ? "pr-10" : ""}
                            data-testid="input-subscription-name"
                          />
                        </FormControl>
                        {matchedIcon && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2" data-testid="icon-preview-matched">
                            <matchedIcon.icon style={{ color: matchedIcon.color, width: 20, height: 20 }} />
                          </div>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cost</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            min="0" 
                            placeholder="9.99" 
                            {...field} 
                            data-testid="input-subscription-cost"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-currency">
                              <SelectValue placeholder="Currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {currencies.map((cur) => (
                              <SelectItem key={cur} value={cur}>
                                {currencySymbols[cur]} {cur}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="billingCycle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Billing</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-billing-cycle">
                              <SelectValue placeholder="Select cycle" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {billingCycles.map((cycle) => (
                              <SelectItem key={cycle} value={cycle}>
                                {getBillingCycleLabel(cycle)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {getCategoryLabel(cat)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          data-testid="input-start-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isTrial"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-trial"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>This is a free trial</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                {isTrial && (
                  <FormField
                    control={form.control}
                    name="trialEndDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trial End Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            data-testid="input-trial-end-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="cancelInstructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cancel Instructions URL (optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://..." 
                          {...field} 
                          data-testid="input-cancel-instructions"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Any notes about this subscription" 
                          {...field} 
                          data-testid="input-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending} data-testid="button-submit">
                    Add Subscription
                  </Button>
                </div>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
