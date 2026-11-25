-- Remove payment/unlock tables and enum (free-at-launch)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'unlocks') THEN
    DROP TABLE "unlocks";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions') THEN
    DROP TABLE "transactions";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TransactionStatus') THEN
    DROP TYPE "TransactionStatus";
  END IF;
END $$;
