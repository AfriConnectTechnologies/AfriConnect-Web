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
import { Plus, Search, Pencil, Trash2, Package, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImageUploader } from "@/components/products";
import Image from "next/image";

type ProductStatus = "active" | "inactive";

const statusColors: Record<ProductStatus, "default" | "secondary" | "outline" | "destructive"> = {
  active: "default",
  inactive: "secondary",
};

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "all">("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Id<"products"> | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Id<"products"> | null>(null);
  const [createStatus, setCreateStatus] = useState<ProductStatus>("active");
  const [editStatus, setEditStatus] = useState<ProductStatus>("active");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newlyCreatedProduct, setNewlyCreatedProduct] = useState<Id<"products"> | null>(null);
  const [editTab, setEditTab] = useState("details");
  const [imagesKey, setImagesKey] = useState(0);
  const isSubmittingRef = useRef(false);

  const products = useQuery(api.products.list, {
    status: statusFilter !== "all" ? statusFilter : undefined,
  });
  const createProduct = useMutation(api.products.create);
  const updateProduct = useMutation(api.products.update);
  const deleteProduct = useMutation(api.products.remove);

  // Get images for each product to show in table
  const productImages = useQuery(
    api.productImages.getByProduct,
    editingProduct ? { productId: editingProduct } : "skip"
  );

  // Get primary images for all products in the list
  const productsWithPrimaryImages = products?.map(product => {
    return product;
  }) ?? [];

  const filteredProducts =
    productsWithPrimaryImages?.filter(
      (product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ) ?? [];

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (isSubmitting || isSubmittingRef.current) {
      return;
    }
    
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const form = e.currentTarget;
    
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
      
      toast.success("Product created! Add images to complete your listing.");
      setIsCreateOpen(false);
      setCreateStatus("active");
      form.reset();
      
      // Open edit dialog to add images
      if (result?._id) {
        setNewlyCreatedProduct(result._id);
        setEditingProduct(result._id);
        setEditTab("images");
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
      setNewlyCreatedProduct(null);
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
      setNewlyCreatedProduct(null);
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

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Create New Product</DialogTitle>
              <DialogDescription>
                Add basic product details. You can add images after creation.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid gap-2">
                <Label htmlFor="create-name">Name *</Label>
                <Input
                  id="create-name"
                  name="name"
                  placeholder="Product name"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-description">Description</Label>
                <Input
                  id="create-description"
                  name="description"
                  placeholder="Product description"
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
                  <Label htmlFor="create-quantity">Quantity *</Label>
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
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create & Add Images"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          {productToEdit && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {newlyCreatedProduct === editingProduct ? "Complete Your Listing" : "Edit Product"}
                </DialogTitle>
                <DialogDescription>
                  {newlyCreatedProduct === editingProduct 
                    ? "Add images to make your product stand out in the marketplace."
                    : "Update product details and manage images."}
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
                  {newlyCreatedProduct === editingProduct ? "Done" : "Cancel"}
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
              <span>⋯</span>
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
