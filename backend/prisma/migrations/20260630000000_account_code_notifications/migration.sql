-- Add accountCode to users
ALTER TABLE "users" ADD COLUMN "account_code" TEXT;
CREATE UNIQUE INDEX "users_account_code_key" ON "users"("account_code");

-- Create user_notifications table
CREATE TABLE "user_notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_notifications_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "user_notifications_user_id_idx" ON "user_notifications"("user_id");
CREATE INDEX "user_notifications_created_at_idx" ON "user_notifications"("created_at");

-- Add foreign key
ALTER TABLE "user_notifications" ADD CONSTRAINT "user_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
