-- CreateEnum
CREATE TYPE "TransportRouteStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "transport_routes" (
    "id" TEXT NOT NULL,
    "routeCode" TEXT NOT NULL,
    "routeName" TEXT NOT NULL,
    "startLocation" TEXT NOT NULL,
    "endLocation" TEXT NOT NULL,
    "stops" JSONB,
    "routePoints" JSONB,
    "distanceKm" DOUBLE PRECISION,
    "estimatedTime" TEXT,
    "vehicleNo" TEXT,
    "driverName" TEXT,
    "status" "TransportRouteStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_routes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transport_routes_routeCode_key" ON "transport_routes"("routeCode");
