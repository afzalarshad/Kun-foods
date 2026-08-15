-- CreateTable
CREATE TABLE "HeldSale" (
    "id" TEXT NOT NULL,
    "label" TEXT,
    "cart" TEXT NOT NULL,
    "customer" TEXT NOT NULL,
    "actorEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HeldSale_pkey" PRIMARY KEY ("id")
);
