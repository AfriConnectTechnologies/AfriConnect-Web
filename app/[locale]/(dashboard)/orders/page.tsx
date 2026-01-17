"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useTranslations } from "next-intl";
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
import { Search, Trash2, Package, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { COMMERCE_ENABLED } from "@/lib/features";
import { ComingSoonPage } from "@/components/ui/coming-soon";

type OrderStatus = "pending" | "processing" | "completed" | "cancelled";
type OrderTab = "purchases" | "sales";

const statusColors: Record<OrderStatus, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "secondary",
  processing: "default",
  completed: "outline",
  cancelled: "destructive",
};

export default function OrdersPage() {
  const t = useTranslations("orders");
  const tCommon = useTranslations("common");
  const tToast = useTranslations("toast");
  
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
      toast.success(tToast("orderDeleted"));
      setDeleteConfirm(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : tToast("failedToDeleteOrder");
      toast.error(errorMessage);
    }
  };

  const handleStatusUpdate = async (orderId: Id<"orders">, newStatus: OrderStatus) => {
    try {
      await updateOrder({
        id: orderId,
        status: newStatus,
      });
      toast.success(tToast("orderStatusUpdated"));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : tToast("failedToUpdateOrder");
      toast.error(errorMessage);
    }
  };

  if (!COMMERCE_ENABLED) {
    return (
      <ComingSoonPage
        title={t("title")}
        description={t("trackAndManage")}
        icon={<ShoppingBag className="h-8 w-8 text-primary" />}
      />
    );
  }

  if (purchases === undefined || sales === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">{tCommon("loading")}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("description")}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as OrderTab)}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {activeTab === "purchases" ? t("myPurchases") : t("mySales")}
                </CardTitle>
                <CardDescription>
                  {activeTab === "purchases"
                    ? t("purchasesDescription")
                    : t("salesDescription")}
                </CardDescription>
              </div>
              <TabsList>
                <TabsTrigger value="purchases">{t("purchases")}</TabsTrigger>
                <TabsTrigger value="sales">{t("sales")}</TabsTrigger>
              </TabsList>
            </div>
          </CardHeader>
          <CardContent>
            <TabsContent value="purchases" className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row">
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
                  onValueChange={(v) => setStatusFilter(v as OrderStatus | "all")}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder={t("filterByStatus")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allStatuses")}</SelectItem>
                    <SelectItem value="pending">{t("pending")}</SelectItem>
                    <SelectItem value="processing">{t("processing")}</SelectItem>
                    <SelectItem value="completed">{t("completed")}</SelectItem>
                    <SelectItem value="cancelled">{t("cancelled")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  {purchases.length === 0
                    ? t("noPurchasesYet")
                    : t("noMatchingOrders")}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("order")}</TableHead>
                        <TableHead>{t("seller")}</TableHead>
                        <TableHead>{t("amount")}</TableHead>
                        <TableHead>{tCommon("status")}</TableHead>
                        <TableHead>{tCommon("created")}</TableHead>
                        <TableHead className="text-right">{tCommon("actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order) => (
                        <TableRow key={order._id}>
                          <TableCell className="font-medium">{order.title}</TableCell>
                          <TableCell>{order.sellerId ? t("seller") : order.customer}</TableCell>
                          <TableCell>${order.amount.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={statusColors[order.status]}>
                              {t(order.status)}
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
                                  {tCommon("viewDetails")}
                                </DropdownMenuItem>
                                {order.status === "pending" && (
                                  <DropdownMenuItem
                                    onClick={() => setDeleteConfirm(order._id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {t("cancelOrder")}
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
                    placeholder={t("searchPlaceholder")}
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
                    <SelectValue placeholder={t("filterByStatus")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allStatuses")}</SelectItem>
                    <SelectItem value="pending">{t("pending")}</SelectItem>
                    <SelectItem value="processing">{t("processing")}</SelectItem>
                    <SelectItem value="completed">{t("completed")}</SelectItem>
                    <SelectItem value="cancelled">{t("cancelled")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  {sales.length === 0
                    ? t("noSalesYet")
                    : t("noMatchingOrders")}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("order")}</TableHead>
                        <TableHead>{t("buyer")}</TableHead>
                        <TableHead>{t("amount")}</TableHead>
                        <TableHead>{tCommon("status")}</TableHead>
                        <TableHead>{tCommon("created")}</TableHead>
                        <TableHead className="text-right">{tCommon("actions")}</TableHead>
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
                              {t(order.status)}
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
                                  {tCommon("viewDetails")}
                                </DropdownMenuItem>
                                {order.status === "pending" && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => handleStatusUpdate(order._id, "processing")}
                                    >
                                      {t("markAsProcessing")}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleStatusUpdate(order._id, "completed")}
                                    >
                                      {t("markAsCompleted")}
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {order.status === "processing" && (
                                  <DropdownMenuItem
                                    onClick={() => handleStatusUpdate(order._id, "completed")}
                                  >
                                    {t("markAsCompleted")}
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
                  {t("orderPlacedOn", { date: new Date(orderDetails.createdAt).toLocaleString() })}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">{tCommon("status")}</div>
                    <Badge variant={statusColors[orderDetails.status]}>
                      {t(orderDetails.status)}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">{t("totalAmount")}</div>
                    <div className="font-semibold">${orderDetails.amount.toLocaleString()}</div>
                  </div>
                </div>
                {orderDetails.description && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">{tCommon("details")}</div>
                    <p>{orderDetails.description}</p>
                  </div>
                )}
                {orderDetails.items && orderDetails.items.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold mb-2">{t("orderItems")}</div>
                    <div className="space-y-2">
                      {orderDetails.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 border rounded"
                        >
                          <div>
                            <div className="font-medium">
                              {item.product?.name || t("unknownProduct")}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {item.quantity} × ${item.price.toLocaleString()}
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
                <Button onClick={() => setSelectedOrder(null)}>{tCommon("close")}</Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{t("loadingOrder")}</DialogTitle>
                <DialogDescription>{t("loadingOrderDetails")}</DialogDescription>
              </DialogHeader>
              <div className="py-8 text-center text-muted-foreground">
                {tCommon("loading")}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("cancelOrder")}</DialogTitle>
            <DialogDescription>
              {t("cancelOrderConfirmation")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
            >
              {t("keepOrder")}
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete}>
              {t("cancelOrder")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
