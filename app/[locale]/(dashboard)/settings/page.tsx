"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { api } from "@/convex/_generated/api";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import {
  User,
  Lock,
  Building2,
  Package,
  Moon,
  Bell,
  HelpCircle,
  FileText,
  Shield,
  LogOut,
  Loader2,
  Sun,
  Monitor,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  ProfileHeader,
  BusinessCard,
  MenuSection,
  MenuItem,
} from "@/components/settings";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const tToast = useTranslations("toast");
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const { signOut } = useClerk();
  const { user } = useUser();

  const ensureUser = useMutation(api.users.ensureUser);
  const currentUser = useQuery(api.users.getCurrentUser);
  const myBusiness = useQuery(api.businesses.getMyBusiness);
  const updateProfile = useMutation(api.users.updateProfile);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    ensureUser().catch(() => {});
  }, [ensureUser]);

  useEffect(() => {
    if (currentUser?.name) {
      setName(currentUser.name);
    } else if (user?.fullName) {
      setName(user.fullName);
    }
  }, [currentUser, user]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({ name: name || undefined });
      toast.success(tToast("productUpdated").replace("Product", "Profile"));
      setShowEditProfile(false);
    } catch {
      toast.error(tToast("error"));
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case "light": return "Light";
      case "dark": return "Dark";
      default: return "System";
    }
  };

  if (currentUser === undefined) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>
      </div>
    );
  }

  const isSeller = currentUser?.role === "seller" || currentUser?.role === "admin";
  const hasBusiness = myBusiness !== undefined && myBusiness !== null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <ProfileHeader />

      {hasBusiness && <BusinessCard />}

      <MenuSection title="Account Settings">
        <MenuItem
          icon={User}
          label="Edit Profile"
          description="Update your display name and profile information"
          onClick={() => setShowEditProfile(true)}
        />
        <MenuItem
          icon={Lock}
          label="Change Password"
          description="Manage your account security"
          onClick={() => toast.info("Password management is handled by Clerk")}
        />
      </MenuSection>

      <MenuSection title="Business">
        {hasBusiness ? (
          <MenuItem
            icon={Building2}
            label="My Business"
            description="View and manage your business profile"
            onClick={() => router.push("/business/profile")}
          />
        ) : (
          <MenuItem
            icon={Building2}
            label="Register Business"
            description="Create a business profile to start selling"
            onClick={() => router.push("/business/register")}
          />
        )}
        {isSeller && (
          <MenuItem
            icon={Package}
            label="My Products"
            description="Manage your product listings"
            onClick={() => router.push("/products")}
          />
        )}
      </MenuSection>

      <MenuSection title="Preferences">
        <MenuItem
          icon={Moon}
          label="Theme"
          value={getThemeLabel()}
          onClick={() => setShowThemeSelector(true)}
        />
        <MenuItem
          icon={Bell}
          label="Push Notifications"
          isSwitch
          switchValue={notificationsEnabled}
          onSwitchChange={setNotificationsEnabled}
        />
      </MenuSection>

      <MenuSection title="Support">
        <MenuItem
          icon={HelpCircle}
          label="Help Center"
          description="Get help and contact support"
          onClick={() => toast.info("Contact us at support@africonnect.com")}
        />
        <MenuItem
          icon={FileText}
          label="Terms of Service"
          onClick={() => router.push("/terms")}
        />
        <MenuItem
          icon={Shield}
          label="Privacy Policy"
          onClick={() => router.push("/privacy")}
        />
      </MenuSection>

      <div className="pt-2">
        <MenuItem
          icon={LogOut}
          label="Sign Out"
          variant="destructive"
          onClick={handleSignOut}
        />
      </div>

      <p className="text-center text-xs text-muted-foreground/60 py-4">
        AfriConnect v1.0.0
      </p>

      {/* Edit Profile Dialog */}
      <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your profile information below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">{t("displayName")}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("enterName")}
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground">{t("displayNameHelp")}</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEditProfile(false)} className="rounded-xl">{tCommon("cancel")}</Button>
            <Button onClick={handleSaveProfile} disabled={saving} className="rounded-xl">
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : tCommon("save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Theme Selector Dialog */}
      <Dialog open={showThemeSelector} onOpenChange={setShowThemeSelector}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Choose Theme</DialogTitle>
            <DialogDescription>Select your preferred theme for the application.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            {[
              { value: "light", label: "Light", icon: Sun },
              { value: "dark", label: "Dark", icon: Moon },
              { value: "system", label: "System", icon: Monitor },
            ].map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                variant={theme === value ? "default" : "outline"}
                className="justify-start gap-3 h-12 rounded-xl"
                onClick={() => {
                  setTheme(value);
                  setShowThemeSelector(false);
                }}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
