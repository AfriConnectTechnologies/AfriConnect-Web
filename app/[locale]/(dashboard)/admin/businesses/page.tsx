"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRequireAdmin } from "@/lib/hooks/useRole";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Search,
  Loader2,
  Building,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  ExternalLink,
} from "lucide-react";

type VerificationStatus = "pending" | "verified" | "rejected";

const statusConfig: Record<
  VerificationStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive";
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  pending: {
    label: "Pending",
    variant: "secondary",
    icon: Clock,
  },
  verified: {
    label: "Verified",
    variant: "default",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    variant: "destructive",
    icon: XCircle,
  },
};

export default function AdminBusinessesPage() {
  const { isLoading: authLoading, isAuthorized } = useRequireAdmin();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<VerificationStatus | "all">(
    "all"
  );
  const [actionDialog, setActionDialog] = useState<{
    businessId: Id<"businesses">;
    businessName: string;
    action: "verify" | "reject";
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const businesses = useQuery(
    api.businesses.listBusinesses,
    isAuthorized
      ? {
          status: statusFilter !== "all" ? statusFilter : undefined,
          search: searchQuery || undefined,
        }
      : "skip"
  );

  const verifyBusiness = useMutation(api.businesses.verifyBusiness);

  const handleVerificationAction = async () => {
    if (!actionDialog) return;

    setIsSubmitting(true);
    try {
      const result = await verifyBusiness({
        businessId: actionDialog.businessId,
        status: actionDialog.action === "verify" ? "verified" : "rejected",
      });

      // Send verification/rejection email to business owner
      if (result?.ownerEmail) {
        const emailType = actionDialog.action === "verify" 
          ? "business-verified" 
          : "business-rejected";
        
        fetch("/api/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: emailType,
            to: result.ownerEmail,
            businessName: actionDialog.businessName,
            ownerName: result.ownerName,
            locale: "en", // Admin panel doesn't have locale context, default to English
          }),
        }).catch((err) => console.error("Failed to send verification email:", err));
      }

      toast.success(
        actionDialog.action === "verify"
          ? "Business verified successfully"
          : "Business rejected"
      );
      setActionDialog(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update business";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
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

  // Count stats
  const pendingCount =
    businesses?.filter((b) => b.verificationStatus === "pending").length ?? 0;
  const verifiedCount =
    businesses?.filter((b) => b.verificationStatus === "verified").length ?? 0;
  const rejectedCount =
    businesses?.filter((b) => b.verificationStatus === "rejected").length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manage Businesses</h1>
        <p className="text-muted-foreground">
          Review and verify business registrations
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Businesses
            </CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {businesses?.length ?? <Loader2 className="h-6 w-6 animate-spin" />}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Review
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pendingCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {verifiedCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {rejectedCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Businesses Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Businesses</CardTitle>
          <CardDescription>
            Review business registrations and verify or reject them
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by business name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) =>
                setStatusFilter(v as VerificationStatus | "all")
              }
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {businesses === undefined ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : businesses.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {searchQuery || statusFilter !== "all"
                ? "No businesses match your search criteria."
                : "No businesses registered yet."}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {businesses.map((business) => {
                    const status = statusConfig[business.verificationStatus];
                    const StatusIcon = status.icon;

                    return (
                      <TableRow key={business._id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{business.name}</span>
                            {business.description && (
                              <span className="text-sm text-muted-foreground line-clamp-1">
                                {business.description}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">
                              {business.owner?.name || "Unknown"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {business.owner?.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3" />
                            {business.city
                              ? `${business.city}, ${business.country}`
                              : business.country}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{business.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={status.variant}
                            className="flex w-fit items-center gap-1"
                          >
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(business.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {business.website && (
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                                title="Visit website"
                              >
                                <a
                                  href={business.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            {business.verificationStatus !== "verified" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setActionDialog({
                                    businessId: business._id,
                                    businessName: business.name,
                                    action: "verify",
                                  })
                                }
                              >
                                <CheckCircle2 className="mr-1 h-4 w-4" />
                                Verify
                              </Button>
                            )}
                            {business.verificationStatus !== "rejected" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setActionDialog({
                                    businessId: business._id,
                                    businessName: business.name,
                                    action: "reject",
                                  })
                                }
                              >
                                <XCircle className="mr-1 h-4 w-4" />
                                Reject
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog
        open={!!actionDialog}
        onOpenChange={(open) => !open && setActionDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.action === "verify"
                ? "Verify Business"
                : "Reject Business"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog?.action === "verify"
                ? `Are you sure you want to verify "${actionDialog?.businessName}"? This will allow them to sell products on the marketplace.`
                : `Are you sure you want to reject "${actionDialog?.businessName}"? They will need to update their information to reapply.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant={actionDialog?.action === "verify" ? "default" : "destructive"}
              onClick={handleVerificationAction}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : actionDialog?.action === "verify" ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Verify Business
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject Business
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
