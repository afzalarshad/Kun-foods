-- DropIndex
DROP INDEX "ShippingZone_city_key";

-- AlterTable
ALTER TABLE "ShippingZone" ADD COLUMN     "excluded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "province" TEXT,
ADD COLUMN     "scope" TEXT NOT NULL DEFAULT 'city',
ALTER COLUMN "city" DROP NOT NULL;
