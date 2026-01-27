"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Building2,
  Loader2,
  MapPin,
  Phone,
  Globe,
  CheckCircle2,
  Clock,
  XCircle,
  Pencil,
  Shield,
  ArrowRight,
} from "lucide-react";
import { useRouter as useNextIntlRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

// African countries list
const AFRICAN_COUNTRIES = [
  "Algeria",
  "Angola",
  "Benin",
  "Botswana",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cameroon",
  "Central African Republic",
  "Chad",
  "Comoros",
  "Congo (DRC)",
  "Congo (Republic)",
  "Cote d'Ivoire",
  "Djibouti",
  "Egypt",
  "Equatorial Guinea",
  "Eritrea",
  "Eswatini",
  "Ethiopia",
  "Gabon",
  "Gambia",
  "Ghana",
  "Guinea",
  "Guinea-Bissau",
  "Kenya",
  "Lesotho",
  "Liberia",
  "Libya",
  "Madagascar",
  "Malawi",
  "Mali",
  "Mauritania",
  "Mauritius",
  "Morocco",
  "Mozambique",
  "Namibia",
  "Niger",
  "Nigeria",
  "Rwanda",
  "Sao Tome and Principe",
  "Senegal",
  "Seychelles",
  "Sierra Leone",
  "Somalia",
  "South Africa",
  "South Sudan",
  "Sudan",
  "Tanzania",
  "Togo",
  "Tunisia",
  "Uganda",
  "Zambia",
  "Zimbabwe",
];

// Business categories
const BUSINESS_CATEGORIES = [
  "Agriculture & Farming",
  "Manufacturing",
  "Technology & IT",
  "Construction & Real Estate",
  "Energy & Utilities",
  "Healthcare & Pharmaceuticals",
  "Education & Training",
  "Financial Services",
  "Retail & E-commerce",
  "Transportation & Logistics",
  "Hospitality & Tourism",
  "Media & Entertainment",
  "Professional Services",
  "Mining & Natural Resources",
  "Textile & Fashion",
  "Food & Beverage",
  "Telecommunications",
  "Other",
];

const statusConfig = {
  pending: {
    label: "Pending Verification",
    variant: "secondary" as const,
    icon: Clock,
    color: "text-yellow-600",
  },
  verified: {
    label: "Verified",
    variant: "default" as const,
    icon: CheckCircle2,
    color: "text-green-600",
  },
  rejected: {
    label: "Rejected",
    variant: "destructive" as const,
    icon: XCircle,
    color: "text-red-600",
  },
};

export default function BusinessProfilePage() {
  const router = useRouter();
  const intlRouter = useNextIntlRouter();
  const t = useTranslations("compliance");
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [country, setCountry] = useState<string>("");
  const [category, setCategory] = useState<string>("");

  const currentUser = useQuery(api.users.getCurrentUser);
  const business = useQuery(api.businesses.getMyBusiness);
  const complianceSummary = useQuery(api.compliance.getComplianceSummary);
  const updateBusiness = useMutation(api.businesses.updateBusiness);

  // Redirect if user doesn't have a business
  useEffect(() => {
    if (currentUser !== undefined && !currentUser?.businessId) {
      router.push("/business/register");
    }
  }, [currentUser, router]);

  // Set initial values when business data loads
  useEffect(() => {
    if (business) {
      setCountry(business.country);
      setCategory(business.category);
    }
  }, [business]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    try {
      await updateBusiness({
        name: formData.get("name") as string,
        description: (formData.get("description") as string) || undefined,
        country: country,
        city: (formData.get("city") as string) || undefined,
        address: (formData.get("address") as string) || undefined,
        phone: (formData.get("phone") as string) || undefined,
        website: (formData.get("website") as string) || undefined,
        category: category,
      });

      toast.success("Business profile updated successfully");
      setIsEditing(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update business";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (currentUser === undefined || business === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!business) {
    return null; // Will redirect via useEffect
  }

  const status = statusConfig[business.verificationStatus];
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Business</h1>
          <p className="text-muted-foreground">
            Manage your business profile and information
          </p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        )}
      </div>

      {/* Verification Status Card */}
      <Card>
        <CardContent className="flex items-center gap-4 pt-6">
          <div className={`rounded-full p-2 ${status.color} bg-muted`}>
            <StatusIcon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Verification Status</h3>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {business.verificationStatus === "pending" &&
                "Your business is being reviewed by our team. This usually takes 1-2 business days."}
              {business.verificationStatus === "verified" &&
                "Your business has been verified. You can now sell products on the marketplace."}
              {business.verificationStatus === "rejected" &&
                "Your business verification was rejected. Please update your information and contact support."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Business Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Business Profile
          </CardTitle>
          <CardDescription>
            {isEditing
              ? "Update your business information below"
              : "Your business details and contact information"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Business Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={business.name}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    defaultValue={business.description || ""}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="country">Country *</Label>
                    <Select
                      value={country}
                      onValueChange={setCountry}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="country">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {AFRICAN_COUNTRIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      defaultValue={business.city || ""}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    defaultValue={business.address || ""}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="category">Business Category *</Label>
                  <Select
                    value={category}
                    onValueChange={setCategory}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      defaultValue={business.phone || ""}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      name="website"
                      type="url"
                      defaultValue={business.website || ""}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold">{business.name}</h3>
                {business.description && (
                  <p className="mt-1 text-muted-foreground">
                    {business.description}
                  </p>
                )}
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Category
                  </p>
                  <p className="font-medium">{business.category}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Location
                  </p>
                  <p className="flex items-center gap-1 font-medium">
                    <MapPin className="h-4 w-4" />
                    {business.city
                      ? `${business.city}, ${business.country}`
                      : business.country}
                  </p>
                </div>

                {business.address && (
                  <div className="space-y-1 sm:col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Address
                    </p>
                    <p className="font-medium">{business.address}</p>
                  </div>
                )}

                {business.phone && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Phone
                    </p>
                    <p className="flex items-center gap-1 font-medium">
                      <Phone className="h-4 w-4" />
                      {business.phone}
                    </p>
                  </div>
                )}

                {business.website && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Website
                    </p>
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 font-medium text-primary hover:underline"
                    >
                      <Globe className="h-4 w-4" />
                      {business.website}
                    </a>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex gap-4 text-sm text-muted-foreground">
                <p>
                  Registered:{" "}
                  {new Date(business.createdAt).toLocaleDateString()}
                </p>
                <p>
                  Last updated:{" "}
                  {new Date(business.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AfCFTA Compliance Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t("afcftaCompliance")}
          </CardTitle>
          <CardDescription>
            {t("afcftaComplianceDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {complianceSummary === undefined ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : complianceSummary.totalProducts === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-4">
                {t("noComplianceCheckYet")}
              </p>
              <Button onClick={() => intlRouter.push("/compliance")}>
                {t("startComplianceCheck")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="text-xl font-bold">{complianceSummary.totalProducts}</div>
                  <div className="text-xs text-muted-foreground">{t("totalProducts")}</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950/30">
                  <div className="text-xl font-bold text-green-600 dark:text-green-400">
                    {complianceSummary.compliantProducts}
                  </div>
                  <div className="text-xs text-green-700 dark:text-green-300">{t("eligible")}</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                  <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                    {complianceSummary.nonCompliantProducts}
                  </div>
                  <div className="text-xs text-amber-700 dark:text-amber-300">{t("notEligible")}</div>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => intlRouter.push("/compliance")}
              >
                {t("manageProducts")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
