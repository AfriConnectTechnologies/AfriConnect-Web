"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
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
  const isSubmittingRef = useRef(false);
  const createFormRef = useRef<HTMLFormElement>(null);

  const products = useQuery(api.products.list, {
    status: statusFilter !== "all" ? statusFilter : undefined,
  });
  const createProduct = useMutation(api.products.create);
  const updateProduct = useMutation(api.products.update);
  const deleteProduct = useMutation(api.products.remove);

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
    
    if (isSubmitting || isSubmittingRef.current) {
      return;
    }
    
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    
    try {
      const result = await createProduct({
        name: formData.get("name") as string,
        description: (formData.get("description") as string) || undefined,
        price: parseFloat(formData.get("price") as string),
        quantity: parseInt(formData.get("quantity") as string),
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
        toast.success("Product created! Now add images to complete your listing.");
      }
    } catch (error) {
      console.error("Create product error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create product";
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
      toast.warning("Consider adding at least one image to help your product stand out.");
    }
    resetCreateDialog();
    toast.success("Product listing complete!");
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
        price: parseFloat(formData.get("price") as string),
        quantity: parseInt(formData.get("quantity") as string),
        category: (formData.get("category") as string) || undefined,
        status: editStatus,
        country: (formData.get("country") as string) || undefined,
        minOrderQuantity: formData.get("minOrderQuantity") 
          ? parseInt(formData.get("minOrderQuantity") as string) 
          : undefined,
      });
      toast.success("Product updated successfully");
      setEditingProduct(null);
    } catch {
      toast.error("Failed to update product");
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
      
      toast.success("Product deleted successfully");
      setDeleteConfirm(null);
    } catch {
      toast.error("Failed to delete product");
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

  if (products === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Products</h1>
          <p className="text-muted-foreground">Manage your product listings</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
          <CardDescription>
            Search and filter your products to find what you need
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
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
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {products.length === 0
                ? "No products yet. Add your first product to get started."
                : "No products match your search criteria."}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <ProductRow 
                      key={product._id} 
                      product={product}
                      onEdit={() => setEditingProduct(product._id)}
                      onDelete={() => setDeleteConfirm(product._id)}
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
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              {createStep === 1 
                ? "Enter product details to get started."
                : "Add images to make your product stand out."}
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
            <span className={cn(createStep >= 1 && "text-foreground font-medium")}>Product Details</span>
            <span className={cn(createStep >= 2 && "text-foreground font-medium")}>Add Images</span>
          </div>

          {/* Step 1: Product Details */}
          {createStep === 1 && (
            <form ref={createFormRef} onSubmit={handleCreateStep1} className="flex-1 overflow-y-auto">
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="create-name">Product Name *</Label>
                  <Input
                    id="create-name"
                    name="name"
                    placeholder="Enter product name"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="create-description">Description</Label>
                  <Input
                    id="create-description"
                    name="description"
                    placeholder="Describe your product"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="create-price">Price *</Label>
                    <Input
                      id="create-price"
                      name="price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="create-quantity">Stock Quantity *</Label>
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
                    <Label htmlFor="create-category">Category</Label>
                    <Input
                      id="create-category"
                      name="category"
                      placeholder="e.g., Electronics"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="create-country">Origin Country</Label>
                    <Input
                      id="create-country"
                      name="country"
                      placeholder="e.g., Ethiopia"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="create-minOrderQuantity">Min Order Qty</Label>
                    <Input
                      id="create-minOrderQuantity"
                      name="minOrderQuantity"
                      type="number"
                      min="1"
                      placeholder="1"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="create-status">Status</Label>
                    <Select
                      value={createStatus}
                      onValueChange={(v) => setCreateStatus(v as ProductStatus)}
                    >
                      <SelectTrigger id="create-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetCreateDialog} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Next: Add Images"}
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
                  Skip for Now
                </Button>
                <Button type="button" onClick={handleCompleteCreate}>
                  <Check className="mr-2 h-4 w-4" />
                  Complete Listing
                  {productImages && productImages.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {productImages.length} image{productImages.length !== 1 ? 's' : ''}
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
                <DialogTitle>Edit Product</DialogTitle>
                <DialogDescription>
                  Update product details and manage images.
                </DialogDescription>
              </DialogHeader>
              
              <Tabs value={editTab} onValueChange={setEditTab} className="flex-1 overflow-hidden flex flex-col">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="images">
                    Images
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
                        <Label htmlFor="edit-name">Name *</Label>
                        <Input
                          id="edit-name"
                          name="name"
                          defaultValue={productToEdit.name}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-description">Description</Label>
                        <Input
                          id="edit-description"
                          name="description"
                          defaultValue={productToEdit.description || ""}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="edit-price">Price *</Label>
                          <Input
                            id="edit-price"
                            name="price"
                            type="number"
                            step="0.01"
                            defaultValue={productToEdit.price}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="edit-quantity">Quantity *</Label>
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
                          <Label htmlFor="edit-category">Category</Label>
                          <Input
                            id="edit-category"
                            name="category"
                            defaultValue={productToEdit.category || ""}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="edit-country">Origin Country</Label>
                          <Input
                            id="edit-country"
                            name="country"
                            defaultValue={productToEdit.country || ""}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="edit-minOrderQuantity">Min Order Qty</Label>
                          <Input
                            id="edit-minOrderQuantity"
                            name="minOrderQuantity"
                            type="number"
                            min="1"
                            defaultValue={productToEdit.minOrderQuantity || ""}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="edit-status">Status</Label>
                          <Select
                            value={editStatus}
                            onValueChange={(v) => setEditStatus(v as ProductStatus)}
                          >
                            <SelectTrigger id="edit-status">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
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
                  Cancel
                </Button>
                {editTab === "details" && (
                  <Button type="submit" form="edit-form">Save Changes</Button>
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
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product? This will also delete all associated images. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
            >
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete}>
              Delete
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
  onDelete 
}: { 
  product: {
    _id: Id<"products">;
    name: string;
    description?: string;
    category?: string;
    price: number;
    quantity: number;
    status: ProductStatus;
    createdAt: number;
  };
  onEdit: () => void;
  onDelete: () => void;
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
      <TableCell>${product.price.toLocaleString()}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Package className="h-3 w-3 text-muted-foreground" />
          {product.quantity}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={statusColors[product.status]}>
          {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
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
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
