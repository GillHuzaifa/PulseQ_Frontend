import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
//primeng
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';
import { TabViewModule } from 'primeng/tabview';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { RippleModule } from 'primeng/ripple';
//services
import { MessageService, ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CardModule,
    ButtonModule,
    TableModule,
    ChartModule,
    TabViewModule,
    DialogModule,
    ConfirmDialogModule,
    InputTextModule,
    DropdownModule,
    CheckboxModule,
    ToastModule,
    RippleModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  currentNav = 'dashboard';
  activeTab = 0;

  // Dashboard Data
  metrics = [
    { label: 'Total Patients Today', value: 127, icon: 'pi-users', bgColor: '#dbeafe' },
    { label: 'Active Doctors', value: 4, icon: 'pi-heart', bgColor: '#dcfce7' },
    { label: 'Avg Wait Time', value: '18m', icon: 'pi-clock', bgColor: '#fed7aa' },
    { label: 'Departments', value: 5, icon: 'pi-building', bgColor: '#e9d5ff' }
  ];

  chartData: any;
  chartOptions: any;

  logEntries = [
    { message: 'Token A-011 generated for General Medicine', time: '2m ago' },
    { message: 'Token A-012 generated for General Medicine', time: '2m ago' },
    { message: 'Token A-013 generated for General Medicine', time: '2m ago' },
    { message: 'Token A-014 generated for General Medicine', time: '2m ago' },
    { message: 'Token A-015 generated for General Medicine', time: '2m ago' }
  ];

  doctors = [
    { name: 'Dr. Ahmad Khan', department: 'Cardiology', room: '201', status: 'Available' },
    { name: 'Dr. Fatima Ali', department: 'Cardiology', room: '202', status: 'Available' },
    { name: 'Dr. Hassan Hussein', department: 'Neurology', room: '301', status: 'Available' },
    { name: 'Dr. Aisha Mohamed', department: 'Orthopedics', room: '302', status: 'Available' },
    { name: 'Dr. Omar Ibrahim', department: 'General Medicine', room: '101', status: 'Available' },
    { name: 'Dr. Sarah Khan', department: 'General Medicine', room: '102', status: 'Available' }
  ];

  departments = [
    { name: 'General Medicine' },
    { name: 'Cardiology' },
    { name: 'Pediatrics' },
    { name: 'Orthopedics' },
    { name: 'Neurology' }
  ];

  // Dialog visibility flags
  showAddDoctorDialog = false;
  showEditDoctorDialog = false;
  showAddDeptDialog = false;

  // Form models
  newDoctorForm: any;
  editDoctorForm: any = null;
  editingDoctor: any = null;
  newDeptForm: any;

  // Department options for dropdown
  departmentOptions: any[] = [];

  constructor(
    public router: Router,
    private activatedRoute: ActivatedRoute,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit() {
    this.initChart();
    this.loadDepartmentOptions();
    this.resetNewDoctorForm();
    this.resetNewDeptForm();
    this.detectActiveRoute();
  }

  detectActiveRoute() {
    // Use Router events and current url to set active tab so navigation from sidebar works
    const setFromUrl = (url: string) => {
      if (url.includes('/admin/dashboard/overview') || url.includes('/admin/overview')) {
        this.activeTab = 0; this.currentNav = 'dashboard';
      } else if (url.includes('/admin/dashboard/doctors') || url.includes('/admin/doctors')) {
        this.activeTab = 1; this.currentNav = 'doctors';
      } else if (url.includes('/admin/dashboard/departments') || url.includes('/admin/departments')) {
        this.activeTab = 2; this.currentNav = 'departments';
      } else if (url.includes('/admin/dashboard/statistics') || url.includes('/admin/statistics')) {
        this.activeTab = 3; this.currentNav = 'statistics';
      } else {
        this.activeTab = 0; this.currentNav = 'dashboard';
      }
    };

    // initial
    setFromUrl(this.router.url);

    // on navigation
    this.router.events.subscribe(evt => {
      // NavigationEnd provides final url; check string contains
      // avoid importing NavigationEnd explicitly to keep code simple
      setFromUrl(this.router.url);
    });
  }

  resetNewDoctorForm() {
    this.newDoctorForm = { name: '', department: null, room: '', available: true };
  }

  resetNewDeptForm() {
    this.newDeptForm = { name: '' };
  }

  loadDepartmentOptions() {
    this.departmentOptions = this.departments.map(d => ({ label: d.name, value: d.name }));
  }

  initChart() {
    const primaryColor = '#3b82f6';

    this.chartData = {
      labels: ['8am', '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm'],
      datasets: [
        {
          label: 'Patients',
          data: [12, 35, 46, 29, 22, 15, 42, 32],
          fill: true,
          backgroundColor: primaryColor,
          borderColor: primaryColor,
          borderRadius: 4,
          borderSkipped: false
        }
      ]
    };

    this.chartOptions = {
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 60,
          ticks: {
            stepSize: 15
          }
        }
      }
    };
  }

  // Doctor Management Methods
  openAddDoctorDialog() {
    this.resetNewDoctorForm();
    this.showAddDoctorDialog = true;
  }

  closeAddDoctorDialog() {
    this.showAddDoctorDialog = false;
    this.resetNewDoctorForm();
  }

  addDoctor() {
    if (!this.newDoctorForm.name || !this.newDoctorForm.department || !this.newDoctorForm.room) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'All fields are required' });
      return;
    }

    const newDoctor = {
      name: this.newDoctorForm.name,
      department: this.newDoctorForm.department,
      room: this.newDoctorForm.room,
      status: this.newDoctorForm.available ? 'Available' : 'Offline'
    };

    this.doctors.push(newDoctor);
    this.messageService.add({ severity: 'success', summary: 'Success', detail: `Doctor ${newDoctor.name} added successfully` });
    this.closeAddDoctorDialog();
  }

  openEditDoctorDialog(doctor: any) {
    this.editingDoctor = doctor;
    this.editDoctorForm = {
      name: doctor.name,
      department: doctor.department,
      room: doctor.room,
      available: doctor.status === 'Available'
    };
    this.showEditDoctorDialog = true;
  }

  closeEditDoctorDialog() {
    this.showEditDoctorDialog = false;
    this.editDoctorForm = null;
    this.editingDoctor = null;
  }

  saveEditDoctor() {
    if (!this.editDoctorForm.name || !this.editDoctorForm.department || !this.editDoctorForm.room) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'All fields are required' });
      return;
    }

    const index = this.doctors.indexOf(this.editingDoctor);
    if (index > -1) {
      this.doctors[index] = {
        name: this.editDoctorForm.name,
        department: this.editDoctorForm.department,
        room: this.editDoctorForm.room,
        status: this.editDoctorForm.available ? 'Available' : 'Offline'
      };
    }

    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Doctor updated successfully' });
    this.closeEditDoctorDialog();
  }

  deleteDoctor(doctor: any) {
    const index = this.doctors.indexOf(doctor);
    if (index > -1) {
      this.doctors.splice(index, 1);
      this.messageService.add({ severity: 'error', summary: 'Deleted', detail: 'Doctor deleted successfully' });
    }
  }

  confirmDelete(doctor: any) {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this doctor?',
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.deleteDoctor(doctor);
      }
    });
  }

  confirmDeleteDepartment(dept: any) {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this department?',
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.deleteDepartment(dept);
      }
    });
  }

  // Department Management Methods
  openAddDeptDialog() {
    this.resetNewDeptForm();
    this.showAddDeptDialog = true;
  }

  closeAddDeptDialog() {
    this.showAddDeptDialog = false;
    this.resetNewDeptForm();
  }

  addDepartment() {
    if (!this.newDeptForm.name) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Department name is required' });
      return;
    }

    this.departments.push({ name: this.newDeptForm.name });
    this.loadDepartmentOptions();
    this.messageService.add({ severity: 'success', summary: 'Success', detail: `Department ${this.newDeptForm.name} added successfully` });
    this.closeAddDeptDialog();
  }

  deleteDepartment(dept: any) {
    const index = this.departments.indexOf(dept);
    if (index > -1) {
      this.departments.splice(index, 1);
      this.loadDepartmentOptions();
      this.messageService.add({ severity: 'error', summary: 'Deleted', detail: 'Department deleted successfully' });
    }
  }

  navigateTo(page: string) {
    this.currentNav = page;
  }

  setActiveTab(tabIndex: number) {
    this.activeTab = tabIndex;
  }

  signOut() {
    this.router.navigate(['/']);
  }
}
