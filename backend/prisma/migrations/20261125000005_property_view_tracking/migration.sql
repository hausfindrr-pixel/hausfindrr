-- CreateTable: property_view_logs
CREATE TABLE "property_view_logs" (
    "id"          TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "viewed_on"   DATE NOT NULL,
    "viewer_id"   TEXT,
    "anon_hash"   TEXT,

    CONSTRAINT "property_view_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: property_view_summaries
CREATE TABLE "property_view_summaries" (
    "id"            TEXT NOT NULL,
    "property_id"   TEXT NOT NULL,
    "summary_date"  DATE NOT NULL,
    "unique_views"  INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "property_view_summaries_pkey" PRIMARY KEY ("id")
);

-- Unique constraints
CREATE UNIQUE INDEX "property_view_logs_property_id_viewed_on_viewer_id_key"
    ON "property_view_logs"("property_id", "viewed_on", "viewer_id")
    WHERE "viewer_id" IS NOT NULL;

CREATE UNIQUE INDEX "property_view_logs_property_id_viewed_on_anon_hash_key"
    ON "property_view_logs"("property_id", "viewed_on", "anon_hash")
    WHERE "anon_hash" IS NOT NULL;

CREATE UNIQUE INDEX "property_view_summaries_property_id_summary_date_key"
    ON "property_view_summaries"("property_id", "summary_date");

-- Indexes
CREATE INDEX "property_view_logs_property_id_idx" ON "property_view_logs"("property_id");
CREATE INDEX "property_view_logs_viewed_on_idx"   ON "property_view_logs"("viewed_on");
CREATE INDEX "property_view_summaries_property_id_idx"  ON "property_view_summaries"("property_id");
CREATE INDEX "property_view_summaries_summary_date_idx" ON "property_view_summaries"("summary_date");

-- Foreign keys
ALTER TABLE "property_view_logs"
    ADD CONSTRAINT "property_view_logs_property_id_fkey"
    FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "property_view_logs"
    ADD CONSTRAINT "property_view_logs_viewer_id_fkey"
    FOREIGN KEY ("viewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "property_view_summaries"
    ADD CONSTRAINT "property_view_summaries_property_id_fkey"
    FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
