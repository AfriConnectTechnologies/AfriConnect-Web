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
      toast.error("Please select a country");
      return;
    }

    if (!category) {
      toast.error("Please select a business category");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    try {
      await createBusiness({
        name: formData.get("name") as string,
        description: (formData.get("description") as string) || undefined,
        country: country,
        city: (formData.get("city") as string) || undefined,
        address: (formData.get("address") as string) || undefined,
        phone: (formData.get("phone") as string) || undefined,
        website: (formData.get("website") as string) || undefined,
        category: category,
      });

      toast.success("Business registered successfully! Pending verification.");
      router.push("/business/profile");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to register business";
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
        <h1 className="text-3xl font-bold tracking-tight">Register Your Business</h1>
        <p className="text-muted-foreground">
          Create a business profile to start selling on the marketplace
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Business Information
          </CardTitle>
          <CardDescription>
            Provide details about your business. Your registration will be reviewed
            by our team before activation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Business Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter your business name"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  placeholder="Brief description of your business"
                  disabled={isSubmitting}
                />
                <p className="text-sm text-muted-foreground">
                  Describe what your business does and what products/services you offer.
                </p>
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
                    placeholder="Enter city"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="Business address"
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
                    placeholder="+251 xxx xxx xxxx"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    placeholder="https://example.com"
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
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  "Register Business"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
