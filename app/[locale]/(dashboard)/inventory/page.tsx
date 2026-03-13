"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, History, Plus, Minus, PackageSearch, Boxes, AlertTriangle, XCircle, Package, Loader2 } from "lucide-react";
import { toast } from "sonner";

type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

const statusConfig: Record<StockStatus, { badge: "default" | "secondary" | "destructive"; className: string }> = {
  in_stock: { badge: "default", className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/50" },
  low_stock: { badge: "secondary", className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50" },
  out_of_stock: { badge: "destructive", className: "" },
};

const summaryCards = [
  { key: "totalProducts", icon: Boxes, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-100 dark:border-blue-900/50" },
  { key: "totalUnits", icon: Package, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-100 dark:border-emerald-900/50" },
  { key: "lowStock", icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-100 dark:border-amber-900/50" },
  { key: "outOfStock", icon: XCircle, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-100 dark:border-red-900/50" },
] as const;

export default function InventoryPage() {
  const t = useTranslations("inventory");
  const tCommon = useTranslations("common");
  const tToast = useTranslations("toast");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StockStatus | "all">("all");
  const [adjustProductId, setAdjustProductId] = useState<Id<"products"> | null>(null);
  const [historyProductId, setHistoryProductId] = useState<Id<"products"> | null>(null);
  const [thresholdProductId, setThresholdProductId] = useState<Id<"products"> | null>(null);
  const [adjustDelta, setAdjustDelta] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustType, setAdjustType] = useState<"restock" | "adjustment" | "return" | "correction">("restock");
  const [lowStockThreshold, setLowStockThreshold] = useState("");
  const [reorderQuantity, setReorderQuantity] = useState("");

  const inventory = useQuery(api.inventory.list, {
    status: statusFilter === "all" ? undefined : statusFilter,
  });
  const activityTransactions = useQuery(api.inventory.getTransactions, { limit: 50 });
  const productTransactions = useQuery(
    api.inventory.getTransactions,
    historyProductId ? { productId: historyProductId, limit: 20 } : "skip"
  );

  const adjustStock = useMutation(api.inventory.adjustStock);
  const updateThresholds = useMutation(api.inventory.updateThresholds);
  const isInventoryLoading = inventory === undefined;
  const isActivityLoading = activityTransactions === undefined;

  const filteredInventory = useMemo(() => {
    if (!inventory) return [];
    const query = searchQuery.trim().toLowerCase();
    if (!query) return inventory;
    return inventory.filter((item) => item.name.toLowerCase().includes(query) || item.sku?.toLowerCase().includes(query));
  }, [inventory, searchQuery]);

  const summary = useMemo(() => {
    if (!inventory) return { totalProducts: 0, totalUnits: 0, lowStock: 0, outOfStock: 0 };
    return inventory.reduce(
      (acc, item) => {
        acc.totalProducts += 1;
        acc.totalUnits += item.quantity;
        if (item.stockStatus === "low_stock") acc.lowStock += 1;
        if (item.stockStatus === "out_of_stock") acc.outOfStock += 1;
        return acc;
      },
      { totalProducts: 0, totalUnits: 0, lowStock: 0, outOfStock: 0 }
    );
  }, [inventory]);

  const getSummaryValue = (key: string) => {
    switch (key) {
      case "totalProducts": return summary.totalProducts;
      case "totalUnits": return summary.totalUnits;
      case "lowStock": return summary.lowStock;
      case "outOfStock": return summary.outOfStock;
      default: return 0;
    }
  };

  const resetAdjustDialog = () => {
    setAdjustDelta("");
    setAdjustReason("");
    setAdjustType("restock");
    setAdjustProductId(null);
  };

  const handleAdjust = async () => {
    if (!adjustProductId) return;
    const delta = Number(adjustDelta);
    if (!Number.isFinite(delta) || delta === 0) {
      toast.error(t("invalidAdjustment"));
      return;
    }
    try {
      await adjustStock({
        productId: adjustProductId,
        delta,
        reason: adjustReason || undefined,
        type: adjustType,
      });
      toast.success(t("adjustmentSaved"));
      resetAdjustDialog();
    } catch (error) {
      const message = error instanceof Error ? error.message : tToast("failedToUpdate");
      toast.error(message);
    }
  };

  const handleOpenThresholds = (productId: Id<"products">, currentThreshold?: number, currentReorder?: number) => {
    setThresholdProductId(productId);
    setLowStockThreshold(currentThreshold?.toString() ?? "");
    setReorderQuantity(currentReorder?.toString() ?? "");
  };

  const handleSaveThresholds = async () => {
    if (!thresholdProductId) return;
    const thresholdValue = lowStockThreshold === "" ? undefined : Number(lowStockThreshold);
    const reorderValue = reorderQuantity === "" ? undefined : Number(reorderQuantity);
    if (thresholdValue !== undefined && thresholdValue < 0) { toast.error(t("invalidThreshold")); return; }
    if (reorderValue !== undefined && reorderValue < 0) { toast.error(t("invalidReorder")); return; }
    try {
      await updateThresholds({ productId: thresholdProductId, lowStockThreshold: thresholdValue, reorderQuantity: reorderValue });
      toast.success(t("thresholdsSaved"));
      setThresholdProductId(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : tToast("failedToUpdate");
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.key} className={`border ${card.border} overflow-hidden transition-all hover:shadow-md`}>
              <CardContent className="p-4 md:p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t(`summary.${card.key}`)}
                    </p>
                    <p className="text-2xl md:text-3xl font-bold animate-count-up">
                      {getSummaryValue(card.key)}
                    </p>
                  </div>
                  <div className={`${card.bg} p-2.5 rounded-xl`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList className="bg-muted/30 p-1 rounded-xl">
          <TabsTrigger value="inventory" className="rounded-lg">{t("tabs.inventory")}</TabsTrigger>
          <TabsTrigger value="activity" className="rounded-lg">{t("tabs.activity")}</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <PackageSearch className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
              <Input
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 rounded-xl bg-muted/30 border-border/60 md:w-72"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StockStatus | "all")}>
              <SelectTrigger className="w-full md:w-[180px] h-10 rounded-xl">
                <SelectValue placeholder={t("filterStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tCommon("all")}</SelectItem>
                <SelectItem value="in_stock">{t("status.inStock")}</SelectItem>
                <SelectItem value="low_stock">{t("status.lowStock")}</SelectItem>
                <SelectItem value="out_of_stock">{t("status.outOfStock")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="border-border/60 rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="font-semibold">{t("table.product")}</TableHead>
                    <TableHead className="font-semibold">{t("table.sku")}</TableHead>
                    <TableHead className="text-right font-semibold">{t("table.onHand")}</TableHead>
                    <TableHead className="text-right font-semibold">{t("table.threshold")}</TableHead>
                    <TableHead className="font-semibold">{t("table.status")}</TableHead>
                    <TableHead className="text-right font-semibold">{t("table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isInventoryLoading && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-16 text-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
                        <span className="text-sm text-muted-foreground">{tCommon("loading")}</span>
                      </TableCell>
                    </TableRow>
                  )}
                  {!isInventoryLoading && filteredInventory.map((item) => (
                    <TableRow key={item._id} className="hover:bg-muted/20">
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{item.sku ? item.sku : t("noSku")}</TableCell>
                      <TableCell className="text-right font-semibold">{item.quantity}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{item.lowStockThreshold ?? 0}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`rounded-lg text-xs font-medium ${statusConfig[item.stockStatus]?.className || ""}`}>
                          {t(`status.${item.stockStatus}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="outline" size="sm" className="rounded-lg h-8" onClick={() => setAdjustProductId(item._id)}>
                            <Pencil className="mr-1 h-3.5 w-3.5" />
                            {t("actions.adjust")}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleOpenThresholds(item._id, item.lowStockThreshold, item.reorderQuantity)}>
                            <PackageSearch className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setHistoryProductId(item._id)}>
                            <History className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!isInventoryLoading && filteredInventory.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-16 text-center text-muted-foreground">
                        {t("noResults")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card className="border-border/60 rounded-2xl overflow-hidden">
            <CardHeader>
              <CardTitle>{t("activityTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="font-semibold">{t("activity.date")}</TableHead>
                    <TableHead className="font-semibold">{t("activity.product")}</TableHead>
                    <TableHead className="font-semibold">{t("activity.type")}</TableHead>
                    <TableHead className="text-right font-semibold">{t("activity.quantity")}</TableHead>
                    <TableHead className="text-right font-semibold">{t("activity.newQuantity")}</TableHead>
                    <TableHead className="font-semibold">{t("activity.reason")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isActivityLoading && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-16 text-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
                        <span className="text-sm text-muted-foreground">{tCommon("loading")}</span>
                      </TableCell>
                    </TableRow>
                  )}
                  {!isActivityLoading && (activityTransactions ?? []).map((tx) => (
                    <TableRow key={tx._id} className="hover:bg-muted/20">
                      <TableCell className="text-sm">{new Date(tx.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="font-medium text-sm">
                        {tx.productName ? `${tx.productName}${tx.productSku ? ` (${tx.productSku})` : ""}` : tx.productId}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-lg text-xs">{t(`types.${tx.type}`)}</Badge>
                      </TableCell>
                      <TableCell className={`text-right font-medium ${tx.direction === "out" ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                        {tx.direction === "out" ? "-" : "+"}{tx.quantity}
                      </TableCell>
                      <TableCell className="text-right font-semibold">{tx.newQuantity}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{tx.reason ?? t("activity.none")}</TableCell>
                    </TableRow>
                  ))}
                  {!isActivityLoading && (activityTransactions ?? []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-16 text-center text-muted-foreground">
                        {t("activity.empty")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Adjust Stock Dialog */}
      <Dialog open={adjustProductId !== null} onOpenChange={(open) => !open && resetAdjustDialog()}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("adjustDialog.title")}</DialogTitle>
            <DialogDescription>{t("adjustDialog.description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="adjustType">{t("adjustDialog.type")}</Label>
              <Select value={adjustType} onValueChange={(value) => setAdjustType(value as typeof adjustType)}>
                <SelectTrigger id="adjustType" className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="restock">{t("types.restock")}</SelectItem>
                  <SelectItem value="adjustment">{t("types.adjustment")}</SelectItem>
                  <SelectItem value="return">{t("types.return")}</SelectItem>
                  <SelectItem value="correction">{t("types.correction")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="adjustDelta">{t("adjustDialog.delta")}</Label>
              <Input id="adjustDelta" type="number" value={adjustDelta} onChange={(e) => setAdjustDelta(e.target.value)} placeholder={t("adjustDialog.deltaPlaceholder")} className="rounded-xl" />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setAdjustDelta("1")}>
                  <Plus className="mr-1 h-3.5 w-3.5" />{t("adjustDialog.quickAdd")}
                </Button>
                <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setAdjustDelta("-1")}>
                  <Minus className="mr-1 h-3.5 w-3.5" />{t("adjustDialog.quickRemove")}
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="adjustReason">{t("adjustDialog.reason")}</Label>
              <Input id="adjustReason" value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} placeholder={t("adjustDialog.reasonPlaceholder")} className="rounded-xl" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={resetAdjustDialog} className="rounded-xl">{tCommon("cancel")}</Button>
            <Button onClick={handleAdjust} className="rounded-xl">{t("adjustDialog.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyProductId !== null} onOpenChange={(open) => !open && setHistoryProductId(null)}>
        <DialogContent className="max-w-3xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("historyDialog.title")}</DialogTitle>
            <DialogDescription>{t("historyDialog.description")}</DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="font-semibold">{t("activity.date")}</TableHead>
                  <TableHead className="font-semibold">{t("activity.type")}</TableHead>
                  <TableHead className="text-right font-semibold">{t("activity.quantity")}</TableHead>
                  <TableHead className="text-right font-semibold">{t("activity.newQuantity")}</TableHead>
                  <TableHead className="font-semibold">{t("activity.reason")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(productTransactions ?? []).map((tx) => (
                  <TableRow key={tx._id}>
                    <TableCell className="text-sm">{new Date(tx.createdAt).toLocaleString()}</TableCell>
                    <TableCell><Badge variant="outline" className="rounded-lg text-xs">{t(`types.${tx.type}`)}</Badge></TableCell>
                    <TableCell className={`text-right font-medium ${tx.direction === "out" ? "text-red-600" : "text-green-600"}`}>
                      {tx.direction === "out" ? "-" : "+"}{tx.quantity}
                    </TableCell>
                    <TableCell className="text-right font-semibold">{tx.newQuantity}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{tx.reason ?? t("activity.none")}</TableCell>
                  </TableRow>
                ))}
                {(productTransactions ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">{t("activity.empty")}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Thresholds Dialog */}
      <Dialog open={thresholdProductId !== null} onOpenChange={(open) => !open && setThresholdProductId(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("thresholdDialog.title")}</DialogTitle>
            <DialogDescription>{t("thresholdDialog.description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="lowStockThreshold">{t("thresholdDialog.lowStock")}</Label>
              <Input id="lowStockThreshold" type="number" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} placeholder={t("thresholdDialog.lowStockPlaceholder")} className="rounded-xl" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reorderQuantity">{t("thresholdDialog.reorder")}</Label>
              <Input id="reorderQuantity" type="number" value={reorderQuantity} onChange={(e) => setReorderQuantity(e.target.value)} placeholder={t("thresholdDialog.reorderPlaceholder")} className="rounded-xl" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setThresholdProductId(null)} className="rounded-xl">{tCommon("cancel")}</Button>
            <Button onClick={handleSaveThresholds} className="rounded-xl">{t("thresholdDialog.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
