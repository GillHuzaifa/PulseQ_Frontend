import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ConsultationService } from '../../../core/services/consultation.service';
import { Consultation } from '../../../shared/models/consultation.model';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ScrollerModule } from 'primeng/scroller';

interface PatientGroup {
  patientId: string;
  patientName: string;
  consultations: Consultation[];
  isExpanded: boolean;
}

@Component({
  selector: 'app-patient-history',
  standalone: true,
  imports: [CommonModule, ButtonModule, CardModule, ScrollerModule],
  templateUrl: './patient-history.component.html',
  styleUrl: './patient-history.component.css'
})
export class PatientHistoryComponent implements OnInit {
  patientGroups: PatientGroup[] = [];
  filteredPatientId: string | null = null;

  constructor(
    private consultationService: ConsultationService,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    //filter by specific patient
    this.activatedRoute.queryParams.subscribe(params => {
      this.filteredPatientId = params['patientId'] || null;
      this.loadConsultations();
    });
  }

  loadConsultations(): void {
    this.consultationService.getGroupedByPatient().subscribe(grouped => {
      const patientArray: PatientGroup[] = [];

      grouped.forEach((consultations, patientId) => {
        // only include the patient group if it matches the filter
        if (this.filteredPatientId && patientId !== this.filteredPatientId) {
          return;
        }

        const patientName = consultations.length > 0 ? (consultations[0].patientName || 'Unknown') : 'Unknown';

        // sort the consulation by date
        const sortedConsultations = [...consultations].sort((a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        );

        patientArray.push({
          patientId,
          patientName,
          consultations: sortedConsultations,
          isExpanded: this.filteredPatientId === patientId
        });
      });
      this.patientGroups = patientArray.sort((a, b) =>
        a.patientName.localeCompare(b.patientName)
      );
    });
  }

  togglePatientGroup(index: number): void {
    if (this.patientGroups[index]) {
      this.patientGroups[index].isExpanded = !this.patientGroups[index].isExpanded;
    }
  }

  formatDateTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  calculateDuration(startTime: Date | string, endTime?: Date | string): number {
    const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
    if (!endTime) return 0;
    const end = typeof endTime === 'string' ? new Date(endTime) : endTime;
    return Math.round((end.getTime() - start.getTime()) / 60000);
  }

  goBack(): void {
    this.router.navigate(['/doctor/dashboard']);
  }
}
