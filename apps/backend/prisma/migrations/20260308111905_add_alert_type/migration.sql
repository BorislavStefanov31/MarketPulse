-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('ABOVE', 'BELOW');

-- AlterTable
ALTER TABLE "Alert" ADD COLUMN     "type" "AlertType" NOT NULL DEFAULT 'ABOVE';
