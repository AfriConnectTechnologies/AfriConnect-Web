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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect via hook
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manage Users</h1>
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users?.length ?? <Loader2 className="h-6 w-6 animate-spin" />}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sellers</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users?.filter((u) => u.role === "seller").length ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users?.filter((u) => u.role === "admin").length ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Search and filter users to manage their roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={roleFilter}
              onValueChange={(v) => setRoleFilter(v as UserRole | "all")}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
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
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {searchQuery || roleFilter !== "all"
                ? "No users match your search criteria."
                : "No users found."}
            </div>
          ) : (
            <div className="rounded-md border">
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
