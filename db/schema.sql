-- Nethra's Mehndi Stencils & Hair Accessories
-- Database schema (MySQL)
-- No foreign key constraints — joins are handled in the PHP backend.
-- Every *key column is a 32-char id: DEFAULT (REPLACE(UUID(), '-', ''))

CREATE DATABASE IF NOT EXISTS nethras_db;
USE nethras_db;

-- ============================================================
-- Users  (Customers / Admin / Staff)
-- ============================================================
CREATE TABLE Users
(
    Userkey         CHAR(32)      NOT NULL PRIMARY KEY DEFAULT (REPLACE(UUID(), '-', '')),

    FullName        VARCHAR(150)  NOT NULL,
    Email           VARCHAR(150)  NOT NULL UNIQUE,
    Password        VARCHAR(500)  NOT NULL, -- no hash

    PhoneNumber     VARCHAR(20)   NULL,

    Role            VARCHAR(50)   NOT NULL DEFAULT 'Customer',
    -- Customer / Admin / Staff

    IsActive        TINYINT(1)    NOT NULL DEFAULT 1,

    CreatedOn       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedOn      DATETIME      NULL,
    CreatedBy       VARCHAR(150)  NULL,
    ModifiedBy      VARCHAR(150)  NULL,

    LastLoginOn     DATETIME      NULL
);

-- ============================================================
-- Categories
-- ============================================================
CREATE TABLE Categories
(
    Categorykey     CHAR(32)      NOT NULL PRIMARY KEY DEFAULT (REPLACE(UUID(), '-', '')),

    Slug            VARCHAR(150)  NOT NULL UNIQUE,
    Name            VARCHAR(150)  NOT NULL,
    ImagePath       VARCHAR(500)  NULL,

    CategoryGroup   VARCHAR(50)   NOT NULL DEFAULT 'stencils',
    -- stencils / accessories

    IsActive        TINYINT(1)    NOT NULL DEFAULT 1,

    CreatedOn       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedOn      DATETIME      NULL,
    CreatedBy       VARCHAR(150)  NULL,
    ModifiedBy      VARCHAR(150)  NULL
);

-- ============================================================
-- Products
-- ============================================================
CREATE TABLE Products
(
    Productkey      CHAR(32)      NOT NULL PRIMARY KEY DEFAULT (REPLACE(UUID(), '-', '')),

    Sku             VARCHAR(150)  NOT NULL UNIQUE,
    Name            VARCHAR(200)  NOT NULL,
    Tagline         VARCHAR(300)  NULL,
    Description     TEXT          NULL,

    CategoryKeyRef  CHAR(32)      NULL,   -- join to Categories.Categorykey in PHP
    ProductGroup    VARCHAR(50)   NOT NULL DEFAULT 'stencils',
    -- stencils / accessories

    ImagePath       VARCHAR(500)  NULL,

    Price           DECIMAL(10,2) NOT NULL DEFAULT 0,
    Mrp             DECIMAL(10,2) NOT NULL DEFAULT 0,

    Rating          DECIMAL(3,2)  NOT NULL DEFAULT 0,
    ReviewsCount    INT           NOT NULL DEFAULT 0,

    Stock           INT           NOT NULL DEFAULT 0,
    IsActive        TINYINT(1)    NOT NULL DEFAULT 1,

    CreatedOn       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedOn      DATETIME      NULL,
    CreatedBy       VARCHAR(150)  NULL,
    ModifiedBy      VARCHAR(150)  NULL
);

-- ============================================================
-- Orders
-- ============================================================
CREATE TABLE Orders
(
    Orderkey        CHAR(32)      NOT NULL PRIMARY KEY DEFAULT (REPLACE(UUID(), '-', '')),

    OrderNumber     VARCHAR(50)   NOT NULL UNIQUE,
    UserKeyRef      CHAR(32)      NULL,   -- join to Users.Userkey in PHP

    Subtotal        DECIMAL(10,2) NOT NULL DEFAULT 0,
    Discount        DECIMAL(10,2) NOT NULL DEFAULT 0,
    ShippingFee     DECIMAL(10,2) NOT NULL DEFAULT 0,
    Total           DECIMAL(10,2) NOT NULL DEFAULT 0,

    CouponCode      VARCHAR(50)   NULL,

    Status          VARCHAR(50)   NOT NULL DEFAULT 'Processing',
    -- Processing / Shipped / Delivered / Cancelled

    PaymentMethod   VARCHAR(50)   NOT NULL,
    -- COD / Razorpay / UPI

    CourierName     VARCHAR(150)  NULL,
    TrackingId      VARCHAR(150)  NULL,

    ShippingName    VARCHAR(150)  NULL,
    ShippingPhone   VARCHAR(20)   NULL,
    ShippingAddress VARCHAR(500)  NULL,

    CreatedOn       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedOn      DATETIME      NULL,
    CreatedBy       VARCHAR(150)  NULL,
    ModifiedBy      VARCHAR(150)  NULL
);

-- ============================================================
-- OrderItems
-- ============================================================
CREATE TABLE OrderItems
(
    OrderItemkey     CHAR(32)      NOT NULL PRIMARY KEY DEFAULT (REPLACE(UUID(), '-', '')),

    OrderKeyRef      CHAR(32)      NOT NULL, -- join to Orders.Orderkey in PHP
    ProductKeyRef    CHAR(32)      NOT NULL, -- join to Products.Productkey in PHP

    ProductName      VARCHAR(200)  NOT NULL,
    ProductImagePath VARCHAR(500)  NULL,

    Qty              INT           NOT NULL DEFAULT 1,
    Price            DECIMAL(10,2) NOT NULL DEFAULT 0,

    CreatedOn        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- OrderLog  (status/history trail for each order)
-- ============================================================
CREATE TABLE OrderLog
(
    OrderLogkey     CHAR(32)      NOT NULL PRIMARY KEY DEFAULT (REPLACE(UUID(), '-', '')),

    OrderKeyRef     CHAR(32)      NOT NULL, -- join to Orders.Orderkey in PHP

    OldStatus       VARCHAR(50)   NULL,
    NewStatus       VARCHAR(50)   NOT NULL,
    -- Processing / Shipped / Delivered / Cancelled

    Remarks         VARCHAR(500)  NULL,

    CreatedOn       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CreatedBy       VARCHAR(150)  NULL
);

-- ============================================================
-- Coupons
-- ============================================================
CREATE TABLE Coupons
(
    Couponkey       CHAR(32)      NOT NULL PRIMARY KEY DEFAULT (REPLACE(UUID(), '-', '')),

    Code            VARCHAR(50)   NOT NULL UNIQUE,

    DiscountType    VARCHAR(20)   NOT NULL DEFAULT 'percent',
    -- percent / flat

    Value           DECIMAL(10,2) NOT NULL DEFAULT 0,
    MinOrderAmount  DECIMAL(10,2) NOT NULL DEFAULT 0,

    UsageLimit      INT           NOT NULL DEFAULT 0,
    UsageCount      INT           NOT NULL DEFAULT 0,

    ExpiryOn        DATETIME      NULL,
    IsActive        TINYINT(1)    NOT NULL DEFAULT 1,

    CreatedOn       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedOn      DATETIME      NULL,
    CreatedBy       VARCHAR(150)  NULL,
    ModifiedBy      VARCHAR(150)  NULL
);

-- ============================================================
-- Wishlist
-- ============================================================
CREATE TABLE Wishlist
(
    Wishlistkey     CHAR(32)      NOT NULL PRIMARY KEY DEFAULT (REPLACE(UUID(), '-', '')),

    UserKeyRef      CHAR(32)      NOT NULL, -- join to Users.Userkey in PHP
    ProductKeyRef   CHAR(32)      NOT NULL, -- join to Products.Productkey in PHP

    CreatedOn       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- CartItems
-- ============================================================
CREATE TABLE CartItems
(
    CartItemkey     CHAR(32)      NOT NULL PRIMARY KEY DEFAULT (REPLACE(UUID(), '-', '')),

    UserKeyRef      CHAR(32)      NOT NULL, -- join to Users.Userkey in PHP
    ProductKeyRef   CHAR(32)      NOT NULL, -- join to Products.Productkey in PHP

    Qty             INT           NOT NULL DEFAULT 1,

    CreatedOn       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedOn      DATETIME      NULL
);

-- ============================================================
-- SeoSettings  (single row per site, keyed for future multi-store use)
-- ============================================================
CREATE TABLE SeoSettings
(
    SeoSettingkey   CHAR(32)      NOT NULL PRIMARY KEY DEFAULT (REPLACE(UUID(), '-', '')),

    SiteTitle       VARCHAR(200)  NULL,
    MetaDescription VARCHAR(500)  NULL,
    MetaKeywords    VARCHAR(500)  NULL,
    OgImagePath     VARCHAR(500)  NULL,
    CanonicalUrl    VARCHAR(500)  NULL,

    ModifiedOn      DATETIME      NULL,
    ModifiedBy      VARCHAR(150)  NULL
);

-- ============================================================
-- PaymentSettings
-- ============================================================
CREATE TABLE PaymentSettings
(
    PaymentSettingkey  CHAR(32)      NOT NULL PRIMARY KEY DEFAULT (REPLACE(UUID(), '-', '')),

    RazorpayEnabled     TINYINT(1)    NOT NULL DEFAULT 1,
    RazorpayKeyId       VARCHAR(200)  NULL,

    CodEnabled          TINYINT(1)    NOT NULL DEFAULT 1,
    UpiId               VARCHAR(150)  NULL,

    FreeShippingAbove   DECIMAL(10,2) NOT NULL DEFAULT 0,
    FlatShippingFee     DECIMAL(10,2) NOT NULL DEFAULT 0,

    ModifiedOn          DATETIME      NULL,
    ModifiedBy           VARCHAR(150) NULL
);

-- ============================================================
-- ContactSettings
-- ============================================================
CREATE TABLE ContactSettings
(
    ContactSettingkey  CHAR(32)      NOT NULL PRIMARY KEY DEFAULT (REPLACE(UUID(), '-', '')),

    SupportEmail        VARCHAR(150) NULL,
    SupportPhone         VARCHAR(20) NULL,
    WhatsappNumber        VARCHAR(20) NULL,
    Address              VARCHAR(500) NULL,
    InstagramUrl         VARCHAR(500) NULL,
    FacebookUrl          VARCHAR(500) NULL,

    ModifiedOn           DATETIME     NULL,
    ModifiedBy           VARCHAR(150) NULL
);

-- ============================================================
-- Banners  (home hero / promo banners)
-- ============================================================
CREATE TABLE Banners
(
    Bannerkey       CHAR(32)      NOT NULL PRIMARY KEY DEFAULT (REPLACE(UUID(), '-', '')),

    Title           VARCHAR(200)  NULL,
    Subtitle        VARCHAR(300)  NULL,
    ImagePath       VARCHAR(500)  NOT NULL,

    LinkUrl         VARCHAR(500)  NULL,
    ButtonText      VARCHAR(100)  NULL,

    Placement       VARCHAR(50)   NOT NULL DEFAULT 'home',
    -- home / category / offer

    SortOrder       INT           NOT NULL DEFAULT 0,
    IsActive        TINYINT(1)    NOT NULL DEFAULT 1,

    StartOn         DATETIME      NULL,
    EndOn           DATETIME      NULL,

    CreatedOn       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedOn      DATETIME      NULL,
    CreatedBy       VARCHAR(150)  NULL,
    ModifiedBy      VARCHAR(150)  NULL
);

-- ============================================================
-- Announcements  (top strip / marquee messages)
-- ============================================================
CREATE TABLE Announcements
(
    Announcementkey CHAR(32)      NOT NULL PRIMARY KEY DEFAULT (REPLACE(UUID(), '-', '')),

    Message         VARCHAR(300)  NOT NULL,
    LinkUrl         VARCHAR(500)  NULL,

    SortOrder       INT           NOT NULL DEFAULT 0,
    IsActive        TINYINT(1)    NOT NULL DEFAULT 1,

    StartOn         DATETIME      NULL,
    EndOn           DATETIME      NULL,

    CreatedOn       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedOn      DATETIME      NULL,
    CreatedBy       VARCHAR(150)  NULL,
    ModifiedBy      VARCHAR(150)  NULL
);

-- ============================================================
-- DeliveryZones  (pincode-based delivery charge rules)
-- ============================================================
CREATE TABLE DeliveryZones
(
    Zonekey            CHAR(32)      NOT NULL PRIMARY KEY DEFAULT (REPLACE(UUID(), '-', '')),

    ZoneName           VARCHAR(150)  NOT NULL,
    PincodePrefix      VARCHAR(10)   NOT NULL,
    -- e.g. "600", "641002" — matched against the customer's pincode by longest-prefix match

    DeliveryFee        DECIMAL(10,2) NOT NULL DEFAULT 0,
    FreeShippingAbove  DECIMAL(10,2) NOT NULL DEFAULT 0,
    EstimatedDays       VARCHAR(50)  NOT NULL DEFAULT '3-5 days',

    SortOrder          INT           NOT NULL DEFAULT 0,
    IsActive           TINYINT(1)    NOT NULL DEFAULT 1,

    CreatedOn          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedOn         DATETIME      NULL,
    CreatedBy          VARCHAR(150)  NULL,
    ModifiedBy         VARCHAR(150)  NULL
);

-- ============================================================
-- Addresses  (customer saved delivery addresses, multiple per user)
-- ============================================================
CREATE TABLE Addresses
(
    Addresskey      CHAR(32)      NOT NULL PRIMARY KEY DEFAULT (REPLACE(UUID(), '-', '')),

    UserKeyRef      CHAR(32)      NOT NULL, -- join to Users.Userkey in PHP

    Label           VARCHAR(50)   NOT NULL DEFAULT 'Home',
    -- Home / Work / Other

    FullName        VARCHAR(150)  NOT NULL,
    Phone           VARCHAR(20)   NOT NULL,
    AddressLine     VARCHAR(500)  NOT NULL,
    Landmark        VARCHAR(200)  NULL,
    City            VARCHAR(100)  NOT NULL,
    State           VARCHAR(100)  NOT NULL,
    Pincode         VARCHAR(10)   NOT NULL,

    IsDefault       TINYINT(1)    NOT NULL DEFAULT 0,

    CreatedOn       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedOn      DATETIME      NULL
);
