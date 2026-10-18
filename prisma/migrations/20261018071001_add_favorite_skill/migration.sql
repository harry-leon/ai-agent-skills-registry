-- CreateTable
CREATE TABLE "FavoriteSkill" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "skillId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteSkill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FavoriteSkill_userId_idx" ON "FavoriteSkill"("userId");

-- CreateIndex
CREATE INDEX "FavoriteSkill_skillId_idx" ON "FavoriteSkill"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteSkill_userId_skillId_key" ON "FavoriteSkill"("userId", "skillId");

-- AddForeignKey
ALTER TABLE "FavoriteSkill" ADD CONSTRAINT "FavoriteSkill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteSkill" ADD CONSTRAINT "FavoriteSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
