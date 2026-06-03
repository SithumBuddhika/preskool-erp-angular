import { Component, OnInit, computed, signal } from '@angular/core';
import { Staff } from '../../../core/models/staff.model';
import { StaffsService } from '../../../core/services/staffs.service';
import { ReportTabsComponent } from '../components/report-tabs/report-tabs.component';

type StaffStatus = 'ACTIVE' | 'INACTIVE';

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
  address?: string | null;
};

type StaffReportRow = {
  id: string;
  staffCode: string;
  staffName: string;
  department: string;
  designation: string;
  designationCode: string;
  employmentType: string;
  status: StaffStatus;
  phone: string;
  email: string;
  joiningDate: string;
  salary: string;
  address: string;
};

type GroupSummary = {
  label: string;
  total: number;
  active: number;
  inactive: number;
};

@Component({
  selector: 'app-staff-report',
  standalone: true,
  imports: [ReportTabsComponent],
  templateUrl: './staff-report.component.html',
  styleUrl: './staff-report.component.scss',
})
export class StaffReportComponent implements OnInit {
  staffs = signal<Staff[]>([]);

  isLoading = signal(false);
  serverError = signal('');

  searchTerm = signal('');
  selectedDepartment = signal('ALL');
  selectedDesignation = signal('ALL');
  selectedEmploymentType = signal('ALL');
  selectedStatus = signal<'ALL' | StaffStatus>('ALL');

  staffRows = computed<StaffReportRow[]>(() =>
    this.staffs()
      .map((staff) => this.normalizeStaff(staff as StaffReportRecord))
      .sort((a, b) => a.staffName.localeCompare(b.staffName)),
  );

  filteredStaffRows = computed(() => {
    const keyword = this.searchTerm().trim().toLowerCase();
    const departmentFilter = this.selectedDepartment();
    const designationFilter = this.selectedDesignation();
    const employmentTypeFilter = this.selectedEmploymentType();
    const statusFilter = this.selectedStatus();

    return this.staffRows().filter((staff) => {
      const searchableText = [
        staff.staffCode,
        staff.staffName,
        staff.department,
        staff.designation,
        staff.designationCode,
        staff.employmentType,
        staff.status,
        staff.phone,
        staff.email,
        staff.address,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = !keyword || searchableText.includes(keyword);
      const matchesDepartment =
        departmentFilter === 'ALL' || staff.department === departmentFilter;
      const matchesDesignation =
        designationFilter === 'ALL' || staff.designation === designationFilter;
      const matchesEmploymentType =
        employmentTypeFilter === 'ALL' ||
        staff.employmentType === employmentTypeFilter;
      const matchesStatus =
        statusFilter === 'ALL' || staff.status === statusFilter;

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesDesignation &&
        matchesEmploymentType &&
        matchesStatus
      );
    });
  });

  departmentOptions = computed(() => {
    const departments = this.staffRows()
      .map((staff) => staff.department)
      .filter((department) => department !== 'Not added');

    return Array.from(new Set(departments)).sort((a, b) => a.localeCompare(b));
  });

  designationOptions = computed(() => {
    const designations = this.staffRows()
      .map((staff) => staff.designation)
      .filter((designation) => designation !== 'Not added');

    return Array.from(new Set(designations)).sort((a, b) => a.localeCompare(b));
  });

  employmentTypeOptions = computed(() => {
    const employmentTypes = this.staffRows()
      .map((staff) => staff.employmentType)
      .filter((employmentType) => employmentType !== 'Not added');

    return Array.from(new Set(employmentTypes)).sort((a, b) =>
      a.localeCompare(b),
    );
  });

  totalStaffs = computed(() => this.filteredStaffRows().length);

  activeStaffs = computed(
    () =>
      this.filteredStaffRows().filter((staff) => staff.status === 'ACTIVE')
        .length,
  );

  inactiveStaffs = computed(
    () =>
      this.filteredStaffRows().filter((staff) => staff.status === 'INACTIVE')
        .length,
  );

  departmentSummary = computed<GroupSummary[]>(() =>
    this.buildGroupSummary(this.filteredStaffRows(), 'department'),
  );

  designationSummary = computed<GroupSummary[]>(() =>
    this.buildGroupSummary(this.filteredStaffRows(), 'designation'),
  );

  employmentSummary = computed<GroupSummary[]>(() =>
    this.buildGroupSummary(this.filteredStaffRows(), 'employmentType'),
  );

  constructor(private readonly staffsService: StaffsService) {}

  ngOnInit(): void {
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
          error?.error?.message || 'Failed to load staff report.',
        );
        this.isLoading.set(false);
      },
    });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
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
      | StaffStatus;
    this.selectedStatus.set(value);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedDepartment.set('ALL');
    this.selectedDesignation.set('ALL');
    this.selectedEmploymentType.set('ALL');
    this.selectedStatus.set('ALL');
  }

  exportCsv(): void {
    const rows = this.filteredStaffRows();

    if (rows.length === 0) {
      return;
    }

    const headers = [
      'Staff ID',
      'Staff Name',
      'Department',
      'Designation',
      'Designation Code',
      'Employment Type',
      'Status',
      'Phone',
      'Email',
      'Joining Date',
      'Salary',
      'Address',
    ];

    const csvRows = rows.map((staff) => [
      staff.staffCode,
      staff.staffName,
      staff.department,
      staff.designation,
      staff.designationCode,
      staff.employmentType,
      this.getStatusLabel(staff.status),
      staff.phone,
      staff.email,
      staff.joiningDate,
      staff.salary,
      staff.address,
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
    link.download = `staff-report-${this.getTodayForFileName()}.csv`;
    link.click();

    window.URL.revokeObjectURL(url);
  }

  getStaffInitial(staff: StaffReportRow): string {
    return staff.staffName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  }

  getStatusLabel(status: StaffStatus): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  private normalizeStaff(staff: StaffReportRecord): StaffReportRow {
    return {
      id: staff.id,
      staffCode:
        staff.staffCode ||
        staff.staffId ||
        staff.staffNo ||
        staff.employeeNo ||
        'Not added',
      staffName: staff.fullName || staff.name || 'Unknown Staff',
      department: staff.department || staff.departmentName || 'Not added',
      designation: staff.designation || staff.designationName || 'Not added',
      designationCode: staff.designationCode || 'Not added',
      employmentType: this.formatEnumLabel(
        staff.employmentType || staff.employment || 'Not added',
      ),
      status:
        String(staff.status || 'ACTIVE').toUpperCase() === 'INACTIVE'
          ? 'INACTIVE'
          : 'ACTIVE',
      phone: staff.phone || 'Not added',
      email: staff.email || 'Not added',
      joiningDate: staff.joiningDate
        ? this.formatDisplayDate(staff.joiningDate)
        : 'Not added',
      salary:
        staff.salary !== undefined && staff.salary !== null
          ? String(staff.salary)
          : 'Not added',
      address: staff.address || 'Not added',
    };
  }

  private buildGroupSummary(
    rows: StaffReportRow[],
    key: 'department' | 'designation' | 'employmentType',
  ): GroupSummary[] {
    const groupedRows = new Map<string, StaffReportRow[]>();

    rows.forEach((staff) => {
      const label = staff[key] || 'Not added';

      if (!groupedRows.has(label)) {
        groupedRows.set(label, []);
      }

      groupedRows.get(label)?.push(staff);
    });

    return Array.from(groupedRows.entries())
      .map(([label, grouped]) => ({
        label,
        total: grouped.length,
        active: grouped.filter((staff) => staff.status === 'ACTIVE').length,
        inactive: grouped.filter((staff) => staff.status === 'INACTIVE').length,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
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

  private formatDisplayDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  }

  private escapeCsvValue(value: string): string {
    const safeValue = String(value).replace(/"/g, '""');

    return `"${safeValue}"`;
  }

  private getTodayForFileName(): string {
    return new Date().toISOString().split('T')[0];
  }
}
