import { query } from "./_generated/server";
import { requireUser } from "./helpers";

const SETTLED_PAYMENT_STATUSES = new Set([
  "success",
  "refunded",
  "partially_refunded",
]);

const TERMINAL_ORDER_STATUSES = new Set(["completed", "cancelled"]);
const RESOLVED_PAYOUT_STATUSES = new Set(["success", "failed", "reverted"]);

function roundToTwo(value: number) {
  return Math.round(value * 100) / 100;
}

function toPercent(numerator: number, denominator: number) {
  if (denominator <= 0) {
    return 0;
  }

  return roundToTwo((numerator / denominator) * 100);
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function startOfWindow(days: number, now: number) {
  return now - days * 24 * 60 * 60 * 1000;
}

type BuyerAggregate = {
  buyerId: string;
  name: string;
  orderCount: number;
  revenue: number;
  country: string | null;
  category: string | null;
  hasBusinessMetadata: boolean;
};

export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    if (!user.businessId) {
      return {
        access: {
          state: "no_business",
          title: "Register your business",
          message:
            "A digital credit profile becomes available after you register and verify a business.",
        },
        business: null,
        reportMeta: null,
        profile: null,
      } as const;
    }

    const business = await ctx.db.get(user.businessId);
    if (!business) {
      return {
        access: {
          state: "no_business",
          title: "Business record not found",
          message:
            "Your account is linked to a business record that is no longer available.",
        },
        business: null,
        reportMeta: null,
        profile: null,
      } as const;
    }

    if (business.verificationStatus !== "verified") {
      return {
        access: {
          state:
            business.verificationStatus === "rejected"
              ? "rejected_verification"
              : "pending_verification",
          title:
            business.verificationStatus === "rejected"
              ? "Verification required"
              : "Verification in progress",
          message:
            business.verificationStatus === "rejected"
              ? "Resolve your business verification first to unlock the digital credit profile."
              : "Your digital credit profile will unlock once the business is verified.",
        },
        business: {
          id: business._id,
          name: business.name,
          category: business.category,
          country: business.country,
          verificationStatus: business.verificationStatus,
          createdAt: business.createdAt,
        },
        reportMeta: null,
        profile: null,
      } as const;
    }

    if (user.role !== "seller" && user.role !== "admin") {
      return {
        access: {
          state: "not_seller",
          title: "Seller access required",
          message:
            "Only verified seller accounts can access the digital credit profile.",
        },
        business: {
          id: business._id,
          name: business.name,
          category: business.category,
          country: business.country,
          verificationStatus: business.verificationStatus,
          createdAt: business.createdAt,
        },
        reportMeta: null,
        profile: null,
      } as const;
    }

    const now = Date.now();
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_seller", (q) => q.eq("sellerId", user.clerkId))
      .collect();
    const payouts = await ctx.db
      .query("payouts")
      .withIndex("by_seller", (q) => q.eq("sellerId", user.clerkId))
      .collect();

    const payoutByOrderId = new Map(
      payouts.map((payout) => [payout.orderId.toString(), payout])
    );

    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        const payment = order.paymentId ? await ctx.db.get(order.paymentId) : null;
        const buyerDocId = ctx.db.normalizeId(
          "users",
          (order.buyerId ?? order.userId) as string
        );
        const buyer = buyerDocId ? await ctx.db.get(buyerDocId) : null;
        const buyerBusiness = buyer?.businessId
          ? await ctx.db.get(buyer.businessId)
          : null;

        return {
          ...order,
          payment,
          payout: payoutByOrderId.get(order._id.toString()) ?? null,
          buyer,
          buyerBusiness,
        };
      })
    );

    const sortedOrders = enrichedOrders.sort((a, b) => b.createdAt - a.createdAt);
    const paidOrders = sortedOrders.filter(
      (order) => order.payment && SETTLED_PAYMENT_STATUSES.has(order.payment.status)
    );
    const ordersWithPayments = sortedOrders.filter((order) => Boolean(order.payment));
    const terminalOrders = sortedOrders.filter((order) =>
      TERMINAL_ORDER_STATUSES.has(order.status)
    );
    const resolvedPayouts = payouts.filter((payout) =>
      RESOLVED_PAYOUT_STATUSES.has(payout.status)
    );

    const totalTransactionVolume = paidOrders.reduce(
      (sum, order) => sum + order.amount,
      0
    );
    const averageOrderValue =
      paidOrders.length > 0 ? roundToTwo(totalTransactionVolume / paidOrders.length) : 0;

    const buyerAggregates = new Map<string, BuyerAggregate>();
    for (const order of paidOrders) {
      const buyerKey =
        order.buyer?._id?.toString() ??
        (order.buyerId as string | undefined) ??
        order.userId.toString();
      const existing = buyerAggregates.get(buyerKey);
      const buyerName =
        order.buyerBusiness?.name ??
        "Unknown Buyer";

      if (existing) {
        existing.orderCount += 1;
        existing.revenue += order.amount;
        if (!existing.country && order.buyerBusiness?.country) {
          existing.country = order.buyerBusiness.country;
        }
        if (!existing.category && order.buyerBusiness?.category) {
          existing.category = order.buyerBusiness.category;
        }
        existing.hasBusinessMetadata =
          existing.hasBusinessMetadata || Boolean(order.buyerBusiness);
      } else {
        buyerAggregates.set(buyerKey, {
          buyerId: buyerKey,
          name: buyerName,
          orderCount: 1,
          revenue: order.amount,
          country: order.buyerBusiness?.country ?? null,
          category: order.buyerBusiness?.category ?? null,
          hasBusinessMetadata: Boolean(order.buyerBusiness),
        });
      }
    }

    const buyers = Array.from(buyerAggregates.values()).sort(
      (a, b) => b.revenue - a.revenue
    );
    const buyersWithBusinessMetadata = buyers.filter(
      (buyer) => buyer.hasBusinessMetadata
    ).length;
    const repeatBuyers = buyers.filter((buyer) => buyer.orderCount > 1).length;
    const topBuyerRevenue = buyers[0]?.revenue ?? 0;

    const countryCounts = new Map<string, number>();
    const categoryCounts = new Map<string, number>();

    for (const buyer of buyers) {
      if (buyer.country) {
        countryCounts.set(buyer.country, (countryCounts.get(buyer.country) ?? 0) + 1);
      }
      if (buyer.category) {
        categoryCounts.set(
          buyer.category,
          (categoryCounts.get(buyer.category) ?? 0) + 1
        );
      }
    }

    const countryBreakdown = Array.from(countryCounts.entries())
      .map(([country, count]) => ({
        label: country,
        count,
        share: toPercent(count, buyersWithBusinessMetadata),
      }))
      .sort((a, b) => b.count - a.count);
    const categoryBreakdown = Array.from(categoryCounts.entries())
      .map(([category, count]) => ({
        label: category,
        count,
        share: toPercent(count, buyersWithBusinessMetadata),
      }))
      .sort((a, b) => b.count - a.count);

    const fulfillmentCycleDays = terminalOrders.map((order) =>
      (order.updatedAt - order.createdAt) / (24 * 60 * 60 * 1000)
    );
    const lastPaidOrder = paidOrders[0] ?? null;
    const reportStart =
      sortedOrders.length > 0
        ? Math.min(...sortedOrders.map((order) => order.createdAt))
        : null;
    const reportEnd =
      sortedOrders.length > 0
        ? Math.max(...sortedOrders.map((order) => order.updatedAt))
        : null;

    return {
      access: {
        state: "ready",
        title: "Ready",
        message: "Your digital credit profile is available.",
      },
      business: {
        id: business._id,
        name: business.name,
        category: business.category,
        country: business.country,
        verificationStatus: business.verificationStatus,
        createdAt: business.createdAt,
      },
      reportMeta: {
        generatedAt: now,
        reportStart,
        reportEnd,
      },
      profile: {
        profileSummary: {
          ordersCount: sortedOrders.length,
          paidOrdersCount: paidOrders.length,
          uniqueBuyers: buyers.length,
          countriesRepresented: countryBreakdown.length,
          totalTransactionVolume,
        },
        transactionHistory: {
          totalOrders: sortedOrders.length,
          paidOrders: paidOrders.length,
          totalTransactionVolume,
          averageOrderValue,
          successfulPaymentRate: toPercent(
            paidOrders.length,
            ordersWithPayments.length
          ),
          recentPaidActivityAt: lastPaidOrder?.updatedAt ?? null,
          trend: [30, 90, 180].map((days) => {
            const windowStart = startOfWindow(days, now);
            const windowOrders = sortedOrders.filter(
              (order) => order.createdAt >= windowStart
            );
            const windowPaidOrders = windowOrders.filter(
              (order) =>
                order.payment && SETTLED_PAYMENT_STATUSES.has(order.payment.status)
            );

            return {
              label: `${days} days`,
              days,
              orderCount: windowOrders.length,
              paidOrderCount: windowPaidOrders.length,
              paidVolume: windowPaidOrders.reduce(
                (sum, order) => sum + order.amount,
                0
              ),
            };
          }),
        },
        fulfillment: {
          totalOrders: sortedOrders.length,
          processingOrders: sortedOrders.filter((order) => order.status === "processing")
            .length,
          completionRate: toPercent(
            sortedOrders.filter((order) => order.status === "completed").length,
            sortedOrders.length
          ),
          cancellationRate: toPercent(
            sortedOrders.filter((order) => order.status === "cancelled").length,
            sortedOrders.length
          ),
          averageFulfillmentCycleDays: roundToTwo(average(fulfillmentCycleDays)),
          payoutSuccessRate: toPercent(
            payouts.filter((payout) => payout.status === "success").length,
            resolvedPayouts.length
          ),
          payoutStatusCounts: {
            pending: payouts.filter((payout) => payout.status === "pending").length,
            queued: payouts.filter((payout) => payout.status === "queued").length,
            success: payouts.filter((payout) => payout.status === "success").length,
            failed: payouts.filter((payout) => payout.status === "failed").length,
            reverted: payouts.filter((payout) => payout.status === "reverted").length,
          },
        },
        buyerDiversity: {
          uniqueBuyers: buyers.length,
          repeatBuyers,
          buyerBusinessCoverageRate: toPercent(
            buyersWithBusinessMetadata,
            buyers.length
          ),
          buyersWithBusinessMetadata,
          topBuyerConcentrationRate: toPercent(
            topBuyerRevenue,
            totalTransactionVolume
          ),
          countries: countryBreakdown,
          categories: categoryBreakdown,
          topBuyers: buyers.slice(0, 5).map((buyer) => ({
            name: buyer.name,
            orderCount: buyer.orderCount,
            revenue: roundToTwo(buyer.revenue),
          })),
          coverageNote:
            buyersWithBusinessMetadata === buyers.length
              ? "Buyer diversity is based on linked buyer business records."
              : "Buyer diversity is based only on buyers with linked business records, so some buyers are excluded from the diversity mix.",
        },
      },
    } as const;
  },
});
