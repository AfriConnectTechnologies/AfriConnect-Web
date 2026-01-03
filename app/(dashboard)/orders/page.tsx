"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Search, Trash2, Package } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type OrderStatus = "pending" | "processing" | "completed" | "cancelled";
type OrderTab = "purchases" | "sales";

const statusColors: Record<OrderStatus, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "secondary",
  processing: "default",
  completed: "outline",
  cancelled: "destructive",
};

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<OrderTab>("purchases");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [deleteConfirm, setDeleteConfirm] = useState<Id<"orders"> | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Id<"orders"> | null>(null);

  const ensureUser = useMutation(api.users.ensureUser);
  const purchases = useQuery(api.orders.purchases, {
    status: statusFilter !== "all" ? statusFilter : undefined,
  });
  const sales = useQuery(api.orders.sales, {
    status: statusFilter !== "all" ? statusFilter : undefined,
  });
  const deleteOrder = useMutation(api.orders.remove);
  const updateOrder = useMutation(api.orders.update);
  const orderDetails = useQuery(
    api.orders.get,
    selectedOrder ? { id: selectedOrder } : "skip"
  );

  useEffect(() => {
    ensureUser().catch(() => {
      // Silently fail if user creation fails
    });
  }, [ensureUser]);

  const currentOrders = activeTab === "purchases" ? purchases : sales;

  const filteredOrders =
    currentOrders?.filter(
      (order) =>
        order.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer.toLowerCase().includes(searchQuery.toLowerCase())
    ) ?? [];

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteOrder({ id: deleteConfirm });
      toast.success("Order deleted successfully");
      setDeleteConfirm(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete order";
      toast.error(errorMessage);
    }
  };

  const handleStatusUpdate = async (orderId: Id<"orders">, newStatus: OrderStatus) => {
    try {
      await updateOrder({
        id: orderId,
        status: newStatus,
      });
      toast.success("Order status updated");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update order";
      toast.error(errorMessage);
    }
  };

  if (purchases === undefined || sales === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">
          Manage your purchases and sales
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as OrderTab)}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {activeTab === "purchases" ? "My Purchases" : "My Sales"}
                </CardTitle>
                <CardDescription>
                  {activeTab === "purchases"
                    ? "Orders you've placed from other businesses"
                    : "Orders placed by other businesses for your products"}
                </CardDescription>
              </div>
              <TabsList>
                <TabsTrigger value="purchases">Purchases</TabsTrigger>
                <TabsTrigger value="sales">Sales</TabsTrigger>
              </TabsList>
            </div>
          </CardHeader>
          <CardContent>
            <TabsContent value="purchases" className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search orders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v as OrderStatus | "all")}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  {purchases.length === 0
                    ? "No purchases yet. Start shopping in the marketplace!"
                    : "No orders match your search criteria."}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Seller</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order) => (
                        <TableRow key={order._id}>
                          <TableCell className="font-medium">{order.title}</TableCell>
                          <TableCell>{order.sellerId ? "Seller" : order.customer}</TableCell>
                          <TableCell>${order.amount.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={statusColors[order.status]}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(order.createdAt).toLocaleDateString()}
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
                                <DropdownMenuItem onClick={() => setSelectedOrder(order._id)}>
                                  <Package className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                {order.status === "pending" && (
                                  <DropdownMenuItem
                                    onClick={() => setDeleteConfirm(order._id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Cancel Order
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="sales" className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search orders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v as OrderStatus | "all")}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  {sales.length === 0
                    ? "No sales yet. List products to start selling!"
                    : "No orders match your search criteria."}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Buyer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order) => (
                        <TableRow key={order._id}>
                          <TableCell className="font-medium">{order.title}</TableCell>
                          <TableCell>{order.customer}</TableCell>
                          <TableCell>${order.amount.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={statusColors[order.status]}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(order.createdAt).toLocaleDateString()}
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
                                <DropdownMenuItem onClick={() => setSelectedOrder(order._id)}>
                                  <Package className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                {order.status === "pending" && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => handleStatusUpdate(order._id, "processing")}
                                    >
                                      Mark as Processing
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleStatusUpdate(order._id, "completed")}
                                    >
                                      Mark as Completed
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {order.status === "processing" && (
                                  <DropdownMenuItem
                                    onClick={() => handleStatusUpdate(order._id, "completed")}
                                  >
                                    Mark as Completed
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          {orderDetails ? (
            <>
              <DialogHeader>
                <DialogTitle>{orderDetails.title}</DialogTitle>
                <DialogDescription>
                  Order placed on {new Date(orderDetails.createdAt).toLocaleString()}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Status</div>
                    <Badge variant={statusColors[orderDetails.status]}>
                      {orderDetails.status.charAt(0).toUpperCase() + orderDetails.status.slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total Amount</div>
                    <div className="font-semibold">${orderDetails.amount.toLocaleString()}</div>
                  </div>
                </div>
                {orderDetails.description && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Description</div>
                    <p>{orderDetails.description}</p>
                  </div>
                )}
                {orderDetails.items && orderDetails.items.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold mb-2">Order Items</div>
                    <div className="space-y-2">
                      {orderDetails.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 border rounded"
                        >
                          <div>
                            <div className="font-medium">
                              {item.product?.name || "Unknown Product"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Quantity: {item.quantity} × ${item.price.toLocaleString()}
                            </div>
                          </div>
                          <div className="font-semibold">
                            ${(item.quantity * item.price).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button onClick={() => setSelectedOrder(null)}>Close</Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Loading Order...</DialogTitle>
                <DialogDescription>Please wait while we fetch the order details.</DialogDescription>
              </DialogHeader>
              <div className="py-8 text-center text-muted-foreground">
                Loading...
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
            >
              Keep Order
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete}>
              Cancel Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
