-- CreateTable
CREATE TABLE "funnel_events" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "campaign" TEXT,
    "happened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "funnel_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "funnel_events_event_idx" ON "funnel_events"("event");

-- CreateIndex
CREATE INDEX "funnel_events_campaign_idx" ON "funnel_events"("campaign");

-- CreateIndex
CREATE INDEX "funnel_events_happened_at_idx" ON "funnel_events"("happened_at");
