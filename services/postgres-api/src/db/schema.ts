import {
  pgTable,
  text,
  varchar,
  boolean,
  integer,
  doublePrecision,
  bigint,
  jsonb,
  index,
  uniqueIndex,
  pgEnum
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["buyer", "seller", "admin"]);
export const verificationStatus = pgEnum("verification_status", ["pending", "verified", "rejected"]);
export const orderStatus = pgEnum("order_status", ["pending", "processing", "completed", "cancelled"]);
export const productStatus = pgEnum("product_status", ["active", "inactive"]);
export const inventoryType = pgEnum("inventory_type", ["restock", "sale", "adjustment", "return", "correction"]);
export const inventoryDirection = pgEnum("inventory_direction", ["in", "out"]);
export const paymentStatus = pgEnum("payment_status", [
  "pending",
  "success",
  "failed",
  "cancelled",
  "refunded",
  "partially_refunded"
]);
export const paymentType = pgEnum("payment_type", ["order", "subscription"]);
export const verificationType = pgEnum("verification_type", ["email", "password_reset"]);
export const subscriptionStatus = pgEnum("subscription_status", [
  "active",
  "past_due",
  "cancelled",
  "trialing",
  "expired"
]);
export const billingCycle = pgEnum("billing_cycle", ["monthly", "annual"]);
export const chatReportStatus = pgEnum("chat_report_status", ["pending", "reviewed", "resolved"]);

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    clerkId: text("clerk_id").notNull(),
    email: text("email").notNull(),
    name: text("name"),
    imageUrl: text("image_url"),
    role: userRole("role"),
    businessId: text("business_id"),
    welcomeEmailSent: boolean("welcome_email_sent"),
    emailVerified: boolean("email_verified"),
    emailVerifiedAt: bigint("email_verified_at", { mode: "number" }),
    preferences: jsonb("preferences")
  },
  (table) => ({
    clerkIdIdx: uniqueIndex("users_clerk_id_idx").on(table.clerkId),
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
    roleIdx: index("users_role_idx").on(table.role)
  })
);

export const businesses = pgTable(
  "businesses",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    country: text("country").notNull(),
    city: text("city"),
    address: text("address"),
    phone: text("phone"),
    website: text("website"),
    logoUrl: text("logo_url"),
    category: text("category").notNull(),
    verificationStatus: verificationStatus("verification_status").notNull(),
    businessLicenceImageUrl: text("business_licence_image_url"),
    businessLicenceNumber: text("business_licence_number"),
    memoOfAssociationImageUrl: text("memo_of_association_image_url"),
    tinCertificateImageUrl: text("tin_certificate_image_url"),
    tinCertificateNumber: text("tin_certificate_number"),
    hasImportExportPermit: boolean("has_import_export_permit"),
    importExportPermitImageUrl: text("import_export_permit_image_url"),
    importExportPermitNumber: text("import_export_permit_number"),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull()
  },
  (table) => ({
    ownerIdx: index("businesses_owner_idx").on(table.ownerId),
    statusIdx: index("businesses_status_idx").on(table.verificationStatus),
    countryIdx: index("businesses_country_idx").on(table.country),
    categoryIdx: index("businesses_category_idx").on(table.category),
    licenceUrlIdx: index("businesses_licence_url_idx").on(table.businessLicenceImageUrl),
    memoUrlIdx: index("businesses_memo_url_idx").on(table.memoOfAssociationImageUrl),
    tinUrlIdx: index("businesses_tin_url_idx").on(table.tinCertificateImageUrl),
    permitUrlIdx: index("businesses_permit_url_idx").on(table.importExportPermitImageUrl)
  })
);

export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    buyerId: text("buyer_id"),
    sellerId: text("seller_id"),
    title: text("title").notNull(),
    customer: text("customer").notNull(),
    amount: doublePrecision("amount").notNull(),
    status: orderStatus("status").notNull(),
    description: text("description"),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull()
  },
  (table) => ({
    userIdx: index("orders_user_idx").on(table.userId),
    buyerIdx: index("orders_buyer_idx").on(table.buyerId),
    sellerIdx: index("orders_seller_idx").on(table.sellerId),
    statusIdx: index("orders_status_idx").on(table.status),
    userStatusIdx: index("orders_user_status_idx").on(table.userId, table.status),
    buyerStatusIdx: index("orders_buyer_status_idx").on(table.buyerId, table.status),
    sellerStatusIdx: index("orders_seller_status_idx").on(table.sellerId, table.status)
  })
);

export const products = pgTable(
  "products",
  {
    id: text("id").primaryKey(),
    sellerId: text("seller_id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    price: doublePrecision("price").notNull(),
    quantity: integer("quantity").notNull(),
    sku: text("sku"),
    lowStockThreshold: integer("low_stock_threshold"),
    reorderQuantity: integer("reorder_quantity"),
    category: text("category"),
    status: productStatus("status").notNull(),
    country: text("country"),
    minOrderQuantity: integer("min_order_quantity"),
    specifications: text("specifications"),
    tags: jsonb("tags"),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull()
  },
  (table) => ({
    sellerIdx: index("products_seller_idx").on(table.sellerId),
    statusIdx: index("products_status_idx").on(table.status),
    sellerStatusIdx: index("products_seller_status_idx").on(table.sellerId, table.status),
    sellerSkuIdx: index("products_seller_sku_idx").on(table.sellerId, table.sku),
    categoryIdx: index("products_category_idx").on(table.category),
    countryIdx: index("products_country_idx").on(table.country),
    categoryCountryIdx: index("products_category_country_idx").on(table.category, table.country)
  })
);

export const productImages = pgTable(
  "product_images",
  {
    id: text("id").primaryKey(),
    productId: text("product_id").notNull(),
    r2Key: text("r2_key").notNull(),
    url: text("url").notNull(),
    order: integer("order_index").notNull(),
    isPrimary: boolean("is_primary").notNull(),
    createdAt: bigint("created_at", { mode: "number" }).notNull()
  },
  (table) => ({
    productIdx: index("product_images_product_idx").on(table.productId),
    productPrimaryIdx: index("product_images_product_primary_idx").on(table.productId, table.isPrimary)
  })
);

export const inventoryTransactions = pgTable(
  "inventory_transactions",
  {
    id: text("id").primaryKey(),
    productId: text("product_id").notNull(),
    sellerId: text("seller_id").notNull(),
    type: inventoryType("type").notNull(),
    direction: inventoryDirection("direction").notNull(),
    quantity: integer("quantity").notNull(),
    previousQuantity: integer("previous_quantity").notNull(),
    newQuantity: integer("new_quantity").notNull(),
    reason: text("reason"),
    reference: text("reference"),
    createdBy: text("created_by"),
    createdAt: bigint("created_at", { mode: "number" }).notNull()
  },
  (table) => ({
    productIdx: index("inventory_product_idx").on(table.productId),
    productCreatedIdx: index("inventory_product_created_idx").on(table.productId, table.createdAt),
    sellerIdx: index("inventory_seller_idx").on(table.sellerId),
    sellerCreatedIdx: index("inventory_seller_created_idx").on(table.sellerId, table.createdAt)
  })
);

export const cartItems = pgTable(
  "cart_items",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    productId: text("product_id").notNull(),
    quantity: integer("quantity").notNull(),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull()
  },
  (table) => ({
    userIdx: index("cart_user_idx").on(table.userId),
    userProductIdx: uniqueIndex("cart_user_product_idx").on(table.userId, table.productId)
  })
);

export const orderItems = pgTable(
  "order_items",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id").notNull(),
    productId: text("product_id").notNull(),
    quantity: integer("quantity").notNull(),
    price: doublePrecision("price").notNull(),
    createdAt: bigint("created_at", { mode: "number" }).notNull()
  },
  (table) => ({
    orderIdx: index("order_items_order_idx").on(table.orderId),
    productIdx: index("order_items_product_idx").on(table.productId)
  })
);

export const payments = pgTable(
  "payments",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    orderId: text("order_id"),
    subscriptionId: text("subscription_id"),
    chapaTransactionRef: text("chapa_transaction_ref").notNull(),
    chapaTrxRef: text("chapa_trx_ref"),
    amount: doublePrecision("amount").notNull(),
    currency: text("currency").notNull(),
    status: paymentStatus("status").notNull(),
    paymentType: paymentType("payment_type").notNull(),
    metadata: text("metadata"),
    idempotencyKey: text("idempotency_key"),
    checkoutUrl: text("checkout_url"),
    refundedAt: bigint("refunded_at", { mode: "number" }),
    refundAmount: doublePrecision("refund_amount"),
    refundReason: text("refund_reason"),
    refundReference: text("refund_reference"),
    refundedByUserId: text("refunded_by_user_id"),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull()
  },
  (table) => ({
    userIdx: index("payments_user_idx").on(table.userId),
    orderIdx: index("payments_order_idx").on(table.orderId),
    subscriptionIdx: index("payments_subscription_idx").on(table.subscriptionId),
    chapaIdx: uniqueIndex("payments_chapa_ref_idx").on(table.chapaTransactionRef),
    statusIdx: index("payments_status_idx").on(table.status),
    idempotencyIdx: uniqueIndex("payments_idempotency_idx").on(table.userId, table.idempotencyKey)
  })
);

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    token: text("token").notNull(),
    type: verificationType("type").notNull(),
    expiresAt: bigint("expires_at", { mode: "number" }).notNull(),
    used: boolean("used").notNull(),
    createdAt: bigint("created_at", { mode: "number" }).notNull()
  },
  (table) => ({
    tokenIdx: index("verification_token_idx").on(table.token),
    userIdx: index("verification_user_idx").on(table.userId),
    userTypeIdx: index("verification_user_type_idx").on(table.userId, table.type)
  })
);

export const subscriptionPlans = pgTable(
  "subscription_plans",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    targetCustomer: text("target_customer"),
    monthlyPrice: doublePrecision("monthly_price").notNull(),
    annualPrice: doublePrecision("annual_price").notNull(),
    currency: text("currency").notNull(),
    features: text("features").notNull(),
    limits: text("limits").notNull(),
    isActive: boolean("is_active").notNull(),
    isPopular: boolean("is_popular"),
    sortOrder: integer("sort_order").notNull(),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull()
  },
  (table) => ({
    slugIdx: uniqueIndex("subscription_plans_slug_idx").on(table.slug),
    activeIdx: index("subscription_plans_active_idx").on(table.isActive),
    sortIdx: index("subscription_plans_sort_idx").on(table.sortOrder)
  })
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id").notNull(),
    planId: text("plan_id").notNull(),
    status: subscriptionStatus("status").notNull(),
    billingCycle: billingCycle("billing_cycle").notNull(),
    currentPeriodStart: bigint("current_period_start", { mode: "number" }).notNull(),
    currentPeriodEnd: bigint("current_period_end", { mode: "number" }).notNull(),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull(),
    trialEndsAt: bigint("trial_ends_at", { mode: "number" }),
    lastPaymentId: text("last_payment_id"),
    cancelledAt: bigint("cancelled_at", { mode: "number" }),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull()
  },
  (table) => ({
    businessIdx: index("subscriptions_business_idx").on(table.businessId),
    statusIdx: index("subscriptions_status_idx").on(table.status),
    planIdx: index("subscriptions_plan_idx").on(table.planId),
    periodEndIdx: index("subscriptions_period_end_idx").on(table.currentPeriodEnd)
  })
);

export const paymentAuditLogs = pgTable(
  "payment_audit_logs",
  {
    id: text("id").primaryKey(),
    paymentId: text("payment_id"),
    userId: text("user_id"),
    action: text("action").notNull(),
    status: text("status").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    txRef: text("tx_ref"),
    metadata: text("metadata"),
    errorMessage: text("error_message"),
    createdAt: bigint("created_at", { mode: "number" }).notNull()
  },
  (table) => ({
    paymentIdx: index("payment_audit_payment_idx").on(table.paymentId),
    userIdx: index("payment_audit_user_idx").on(table.userId),
    actionIdx: index("payment_audit_action_idx").on(table.action),
    txRefIdx: index("payment_audit_tx_ref_idx").on(table.txRef),
    createdIdx: index("payment_audit_created_idx").on(table.createdAt)
  })
);

export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: text("id").primaryKey(),
    txRef: text("tx_ref").notNull(),
    eventType: text("event_type").notNull(),
    processedAt: bigint("processed_at", { mode: "number" }).notNull(),
    signature: text("signature")
  },
  (table) => ({
    txRefIdx: uniqueIndex("webhook_events_tx_ref_idx").on(table.txRef),
    processedIdx: index("webhook_events_processed_idx").on(table.processedAt)
  })
);

export const chatReports = pgTable(
  "chat_reports",
  {
    id: text("id").primaryKey(),
    channelId: text("channel_id").notNull(),
    reporterId: text("reporter_id").notNull(),
    reason: text("reason").notNull(),
    status: chatReportStatus("status").notNull(),
    createdAt: bigint("created_at", { mode: "number" }).notNull()
  },
  (table) => ({
    channelIdx: index("chat_reports_channel_idx").on(table.channelId),
    reporterIdx: index("chat_reports_reporter_idx").on(table.reporterId),
    channelReporterIdx: index("chat_reports_channel_reporter_idx").on(table.channelId, table.reporterId),
    statusIdx: index("chat_reports_status_idx").on(table.status)
  })
);

export const businessProducts = pgTable(
  "business_products",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id").notNull(),
    hsCode: text("hs_code").notNull(),
    productName: text("product_name").notNull(),
    productNameAmharic: text("product_name_amharic"),
    isCompliant: boolean("is_compliant").notNull(),
    currentRate: text("current_rate"),
    rates: text("rates"),
    country: text("country"),
    createdAt: bigint("created_at", { mode: "number" }).notNull()
  },
  (table) => ({
    businessIdx: index("business_products_business_idx").on(table.businessId),
    hsCodeIdx: index("business_products_hs_code_idx").on(table.hsCode),
    businessHsIdx: index("business_products_business_hs_idx").on(table.businessId, table.hsCode),
    countryIdx: index("business_products_country_idx").on(table.country)
  })
);

export const originCalculations = pgTable(
  "origin_calculations",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id").notNull(),
    productId: text("product_id"),
    productName: text("product_name").notNull(),
    costOfMaterials: doublePrecision("cost_of_materials").notNull(),
    laborCosts: doublePrecision("labor_costs").notNull(),
    factoryOverheads: doublePrecision("factory_overheads").notNull(),
    profitMargin: doublePrecision("profit_margin").notNull(),
    exWorksPrice: doublePrecision("ex_works_price").notNull(),
    nonOriginatingMaterials: doublePrecision("non_originating_materials").notNull(),
    vnmDetails: text("vnm_details"),
    vnmPercentage: doublePrecision("vnm_percentage").notNull(),
    isEligible: boolean("is_eligible").notNull(),
    currency: text("currency").notNull(),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull()
  },
  (table) => ({
    businessIdx: index("origin_business_idx").on(table.businessId),
    productIdx: index("origin_product_idx").on(table.productId),
    eligibilityIdx: index("origin_eligibility_idx").on(table.businessId, table.isEligible)
  })
);
