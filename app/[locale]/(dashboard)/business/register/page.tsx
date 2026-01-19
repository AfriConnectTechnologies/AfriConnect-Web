"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
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
import { toast } from "sonner";
import { Building2, Loader2 } from "lucide-react";

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

export default function BusinessRegisterPage() {
  const t = useTranslations("business");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const tToast = useTranslations("toast");
  const locale = useLocale();
  
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [country, setCountry] = useState<string>("");
  const [category, setCategory] = useState<string>("");

  const currentUser = useQuery(api.users.getCurrentUser);
  const createBusiness = useMutation(api.businesses.createBusiness);

  // Redirect if user already has a business
  useEffect(() => {
    if (currentUser?.businessId) {
      router.push("/business/profile");
    }
  }, [currentUser, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!country) {
      toast.error(tValidation("selectCountry"));
      return;
    }

    if (!category) {
      toast.error(tValidation("selectCategory"));
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const businessName = formData.get("name") as string;
    const city = (formData.get("city") as string) || undefined;

    try {
      const result = await createBusiness({
        name: businessName,
        description: (formData.get("description") as string) || undefined,
        country: country,
        city: city,
        address: (formData.get("address") as string) || undefined,
        phone: (formData.get("phone") as string) || undefined,
        website: (formData.get("website") as string) || undefined,
        category: category,
      });

      // Send registration confirmation email to business owner
      fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "business-registered",
          to: result?.ownerEmail,
          businessName: businessName,
          ownerName: result?.ownerName,
          category: category,
          country: country,
          locale: locale,
        }),
      }).catch((err) => console.error("Failed to send registration email:", err));

      // Send notification to admin about new business registration
      fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "admin-new-business",
          businessName: businessName,
          ownerName: result?.ownerName || "Not provided",
          ownerEmail: result?.ownerEmail,
          category: category,
          country: country,
          city: city,
        }),
      }).catch((err) => console.error("Failed to send admin notification:", err));

      toast.success(tToast("businessRegistered"));
      router.push("/business/profile");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : tToast("failedToRegisterBusiness");
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (currentUser === undefined || currentUser?.businessId) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("registerTitle")}</h1>
        <p className="text-muted-foreground">
          {t("registerDescription")}
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {t("businessInformation")}
          </CardTitle>
          <CardDescription>
            {t("businessInfoDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">{t("businessName")} *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder={t("enterBusinessName")}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">{t("description")}</Label>
                <Input
                  id="description"
                  name="description"
                  placeholder={t("businessDescription")}
                  disabled={isSubmitting}
                />
                <p className="text-sm text-muted-foreground">
                  {t("descriptionHelp")}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="country">{t("country")} *</Label>
                  <Select
                    value={country}
                    onValueChange={setCountry}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="country">
                      <SelectValue placeholder={t("selectCountry")} />
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
                  <Label htmlFor="city">{t("city")}</Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder={t("enterCity")}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="address">{t("address")}</Label>
                <Input
                  id="address"
                  name="address"
                  placeholder={t("businessAddress")}
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category">{t("category")} *</Label>
                <Select
                  value={category}
                  onValueChange={setCategory}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder={t("selectCategory")} />
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
                  <Label htmlFor="phone">{t("phone")}</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder={t("phonePlaceholder")}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="website">{t("website")}</Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    placeholder={t("websitePlaceholder")}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("registering")}
                  </>
                ) : (
                  t("registerTitle")
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
