import { Component, OnInit, computed, signal } from '@angular/core';
import { Staff } from '../../../core/models/staff.model';
import { StaffsService } from '../../../core/services/staffs.service';
import { ReportTabsComponent } from '../components/report-tabs/report-tabs.component';

type DayColumn = {
  dayNumber: number;
  label: string;
};

type StaffStatusMarker = 'ACTIVE' | 'INACTIVE';

type StaffReportRecord = Staff & {
  staffCode?: string | null;
  staffId?: string | null;
  staffNo?: string | null;
  employeeNo?: string | null;
  fullName?: string | null;
  name?: string | null;
  department?: string | null;
  departmentName?: string | null;
  departmentCode?: string | null;
  designation?: string | null;
  designationName?: string | null;
  designationCode?: string | null;
  employmentType?: string | null;
  employment?: string | null;
  status?: string | null;
  phone?: string | null;
  email?: string | null;
  joiningDate?: string | null;
  salary?: number | string | null;
};

type StaffDayWiseRow = {
  staffKey: string;
  staffCode: string;
  staffName: string;
  department: string;
  designation: string;
  employmentType: string;
  status: StaffStatusMarker;
  activeDays: number;
  inactiveDays: number;
  totalDays: number;
  activeRate: number;
  dayMap: Record<number, StaffStatusMarker>;
};

@Component({
  selector: 'app-staff-day-wise',
  standalone: true,
  imports: [ReportTabsComponent],
  templateUrl: './staff-day-wise.component.html',
  styleUrl: './staff-day-wise.component.scss',
})
export class StaffDayWiseComponent implements OnInit {
  staffs = signal<Staff[]>([]);

  isLoading = signal(false);
  serverError = signal('');

  searchTerm = signal('');
  selectedMonth = signal('');
  selectedDepartment = signal('ALL');
  selectedDesignation = signal('ALL');
  selectedEmploymentType = signal('ALL');
  selectedStatus = signal<'ALL' | StaffStatusMarker>('ALL');

  monthDays = computed<DayColumn[]>(() => {
    const monthValue = this.selectedMonth();

    if (!monthValue) {
      return [];
    }

    const [year, month] = monthValue.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();

    return Array.from({ length: daysInMonth }, (_, index) => ({
      dayNumber: index + 1,
      label: String(index + 1).padStart(2, '0'),
    }));
  });

  staffRecords = computed(() =>
    this.staffs().map((staff) => staff as StaffReportRecord),
  );

  departmentOptions = computed(() => {
    const departments = this.staffRecords()
      .map((staff) => this.getStaffDepartment(staff))
      .filter((department) => department !== 'Not added');

    return Array.from(new Set(departments)).sort((a, b) => a.localeCompare(b));
  });

  designationOptions = computed(() => {
    const designations = this.staffRecords()
      .map((staff) => this.getStaffDesignation(staff))
      .filter((designation) => designation !== 'Not added');

    return Array.from(new Set(designations)).sort((a, b) => a.localeCompare(b));
  });

  employmentTypeOptions = computed(() => {
    const employmentTypes = this.staffRecords()
      .map((staff) => this.getStaffEmploymentType(staff))
      .filter((employmentType) => employmentType !== 'Not added');

    return Array.from(new Set(employmentTypes)).sort((a, b) =>
      a.localeCompare(b),
    );
  });

  filteredStaffs = computed(() => {
    const keyword = this.searchTerm().trim().toLowerCase();
    const departmentFilter = this.selectedDepartment();
    const designationFilter = this.selectedDesignation();
    const employmentTypeFilter = this.selectedEmploymentType();
    const statusFilter = this.selectedStatus();

    return this.staffRecords().filter((staff) => {
      const department = this.getStaffDepartment(staff);
      const designation = this.getStaffDesignation(staff);
      const employmentType = this.getStaffEmploymentType(staff);
      const status = this.getStaffStatus(staff);

      const searchableText = [
        this.getStaffCode(staff),
        this.getStaffName(staff),
        department,
        designation,
        employmentType,
        status,
        staff.phone,
        staff.email,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = !keyword || searchableText.includes(keyword);
      const matchesDepartment =
        departmentFilter === 'ALL' || department === departmentFilter;
      const matchesDesignation =
        designationFilter === 'ALL' || designation === designationFilter;
      const matchesEmploymentType =
        employmentTypeFilter === 'ALL' ||
        employmentType === employmentTypeFilter;
      const matchesStatus = statusFilter === 'ALL' || status === statusFilter;

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesDesignation &&
        matchesEmploymentType &&
        matchesStatus
      );
    });
  });

  staffRows = computed<StaffDayWiseRow[]>(() =>
    this.filteredStaffs()
      .map((staff) => {
        const status = this.getStaffStatus(staff);
        const totalDays = this.monthDays().length;
        const activeDays = status === 'ACTIVE' ? totalDays : 0;
        const inactiveDays = status === 'INACTIVE' ? totalDays : 0;
        const activeRate =
          totalDays === 0 ? 0 : Math.round((activeDays / totalDays) * 100);

        const dayMap: Record<number, StaffStatusMarker> = {};

        this.monthDays().forEach((day) => {
          dayMap[day.dayNumber] = status;
        });

        return {
          staffKey: staff.id,
          staffCode: this.getStaffCode(staff),
          staffName: this.getStaffName(staff),
          department: this.getStaffDepartment(staff),
          designation: this.getStaffDesignation(staff),
          employmentType: this.getStaffEmploymentType(staff),
          status,
          activeDays,
          inactiveDays,
          totalDays,
          activeRate,
          dayMap,
        };
      })
      .sort((a, b) => a.staffName.localeCompare(b.staffName)),
  );

  totalStaffs = computed(() => this.staffRows().length);

  activeStaffs = computed(
    () => this.staffRows().filter((row) => row.status === 'ACTIVE').length,
  );

  inactiveStaffs = computed(
    () => this.staffRows().filter((row) => row.status === 'INACTIVE').length,
  );

  totalActiveDays = computed(() =>
    this.staffRows().reduce((total, row) => total + row.activeDays, 0),
  );

  totalInactiveDays = computed(() =>
    this.staffRows().reduce((total, row) => total + row.inactiveDays, 0),
  );

  selectedMonthLabel = computed(() => {
    const monthValue = this.selectedMonth();

    if (!monthValue) {
      return 'All Months';
    }

    const [year, month] = monthValue.split('-').map(Number);

    return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  });

  constructor(private readonly staffsService: StaffsService) {}

  ngOnInit(): void {
    this.selectedMonth.set(this.getCurrentMonthForInput());
    this.loadStaffs();
  }

  loadStaffs(): void {
    this.isLoading.set(true);
    this.serverError.set('');

    this.staffsService.getStaffs().subscribe({
      next: (staffs) => {
        this.staffs.set(staffs);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.serverError.set(
          error?.error?.message || 'Failed to load staff day wise report.',
        );
        this.isLoading.set(false);
      },
    });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  onMonthInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.selectedMonth.set(value);
  }

  onDepartmentChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedDepartment.set(value);
  }

  onDesignationChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedDesignation.set(value);
  }

  onEmploymentTypeChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedEmploymentType.set(value);
  }

  onStatusChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as
      | 'ALL'
      | StaffStatusMarker;

    this.selectedStatus.set(value);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedMonth.set(this.getCurrentMonthForInput());
    this.selectedDepartment.set('ALL');
    this.selectedDesignation.set('ALL');
    this.selectedEmploymentType.set('ALL');
    this.selectedStatus.set('ALL');
  }

  exportCsv(): void {
    const rows = this.staffRows();
    const days = this.monthDays();

    if (rows.length === 0) {
      return;
    }

    const headers = [
      'Staff ID',
      'Staff Name',
      'Department',
      'Designation',
      'Employment Type',
      'Status',
      'Total Days',
      'Active Days',
      'Inactive Days',
      'Active Rate',
      ...days.map((day) => day.label),
    ];

    const csvRows = rows.map((row) => [
      row.staffCode,
      row.staffName,
      row.department,
      row.designation,
      row.employmentType,
      this.getStatusLabel(row.status),
      String(row.totalDays),
      String(row.activeDays),
      String(row.inactiveDays),
      `${row.activeRate}%`,
      ...days.map((day) => this.getStatusShortLabel(row.dayMap[day.dayNumber])),
    ]);

    const csvContent = [headers, ...csvRows]
      .map((row) => row.map((cell) => this.escapeCsvValue(cell)).join(','))
      .join('\n');

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `staff-day-wise-${
      this.selectedMonth() || this.getCurrentMonthForInput()
    }.csv`;
    link.click();

    window.URL.revokeObjectURL(url);
  }

  getStaffInitial(row: StaffDayWiseRow): string {
    return row.staffName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  }

  getStatusShortLabel(status: StaffStatusMarker): string {
    return status === 'ACTIVE' ? 'A' : 'I';
  }

  getStatusLabel(status: StaffStatusMarker): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  private getStaffCode(staff: StaffReportRecord): string {
    return (
      staff.staffCode ||
      staff.staffId ||
      staff.staffNo ||
      staff.employeeNo ||
      'Not added'
    );
  }

  private getStaffName(staff: StaffReportRecord): string {
    return staff.fullName || staff.name || 'Unknown Staff';
  }

  private getStaffDepartment(staff: StaffReportRecord): string {
    return staff.department || staff.departmentName || 'Not added';
  }

  private getStaffDesignation(staff: StaffReportRecord): string {
    return staff.designation || staff.designationName || 'Not added';
  }

  private getStaffEmploymentType(staff: StaffReportRecord): string {
    return this.formatEnumLabel(
      staff.employmentType || staff.employment || 'Not added',
    );
  }

  private getStaffStatus(staff: StaffReportRecord): StaffStatusMarker {
    return String(staff.status || 'ACTIVE').toUpperCase() === 'INACTIVE'
      ? 'INACTIVE'
      : 'ACTIVE';
  }

  private formatEnumLabel(value: string): string {
    if (!value || value === 'Not added') {
      return 'Not added';
    }

    return value
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  private getCurrentMonthForInput(): string {
    const today = new Date();

    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      '0',
    )}`;
  }

  private escapeCsvValue(value: string): string {
    const safeValue = String(value).replace(/"/g, '""');

    return `"${safeValue}"`;
  }
}
