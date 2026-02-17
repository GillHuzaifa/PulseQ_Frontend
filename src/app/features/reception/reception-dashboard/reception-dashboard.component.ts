import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { QueueService } from '../../../core/services/queue.service';
import { ConsultationService } from '../../../core/services/consultation.service';
import { Token } from '../../../shared/models/token.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface Patient {
  token: string;
  name: string;
  age: number;
  gender: string;
  reason: string;
  status?: 'pending' | 'completed' | 'skipped';
  department?: string;
  phone?: string;
  paymentStatus?: 'paid' | 'unpaid';
}

@Component({
  selector: 'app-reception-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    DropdownModule,
    DialogModule,
    ToastModule,
    InputTextModule,
    InputTextareaModule,
    CheckboxModule
  ],
  providers: [MessageService],
  templateUrl: './reception-dashboard.component.html',
  styleUrls: ['./reception-dashboard.component.css']
})
export class ReceptionDashboardComponent implements OnInit, OnDestroy {
  departments = [
    { label: 'General Medicine', value: 'General Medicine' },
    { label: 'Cardiology', value: 'Cardiology' },
    { label: 'Pediatrics', value: 'Pediatrics' }
  ];
  doctors = [
    { label: 'Choose a specific doctor...', value: null },
    { label: 'Dr. Ahmad Khan', value: 'D002' },
    { label: 'Dr. Fatima Ali', value: 'D003' },
    { label: 'Dr. Hassan Hussein', value: 'D004' },
    { label: 'Dr. Aisha Mohamed', value: 'D005' },
    { label: 'Dr. Omar Ibrahim', value: 'D006' },
    { label: 'Dr. Sarah Khan', value: 'D001' }
  ];
  genders = [
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Other', value: 'Other' }
  ];
  selectedDepartment = 'General Medicine';
  currentNav = 'dashboard';

  current: Patient | null = null;
  upcoming: Patient[] = [];
  allUpcoming: Patient[] = [];
  allTokens: Patient[] = [];
  waitingCount = 0;
  completedCount = 0;
  skippedCount = 0;
  avgWait = 0;

  showWalkIn = false;
  walkIn: any = {
    department: 'General Medicine',
    doctor: null,
    assignAnyDoctor: false,
    phone: '',
    name: '',
    age: null,
    gender: 'Male',
    reason: '',
    paymentStatus: 'unpaid',
    specialInstructions: ''
  };
  // Track touched fields for validation display
  walkInTouched: { [key: string]: boolean } = {};

  private destroy$ = new Subject<void>();

  constructor(private router: Router, private messageService: MessageService, private queueService: QueueService, private consultationService: ConsultationService) { }

  ngOnInit() {
    // Subscribe to shared queue and consultation history
    this.queueService.getQueue().pipe(takeUntil(this.destroy$)).subscribe(tokens => {
      this.allTokens = tokens.map((t: Token) => ({
        token: t.tokenNumber,
        name: t.patientName || t.patientId,
        age: t.patientAge || 0,
        gender: (t.patientGender as any) || 'Unknown',
        reason: (t.reasonForVisit as any) || '',
        status: t.status === 'WAITING' ? 'pending' : (t.status === 'DONE' ? 'completed' : (t.status === 'SKIPPED' ? 'skipped' : 'pending')),
        department: t.department || 'General Medicine',
        phone: t.patientPhone
      } as any));

      // compute upcoming and current
      const inProgress = tokens.find(x => x.status === 'IN_PROGRESS');
      if (inProgress) {
        this.current = {
          token: inProgress.tokenNumber,
          name: inProgress.patientName || inProgress.patientId,
          age: inProgress.patientAge || 0,
          gender: (inProgress.patientGender as any) || 'Unknown',
          reason: (inProgress.reasonForVisit as any) || '',
          status: 'pending',
          department: inProgress.department,
          phone: inProgress.patientPhone
        } as any;
      } else {
        // no in-progress, pick first waiting as current
        const waiting = tokens.filter(x => x.status === 'WAITING');
        if (waiting.length) {
          const w = waiting[0];
          this.current = { token: w.tokenNumber, name: w.patientName || w.patientId, age: w.patientAge || 0, gender: w.patientGender || 'Unknown', reason: w.reasonForVisit || '', status: 'pending', department: w.department, phone: w.patientPhone } as any;
        } else {
          this.current = null;
        }
      }

      this.allUpcoming = this.allTokens.filter(t => t.status === 'pending');
      this.filterByDepartment();
    });

    this.consultationService.consultations$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      // recompute completed count and avg wait
      this.completedCount = this.consultationService.getCompletedToday();
      this.avgWait = this.consultationService.getAverageConsultTime();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private handleStorageEvent = (e: StorageEvent) => {
    if (!e) return;
    // Only reload when the receptionQueue key changes
    if (e.key === 'receptionQueue') {
      // queue is reactive; recompute filtered view
      this.filterByDepartment();
    }
  };

  // loadQueue replaced by subscription in ngOnInit

  onDepartmentChange() {
    this.filterByDepartment();
  }

  filterByDepartment() {
    // Filter upcoming patients by selected department. Treat missing department as 'General Medicine'.
    this.upcoming = this.allUpcoming.filter(patient => {
      const dept = (patient.department as string) ?? 'General Medicine';
      return !this.selectedDepartment || dept === this.selectedDepartment;
    });
    this.waitingCount = this.upcoming.length;
  }

  saveQueue() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('receptionQueue', JSON.stringify({
          current: this.current,
          allTokens: this.allTokens
        }));
      }
    } catch (e) {
      // ignore on server
    }
  }

  completeCurrent() {
    if (!this.current) return;
    // Mark current token as completed in allTokens
    const idx = this.allTokens.findIndex(t => t.token === this.current?.token);
    if (idx >= 0) {
      this.allTokens[idx].status = 'completed';
    }
    this.completedCount++;
    this.messageService.add({ severity: 'success', summary: 'Completed', detail: this.current.token, life: 2000 });

    // Remove from upcoming
    const upIdx = this.allUpcoming.findIndex(p => p.token === this.current?.token);
    if (upIdx >= 0) this.allUpcoming.splice(upIdx, 1);

    // Promote next patient (first-come-first-serve). Use shift() so it is removed from allUpcoming.
    this.current = this.allUpcoming.length > 0 ? this.allUpcoming.shift()! : null;
    this.filterByDepartment();
    this.saveQueue();
  }

  skipCurrent() {
    if (!this.current) return;
    // Mark current token as skipped in allTokens
    const idx = this.allTokens.findIndex(t => t.token === this.current?.token);
    if (idx >= 0) {
      this.allTokens[idx].status = 'skipped';
    }
    this.skippedCount++;
    this.messageService.add({ severity: 'info', summary: 'Skipped', detail: this.current.token, life: 2000 });

    // Remove from upcoming
    const upIdx = this.allUpcoming.findIndex(p => p.token === this.current?.token);
    if (upIdx >= 0) this.allUpcoming.splice(upIdx, 1);

    // Promote next patient and remove from upcoming
    this.current = this.allUpcoming.length > 0 ? this.allUpcoming.shift()! : null;
    this.filterByDepartment();
    this.saveQueue();
  }

  addWalkIn() {
    // Validate required fields with proper type checking
    if (!this.isNameValid(this.walkIn.name)) {
      if (this.hasNumbersInName(this.walkIn.name)) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Patient Name cannot contain numbers', life: 3000 });
      } else {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Patient Name is required and must contain only letters', life: 3000 });
      }
      return;
    }
    if (!this.isAgeValid(this.walkIn.age)) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please enter a valid age (1-150)', life: 3000 });
      return;
    }
    if (!this.walkIn.gender) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Gender is required', life: 3000 });
      return;
    }
    if (!this.walkIn.department) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Department is required', life: 3000 });
      return;
    }
    if (!this.isPhoneValid(this.walkIn.phone)) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Phone must be numeric (digits only, minimum 7 digits)', life: 3000 });
      return;
    }
    if (!this.walkIn.reason || !this.walkIn.reason.trim()) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Reason for Visit is required', life: 3000 });
      return;
    }
    // Create walk-in token via QueueService so it enters the shared queue
    const patientId = `WALKIN-${Date.now()}`;
    const extras = {
      patientName: this.walkIn.name,
      patientPhone: this.walkIn.phone,
      patientAge: this.walkIn.age,
      patientGender: this.walkIn.gender,
      reasonForVisit: this.walkIn.reason,
      specialNotes: this.walkIn.specialInstructions
    };
    const created = this.queueService.addTokenFor(
      patientId,
      this.walkIn.doctor || '',
      this.walkIn.department || 'General Medicine',
      extras as any
    );

    this.messageService.add({ severity: 'success', summary: 'Token Generated', detail: `${created.tokenNumber} - ${this.walkIn.name}`, life: 3000 });
    this.walkIn = {
      department: 'General Medicine',
      doctor: null,
      assignAnyDoctor: false,
      phone: '',
      cnic: '',
      name: '',
      age: null,
      gender: 'Male',
      reason: '',
      paymentStatus: 'unpaid',
      specialInstructions: ''
    };
    this.walkInTouched = {};
    this.showWalkIn = false;
    this.filterByDepartment();
    this.saveQueue();
  }


  // Validation helper methods for walk-in form
  isNameValid(name: string): boolean {
    if (!name) return false;
    const trimmed = name.trim();
    if (!trimmed) return false;
    // Allow letters and spaces only - NO numbers, NO special characters
    return /^[a-zA-Z\s]+$/.test(trimmed);
  }

  hasNumbersInName(name: string): boolean {
    if (!name) return false;
    // Check if name contains any digits (0-9)
    return /[0-9]/.test(name);
  }

  isPhoneValid(phone: string): boolean {
    if (!phone) return false; // phone is required
    // Only allow digits (0-9) - NO spaces, hyphens, plus, or any other character
    const cleanPhone = phone.trim();
    return /^[0-9]+$/.test(cleanPhone) && cleanPhone.length >= 7;
  }

  isAgeValid(age: any): boolean {
    if (!age && age !== 0) return false;
    const ageNum = Number(age);
    // Must be a valid number, positive integer between 1-150
    return !isNaN(ageNum) && Number.isInteger(ageNum) && ageNum > 0 && ageNum <= 150;
  }

  navigateTo(page: string) {
    this.currentNav = page;
    if (page === 'queue') {
      this.router.navigate(['/reception', 'queue']);
    }
  }

  signOut() {
    this.router.navigate(['/']);
  }
}
