-- AlterTable: make password optional for OAuth users
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;

-- AddColumn: OAuth fields
ALTER TABLE "users" ADD COLUMN "oauth_provider" TEXT;
ALTER TABLE "users" ADD COLUMN "oauth_id" TEXT;
ALTER TABLE "users" ADD COLUMN "oauth_access_token" TEXT;
ALTER TABLE "users" ADD COLUMN "oauth_refresh_token" TEXT;
ALTER TABLE "users" ADD COLUMN "oauth_token_expires_at" TIMESTAMPTZ;
ALTER TABLE "users" ADD COLUMN "profile_picture" TEXT;

-- CreateIndex: composite unique for OAuth lookup
CREATE UNIQUE INDEX "users_oauth_provider_oauth_id_key" ON "users"("oauth_provider", "oauth_id");
