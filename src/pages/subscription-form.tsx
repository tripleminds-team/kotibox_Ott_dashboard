
import { useMemo, useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateSubscription,
  useUpdateSubscription,
  useGetSubscriptionById,
  useGetSubscriptionPlans,
  useGetUsersList,
} from "@/lib/api-client";

export default function SubscriptionFormPage() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id?: string }>();
  const isEdit = !!params.id;
  const { toast } = useToast();
  const { data: usersData } = useGetUsersList({});
  const { data: plansData } = useGetSubscriptionPlans();
  const { data: subscriptionData } = useGetSubscriptionById(params.id || "");
  const createSubscription = useCreateSubscription();
  const updateSubscription = useUpdateSubscription();

  const users = usersData?.data || [];
  const plans = plansData?.data || [];
  const subscription = subscriptionData?.data;

  const [userId, setUserId] = useState("");
  const [planId, setPlanId] = useState("");
  const [duration, setDuration] = useState("Month");
  const [durationValue, setDurationValue] = useState("1");
  const [paymentMethod, setPaymentMethod] = useState("-");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("0");
  const [couponDiscount, setCouponDiscount] = useState("0");
  const [tax, setTax] = useState("0");
  const [totalAmount, setTotalAmount] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedPlan = useMemo(
    () => plans.find((plan: any) => String(plan.id || plan._id) === planId),
    [plans, planId]
  );

  // Calculate end date based on start date and duration
  const calculateEndDate = (start: string, dur: string, val: number): string => {
    const date = new Date(start);
    const value = Math.max(1, val);
    const normalized = dur.toLowerCase();
    if (normalized.includes("day")) {
      date.setDate(date.getDate() + value);
    } else if (normalized.includes("week")) {
      date.setDate(date.getDate() + value * 7);
    } else if (normalized.includes("year")) {
      date.setFullYear(date.getFullYear() + value);
    } else {
      date.setMonth(date.getMonth() + value);
    }
    return date.toISOString().split("T")[0];
  };

  // Calculate total amount
  const calculateTotal = (p: string, d: string, cd: string, t: string): string => {
    const priceNum = parseFloat(p) || 0;
    const discountNum = parseFloat(d) || 0;
    const couponDiscountNum = parseFloat(cd) || 0;
    const taxNum = parseFloat(t) || 0;
    const total = priceNum - discountNum - couponDiscountNum + taxNum;
    return total.toFixed(2);
  };

  // Update when plan changes
  const handlePlanChange = (value: string) => {
    setPlanId(value);
    const plan = plans.find((item: any) => String(item.id || item._id) === value);
    if (plan) {
      if (!price) setPrice(String(plan.totalPrice ?? plan.price ?? 0));
      if (plan.duration) setDuration(plan.duration);
      if (plan.durationValue) setDurationValue(String(plan.durationValue));
    }
  };

  // Update end date when start date or duration changes
  useEffect(() => {
    if (!endDate) {
      setEndDate(calculateEndDate(startDate, duration, parseInt(durationValue) || 1));
    }
  }, [startDate, duration, durationValue]);

  // Update total amount when price/discount/coupon/tax changes
  useEffect(() => {
    if (!totalAmount) {
      setTotalAmount(calculateTotal(price, discount, couponDiscount, tax));
    }
  }, [price, discount, couponDiscount, tax]);

  // Populate form if editing
  useEffect(() => {
    if (isEdit && subscription) {
      setUserId(subscription.userId);
      setPlanId(subscription.planId);
      setDuration(subscription.duration || "Month");
      setDurationValue(String(subscription.durationValue || 1));
      setPaymentMethod(subscription.paymentMethod || "-");
      setStartDate(subscription.startDate);
      setEndDate(subscription.endDate);
      setPrice(String(subscription.price));
      setDiscount(String(subscription.discount));
      setCouponDiscount(String(subscription.couponDiscount));
      setTax(String(subscription.tax));
      setTotalAmount(String(subscription.totalAmount));
      setStatus(subscription.status);
    }
  }, [isEdit, subscription]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      toast({ title: "Please select a user", variant: "destructive" });
      return;
    }
    if (!planId) {
      toast({ title: "Please select a plan", variant: "destructive" });
      return;
    }
    if (!startDate) {
      toast({ title: "Please enter start date", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const data = {
        userId,
        planId,
        duration,
        durationValue: parseInt(durationValue) || 1,
        paymentMethod,
        startDate,
        endDate: endDate || calculateEndDate(startDate, duration, parseInt(durationValue) || 1),
        price: parseFloat(price) || 0,
        discount: parseFloat(discount) || 0,
        couponDiscount: parseFloat(couponDiscount) || 0,
        tax: parseFloat(tax) || 0,
        totalAmount: parseFloat(totalAmount) || parseFloat(calculateTotal(price, discount, couponDiscount, tax)),
        status,
      };

      if (isEdit) {
        await updateSubscription.mutateAsync({ id: params.id!, data });
        toast({ title: "Subscription updated successfully" });
      } else {
        await createSubscription.mutateAsync(data);
        toast({ title: "Subscription created successfully" });
      }
      setLocation("/subscriptions");
    } catch {
      toast({ title: `Failed to ${isEdit ? "update" : "create"} subscription`, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="text-gray-500">Dashboard</span>
        <span>/</span>
        <span
          onClick={() => setLocation("/subscriptions")}
          className="cursor-pointer hover:text-foreground"
        >
          Subscriptions
        </span>
        <span>/</span>
        <span className="text-foreground font-medium">
          {isEdit ? "Edit Subscription" : "New Subscription"}
        </span>
      </div>

      {/* Back Button */}
      <button
        onClick={() => setLocation("/subscriptions")}
        className="flex items-center gap-1 text-red-400 hover:text-red-300 font-semibold text-sm transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        <ChevronLeft className="h-4 w-4 -ml-2.5" />
        Back
      </button>

      {/* Form Card */}
      <form onSubmit={handleSubmit}>
        <div className="rounded-xl border border-border bg-card/50 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* User */}
            <div className="space-y-2">
              <Label className="text-zinc-300 font-medium text-sm">
                User <span className="text-red-500">*</span>
              </Label>
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger className="bg-card border-border text-foreground h-11 rounded-lg focus:ring-red-500 focus:border-red-500">
                  <SelectValue placeholder="Select User" />
                </SelectTrigger>
                <SelectContent className="bg-muted border-border text-foreground max-h-60">
                  {users.map((u: any) => (
                    <SelectItem key={u.id || u._id} value={String(u.id || u._id)}>
                      {u.name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Plans */}
            <div className="space-y-2">
              <Label className="text-zinc-300 font-medium text-sm">
                Plan <span className="text-red-500">*</span>
              </Label>
              <Select value={planId} onValueChange={handlePlanChange}>
                <SelectTrigger className="bg-card border-border text-foreground h-11 rounded-lg focus:ring-red-500 focus:border-red-500">
                  <SelectValue placeholder="Select Plan" />
                </SelectTrigger>
                <SelectContent className="bg-muted border-border text-foreground max-h-60">
                  {plans.map((p: any) => (
                    <SelectItem key={p.id || p._id} value={String(p.id || p._id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="text-zinc-300 font-medium text-sm">Status</Label>
              <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                <SelectTrigger className="bg-card border-border text-foreground h-11 rounded-lg focus:ring-red-500 focus:border-red-500">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent className="bg-muted border-border text-foreground">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Duration Type */}
            <div className="space-y-2">
              <Label className="text-zinc-300 font-medium text-sm">Duration Type</Label>
              <Select value={duration} onValueChange={(val) => {
                setDuration(val);
                setEndDate(""); // Reset end date when duration type changes
              }}>
                <SelectTrigger className="bg-card border-border text-foreground h-11 rounded-lg focus:ring-red-500 focus:border-red-500">
                  <SelectValue placeholder="Select Duration Type" />
                </SelectTrigger>
                <SelectContent className="bg-muted border-border text-foreground">
                  <SelectItem value="Day">Day</SelectItem>
                  <SelectItem value="Week">Week</SelectItem>
                  <SelectItem value="Month">Month</SelectItem>
                  <SelectItem value="Year">Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Duration Value */}
            <div className="space-y-2">
              <Label className="text-zinc-300 font-medium text-sm">Duration Value</Label>
              <Input
                type="number"
                min="1"
                value={durationValue}
                onChange={(e) => {
                  setDurationValue(e.target.value);
                  setEndDate(""); // Reset end date when duration value changes
                }}
                className="bg-card border-border text-foreground placeholder:text-zinc-500 h-11 rounded-lg focus:border-red-500"
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label className="text-zinc-300 font-medium text-sm">Payment Method</Label>
              <Input
                type="text"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                placeholder="e.g., Credit Card, PayPal"
                className="bg-card border-border text-foreground placeholder:text-zinc-500 h-11 rounded-lg focus:border-red-500"
              />
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label className="text-zinc-300 font-medium text-sm">
                Start Date <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setEndDate(""); // Reset end date when start date changes
                }}
                className="bg-card border-border text-foreground h-11 rounded-lg focus:border-red-500"
              />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label className="text-zinc-300 font-medium text-sm">End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-card border-border text-foreground h-11 rounded-lg focus:border-red-500"
              />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label className="text-zinc-300 font-medium text-sm">Price</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  setTotalAmount(""); // Reset total when price changes
                }}
                placeholder="Enter Price"
                className="bg-card border-border text-foreground placeholder:text-zinc-500 h-11 rounded-lg focus:border-red-500"
              />
            </div>

            {/* Discount */}
            <div className="space-y-2">
              <Label className="text-zinc-300 font-medium text-sm">Discount</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={discount}
                onChange={(e) => {
                  setDiscount(e.target.value);
                  setTotalAmount(""); // Reset total when discount changes
                }}
                placeholder="Enter Discount"
                className="bg-card border-border text-foreground placeholder:text-zinc-500 h-11 rounded-lg focus:border-red-500"
              />
            </div>

            {/* Coupon Discount */}
            <div className="space-y-2">
              <Label className="text-zinc-300 font-medium text-sm">Coupon Discount</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={couponDiscount}
                onChange={(e) => {
                  setCouponDiscount(e.target.value);
                  setTotalAmount(""); // Reset total when coupon discount changes
                }}
                placeholder="Enter Coupon Discount"
                className="bg-card border-border text-foreground placeholder:text-zinc-500 h-11 rounded-lg focus:border-red-500"
              />
            </div>

            {/* Tax */}
            <div className="space-y-2">
              <Label className="text-zinc-300 font-medium text-sm">Tax</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={tax}
                onChange={(e) => {
                  setTax(e.target.value);
                  setTotalAmount(""); // Reset total when tax changes
                }}
                placeholder="Enter Tax"
                className="bg-card border-border text-foreground placeholder:text-zinc-500 h-11 rounded-lg focus:border-red-500"
              />
            </div>

            {/* Total Amount */}
            <div className="space-y-2">
              <Label className="text-zinc-300 font-medium text-sm">Total Amount</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="Enter Total Amount"
                className="bg-card border-border text-foreground placeholder:text-zinc-500 h-11 rounded-lg focus:border-red-500 font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end mt-6">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-red-600 hover:bg-red-700 text-foreground h-11 px-8 rounded-lg font-semibold text-sm"
          >
            {isSubmitting ? "Saving..." : isEdit ? "Update Subscription" : "Create Subscription"}
          </Button>
        </div>
      </form>
    </div>
  );
}
