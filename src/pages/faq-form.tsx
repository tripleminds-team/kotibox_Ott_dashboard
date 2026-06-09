
import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const DUMMY_FAQS: Record<string, { question: string; answer: string; status: boolean }> = {
  "1": { question: "What is this platform?", answer: "This is a cutting-edge streaming platform that allows users to watch movies, TV shows, and live content seamlessly.", status: true },
  "2": { question: "How can I create an account?", answer: "To create an account, simply click on the Sign Up button on the homepage, enter your details, and follow the on-screen instructions.", status: true },
};

const labelCls = "text-gray-300 text-sm font-medium";

export default function FaqFormPage() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id?: string }>();
  const { toast } = useToast();

  const isEdit = !!params.id && params.id !== "new";
  const existing = isEdit ? DUMMY_FAQS[params.id!] : null;

  const [question, setQuestion] = useState(existing?.question ?? "");
  const [answer, setAnswer] = useState(existing?.answer ?? "");
  const [status, setStatus] = useState(existing?.status ?? true);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    if (!question.trim()) {
      toast({ title: "Question is required", variant: "destructive" });
      return;
    }
    if (!answer.trim()) {
      toast({ title: "Answer is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast({ title: isEdit ? "FAQ updated successfully!" : "FAQ created successfully!" });
      setLocation("/faq");
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span className="text-gray-500">Dashboard</span>
        <span>/</span>
        <span className="text-white font-medium">{isEdit ? "Edit FAQ" : "Add FAQ"}</span>
      </div>

      {/* Back */}
      <button
        onClick={() => setLocation("/faq")}
        className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 font-medium transition-colors"
      >
        <span className="text-base leading-none">«</span>
        Back
      </button>

      {/* Form Card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-6">
        {/* Question + Answer in 2 cols */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Question */}
          <div className="space-y-2">
            <Label className={labelCls}>
              Question <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Enter question"
              rows={8}
              className="bg-zinc-900 border-zinc-700 text-white placeholder:text-gray-600 focus:border-red-500 rounded-lg resize-none"
            />
          </div>

          {/* Answer */}
          <div className="space-y-2">
            <Label className={labelCls}>
              Answer <span className="text-red-500">*</span>
            </Label>
            {/* Toolbar mock */}
            <div className="rounded-t-lg border border-zinc-700 bg-zinc-900 px-3 py-2 flex flex-wrap items-center gap-1">
              {["File", "Edit", "View", "Insert", "Format"].map((item) => (
                <button
                  key={item}
                  type="button"
                  className="text-xs text-zinc-400 hover:text-white px-2 py-1 rounded hover:bg-zinc-700 transition-colors"
                >
                  {item} ▾
                </button>
              ))}
              <div className="w-px h-4 bg-zinc-700 mx-1" />
              {["B", "I", "S"].map((f) => (
                <button
                  key={f}
                  type="button"
                  className="text-xs text-zinc-400 hover:text-white h-6 w-6 flex items-center justify-center rounded hover:bg-zinc-700 font-semibold transition-colors"
                >
                  {f}
                </button>
              ))}
            </div>
            <Textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Enter answer..."
              rows={8}
              className="rounded-t-none border-t-0 bg-zinc-900 border-zinc-700 text-white placeholder:text-gray-600 focus:border-red-500 rounded-lg resize-none"
            />
          </div>
        </div>

        {/* Status */}
        <div className="max-w-sm">
          <Label className={labelCls + " block mb-2"}>Status</Label>
          <div className="flex items-center justify-between h-12 px-4 rounded-lg border border-zinc-700 bg-zinc-900">
            <span className="text-sm text-gray-300 font-medium">Active</span>
            <Switch
              checked={status}
              onCheckedChange={setStatus}
              className="data-[state=checked]:bg-red-600"
            />
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-red-600 hover:bg-red-700 text-white h-11 px-10 rounded-lg font-semibold min-w-[100px]"
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
