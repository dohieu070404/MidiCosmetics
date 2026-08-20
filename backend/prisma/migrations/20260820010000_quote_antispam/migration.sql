ALTER TABLE "quotes" ADD COLUMN "request_key" CHAR(36);

CREATE UNIQUE INDEX "quotes_request_key_key" ON "quotes"("request_key");
CREATE INDEX "idx_quotes_archived_at" ON "quotes"("archived_at");
CREATE INDEX "idx_interest_events_session_created_at" ON "interest_events"("session_hash", "created_at");
