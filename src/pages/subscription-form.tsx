
import { useState } from "react";
import { useLocation } from "wouter";
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

const DUMMY_USERS = [
  { id: "1", name: "John Doe" },
  { id: "2", name: "Jane Smith" },
  { id: "3", name: "Alice Johnson" },
  { id: "4", name: "Bob Williams" },
  { id: "5", name: "Charlie Brown" },
];

const DUMMY_PLANS = [
  { id: "1", name: "Basic" },
  { id: "2", name: "Premium Plan" },
  { id: "3", name: "Ultimate Plan" },
  { id: "4", name: "Standard Plan" },
  { id: "5", name: "Starter Plan" },
];

export default function SubscriptionFormPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const today = new Date().toISOString().split("T")[0];

  const [userId, setUserId] = useState("");
  const [planId, setPlanId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(today);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (!paymentDate) {
      toast({ title: "Please enter payment date", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      toast({ title: "Subscription created successfully" });
      setLocation("/subscriptions");
    } catch {
      toast({ title: "Failed to create subscription", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span className="text-gray-500">Dashboard</span>
        <span>/</span>
        <span className="text-white font-medium">New Subscription</span>
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
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User */}
            <div className="space-y-2">
              <Label className="text-zinc-300 font-medium text-sm">
                User <span className="text-red-500">*</span>
              </Label>
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger className="bg-zinc-900 border-zinc-700 text-gray-300 h-11 rounded-lg focus:ring-red-500 focus:border-red-500">
                  <SelectValue placeholder="Select User" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                  {DUMMY_USERS.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Plans */}
            <div className="space-y-2">
              <Label className="text-zinc-300 font-medium text-sm">
                Plans <span className="text-red-500">*</span>
              </Label>
              <Select value={planId} onValueChange={setPlanId}>
                <SelectTrigger className="bg-zinc-900 border-zinc-700 text-gray-300 h-11 rounded-lg focus:ring-red-500 focus:border-red-500">
                  <SelectValue placeholder="Select Plan" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                  {DUMMY_PLANS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label className="text-zinc-300 font-medium text-sm">Amount</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 h-11 rounded-lg focus:border-red-500"
              />
            </div>

            {/* Payment Date */}
            <div className="space-y-2">
              <Label className="text-zinc-300 font-medium text-sm">
                Payment Date <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-white h-11 rounded-lg focus:border-red-500"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end mt-6">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-red-600 hover:bg-red-700 text-white h-11 px-8 rounded-lg font-semibold text-sm"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </form>
    </div>
  );
}
