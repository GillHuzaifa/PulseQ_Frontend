import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { QueueService } from '../../../core/services/queue.service';
import { UserProfileService, UserProfile } from '../../../core/services/user-profile.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, RouterLink],
  templateUrl: './patient-dashboard.component.html',
  styleUrls: ['./patient-dashboard.component.css']
})
export class PatientDashboardComponent implements OnInit, OnDestroy {
  patientName = 'Aimen Durrani';
  userProfile: UserProfile = {
    fullName: 'Aimen Durrani',
    email: 'aimenduraniii@gmail.com',
    profilePicture: null,
    initials: 'JD'
  };
  private destroy$ = new Subject<void>();

  activeToken: {
    tokenNumber: string;
    hospital: string;
    department: string;
    doctor: string;
    status: string;
    visitReason?: string;
  } | null = null;

  // additional mock data to match design
  currentServing = { tokenNumber: 'A-001', department: 'General Medicine', room: 'Room 101' };
  estimatedWait = '15 min';
  queuePosition = '5th';
  hospitalUpdates = 'Please arrive 10 minutes before your estimated time. Wearing a mask is recommended in the waiting area.';

  constructor(
    private router: Router,
    private queueService: QueueService,
    private userProfileService: UserProfileService
  ) { }

  ngOnInit(): void {
    // Subscribe to profile changes
    this.userProfileService.profile$
      .pipe(takeUntil(this.destroy$))
      .subscribe(profile => {
        this.userProfile = profile;
      });

    this.queueService.activeToken$
      .pipe(takeUntil(this.destroy$))
      .subscribe(token => {
        if (token) {
          this.activeToken = {
            tokenNumber: token.tokenNumber,
            hospital: token.hospital || '',
            department: token.department,
            doctor: token.doctor || 'Any',
            status: token.status
          };
        } else {
          this.activeToken = null;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  logout(): void {
    // TODO: call AuthService.logout() if available
    this.router.navigate(['/patient', 'auth']);
  }

  goGenerateToken(): void {
    this.router.navigate(['/patient', 'new-token']);
  }

  viewToken(): void {
    this.router.navigate(['/patient', 'my-token']);
  }

  viewLiveStatus(): void {
    this.router.navigate(['/patient', 'live-status']);
  }

  openNotifications(): void {
    this.router.navigate(['/patient', 'notifications']);
  }
}
