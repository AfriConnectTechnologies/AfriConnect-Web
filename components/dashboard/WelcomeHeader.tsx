"use client";

import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { api } from "@/convex/_generated/api";
import { CheckCircle2, Sparkles } from "lucide-react";

export function WelcomeHeader() {
  const t = useTranslations("dashboard");
  const { user } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);
  const myBusiness = useQuery(api.businesses.getMyBusiness);

  const getInitials = (name: string | undefined | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = currentUser?.name || user?.fullName || user?.firstName || "User";

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="welcome-card-gradient rounded-2xl border p-6 md:p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-5">
          <div className="relative">
            <Avatar className="h-14 w-14 md:h-16 md:w-16 border-[3px] border-primary/20 shadow-lg">
              <AvatarImage src={currentUser?.imageUrl || user?.imageUrl} alt={displayName} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg md:text-xl font-bold">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            {myBusiness?.verificationStatus === "verified" && (
              <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 border-2 border-background">
                <CheckCircle2 className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">{getTimeGreeting()}</p>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{displayName}</h1>
            <div className="flex items-center gap-2 mt-1.5">
              {currentUser?.role && (
                <Badge variant="secondary" className="text-xs font-medium px-2.5 py-0.5 rounded-lg">
                  {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
                </Badge>
              )}
              {myBusiness && (
                <Badge variant="outline" className="text-xs text-muted-foreground border-dashed">
                  {myBusiness.name}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center">
          <Sparkles className="h-16 w-16 text-primary/10" />
        </div>
      </div>
    </div>
  );
}
