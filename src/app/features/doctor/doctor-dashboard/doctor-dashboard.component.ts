import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { BadgeModule } from 'primeng/badge';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ConsultationService } from '../../../core/services/consultation.service';
import { QueueService } from '../../../core/services/queue.service';
import { Token } from '../../../shared/models/token.model';
import { Subscription } from 'rxjs';

interface Patient {
  name: string;
  age: number;
  gender: string;
  reason: string;
  phone: string;
  token: string;
  patientId?: string;
}

interface UpcomingPatient {
  token: string;
  name: string;
  age: number;
  reason: string;
  waitTime: string;
  patientId?: string;
}

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, CardModule, InputTextareaModule, BadgeModule, ToastModule],
  providers: [MessageService],
  templateUrl: './doctor-dashboard.component.html',
  styleUrl: './doctor-dashboard.component.css'
})
export class DoctorDashboardComponent implements OnInit, OnDestroy {
  doctorName = 'Dr. Sarah Khan';
  doctorId = 'D001';
  specialty = 'General Medicine';
  room = 'Room 101';
  waitingPatients = 0;
  patientsServed = 0;

  // Current consultation (may be null when theres no patient)
  currentPatient: Patient | null = null;

  consultationNotes = '';
  consultationStartTime: Date | null = null;
  isConsultationActive = false;

  // Upcoming patients list
  upcomingPatients: UpcomingPatient[] = [];
  // Skipped patients list 
  skippedPatients: UpcomingPatient[] = [];

  private sub: Subscription | null = null;
  constructor(
    private router: Router,
    private messageService: MessageService,
    private consultationService: ConsultationService,
    private queueService: QueueService
  ) { }

  startConsultation(): void {
    if (!this.currentPatient) return;
    this.consultationService.startConsultation(this.currentPatient.patientId || this.currentPatient.token);
    this.consultationStartTime = new Date();
    this.isConsultationActive = true;
    this.messageService.add({ severity: 'info', summary: 'Consultation started', detail: `Consultation with ${this.currentPatient.name} started`, life: 3000 });
  }

  finishConsultation(): void {
    if (!this.currentPatient || !this.consultationStartTime) return;
    this.consultationService.finishConsultation(this.currentPatient.patientId || this.currentPatient.token, this.consultationNotes);
    this.messageService.add({ severity: 'success', summary: 'Consultation completed', detail: 'Patient marked as served', life: 3000 });
    this.patientsServed++;
    this.consultationNotes = '';
    this.consultationStartTime = null;
    this.isConsultationActive = false;
  }

  skipPatient(): void {
    if (!this.currentPatient) return;
    this.queueService.updateTokenStatus(this.currentPatient.patientId || this.currentPatient.token, 'SKIPPED');
    this.messageService.add({ severity: 'info', summary: 'Patient skipped', detail: `${this.currentPatient.token} moved to skipped queue`, life: 3000 });
    this.consultationNotes = '';
    this.consultationStartTime = null;
    this.isConsultationActive = false;
  }

  reAddFromSkipped(index: number): void {
    const item = this.skippedPatients.splice(index, 1)[0];
    if (!item) return;
    this.queueService.updateTokenStatus(item.patientId || item.token, 'WAITING');
    this.messageService.add({ severity: 'success', summary: 'Re-added', detail: `${item.token} re-added to upcoming`, life: 2500 });
  }

  viewPreviousHistory(): void {
    if (!this.currentPatient || !this.currentPatient.patientId) return;

    //history page for particular patient
    this.router.navigate(['/doctor/history'], {
      queryParams: { patientId: this.currentPatient.patientId }
    });
  }

  logout(): void {
    this.router.navigate(['/']);
  }

  ngOnInit(): void {
    this.sub = this.queueService.getQueue().subscribe(tokens => {
      const inProgress = tokens.find(t => (t.doctorId === this.doctorId || t.doctor === this.doctorName) && t.status === 'IN_PROGRESS');
      if (inProgress) {
        this.currentPatient = {
          name: (inProgress as any).patientName || inProgress.patientId,
          age: (inProgress as any).patientAge || 0,
          gender: (inProgress as any).patientGender || 'unknown',
          reason: (inProgress as any).reasonForVisit || '',
          phone: (inProgress as any).patientPhone || '',
          token: inProgress.tokenNumber,
          patientId: inProgress.id
        };
      } else {
        // If no IN_PROGRESS patient, get first WAITING patient
        const firstWaiting = tokens.find(t => (t.doctorId === this.doctorId || t.doctor === this.doctorName) && t.status === 'WAITING');
        if (firstWaiting) {
          this.currentPatient = {
            name: (firstWaiting as any).patientName || firstWaiting.patientId,
            age: (firstWaiting as any).patientAge || 0,
            gender: (firstWaiting as any).patientGender || 'unknown',
            reason: (firstWaiting as any).reasonForVisit || '',
            phone: (firstWaiting as any).patientPhone || '',
            token: firstWaiting.tokenNumber,
            patientId: firstWaiting.id
          };
        } else {
          this.currentPatient = null;
        }
      }

      this.upcomingPatients = tokens.filter(t => (t.doctorId === this.doctorId || t.doctor === this.doctorName) && t.status === 'WAITING')
        .map(t => ({ token: t.tokenNumber, name: (t as any).patientName || t.patientId, age: (t as any).patientAge || 0, reason: (t as any).reasonForVisit || '', waitTime: `${Math.max(1, Math.round(this.queueService.estimateWaitTime(this.doctorId)))}m`, patientId: t.id }));

      this.skippedPatients = tokens.filter(t => (t.doctorId === this.doctorId || t.doctor === this.doctorName) && t.status === 'SKIPPED')
        .map(t => ({ token: t.tokenNumber, name: (t as any).patientName || t.patientId, age: (t as any).patientAge || 0, reason: '', waitTime: '0m', patientId: t.id }));

      this.waitingPatients = this.upcomingPatients.length;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
