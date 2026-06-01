export type LibraryBookStatus = 'AVAILABLE' | 'UNAVAILABLE';

export type LibraryBook = {
  id: string;
  bookCode: string;
  bookTitle: string;
  isbn?: string | null;
  author: string;
  category: string;
  publisher?: string | null;
  totalCopies: number;
  availableCopies: number;
  shelfNo?: string | null;
  status: LibraryBookStatus;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateLibraryBookPayload = {
  bookCode: string;
  bookTitle: string;
  isbn?: string;
  author: string;
  category: string;
  publisher?: string;
  totalCopies: number;
  availableCopies: number;
  shelfNo?: string;
  status?: LibraryBookStatus;
  description?: string;
};
