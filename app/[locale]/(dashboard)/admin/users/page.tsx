"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRequireAdmin } from "@/lib/hooks/useRole";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Search, Loader2, Users, Shield, Building2, LogIn } from "lucide-react";
import { useClerk } from "@clerk/nextjs";

type UserRole = "buyer" | "seller" | "admin";

const roleColors: Record<UserRole, "default" | "secondary" | "outline"> = {
  buyer: "secondary",
  seller: "default",
  admin: "outline",
};

const roleIcons: Record<UserRole, React.ReactNode> = {
  buyer: null,
  seller: <Building2 className="h-3 w-3" />,
  admin: <Shield className="h-3 w-3" />,
};

export default function AdminUsersPage() {
  const { isLoading: authLoading, isAuthorized } = useRequireAdmin();
  const { signOut } = useClerk();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [updatingUserId, setUpdatingUserId] = useState<Id<"users"> | null>(null);
  const [impersonatingUserId, setImpersonatingUserId] = useState<Id<"users"> | null>(null);
  const [isSeedingAgreements, setIsSeedingAgreements] = useState(false);

  const users = useQuery(
    api.users.listUsers,
    isAuthorized
      ? {
          role: roleFilter !== "all" ? roleFilter : undefined,
          search: searchQuery || undefined,
        }
      : "skip"
  );

  const setUserRole = useMutation(api.users.setUserRole);
  const seedDefaultAgreementVersions = useMutation(
    api.agreements.seedDefaultAgreementVersions
  );
  const activeBuyerAgreement = useQuery(
    api.agreements.getActiveAgreement,
    isAuthorized ? { type: "buyer" } : "skip"
  );
  const activeSellerAgreement = useQuery(
    api.agreements.getActiveAgreement,
    isAuthorized ? { type: "seller" } : "skip"
  );

  const handleRoleChange = async (userId: Id<"users">, newRole: UserRole) => {
    setUpdatingUserId(userId);
    try {
      await setUserRole({ userId, role: newRole });
      toast.success("User role updated successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update user role";
      toast.error(errorMessage);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleImpersonate = async (userId: Id<"users">, label: string) => {
    const confirmed = window.confirm(
      `Impersonate ${label}? This will switch your session to their account.`
    );
    if (!confirmed) return;

    setImpersonatingUserId(userId);
    try {
      const response = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to impersonate user");
      }

      if (!data?.url) {
        throw new Error("Missing impersonation URL");
      }

      await signOut({ redirectUrl: data.url });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to impersonate user";
      toast.error(message);
    } finally {
      setImpersonatingUserId(null);
    }
  };

  const handleSeedAgreements = async () => {
    if (isSeedingAgreements) return;
    setIsSeedingAgreements(true);
    try {
      const seededIds = await seedDefaultAgreementVersions({});
      if (seededIds.length === 0) {
        toast.success("Agreement versions already exist and are active.");
      } else {
        toast.success(
          `Seeded ${seededIds.length} agreement version${seededIds.length > 1 ? "s" : ""}.`
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to seed agreement versions";
      toast.error(message);
    } finally {
      setIsSeedingAgreements(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground">Loading admin panel...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Manage Users</h1>
        <p className="text-muted-foreground">
          View and manage user accounts and roles
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agreement Setup (Temporary)</CardTitle>
          <CardDescription>
            Seed missing buyer/seller agreement versions for this environment.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1 text-sm">
            <p>
              Buyer active:{" "}
              <span className="font-medium">
                {activeBuyerAgreement === undefined
                  ? "Loading..."
                  : activeBuyerAgreement
                    ? `Yes (v${activeBuyerAgreement.version})`
                    : "No"}
              </span>
            </p>
            <p>
              Seller active:{" "}
              <span className="font-medium">
                {activeSellerAgreement === undefined
                  ? "Loading..."
                  : activeSellerAgreement
                    ? `Yes (v${activeSellerAgreement.version})`
                    : "No"}
              </span>
            </p>
          </div>
          <Button onClick={handleSeedAgreements} disabled={isSeedingAgreements}>
            {isSeedingAgreements ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Seeding...
              </>
            ) : (
              "Seed Default Agreement Versions"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-blue-100 dark:border-blue-900/50">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Users</p>
                <p className="text-2xl md:text-3xl font-bold">
                  {users?.length ?? <Loader2 className="h-6 w-6 animate-spin" />}
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/30 p-2.5 rounded-xl">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-100 dark:border-emerald-900/50">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sellers</p>
                <p className="text-2xl md:text-3xl font-bold">
                  {users?.filter((u) => u.role === "seller").length ?? 0}
                </p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-xl">
                <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-violet-100 dark:border-violet-900/50">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Admins</p>
                <p className="text-2xl md:text-3xl font-bold">
                  {users?.filter((u) => u.role === "admin").length ?? 0}
                </p>
              </div>
              <div className="bg-violet-50 dark:bg-violet-950/30 p-2.5 rounded-xl">
                <Shield className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="border-border/60 rounded-2xl overflow-hidden">
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>Search and filter users to manage their roles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 rounded-xl bg-muted/30 border-border/60"
              />
            </div>
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as UserRole | "all")}>
              <SelectTrigger className="w-full sm:w-[180px] h-10 rounded-xl">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="buyer">Buyers</SelectItem>
                <SelectItem value="seller">Sellers</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {users === undefined ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
              <span className="text-sm text-muted-foreground">Loading users...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              {searchQuery || roleFilter !== "all"
                ? "No users match your search criteria."
                : "No users found."}
            </div>
          ) : (
            <div className="rounded-xl border border-border/60 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Business</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={user.imageUrl}
                              alt={user.name || "User"}
                            />
                            <AvatarFallback>
                              {user.name?.charAt(0) ||
                                user.email.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            {user.name || "No name"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={roleColors[user.role || "buyer"]}
                          className="flex w-fit items-center gap-1"
                        >
                          {roleIcons[user.role || "buyer"]}
                          {(user.role || "buyer").charAt(0).toUpperCase() +
                            (user.role || "buyer").slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.business ? (
                          <span className="text-sm">{user.business.name}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Select
                            value={user.role || "buyer"}
                            onValueChange={(v) =>
                              handleRoleChange(user._id, v as UserRole)
                            }
                            disabled={updatingUserId === user._id}
                          >
                            <SelectTrigger className="w-[120px]">
                              {updatingUserId === user._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <SelectValue />
                              )}
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="buyer">Buyer</SelectItem>
                              <SelectItem value="seller">Seller</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleImpersonate(
                                user._id,
                                user.name || user.email || "this user"
                              )
                            }
                            disabled={impersonatingUserId === user._id}
                          >
                            {impersonatingUserId === user._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <LogIn className="h-4 w-4 mr-2" />
                                Impersonate
                              </>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
