-- CreateEnum
CREATE TYPE "LibraryBookStatus" AS ENUM ('AVAILABLE', 'UNAVAILABLE');

-- CreateTable
CREATE TABLE "library_books" (
    "id" TEXT NOT NULL,
    "bookCode" TEXT NOT NULL,
    "bookTitle" TEXT NOT NULL,
    "isbn" TEXT,
    "author" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "publisher" TEXT,
    "totalCopies" INTEGER NOT NULL DEFAULT 1,
    "availableCopies" INTEGER NOT NULL DEFAULT 1,
    "shelfNo" TEXT,
    "status" "LibraryBookStatus" NOT NULL DEFAULT 'AVAILABLE',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "library_books_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "library_books_bookCode_key" ON "library_books"("bookCode");

-- CreateIndex
CREATE UNIQUE INDEX "library_books_isbn_key" ON "library_books"("isbn");
