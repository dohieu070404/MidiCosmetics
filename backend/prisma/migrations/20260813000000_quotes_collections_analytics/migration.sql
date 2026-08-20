CREATE TYPE "QuoteStatus" AS ENUM ('CREATED', 'MESSENGER_OPENED', 'PROCESSED', 'EXPIRED');
CREATE TYPE "InterestEventType" AS ENUM ('PRODUCT_VIEWED', 'ADDED_TO_CART', 'REMOVED_FROM_CART', 'QUANTITY_CHANGED', 'INCLUDED_IN_QUOTE', 'QUOTE_CREATED', 'MESSENGER_CLICKED');

ALTER TABLE "product_collections" ADD COLUMN "cover_image_url" VARCHAR(1000), ADD COLUMN "seo_title" VARCHAR(255), ADD COLUMN "seo_description" VARCHAR(500);

CREATE TABLE "quotes" (
  "id" BIGSERIAL NOT NULL,
  "uuid" CHAR(36) NOT NULL,
  "code" VARCHAR(32) NOT NULL,
  "public_token_hash" CHAR(64) NOT NULL,
  "public_token_ciphertext" TEXT,
  "status" "QuoteStatus" NOT NULL DEFAULT 'CREATED',
  "note" VARCHAR(1000),
  "snapshot_total" DECIMAL(12,2) NOT NULL,
  "currency" CHAR(3) NOT NULL DEFAULT 'VND',
  "messenger_opened_at" TIMESTAMP(3),
  "processed_at" TIMESTAMP(3),
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "archived_at" TIMESTAMP(3),
  CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "quotes_uuid_key" ON "quotes"("uuid");
CREATE UNIQUE INDEX "quotes_code_key" ON "quotes"("code");
CREATE UNIQUE INDEX "quotes_public_token_hash_key" ON "quotes"("public_token_hash");
CREATE INDEX "idx_quotes_status_created_at" ON "quotes"("status", "created_at");
CREATE INDEX "idx_quotes_expires_at" ON "quotes"("expires_at");

CREATE TABLE "quote_items" (
  "id" BIGSERIAL NOT NULL,
  "quote_id" BIGINT NOT NULL,
  "product_id" BIGINT,
  "product_uuid" CHAR(36) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "sku" VARCHAR(100),
  "unit" VARCHAR(50),
  "image_url" VARCHAR(1000),
  "unit_price" DECIMAL(12,2) NOT NULL,
  "quantity" INTEGER NOT NULL,
  "line_total" DECIMAL(12,2) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "quote_items_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_quote_items_quote_id" ON "quote_items"("quote_id");
CREATE INDEX "idx_quote_items_product_id" ON "quote_items"("product_id");
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "interest_events" (
  "id" BIGSERIAL NOT NULL,
  "uuid" CHAR(36) NOT NULL,
  "event_type" "InterestEventType" NOT NULL,
  "product_id" BIGINT,
  "quote_id" BIGINT,
  "session_hash" CHAR(64),
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "interest_events_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "interest_events_uuid_key" ON "interest_events"("uuid");
CREATE INDEX "idx_interest_events_type_created_at" ON "interest_events"("event_type", "created_at");
CREATE INDEX "idx_interest_events_product_created_at" ON "interest_events"("product_id", "created_at");
CREATE INDEX "idx_interest_events_quote_id" ON "interest_events"("quote_id");
ALTER TABLE "interest_events" ADD CONSTRAINT "interest_events_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "interest_events" ADD CONSTRAINT "interest_events_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
