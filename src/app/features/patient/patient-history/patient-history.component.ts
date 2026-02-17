import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Consultation } from '../../../shared/models/consultation.model';
import { ConsultationService } from '../../../core/services/consultation.service';
import { UserProfileService } from '../../../core/services/user-profile.service';
import { Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';

interface Visit {
  id: string;
  doctor: string;
  specialty?: string;
  date: string;
  time: string;
  reason?: string;
  token?: string;
  hasNotes: boolean;
}

@Component({
  selector: 'app-patient-history',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './patient-history.component.html',
  styleUrl: './patient-history.component.css'
})
export class PatientHistoryComponent implements OnInit, OnDestroy {
  visits: Visit[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private consultationService: ConsultationService,
    private userProfileService: UserProfileService
  ) { }

  ngOnInit(): void {
    this.userProfileService.profile$
      .pipe(
        takeUntil(this.destroy$),
        switchMap(profile => this.consultationService.getPatientHistory(profile.email))
      )
      .subscribe(consultations => {
        this.visits = consultations.map(c => ({
          id: c.id,
          doctor: c.doctorName || c.doctorId,
          specialty: '',
          date: c.startTime ? c.startTime.toDateString() : '',
          time: c.startTime ? c.startTime.toLocaleTimeString() : '',
          reason: c.reason,
          token: c.tokenNumber,
          hasNotes: !!c.notes
        }));
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
