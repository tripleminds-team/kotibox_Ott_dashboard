
import { useState } from "react";
import { useLocation } from "wouter";
import { Edit2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

type NotifTemplate = {
  id: string;
  name: string;
  status: boolean;
};

const DUMMY_TEMPLATES: NotifTemplate[] = [
  { id: "1", name: "Change Password", status: true },
  { id: "2", name: "Continue Watch", status: true },
  { id: "3", name: "Episode Add", status: true },
  { id: "4", name: "Expiry Plan", status: true },
  { id: "5", name: "Forget Email/Password", status: true },
  { id: "6", name: "Movie Add", status: true },
  { id: "7", name: "New Subscription", status: true },
  { id: "8", name: "Registration", status: true },
  { id: "9", name: "TV Show Add", status: false },
  { id: "10", name: "Video Add", status: true },
  { id: "11", name: "Welcome", status: true },
];

export default function NotificationTemplatesPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<NotifTemplate[]>(DUMMY_TEMPLATES);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = templates.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleStatus = (id: string) => {
    setTemplates((prev) =>
      prev.map((t) => t.id === id ? { ...t, status: !t.status } : t)
    );
    const tpl = templates.find((t) => t.id === id);
    if (tpl) toast({ title: `"${tpl.name}" ${tpl.status ? "deactivated" : "activated"}` });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span className="text-gray-500">Dashboard</span>
        <span>/</span>
        <span className="text-white font-medium">Notification Templates</span>
      </div>

      <div className="flex items-center justify-end gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-56 bg-zinc-900 border-zinc-700 text-white placeholder:text-gray-500 focus:border-red-500 h-10 rounded-lg"
          />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 bg-zinc-900 hover:bg-zinc-900">
              <TableHead className="text-zinc-400 font-semibold text-sm">Template Name</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-sm">Status</TableHead>
              <TableHead className="text-zinc-400 font-semibold text-sm">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-zinc-500 py-10">
                  No templates found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((template) => (
                <TableRow key={template.id} className="border-zinc-800 hover:bg-zinc-800/40">
                  <TableCell>
                    <span className="text-red-400 font-medium text-sm">{template.name}</span>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={template.status}
                      onCheckedChange={() => toggleStatus(template.id)}
                      className="data-[state=checked]:bg-red-600"
                    />
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => setLocation(`/notification-templates/${template.id}/edit`)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg bg-amber-600/15 text-amber-400 hover:bg-amber-600/30 transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
