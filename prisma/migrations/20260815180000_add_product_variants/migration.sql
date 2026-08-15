-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "variantGroupId" TEXT,
ADD COLUMN     "variantLabel" TEXT;

-- CreateIndex
CREATE INDEX "Product_variantGroupId_idx" ON "Product"("variantGroupId");
