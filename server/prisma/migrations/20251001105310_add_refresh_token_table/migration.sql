-- CreateTable
CREATE TABLE "public"."RefreshToken" (
    "user_id" UUID NOT NULL,
    "token" TEXT NOT NULL,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("user_id","token")
);

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "public"."RefreshToken"("token");

-- AddForeignKey
ALTER TABLE "public"."RefreshToken" ADD CONSTRAINT "RefreshToken_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
