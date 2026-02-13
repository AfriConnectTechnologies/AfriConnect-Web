import { initTRPC } from "@trpc/server";
import { z } from "zod";
import type { Context } from "./context";
import * as inventory from "../domain/inventory";
import * as directory from "../domain/directory";
import * as stats from "../domain/stats";
import * as chat from "../domain/chat";
import * as paymentAuditLogs from "../domain/paymentAuditLogs";
import * as businesses from "../domain/businesses";
import * as products from "../domain/products";
import * as orders from "../domain/orders";
import * as subscriptionPlans from "../domain/subscriptionPlans";
import * as subscriptions from "../domain/subscriptions";
import * as originCalculations from "../domain/originCalculations";
import * as compliance from "../domain/compliance";
import * as users from "../domain/users";
import * as payments from "../domain/payments";
import * as verification from "../domain/verification";
import * as cart from "../domain/cart";
import * as productImages from "../domain/productImages";

const t = initTRPC.context<Context>().create();
const router = t.router;
const publicProcedure = t.procedure;
const anyInput = z.any().optional();

const inventoryRouter = router({
  list: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return inventory.list(domainCtx, input ?? {});
  }),
  getTransactions: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return inventory.getTransactions(domainCtx, input ?? {});
  }),
  adjustStock: publicProcedure.input(anyInput).mutation(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return inventory.adjustStock(domainCtx, input ?? {});
  }),
  updateThresholds: publicProcedure.input(anyInput).mutation(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return inventory.updateThresholds(domainCtx, input ?? {});
  }),
});

const directoryRouter = router({
  listBusinesses: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return directory.listBusinesses(domainCtx, input ?? {});
  }),
  getBusiness: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return directory.getBusiness(domainCtx, input ?? {});
  }),
  getBusinessProducts: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return directory.getBusinessProducts(domainCtx, input ?? {});
  }),
  getBusinessStats: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return directory.getBusinessStats(domainCtx, input ?? {});
  }),
  getCountries: publicProcedure.input(anyInput).query(async ({ ctx }) => {
    const domainCtx = { auth: ctx.auth };
    return directory.getCountries(domainCtx);
  }),
  getCategories: publicProcedure.input(anyInput).query(async ({ ctx }) => {
    const domainCtx = { auth: ctx.auth };
    return directory.getCategories(domainCtx);
  }),
  searchBusinesses: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return directory.searchBusinesses(domainCtx, input ?? {});
  }),
});

const statsRouter = router({
  getDashboardStats: publicProcedure.input(anyInput).query(async ({ ctx }) => {
    const domainCtx = { auth: ctx.auth };
    return stats.getDashboardStats(domainCtx);
  }),
});

const chatRouter = router({
  getProductChannelInfo: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return chat.getProductChannelInfo(domainCtx, input ?? {});
  }),
  getBusinessChannelInfo: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return chat.getBusinessChannelInfo(domainCtx, input ?? {});
  }),
  reportConversation: publicProcedure.input(anyInput).mutation(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return chat.reportConversation(domainCtx, input ?? {});
  }),
  listChatReports: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return chat.listChatReports(domainCtx, input ?? {});
  }),
  updateReportStatus: publicProcedure.input(anyInput).mutation(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return chat.updateReportStatus(domainCtx, input ?? {});
  }),
  getStreamUserId: publicProcedure.input(anyInput).query(async ({ ctx }) => {
    const domainCtx = { auth: ctx.auth };
    return chat.getStreamUserId(domainCtx);
  }),
  deleteChannelReports: publicProcedure.input(anyInput).mutation(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return chat.deleteChannelReports(domainCtx, input ?? {});
  }),
});

const paymentAuditLogsRouter = router({
  create: publicProcedure.input(anyInput).mutation(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return paymentAuditLogs.create(domainCtx, input ?? {});
  }),
  isWebhookProcessed: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return paymentAuditLogs.isWebhookProcessed(domainCtx, input ?? {});
  }),
  markWebhookProcessed: publicProcedure.input(anyInput).mutation(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return paymentAuditLogs.markWebhookProcessed(domainCtx, input ?? {});
  }),
  getByPayment: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return paymentAuditLogs.getByPayment(domainCtx, input ?? {});
  }),
  listRecent: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return paymentAuditLogs.listRecent(domainCtx, input ?? {});
  }),
  getByTxRef: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return paymentAuditLogs.getByTxRef(domainCtx, input ?? {});
  }),
  cleanupOldWebhookEvents: publicProcedure.input(anyInput).mutation(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return paymentAuditLogs.cleanupOldWebhookEvents(domainCtx, input ?? {});
  }),
});

const businessesRouter = router({
  createBusiness: publicProcedure.input(anyInput).mutation(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return businesses.createBusiness(domainCtx, input ?? {});
  }),
  updateBusiness: publicProcedure.input(anyInput).mutation(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return businesses.updateBusiness(domainCtx, input ?? {});
  }),
  getBusiness: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return businesses.getBusiness(domainCtx, input ?? {});
  }),
  getMyBusiness: publicProcedure.input(anyInput).query(async ({ ctx }) => {
    const domainCtx = { auth: ctx.auth };
    return businesses.getMyBusiness(domainCtx);
  }),
  listBusinesses: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return businesses.listBusinesses(domainCtx, input ?? {});
  }),
  isDocumentUrlAllowed: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return businesses.isDocumentUrlAllowed(domainCtx, input ?? {});
  }),
  verifyBusiness: publicProcedure.input(anyInput).mutation(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return businesses.verifyBusiness(domainCtx, input ?? {});
  }),
  getCountries: publicProcedure.input(anyInput).query(async ({ ctx }) => {
    const domainCtx = { auth: ctx.auth };
    return businesses.getCountries(domainCtx);
  }),
  getCategories: publicProcedure.input(anyInput).query(async ({ ctx }) => {
    const domainCtx = { auth: ctx.auth };
    return businesses.getCategories(domainCtx);
  }),
  publicDirectory: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return businesses.publicDirectory(domainCtx, input ?? {});
  }),
});

const productsRouter = router({
  list: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return products.list(domainCtx, input ?? {});
  }),
  get: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return products.get(domainCtx, input ?? {});
  }),
  create: publicProcedure.input(anyInput).mutation(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return products.create(domainCtx, input ?? {});
  }),
  update: publicProcedure.input(anyInput).mutation(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return products.update(domainCtx, input ?? {});
  }),
  remove: publicProcedure.input(anyInput).mutation(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return products.remove(domainCtx, input ?? {});
  }),
  marketplace: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return products.marketplace(domainCtx, input ?? {});
  }),
  publicMarketplace: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return products.publicMarketplace(domainCtx, input ?? {});
  }),
  getProductPriceRange: publicProcedure.input(anyInput).query(async ({ ctx }) => {
    const domainCtx = { auth: ctx.auth };
    return products.getProductPriceRange(domainCtx);
  }),
  getProductCountries: publicProcedure.input(anyInput).query(async ({ ctx }) => {
    const domainCtx = { auth: ctx.auth };
    return products.getProductCountries(domainCtx);
  }),
  getProductCategories: publicProcedure.input(anyInput).query(async ({ ctx }) => {
    const domainCtx = { auth: ctx.auth };
    return products.getProductCategories(domainCtx);
  }),
  getProductWithImages: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return products.getProductWithImages(domainCtx, input ?? {});
  }),
  getRelatedProducts: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return products.getRelatedProducts(domainCtx, input ?? {});
  }),
});

const ordersRouter = router({
  list: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return orders.list(domainCtx, input ?? {});
  }),
  get: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return orders.get(domainCtx, input ?? {});
  }),
  create: publicProcedure.input(anyInput).mutation(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return orders.create(domainCtx, input ?? {});
  }),
  update: publicProcedure.input(anyInput).mutation(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return orders.update(domainCtx, input ?? {});
  }),
  remove: publicProcedure.input(anyInput).mutation(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return orders.remove(domainCtx, input ?? {});
  }),
  purchases: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return orders.purchases(domainCtx, input ?? {});
  }),
  sales: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return orders.sales(domainCtx, input ?? {});
  }),
  checkout: publicProcedure.input(anyInput).mutation(async ({ ctx }) => {
    const domainCtx = { auth: ctx.auth };
    return orders.checkout(domainCtx);
  }),
});

const subscriptionPlansRouter = router({
  list: publicProcedure.input(anyInput).query(async ({ ctx }) => {
    const domainCtx = { auth: ctx.auth };
    return subscriptionPlans.list(domainCtx);
  }),
  listAll: publicProcedure.input(anyInput).query(async ({ ctx }) => {
    const domainCtx = { auth: ctx.auth };
    return subscriptionPlans.listAll(domainCtx);
  }),
  getBySlug: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return subscriptionPlans.getBySlug(domainCtx, input ?? {});
  }),
  getById: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return subscriptionPlans.getById(domainCtx, input ?? {});
  }),
  create: publicProcedure.input(anyInput).mutation(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return subscriptionPlans.create(domainCtx, input ?? {});
  }),
  update: publicProcedure.input(anyInput).mutation(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return subscriptionPlans.update(domainCtx, input ?? {});
  }),
  updatePricesToUsd: publicProcedure.input(anyInput).mutation(async ({ ctx }) => {
    const domainCtx = { auth: ctx.auth };
    return subscriptionPlans.updatePricesToUsd(domainCtx);
  }),
  deleteAll: publicProcedure.input(anyInput).mutation(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return subscriptionPlans.deleteAll(domainCtx, input ?? {});
  }),
  seedPlans: publicProcedure.input(anyInput).mutation(async ({ ctx }) => {
    const domainCtx = { auth: ctx.auth };
    return subscriptionPlans.seedPlans(domainCtx);
  }),
  calculatePrice: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return subscriptionPlans.calculatePrice(domainCtx, input ?? {});
  }),
});

const subscriptionsRouter = router({
  getCurrentSubscription: publicProcedure.input(anyInput).query(async ({ ctx }) => {
    const domainCtx = { auth: ctx.auth };
    return subscriptions.getCurrentSubscription(domainCtx);
  }),
  getByBusiness: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return subscriptions.getByBusiness(domainCtx, input ?? {});
  }),
  getById: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return subscriptions.getById(domainCtx, input ?? {});
  }),
  create: publicProcedure.input(anyInput).mutation(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return subscriptions.create(domainCtx, input ?? {});
  }),
  activateAfterPayment: publicProcedure.input(anyInput).mutation(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return subscriptions.activateAfterPayment(domainCtx, input ?? {});
  }),
  cancel: publicProcedure.input(anyInput).mutation(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return subscriptions.cancel(domainCtx, input ?? {});
  }),
  reactivate: publicProcedure.input(anyInput).mutation(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return subscriptions.reactivate(domainCtx, input ?? {});
  }),
  changePlan: publicProcedure.input(anyInput).mutation(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return subscriptions.changePlan(domainCtx, input ?? {});
  }),
  updateStatus: publicProcedure.input(anyInput).mutation(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return subscriptions.updateStatus(domainCtx, input ?? {});
  }),
  hasActiveSubscription: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return subscriptions.hasActiveSubscription(domainCtx, input ?? {});
  }),
  getBusinessLimits: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return subscriptions.getBusinessLimits(domainCtx, input ?? {});
  }),
  listAll: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return subscriptions.listAll(domainCtx, input ?? {});
  }),
  processExpiredSubscriptions: publicProcedure.input(anyInput).mutation(async ({ ctx }) => {
    const domainCtx = { auth: ctx.auth };
    return subscriptions.processExpiredSubscriptions(domainCtx);
  }),
  getUsageStats: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return subscriptions.getUsageStats(domainCtx, input ?? {});
  }),
});

const originCalculationsRouter = router({
  saveOriginCalculation: publicProcedure.input(anyInput).mutation(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return originCalculations.saveOriginCalculation(domainCtx, input ?? {});
  }),
  updateOriginCalculation: publicProcedure.input(anyInput).mutation(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return originCalculations.updateOriginCalculation(domainCtx, input ?? {});
  }),
  deleteOriginCalculation: publicProcedure.input(anyInput).mutation(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return originCalculations.deleteOriginCalculation(domainCtx, input ?? {});
  }),
  getMyOriginCalculations: publicProcedure.input(anyInput).query(async ({ ctx }) => {
    const domainCtx = { auth: ctx.auth };
    return originCalculations.getMyOriginCalculations(domainCtx);
  }),
  getOriginCalculation: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return originCalculations.getOriginCalculation(domainCtx, input ?? {});
  }),
  getOriginCalculationsSummary: publicProcedure.input(anyInput).query(async ({ ctx }) => {
    const domainCtx = { auth: ctx.auth };
    return originCalculations.getOriginCalculationsSummary(domainCtx);
  }),
  hasOriginCalculations: publicProcedure.input(anyInput).query(async ({ ctx }) => {
    const domainCtx = { auth: ctx.auth };
    return originCalculations.hasOriginCalculations(domainCtx);
  }),
});

const complianceRouter = router({
  addBusinessProduct: publicProcedure.input(anyInput).mutation(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return compliance.addBusinessProduct(domainCtx, input ?? {});
  }),
  removeBusinessProduct: publicProcedure.input(anyInput).mutation(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return compliance.removeBusinessProduct(domainCtx, input ?? {});
  }),
  getMyBusinessProducts: publicProcedure.input(anyInput).query(async ({ ctx }) => {
    const domainCtx = { auth: ctx.auth };
    return compliance.getMyBusinessProducts(domainCtx);
  }),
  getBusinessProducts: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return compliance.getBusinessProducts(domainCtx, input ?? {});
  }),
  getComplianceSummary: publicProcedure.input(anyInput).query(async ({ ctx }) => {
    const domainCtx = { auth: ctx.auth };
    return compliance.getComplianceSummary(domainCtx);
  }),
  hasCompletedComplianceCheck: publicProcedure.input(anyInput).query(async ({ ctx }) => {
    const domainCtx = { auth: ctx.auth };
    return compliance.hasCompletedComplianceCheck(domainCtx);
  }),
});

const usersRouter = router({
  getCurrentUser: publicProcedure.input(anyInput).query(async ({ ctx }) => {
    const domainCtx = { auth: ctx.auth };
    return users.getCurrentUser(domainCtx);
  }),
  ensureUser: publicProcedure.input(anyInput).mutation(async ({ ctx }) => {
    const domainCtx = { auth: ctx.auth };
    return users.ensureUser(domainCtx);
  }),
  markWelcomeEmailSent: publicProcedure.input(anyInput).mutation(async ({ ctx }) => {
    const domainCtx = { auth: ctx.auth };
    return users.markWelcomeEmailSent(domainCtx);
  }),
  updateProfile: publicProcedure.input(anyInput).mutation(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return users.updateProfile(domainCtx, input ?? {});
  }),
  getUserRole: publicProcedure.input(anyInput).query(async ({ ctx }) => {
    const domainCtx = { auth: ctx.auth };
    return users.getUserRole(domainCtx);
  }),
  listUsers: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return users.listUsers(domainCtx, input ?? {});
  }),
  getUsersByRole: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return users.getUsersByRole(domainCtx, input ?? {});
  }),
  setUserRole: publicProcedure.input(anyInput).mutation(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return users.setUserRole(domainCtx, input ?? {});
  }),
  getUser: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return users.getUser(domainCtx, input ?? {});
  }),
});

const paymentsRouter = router({
  create: publicProcedure.input(anyInput).mutation(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return payments.create(domainCtx, input ?? {});
  }),
  updateStatus: publicProcedure.input(anyInput).mutation(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return payments.updateStatus(domainCtx, input ?? {});
  }),
  getByTxRef: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return payments.getByTxRef(domainCtx, input ?? {});
  }),
  getByIdempotencyKey: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return payments.getByIdempotencyKey(domainCtx, input ?? {});
  }),
  updateCheckoutUrl: publicProcedure.input(anyInput).mutation(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return payments.updateCheckoutUrl(domainCtx, input ?? {});
  }),
  list: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return payments.list(domainCtx, input ?? {});
  }),
  getWithOrder: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return payments.getWithOrder(domainCtx, input ?? {});
  }),
  getById: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return payments.getById(domainCtx, input ?? {});
  }),
  recordRefund: publicProcedure.input(anyInput).mutation(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return payments.recordRefund(domainCtx, input ?? {});
  }),
  listSubscriptionPayments: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return payments.listSubscriptionPayments(domainCtx, input ?? {});
  }),
});

const verificationRouter = router({
  createEmailVerificationToken: publicProcedure.input(anyInput).mutation(async ({ ctx }) => {
    const domainCtx = { auth: ctx.auth };
    return verification.createEmailVerificationToken(domainCtx);
  }),
  verifyEmailToken: publicProcedure.input(anyInput).mutation(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return verification.verifyEmailToken(domainCtx, input ?? {});
  }),
  isEmailVerified: publicProcedure.input(anyInput).query(async ({ ctx }) => {
    const domainCtx = { auth: ctx.auth };
    return verification.isEmailVerified(domainCtx);
  }),
  resendVerificationToken: publicProcedure.input(anyInput).mutation(async ({ ctx }) => {
    const domainCtx = { auth: ctx.auth };
    return verification.resendVerificationToken(domainCtx);
  }),
});

const cartRouter = router({
  get: publicProcedure.input(anyInput).query(async ({ ctx }) => {
    const domainCtx = { auth: ctx.auth };
    return cart.get(domainCtx);
  }),
  add: publicProcedure.input(anyInput).mutation(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return cart.add(domainCtx, input ?? {});
  }),
  update: publicProcedure.input(anyInput).mutation(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return cart.update(domainCtx, input ?? {});
  }),
  remove: publicProcedure.input(anyInput).mutation(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return cart.remove(domainCtx, input ?? {});
  }),
  clear: publicProcedure.input(anyInput).mutation(async ({ ctx }) => {
    const domainCtx = { auth: ctx.auth };
    return cart.clear(domainCtx);
  }),
});

const productImagesRouter = router({
  saveImage: publicProcedure.input(anyInput).mutation(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return productImages.saveImage(domainCtx, input ?? {});
  }),
  deleteImage: publicProcedure.input(anyInput).mutation(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return productImages.deleteImage(domainCtx, input ?? {});
  }),
  reorderImages: publicProcedure.input(anyInput).mutation(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return productImages.reorderImages(domainCtx, input ?? {});
  }),
  setPrimaryImage: publicProcedure.input(anyInput).mutation(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return productImages.setPrimaryImage(domainCtx, input ?? {});
  }),
  getByProduct: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return productImages.getByProduct(domainCtx, input ?? {});
  }),
  getPrimaryImage: publicProcedure.input(anyInput).query(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return productImages.getPrimaryImage(domainCtx, input ?? {});
  }),
  deleteAllForProduct: publicProcedure.input(anyInput).mutation(async ({ ctx, input }) => {
    const domainCtx = { auth: ctx.auth };
    return productImages.deleteAllForProduct(domainCtx, input ?? {});
  }),
});

export const appRouter = router({
  inventory: inventoryRouter,
  directory: directoryRouter,
  stats: statsRouter,
  chat: chatRouter,
  paymentAuditLogs: paymentAuditLogsRouter,
  businesses: businessesRouter,
  products: productsRouter,
  orders: ordersRouter,
  subscriptionPlans: subscriptionPlansRouter,
  subscriptions: subscriptionsRouter,
  originCalculations: originCalculationsRouter,
  compliance: complianceRouter,
  users: usersRouter,
  payments: paymentsRouter,
  verification: verificationRouter,
  cart: cartRouter,
  productImages: productImagesRouter,
});

export type AppRouter = typeof appRouter;