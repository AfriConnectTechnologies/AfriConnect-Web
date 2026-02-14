"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Pencil, Trash2, Package, ImageIcon, Check, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImageUploader } from "@/components/products";
import Image from "next/image";
import { cn } from "@/lib/utils";

type ProductStatus = "active" | "inactive";

const statusColors: Record<ProductStatus, "default" | "secondary" | "outline" | "destructive"> = {
  active: "default",
  inactive: "secondary",
};

export default function ProductsPage() {
  const router = useRouter();
  const t = useTranslations("products");
  const tCommon = useTranslations("common");
  const tToast = useTranslations("toast");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "all">("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2>(1);
  const [createdProductId, setCreatedProductId] = useState<Id<"products"> | null>(null);
  const [editingProduct, setEditingProduct] = useState<Id<"products"> | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Id<"products"> | null>(null);
  const [createStatus, setCreateStatus] = useState<ProductStatus>("active");
  const [editStatus, setEditStatus] = useState<ProductStatus>("active");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editTab, setEditTab] = useState("details");
  const [imagesKey, setImagesKey] = useState(0);
  const [shouldPromptPricingAfterCreate, setShouldPromptPricingAfterCreate] = useState(false);
  const [showFirstProductPricingPrompt, setShowFirstProductPricingPrompt] = useState(false);
  const [showSubscriptionRequiredPrompt, setShowSubscriptionRequiredPrompt] = useState(false);
  const isSubmittingRef = useRef(false);
  const createFormRef = useRef<HTMLFormElement>(null);

  const currentUser = useQuery(api.users.getCurrentUser);
  const products = useQuery(
    api.products.list,
    currentUser
      ? {
          sellerId: currentUser.clerkId,
          status: statusFilter !== "all" ? statusFilter : undefined,
        }
      : "skip"
  );
  const createProduct = useMutation(api.products.create);
  const updateProduct = useMutation(api.products.update);
  const deleteProduct = useMutation(api.products.remove);
  const currentSubscription = useQuery(api.subscriptions.getCurrentSubscription);
  const allProducts = useQuery(
    api.products.list,
    currentUser
      ? {
          sellerId: currentUser.clerkId,
        }
      : "skip"
  );
  const hasExistingProducts = Array.isArray(allProducts) && allProducts.length > 0;
  const hasPaidSubscription = currentSubscription?.status === "active";
  const isAdmin = currentUser?.role === "admin";
  const canCreateProduct = isAdmin || !hasExistingProducts || hasPaidSubscription;

  // Get images for the product being created or edited
  const productImages = useQuery(
    api.productImages.getByProduct,
    (editingProduct || createdProductId) ? { productId: (editingProduct || createdProductId)! } : "skip"
  );

  const filteredProducts =
    products?.filter(
      (product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ) ?? [];

  // Handle Step 1: Create product
  const handleCreateStep1 = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!canCreateProduct) {
      setShowSubscriptionRequiredPrompt(true);
      return;
    }
    
    if (isSubmitting || isSubmittingRef.current) {
      return;
    }
    
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const isFirstProduct = Array.isArray(allProducts) && allProducts.length === 0;
    
    try {
      const result = await createProduct({
        name: formData.get("name") as string,
        description: (formData.get("description") as string) || undefined,
        price: parseFloat(formData.get("priceEtb") as string),
        usdPrice: formData.get("priceUsd")
          ? parseFloat(formData.get("priceUsd") as string)
          : undefined,
        quantity: parseInt(formData.get("quantity") as string),
        sku: (formData.get("sku") as string) || undefined,
        lowStockThreshold: formData.get("lowStockThreshold")
          ? parseInt(formData.get("lowStockThreshold") as string)
          : undefined,
        reorderQuantity: formData.get("reorderQuantity")
          ? parseInt(formData.get("reorderQuantity") as string)
          : undefined,
        category: (formData.get("category") as string) || undefined,
        status: createStatus,
        country: (formData.get("country") as string) || undefined,
        minOrderQuantity: formData.get("minOrderQuantity") 
          ? parseInt(formData.get("minOrderQuantity") as string) 
          : undefined,
      });
      
      if (result?._id) {
        setCreatedProductId(result._id);
        setCreateStep(2);
        if (isFirstProduct) {
          setShouldPromptPricingAfterCreate(true);
        }
        toast.success(tToast("productCreated"));
      }
    } catch (error) {
      console.error("Create product error:", error);
      const errorMessage = error instanceof Error ? error.message : tToast("failedToCreate");
      if (errorMessage === "Paid subscription required to add additional products") {
        setShowSubscriptionRequiredPrompt(true);
      }
      toast.error(errorMessage);
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  // Handle completing the product creation (after images)
  const handleCompleteCreate = () => {
    const imageCount = productImages?.length ?? 0;
    if (imageCount === 0) {
      toast.warning(tToast("addImageSuggestion"));
    }
    resetCreateDialog();
    if (shouldPromptPricingAfterCreate) {
      setShowFirstProductPricingPrompt(true);
      setShouldPromptPricingAfterCreate(false);
    }
    toast.success(tToast("productListingComplete"));
  };

  // Reset create dialog state
  const resetCreateDialog = () => {
    setIsCreateOpen(false);
    setCreateStep(1);
    setCreatedProductId(null);
    setCreateStatus("active");
    createFormRef.current?.reset();
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingProduct) return;
    const formData = new FormData(e.currentTarget);
    try {
      await updateProduct({
        id: editingProduct,
        name: formData.get("name") as string,
        description: (formData.get("description") as string) || undefined,
        price: parseFloat(formData.get("priceEtb") as string),
        usdPrice: formData.get("priceUsd")
          ? parseFloat(formData.get("priceUsd") as string)
          : undefined,
        quantity: parseInt(formData.get("quantity") as string),
        sku: (formData.get("sku") as string) || undefined,
        lowStockThreshold: formData.get("lowStockThreshold")
          ? parseInt(formData.get("lowStockThreshold") as string)
          : undefined,
        reorderQuantity: formData.get("reorderQuantity")
          ? parseInt(formData.get("reorderQuantity") as string)
          : undefined,
        category: (formData.get("category") as string) || undefined,
        status: editStatus,
        country: (formData.get("country") as string) || undefined,
        minOrderQuantity: formData.get("minOrderQuantity") 
          ? parseInt(formData.get("minOrderQuantity") as string) 
          : undefined,
      });
      toast.success(tToast("productUpdated"));
      setEditingProduct(null);
    } catch {
      toast.error(tToast("failedToUpdate"));
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const result = await deleteProduct({ id: deleteConfirm });
      
      // Delete images from R2
      if (result?.r2Keys && result.r2Keys.length > 0) {
        for (const key of result.r2Keys) {
          try {
            await fetch("/api/images/delete", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ key }),
            });
          } catch (e) {
            console.error("Failed to delete image from R2:", e);
          }
        }
      }
      
      toast.success(tToast("productDeleted"));
      setDeleteConfirm(null);
    } catch {
      toast.error(tToast("failedToDelete"));
    }
  };

  const productToEdit = editingProduct
    ? products?.find((p) => p._id === editingProduct)
    : null;

  useEffect(() => {
    if (productToEdit) {
      setEditStatus(productToEdit.status);
    }
  }, [productToEdit]);

  useEffect(() => {
    if (!editingProduct) {
      setEditTab("details");
    }
  }, [editingProduct]);

  const handleImagesChange = () => {
    setImagesKey(prev => prev + 1);
  };

  const handleOpenCreateDialog = () => {
    if (!canCreateProduct) {
      setShowSubscriptionRequiredPrompt(true);
      return;
    }
    setIsCreateOpen(true);
  };

  if (products === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">{tCommon("loading")}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <Button onClick={handleOpenCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          {t("addProduct")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("allProducts")}</CardTitle>
          <CardDescription>
            {t("searchDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as ProductStatus | "all")}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={t("filterByStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allStatuses")}</SelectItem>
                <SelectItem value="active">{t("active")}</SelectItem>
                <SelectItem value="inactive">{t("inactive")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {products.length === 0
                ? t("noProducts")
                : t("noMatchingProducts")}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">{t("image")}</TableHead>
                    <TableHead>{t("productName")}</TableHead>
                    <TableHead>{t("category")}</TableHead>
                    <TableHead>{t("price")}</TableHead>
                    <TableHead>{t("quantity")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead>{tCommon("created")}</TableHead>
                    <TableHead className="text-right">{tCommon("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <ProductRow 
                      key={product._id} 
                      product={product}
                      onEdit={() => setEditingProduct(product._id)}
                      onDelete={() => setDeleteConfirm(product._id)}
                      translations={{ edit: tCommon("edit"), delete: tCommon("delete"), active: t("active"), inactive: t("inactive") }}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog with Stepper */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => !open && resetCreateDialog()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{t("addNewProduct")}</DialogTitle>
            <DialogDescription>
              {createStep === 1 
                ? t("enterDetailsStep")
                : t("addImagesStep")}
            </DialogDescription>
          </DialogHeader>

          {/* Stepper Indicator */}
          <div className="flex items-center justify-center gap-2 py-4">
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors",
              createStep >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              {createStep > 1 ? <Check className="h-4 w-4" /> : "1"}
            </div>
            <div className="flex items-center">
              <div className={cn(
                "w-12 h-0.5 transition-colors",
                createStep > 1 ? "bg-primary" : "bg-muted"
              )} />
              <ChevronRight className={cn(
                "h-4 w-4 -mx-1 transition-colors",
                createStep > 1 ? "text-primary" : "text-muted-foreground"
              )} />
              <div className={cn(
                "w-12 h-0.5 transition-colors",
                createStep > 1 ? "bg-primary" : "bg-muted"
              )} />
            </div>
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors",
              createStep >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              2
            </div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground px-4 -mt-2 mb-2">
            <span className={cn(createStep >= 1 && "text-foreground font-medium")}>{t("productDetails")}</span>
            <span className={cn(createStep >= 2 && "text-foreground font-medium")}>{t("addImages")}</span>
          </div>

          {/* Step 1: Product Details */}
          {createStep === 1 && (
            <form ref={createFormRef} onSubmit={handleCreateStep1} className="flex-1 overflow-y-auto">
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="create-name">{t("productName")} *</Label>
                  <Input
                    id="create-name"
                    name="name"
                    placeholder={t("enterProductName")}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="create-description">{t("descriptionLabel")}</Label>
                  <Input
                    id="create-description"
                    name="description"
                    placeholder={t("describeProduct")}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="create-price-etb">{t("price")} (ETB) *</Label>
                    <Input
                      id="create-price-etb"
                      name="priceEtb"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="create-price-usd">{t("price")} (USD)</Label>
                    <Input
                      id="create-price-usd"
                      name="priceUsd"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="create-quantity">{t("stockQuantity")} *</Label>
                    <Input
                      id="create-quantity"
                      name="quantity"
                      type="number"
                      min="0"
                      placeholder="0"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="create-sku">{t("sku")}</Label>
                    <Input
                      id="create-sku"
                      name="sku"
                      placeholder={t("skuPlaceholder")}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="create-lowStockThreshold">{t("lowStockThreshold")}</Label>
                    <Input
                      id="create-lowStockThreshold"
                      name="lowStockThreshold"
                      type="number"
                      min="0"
                      placeholder="5"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="create-category">{t("category")}</Label>
                    <Input
                      id="create-category"
                      name="category"
                      placeholder={t("categoryPlaceholder")}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="create-country">{t("originCountry")}</Label>
                    <Input
                      id="create-country"
                      name="country"
                      placeholder={t("countryPlaceholder")}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="create-minOrderQuantity">{t("minOrderQty")}</Label>
                    <Input
                      id="create-minOrderQuantity"
                      name="minOrderQuantity"
                      type="number"
                      min="1"
                      placeholder="1"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="create-reorderQuantity">{t("reorderQuantity")}</Label>
                    <Input
                      id="create-reorderQuantity"
                      name="reorderQuantity"
                      type="number"
                      min="0"
                      placeholder="25"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="create-status">{t("status")}</Label>
                  <Select
                    value={createStatus}
                    onValueChange={(v) => setCreateStatus(v as ProductStatus)}
                  >
                    <SelectTrigger id="create-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{t("active")}</SelectItem>
                      <SelectItem value="inactive">{t("inactive")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetCreateDialog} disabled={isSubmitting}>
                  {tCommon("cancel")}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? t("creating") : t("nextAddImages")}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </DialogFooter>
            </form>
          )}

          {/* Step 2: Image Upload */}
          {createStep === 2 && createdProductId && (
            <div className="flex-1 overflow-y-auto flex flex-col">
              <div className="flex-1 py-4">
                <ImageUploader
                  key={imagesKey}
                  productId={createdProductId}
                  existingImages={productImages?.map(img => ({
                    _id: img._id,
                    url: img.url,
                    isPrimary: img.isPrimary,
                    order: img.order,
                    r2Key: img.r2Key,
                  })) ?? []}
                  onImagesChange={handleImagesChange}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCompleteCreate}>
                  {t("skipForNow")}
                </Button>
                <Button type="button" onClick={handleCompleteCreate}>
                  <Check className="mr-2 h-4 w-4" />
                  {t("completeListing")}
                  {productImages && productImages.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {productImages.length} {t("image")}{productImages.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          {productToEdit && (
            <>
              <DialogHeader>
                <DialogTitle>{t("editProduct")}</DialogTitle>
                <DialogDescription>
                  {t("updateDetails")}
                </DialogDescription>
              </DialogHeader>
              
              <Tabs value={editTab} onValueChange={setEditTab} className="flex-1 overflow-hidden flex flex-col">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details">{tCommon("details")}</TabsTrigger>
                  <TabsTrigger value="images">
                    {t("images")}
                    {productImages && productImages.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {productImages.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="flex-1 overflow-y-auto mt-4">
                  <form onSubmit={handleUpdate} id="edit-form">
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-name">{t("productName")} *</Label>
                        <Input
                          id="edit-name"
                          name="name"
                          defaultValue={productToEdit.name}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-description">{t("descriptionLabel")}</Label>
                        <Input
                          id="edit-description"
                          name="description"
                          defaultValue={productToEdit.description || ""}
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="grid gap-2">
                          <Label htmlFor="edit-price-etb">{t("price")} (ETB) *</Label>
                          <Input
                            id="edit-price-etb"
                            name="priceEtb"
                            type="number"
                            step="0.01"
                            defaultValue={productToEdit.price}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="edit-price-usd">{t("price")} (USD)</Label>
                          <Input
                            id="edit-price-usd"
                            name="priceUsd"
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={productToEdit.usdPrice ?? ""}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="edit-quantity">{t("quantity")} *</Label>
                          <Input
                            id="edit-quantity"
                            name="quantity"
                            type="number"
                            min="0"
                            defaultValue={productToEdit.quantity}
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="edit-sku">{t("sku")}</Label>
                          <Input
                            id="edit-sku"
                            name="sku"
                            defaultValue={productToEdit.sku || ""}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="edit-lowStockThreshold">{t("lowStockThreshold")}</Label>
                          <Input
                            id="edit-lowStockThreshold"
                            name="lowStockThreshold"
                            type="number"
                            min="0"
                            defaultValue={productToEdit.lowStockThreshold ?? ""}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="edit-category">{t("category")}</Label>
                          <Input
                            id="edit-category"
                            name="category"
                            defaultValue={productToEdit.category || ""}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="edit-country">{t("originCountry")}</Label>
                          <Input
                            id="edit-country"
                            name="country"
                            defaultValue={productToEdit.country || ""}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="edit-minOrderQuantity">{t("minOrderQty")}</Label>
                          <Input
                            id="edit-minOrderQuantity"
                            name="minOrderQuantity"
                            type="number"
                            min="1"
                            defaultValue={productToEdit.minOrderQuantity || ""}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="edit-reorderQuantity">{t("reorderQuantity")}</Label>
                          <Input
                            id="edit-reorderQuantity"
                            name="reorderQuantity"
                            type="number"
                            min="0"
                            defaultValue={productToEdit.reorderQuantity ?? ""}
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-status">{t("status")}</Label>
                        <Select
                          value={editStatus}
                          onValueChange={(v) => setEditStatus(v as ProductStatus)}
                        >
                          <SelectTrigger id="edit-status">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">{t("active")}</SelectItem>
                            <SelectItem value="inactive">{t("inactive")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </form>
                </TabsContent>
                
                <TabsContent value="images" className="flex-1 overflow-y-auto mt-4">
                  <ImageUploader
                    key={imagesKey}
                    productId={editingProduct!}
                    existingImages={productImages?.map(img => ({
                      _id: img._id,
                      url: img.url,
                      isPrimary: img.isPrimary,
                      order: img.order,
                      r2Key: img.r2Key,
                    })) ?? []}
                    onImagesChange={handleImagesChange}
                  />
                </TabsContent>
              </Tabs>

              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingProduct(null)}
                >
                  {tCommon("cancel")}
                </Button>
                {editTab === "details" && (
                  <Button type="submit" form="edit-form">{t("saveChanges")}</Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteProduct")}</DialogTitle>
            <DialogDescription>
              {t("deleteConfirmation")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
            >
              {tCommon("cancel")}
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete}>
              {tCommon("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* First Product Pricing Prompt */}
      <Dialog open={showFirstProductPricingPrompt} onOpenChange={setShowFirstProductPricingPrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("firstProductPricingPromptTitle")}</DialogTitle>
            <DialogDescription>{t("firstProductPricingPromptDescription")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFirstProductPricingPrompt(false)}
            >
              {t("firstProductPricingPromptStay")}
            </Button>
            <Button
              type="button"
              onClick={() => {
                setShowFirstProductPricingPrompt(false);
                router.push("/pricing");
              }}
            >
              {t("firstProductPricingPromptGo")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subscription Required Prompt */}
      <Dialog open={showSubscriptionRequiredPrompt} onOpenChange={setShowSubscriptionRequiredPrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("subscriptionRequiredPromptTitle")}</DialogTitle>
            <DialogDescription>{t("subscriptionRequiredPromptDescription")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSubscriptionRequiredPrompt(false)}
            >
              {t("subscriptionRequiredPromptStay")}
            </Button>
            <Button
              type="button"
              onClick={() => {
                setShowSubscriptionRequiredPrompt(false);
                router.push("/pricing");
              }}
            >
              {t("subscriptionRequiredPromptGo")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Separate component for product row to fetch primary image
function ProductRow({ 
  product, 
  onEdit, 
  onDelete,
  translations,
}: { 
  product: {
    _id: Id<"products">;
    name: string;
    description?: string;
    category?: string;
    price: number;
    usdPrice?: number;
    quantity: number;
    status: ProductStatus;
    createdAt: number;
  };
  onEdit: () => void;
  onDelete: () => void;
  translations: { edit: string; delete: string; active: string; inactive: string };
}) {
  const primaryImage = useQuery(api.productImages.getPrimaryImage, { productId: product._id });

  return (
    <TableRow>
      <TableCell>
        <div className="relative h-10 w-10 overflow-hidden rounded border bg-muted">
          {primaryImage?.url ? (
            <Image
              src={primaryImage.url}
              alt={product.name}
              fill
              className="object-cover"
              sizes="40px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className="font-medium">{product.name}</TableCell>
      <TableCell>
        {product.category ? (
          <Badge variant="outline">{product.category}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span>{product.price.toLocaleString()} ETB</span>
          {product.usdPrice !== undefined && (
            <span className="text-xs text-muted-foreground">${product.usdPrice.toLocaleString()}</span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Package className="h-3 w-3 text-muted-foreground" />
          {product.quantity}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={statusColors[product.status]}>
          {product.status === "active" ? translations.active : translations.inactive}
        </Badge>
      </TableCell>
      <TableCell>
        {new Date(product.createdAt).toLocaleDateString()}
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <span className="sr-only">Open menu</span>
              <span>...</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              {translations.edit}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {translations.delete}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
