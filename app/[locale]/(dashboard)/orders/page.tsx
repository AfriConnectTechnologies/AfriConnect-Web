"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Search, Trash2, Package, ShoppingBag, Loader2 } from "lucide-react";
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
type PayoutStatus = "pending" | "approved" | "queued" | "success" | "failed" | "reverted";

const statusStyles: Record<OrderStatus, { variant: "default" | "secondary" | "outline" | "destructive"; className: string }> = {
  pending: { variant: "secondary", className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50" },
  processing: { variant: "default", className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50" },
  completed: { variant: "outline", className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/50" },
  cancelled: { variant: "destructive", className: "" },
};

const payoutStatusStyles: Record<PayoutStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400",
  approved: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400",
  queued: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400",
  success: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400",
  failed: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400",
  reverted: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400",
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
  const [payoutProcessing, setPayoutProcessing] = useState<string | null>(null);

  const ensureUser = useMutation(api.users.ensureUser);
  const purchases = useQuery(api.orders.purchases, {
    status: statusFilter !== "all" ? statusFilter : undefined,
  });
  const sales = useQuery(api.orders.sales, {
    status: statusFilter !== "all" ? statusFilter : undefined,
  });
  const payouts = useQuery(api.payouts.listForSeller);
  const deleteOrder = useMutation(api.orders.remove);
  const updateOrder = useMutation(api.orders.update);
  const completeBySeller = useMutation(api.orders.completeBySeller);
  const orderDetails = useQuery(
    api.orders.get,
    selectedOrder ? { id: selectedOrder } : "skip"
  );
  const orderPayout = useQuery(
    api.payouts.getByOrder,
    selectedOrder ? { orderId: selectedOrder } : "skip"
  );

  useEffect(() => {
    ensureUser().catch(() => {});
  }, [ensureUser]);

  const currentOrders = activeTab === "purchases" ? purchases : sales;

  const filteredOrders =
    currentOrders?.filter(
      (order) =>
        order.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer.toLowerCase().includes(searchQuery.toLowerCase())
    ) ?? [];

  const payoutByOrderId = useMemo(() => {
    type PayoutType = NonNullable<typeof payouts>[number];
    const map = new Map<string, PayoutType>();
    payouts?.forEach((payout: PayoutType) => {
      map.set(payout.orderId.toString(), payout);
    });
    return map;
  }, [payouts]);

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
      if (newStatus === "completed" && activeTab === "sales") {
        await completeBySeller({ id: orderId });
        toast.success(tToast("orderStatusUpdated"));

        setPayoutProcessing(orderId.toString());
        const response = await fetch("/api/payouts/transfer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || "Failed to initiate payout");
        }
      } else {
        await updateOrder({ id: orderId, status: newStatus });
        toast.success(tToast("orderStatusUpdated"));
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : tToast("failedToUpdateOrder");
      toast.error(errorMessage);
    } finally {
      setPayoutProcessing(null);
    }
  };

  const handleRetryPayout = async (orderId: Id<"orders">) => {
    setPayoutProcessing(orderId.toString());
    try {
      const response = await fetch("/api/payouts/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to retry payout");
      }
      toast.success("Payout retry initiated");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to retry payout";
      toast.error(errorMessage);
    } finally {
      setPayoutProcessing(null);
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
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>
      </div>
    );
  }

  const renderOrdersTable = (orders: typeof filteredOrders, emptyMessage: string, isSales: boolean) => (
    <>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 rounded-xl bg-muted/30 border-border/60"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as OrderStatus | "all")}>
          <SelectTrigger className="w-full sm:w-[180px] h-10 rounded-xl">
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

      {orders.length === 0 ? (
        <div className="py-16 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
            <ShoppingBag className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-semibold">{t("order")}</TableHead>
                <TableHead className="font-semibold">{isSales ? t("buyer") : t("seller")}</TableHead>
                <TableHead className="font-semibold">{t("amount")}</TableHead>
                <TableHead className="font-semibold">{tCommon("status")}</TableHead>
                {isSales && <TableHead className="font-semibold">Payout</TableHead>}
                <TableHead className="font-semibold">{tCommon("created")}</TableHead>
                <TableHead className="text-right font-semibold">{tCommon("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order._id} className="hover:bg-muted/20">
                  <TableCell className="font-medium">{order.title}</TableCell>
                  <TableCell className="text-muted-foreground">{isSales ? order.customer : (order.sellerId ? t("seller") : order.customer)}</TableCell>
                  <TableCell className="font-semibold">${order.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`rounded-lg text-xs font-medium ${statusStyles[order.status].className}`}>
                      {t(order.status)}
                    </Badge>
                  </TableCell>
                  {isSales && (
                    <TableCell>
                      {(() => {
                        const payout = payoutByOrderId.get(order._id.toString());
                        if (!payout) return <span className="text-xs text-muted-foreground">Not started</span>;
                        return (
                          <Badge variant="outline" className={`rounded-lg text-xs font-medium ${payoutStatusStyles[payout.status as PayoutStatus] || ""}`}>
                            {payout.status}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                  )}
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                          <span className="sr-only">Open menu</span>
                          <span>&#8230;</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem onClick={() => setSelectedOrder(order._id)} className="rounded-lg">
                          <Package className="mr-2 h-4 w-4" />
                          {tCommon("viewDetails")}
                        </DropdownMenuItem>
                        {!isSales && order.status === "pending" && (
                          <DropdownMenuItem onClick={() => setDeleteConfirm(order._id)} className="text-destructive rounded-lg">
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t("cancelOrder")}
                          </DropdownMenuItem>
                        )}
                        {isSales && order.status === "pending" && (
                          <>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(order._id, "processing")} className="rounded-lg">
                              {t("markAsProcessing")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(order._id, "completed")} className="rounded-lg">
                              {payoutProcessing === order._id.toString() ? "Processing..." : t("markAsCompleted")}
                            </DropdownMenuItem>
                          </>
                        )}
                        {isSales && order.status === "processing" && (
                          <DropdownMenuItem onClick={() => handleStatusUpdate(order._id, "completed")} className="rounded-lg">
                            {payoutProcessing === order._id.toString() ? "Processing..." : t("markAsCompleted")}
                          </DropdownMenuItem>
                        )}
                        {(() => {
                          const payout = payoutByOrderId.get(order._id.toString());
                          if (isSales && order.status === "completed" && payout?.status === "failed") {
                            return (
                              <DropdownMenuItem onClick={() => handleRetryPayout(order._id)} className="rounded-lg">
                                Retry payout
                              </DropdownMenuItem>
                            );
                          }
                          return null;
                        })()}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as OrderTab)}>
        <Card className="border-border/60 rounded-2xl overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>{activeTab === "purchases" ? t("myPurchases") : t("mySales")}</CardTitle>
                <CardDescription className="mt-1">
                  {activeTab === "purchases" ? t("purchasesDescription") : t("salesDescription")}
                </CardDescription>
              </div>
              <TabsList className="bg-muted/30 p-1 rounded-xl">
                <TabsTrigger value="purchases" className="rounded-lg text-sm">{t("purchases")}</TabsTrigger>
                <TabsTrigger value="sales" className="rounded-lg text-sm">{t("sales")}</TabsTrigger>
              </TabsList>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <TabsContent value="purchases" className="space-y-4 mt-0">
              {renderOrdersTable(
                filteredOrders,
                purchases.length === 0 ? t("noPurchasesYet") : t("noMatchingOrders"),
                false
              )}
            </TabsContent>
            <TabsContent value="sales" className="space-y-4 mt-0">
              {renderOrdersTable(
                filteredOrders,
                sales.length === 0 ? t("noSalesYet") : t("noMatchingOrders"),
                true
              )}
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl rounded-2xl">
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
                  <div className="bg-muted/30 rounded-xl p-3">
                    <div className="text-xs text-muted-foreground mb-1">{tCommon("status")}</div>
                    <Badge variant="outline" className={`rounded-lg text-xs font-medium ${statusStyles[orderDetails.status].className}`}>
                      {t(orderDetails.status)}
                    </Badge>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-3">
                    <div className="text-xs text-muted-foreground mb-1">{t("totalAmount")}</div>
                    <div className="font-bold text-lg">${orderDetails.amount.toLocaleString()}</div>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-3">
                    <div className="text-xs text-muted-foreground mb-1">Payout</div>
                    {orderPayout === undefined ? (
                      <span className="text-muted-foreground text-sm">{tCommon("loading")}</span>
                    ) : orderPayout ? (
                      <Badge variant="outline" className={`rounded-lg text-xs font-medium ${payoutStatusStyles[orderPayout.status as PayoutStatus] || ""}`}>
                        {orderPayout.status}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">Not started</span>
                    )}
                  </div>
                </div>
                {orderDetails.description && (
                  <div className="bg-muted/30 rounded-xl p-4">
                    <div className="text-xs text-muted-foreground mb-1">{tCommon("details")}</div>
                    <p className="text-sm">{orderDetails.description}</p>
                  </div>
                )}
                {orderDetails.items && orderDetails.items.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold mb-2">{t("orderItems")}</div>
                    <div className="space-y-2">
                      {orderDetails.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 border border-border/60 rounded-xl">
                          <div>
                            <div className="font-medium text-sm">{item.product?.name || t("unknownProduct")}</div>
                            <div className="text-xs text-muted-foreground">{item.quantity} x ${item.price.toLocaleString()}</div>
                          </div>
                          <div className="font-semibold">${(item.quantity * item.price).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {orderPayout && (
                  <div className="border-t pt-4">
                    <div className="text-sm font-semibold mb-3">Payout Breakdown</div>
                    <div className="grid grid-cols-2 gap-2 text-sm bg-muted/30 rounded-xl p-4">
                      <span className="text-muted-foreground">Gross Amount:</span>
                      <span className="text-right font-medium">${orderPayout.amountGross.toLocaleString()}</span>
                      <span className="text-muted-foreground">Platform Fee (1%):</span>
                      <span className="text-right text-destructive">-${orderPayout.platformFeeSeller.toLocaleString()}</span>
                      <span className="text-muted-foreground">Processor Fee:</span>
                      <span className="text-right text-destructive">-${orderPayout.processorFeeAllocated.toLocaleString()}</span>
                      <span className="font-semibold pt-2 border-t">Net Payout:</span>
                      <span className="font-bold text-right pt-2 border-t">${orderPayout.amountNet.toLocaleString()}</span>
                    </div>
                    {orderPayout.reference && (
                      <div className="mt-3 text-xs text-muted-foreground">Reference: {orderPayout.reference}</div>
                    )}
                    {orderPayout.lastError && (
                      <div className="mt-2 text-xs text-destructive bg-destructive/5 rounded-lg p-2">Error: {orderPayout.lastError}</div>
                    )}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button onClick={() => setSelectedOrder(null)} className="rounded-xl">{tCommon("close")}</Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{t("loadingOrder")}</DialogTitle>
                <DialogDescription>{t("loadingOrderDetails")}</DialogDescription>
              </DialogHeader>
              <div className="py-8 flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("cancelOrder")}</DialogTitle>
            <DialogDescription>{t("cancelOrderConfirmation")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setDeleteConfirm(null)} className="rounded-xl">
              {t("keepOrder")}
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} className="rounded-xl">
              {t("cancelOrder")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
