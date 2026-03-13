"use client";

import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { api } from "@/convex/_generated/api";
import { CheckCircle2 } from "lucide-react";

export function ProfileHeader() {
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
  const email = currentUser?.email || user?.primaryEmailAddress?.emailAddress || "";

  const getRoleBadgeStyle = (role: string | undefined) => {
    switch (role) {
      case "seller":
        return "bg-primary/10 text-primary border-primary/20";
      case "admin":
        return "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400";
      default:
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400";
    }
  };

  return (
    <div className="welcome-card-gradient rounded-2xl border border-border/60 p-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="h-20 w-20 border-[3px] border-primary/20 shadow-lg">
            <AvatarImage src={currentUser?.imageUrl || user?.imageUrl} alt={displayName} />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          {myBusiness?.verificationStatus === "verified" && (
            <div className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 border-2 border-background">
              <CheckCircle2 className="h-3.5 w-3.5 text-white" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{displayName}</h2>
          <p className="text-sm text-muted-foreground">{email}</p>
          <div className="flex items-center gap-2 mt-2">
            {currentUser?.role && (
              <Badge 
                variant="outline" 
                className={`text-xs rounded-lg ${getRoleBadgeStyle(currentUser.role)}`}
              >
                {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
