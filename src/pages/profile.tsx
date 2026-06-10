
import { useState, useRef } from "react";
import { User, KeyRound, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";

type Tab = "personal" | "password";

export default function ProfilePage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("personal");

  const [form, setForm] = useState({
    firstName: "Ivan",
    lastName: "Norris",
    email: "demo@streamit.com",
    contactNumber: "+12124567899",
    gender: "male",
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    toast({ title: "Profile updated successfully" });
  };

  const handleChangePassword = () => {
    if (!passwords.oldPassword || !passwords.newPassword || !passwords.confirmPassword) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({ title: "New passwords don't match", variant: "destructive" });
      return;
    }
    toast({ title: "Password changed successfully" });
    setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="text-gray-500">Dashboard</span>
        <span>/</span>
        <span className="text-foreground font-medium">Profile</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left tab list */}
        <div className="w-full lg:w-64 shrink-0 space-y-2">
          <button
            onClick={() => setActiveTab("personal")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "personal"
                ? "bg-red-600 text-foreground"
                : "bg-card border border-border text-zinc-300 hover:bg-muted"
            }`}
          >
            <User className="h-4 w-4 shrink-0" />
            Personal Information
          </button>
          <button
            onClick={() => setActiveTab("password")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "password"
                ? "bg-red-600 text-foreground"
                : "bg-card border border-border text-zinc-300 hover:bg-muted"
            }`}
          >
            <KeyRound className="h-4 w-4 shrink-0" />
            Change Password
          </button>
        </div>

        {/* Right content panel */}
        <div className="flex-1 bg-card border border-border rounded-xl p-6 w-full">
          {activeTab === "personal" ? (
            <>
              <h2 className="text-foreground font-semibold text-lg mb-6 flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </h2>

              <div className="flex flex-col lg:flex-row gap-6">
                {/* Form fields */}
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-zinc-400 text-sm">
                        First Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={form.firstName}
                        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                        className="bg-muted border-border text-foreground focus:border-red-500 h-11"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-zinc-400 text-sm">
                        Last Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={form.lastName}
                        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                        className="bg-muted border-border text-foreground focus:border-red-500 h-11"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-zinc-400 text-sm">
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="bg-muted border-border text-foreground focus:border-red-500 h-11"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-zinc-400 text-sm">
                        Contact Number <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={form.contactNumber}
                        onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                        className="bg-muted border-border text-foreground focus:border-red-500 h-11"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400 text-sm">Gender</Label>
                    <RadioGroup
                      value={form.gender}
                      onValueChange={(v) => setForm({ ...form, gender: v })}
                      className="flex flex-wrap gap-3"
                    >
                      {["male", "female", "other"].map((g) => (
                        <div
                          key={g}
                          className="flex items-center gap-2.5 bg-muted border border-border rounded-lg px-4 py-2.5 cursor-pointer hover:border-border transition-colors"
                        >
                          <RadioGroupItem
                            value={g}
                            id={`gender-${g}`}
                            className="border-zinc-500 data-[state=checked]:border-red-500 data-[state=checked]:bg-red-500"
                          />
                          <Label
                            htmlFor={`gender-${g}`}
                            className="text-zinc-300 text-sm cursor-pointer"
                          >
                            {g.charAt(0).toUpperCase() + g.slice(1)}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </div>

                {/* Photo upload */}
                <div className="shrink-0 flex flex-col items-center gap-2">
                  <div
                    onClick={() => !photoPreview && fileInputRef.current?.click()}
                    className="w-40 h-40 border-2 border-dashed border-border rounded-xl flex items-center justify-center relative cursor-pointer hover:border-zinc-500 transition-colors overflow-hidden bg-muted"
                  >
                    {photoPreview ? (
                      <>
                        <img
                          src={photoPreview}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPhotoPreview(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="absolute top-1.5 right-1.5 h-5 w-5 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
                        >
                          <X className="h-3 w-3 text-foreground" />
                        </button>
                      </>
                    ) : (
                      <div className="text-center px-3">
                        <User className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <span className="text-zinc-500 text-xs">Click to upload photo</span>
                      </div>
                    )}
                  </div>
                  {photoPreview && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-zinc-400 hover:text-foreground transition-colors"
                    >
                      Change photo
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </div>
              </div>

              <div className="flex justify-end mt-6 pt-4 border-t border-border">
                <Button
                  onClick={handleSave}
                  className="bg-red-600 hover:bg-red-700 text-foreground px-8 h-11 font-semibold"
                >
                  Save
                </Button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-foreground font-semibold text-lg mb-6 flex items-center gap-2">
                <KeyRound className="h-5 w-5" />
                Change Password
              </h2>

              <div className="space-y-4 max-w-2xl">
                <div className="space-y-1.5">
                  <Label className="text-zinc-400 text-sm">Old Password</Label>
                  <Input
                    type="password"
                    placeholder="Enter Old Password"
                    value={passwords.oldPassword}
                    onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-red-500 h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-zinc-400 text-sm">New Password</Label>
                  <Input
                    type="password"
                    placeholder="Enter New Password"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-red-500 h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-zinc-400 text-sm">Confirm New Password</Label>
                  <Input
                    type="password"
                    placeholder="Enter confirm password"
                    value={passwords.confirmPassword}
                    onChange={(e) =>
                      setPasswords({ ...passwords, confirmPassword: e.target.value })
                    }
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-red-500 h-11"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-6 pt-4 border-t border-border">
                <Button
                  onClick={handleChangePassword}
                  className="bg-red-600 hover:bg-red-700 text-foreground px-8 h-11 font-semibold"
                >
                  Submit
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
