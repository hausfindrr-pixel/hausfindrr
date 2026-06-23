-- Performance indexes for hot-path query columns
-- users: admin queries filter on role+status and order by created_at
CREATE INDEX IF NOT EXISTS "users_role_status_idx" ON "users"("role", "status");
CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "users"("created_at");

-- properties: filtered by status, joined by landlord_id, ordered by created_at
CREATE INDEX IF NOT EXISTS "properties_status_idx" ON "properties"("status");
CREATE INDEX IF NOT EXISTS "properties_landlord_id_idx" ON "properties"("landlord_id");
CREATE INDEX IF NOT EXISTS "properties_created_at_idx" ON "properties"("created_at");

-- messages: queried by property, sender, receiver; ordered by sent_at
CREATE INDEX IF NOT EXISTS "messages_property_id_idx" ON "messages"("property_id");
CREATE INDEX IF NOT EXISTS "messages_sender_id_idx" ON "messages"("sender_id");
CREATE INDEX IF NOT EXISTS "messages_receiver_id_idx" ON "messages"("receiver_id");
CREATE INDEX IF NOT EXISTS "messages_sent_at_idx" ON "messages"("sent_at");

-- unlocks: ordered by unlocked_at in analytics and activity feed
CREATE INDEX IF NOT EXISTS "unlocks_unlocked_at_idx" ON "unlocks"("unlocked_at");

-- transactions: filtered by status, joined by tenant/property, ordered by created_at
CREATE INDEX IF NOT EXISTS "transactions_status_idx" ON "transactions"("status");
CREATE INDEX IF NOT EXISTS "transactions_tenant_id_idx" ON "transactions"("tenant_id");
CREATE INDEX IF NOT EXISTS "transactions_property_id_idx" ON "transactions"("property_id");
CREATE INDEX IF NOT EXISTS "transactions_created_at_idx" ON "transactions"("created_at");
