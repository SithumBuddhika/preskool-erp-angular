import { Component, OnInit, computed, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  CreateLibraryBookPayload,
  LibraryBook,
  LibraryBookStatus,
} from '../../../core/models/library.model';
import { LibraryService } from '../../../core/services/library.service';

type ToastType = 'success' | 'error';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './library.component.html',
  styleUrl: './library.component.scss',
})
export class LibraryComponent implements OnInit {
  books = signal<LibraryBook[]>([]);
  selectedBook = signal<LibraryBook | null>(null);
  bookToDelete = signal<LibraryBook | null>(null);

  isLoading = signal(false);
  isSubmitting = signal(false);
  isDeleting = signal(false);
  showBookModal = signal(false);

  serverError = signal('');
  searchTerm = signal('');

  toast = signal<{ message: string; type: ToastType } | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  isEditMode = computed(() => this.selectedBook() !== null);

  availableBooks = computed(
    () => this.books().filter((book) => book.status === 'AVAILABLE').length,
  );

  unavailableBooks = computed(
    () => this.books().filter((book) => book.status === 'UNAVAILABLE').length,
  );

  totalCopies = computed(() =>
    this.books().reduce(
      (total, book) => total + Number(book.totalCopies || 0),
      0,
    ),
  );

  availableCopies = computed(() =>
    this.books().reduce(
      (total, book) => total + Number(book.availableCopies || 0),
      0,
    ),
  );

  bookForm = new FormGroup({
    bookCode: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    bookTitle: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    isbn: new FormControl('', {
      nonNullable: true,
    }),
    author: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    category: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    publisher: new FormControl('', {
      nonNullable: true,
    }),
    totalCopies: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
    availableCopies: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
    shelfNo: new FormControl('', {
      nonNullable: true,
    }),
    status: new FormControl<LibraryBookStatus>('AVAILABLE', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    description: new FormControl('', {
      nonNullable: true,
    }),
  });

  constructor(private readonly libraryService: LibraryService) {}

  ngOnInit(): void {
    this.loadBooks();
  }

  loadBooks(search = this.searchTerm()): void {
    this.isLoading.set(true);
    this.serverError.set('');

    this.libraryService.getBooks(search).subscribe({
      next: (books) => {
        this.books.set(books);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.serverError.set(
          error?.error?.message || 'Failed to load library books.',
        );
        this.isLoading.set(false);
        this.showToast('Failed to load library books.', 'error');
      },
    });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.loadBooks(value);
  }

  openCreateModal(): void {
    this.selectedBook.set(null);

    this.bookForm.reset({
      bookCode: '',
      bookTitle: '',
      isbn: '',
      author: '',
      category: '',
      publisher: '',
      totalCopies: '1',
      availableCopies: '1',
      shelfNo: '',
      status: 'AVAILABLE',
      description: '',
    });

    this.libraryService.generateNextBookCode().subscribe({
      next: (bookCode) => {
        this.bookForm.controls.bookCode.setValue(bookCode);
      },
      error: () => {
        this.bookForm.controls.bookCode.setValue('LIB-0001');
        this.showToast('Could not generate next book ID.', 'error');
      },
    });

    this.serverError.set('');
    this.showBookModal.set(true);
  }

  openEditModal(book: LibraryBook): void {
    this.selectedBook.set(book);

    this.bookForm.reset({
      bookCode: book.bookCode,
      bookTitle: book.bookTitle,
      isbn: book.isbn || '',
      author: book.author,
      category: book.category,
      publisher: book.publisher || '',
      totalCopies: String(book.totalCopies),
      availableCopies: String(book.availableCopies),
      shelfNo: book.shelfNo || '',
      status: book.status,
      description: book.description || '',
    });

    this.serverError.set('');
    this.showBookModal.set(true);
  }

  closeBookModal(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.showBookModal.set(false);
    this.selectedBook.set(null);
    this.serverError.set('');
  }

  saveBook(): void {
    this.bookForm.markAllAsTouched();
    this.serverError.set('');

    if (this.bookForm.invalid || this.isSubmitting()) {
      return;
    }

    if (!this.isCopyCountValid()) {
      this.serverError.set(
        'Available copies cannot be greater than total copies.',
      );
      return;
    }

    const selectedBook = this.selectedBook();
    const payload = this.buildBookPayload();

    this.isSubmitting.set(true);

    if (selectedBook) {
      this.libraryService.updateBook(selectedBook.id, payload).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeBookModal();
          this.loadBooks();
          this.showToast('Library book updated successfully.', 'success');
        },
        error: (error) => {
          this.isSubmitting.set(false);
          this.serverError.set(
            error?.error?.message || 'Failed to update library book.',
          );
          this.showToast('Failed to update library book.', 'error');
        },
      });

      return;
    }

    this.libraryService.createBook(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeBookModal();
        this.loadBooks();
        this.showToast('Library book added successfully.', 'success');
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.serverError.set(
          error?.error?.message || 'Failed to create library book.',
        );
        this.showToast('Failed to create library book.', 'error');
      },
    });
  }

  openDeleteModal(book: LibraryBook): void {
    this.bookToDelete.set(book);
  }

  closeDeleteModal(): void {
    if (this.isDeleting()) {
      return;
    }

    this.bookToDelete.set(null);
  }

  confirmDeleteBook(): void {
    const book = this.bookToDelete();

    if (!book || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);

    this.libraryService.deleteBook(book.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.bookToDelete.set(null);
        this.loadBooks();
        this.showToast('Library book deleted successfully.', 'success');
      },
      error: (error) => {
        this.isDeleting.set(false);
        this.bookToDelete.set(null);
        this.serverError.set(
          error?.error?.message || 'Failed to delete library book.',
        );
        this.showToast('Failed to delete library book.', 'error');
      },
    });
  }

  getInitials(book: LibraryBook): string {
    return book.bookTitle
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  }

  getStatusLabel(status: LibraryBookStatus): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  getAvailabilityText(book: LibraryBook): string {
    return `${book.availableCopies} / ${book.totalCopies}`;
  }

  isInvalid(controlName: keyof typeof this.bookForm.controls): boolean {
    const control = this.bookForm.controls[controlName];
    return control.invalid && control.touched;
  }

  isCopyCountValid(): boolean {
    const totalCopies = Number(this.bookForm.controls.totalCopies.value || 0);
    const availableCopies = Number(
      this.bookForm.controls.availableCopies.value || 0,
    );

    return availableCopies <= totalCopies;
  }

  private buildBookPayload(): CreateLibraryBookPayload {
    const formValue = this.bookForm.getRawValue();

    const payload: CreateLibraryBookPayload = {
      bookCode: formValue.bookCode.trim(),
      bookTitle: formValue.bookTitle.trim(),
      author: formValue.author.trim(),
      category: formValue.category.trim(),
      totalCopies: Number(formValue.totalCopies || 0),
      availableCopies: Number(formValue.availableCopies || 0),
      status: formValue.status,
    };

    if (formValue.isbn.trim()) {
      payload.isbn = formValue.isbn.trim();
    }

    if (formValue.publisher.trim()) {
      payload.publisher = formValue.publisher.trim();
    }

    if (formValue.shelfNo.trim()) {
      payload.shelfNo = formValue.shelfNo.trim();
    }

    if (formValue.description.trim()) {
      payload.description = formValue.description.trim();
    }

    return payload;
  }

  private showToast(message: string, type: ToastType): void {
    this.toast.set({ message, type });

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }

    this.toastTimer = setTimeout(() => {
      this.toast.set(null);
    }, 2800);
  }
}
