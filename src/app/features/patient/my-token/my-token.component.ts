import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { QueueService, Token as QueueToken } from '../../../core/services/queue.service';
import { UserProfileService, UserProfile } from '../../../core/services/user-profile.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface Token extends QueueToken {
  estimatedTime?: string;
}

@Component({
  selector: 'app-my-token',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ButtonModule,
    CardModule,
    ToastModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './my-token.component.html',
  styleUrl: './my-token.component.css'
})
export class MyTokenComponent implements OnInit, OnDestroy {
  token: Token | null = null;
  hasActiveToken = false;
  userProfile: UserProfile = {
    fullName: 'Aimen Durrani',
    email: 'aimenduraniii@gmail.com',
    profilePicture: null,
    initials: 'JD'
  };
  private destroy$ = new Subject<void>();

  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
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

    // Subscribe to token changes from QueueService
    this.queueService.activeToken$
      .pipe(takeUntil(this.destroy$))
      .subscribe(token => {
        this.token = token;
        this.hasActiveToken = !!token;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  saveTicket(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Downloading',
      detail: 'Downloading ticket as image...',
      life: 2000
    });

    setTimeout(() => {
      // canvas ticket information
      const canvas = document.createElement('canvas');
      canvas.width = 500;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Blue accent bar
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(0, 0, canvas.width, 8);

        // Token number
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 72px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.token?.tokenNumber || '', canvas.width / 2, 120);

        // Details
        ctx.font = '14px Arial';
        ctx.fillStyle = '#666666';
        ctx.textAlign = 'center';
        let yPos = 170;
        const lineHeight = 22;

        ctx.fillText(`Hospital: ${this.token?.hospital}`, canvas.width / 2, yPos);
        yPos += lineHeight;
        ctx.fillText(`Department: ${this.token?.department}`, canvas.width / 2, yPos);
        yPos += lineHeight;
        ctx.fillText(`Doctor: ${this.token?.doctor || 'Any'}`, canvas.width / 2, yPos);
        yPos += lineHeight;
        ctx.fillText(`Name: ${this.token?.patientName || '-'}`, canvas.width / 2, yPos);
        yPos += lineHeight;
        ctx.fillText(`Phone: ${this.token?.patientPhone || '-'}`, canvas.width / 2, yPos);
        yPos += lineHeight;
        ctx.fillText(`Age: ${this.token?.patientAge || '-'}`, canvas.width / 2, yPos);
        yPos += lineHeight;
        ctx.fillText(`Gender: ${this.token?.patientGender || '-'}`, canvas.width / 2, yPos);
        yPos += lineHeight;
        if (this.token?.specialNotes) {
          ctx.fillText(`Notes: ${this.token?.specialNotes}`, canvas.width / 2, yPos);
          yPos += lineHeight;
        }
        ctx.fillText(`Estimated Wait: ${this.token?.estimatedWait || '-'}`, canvas.width / 2, yPos);
        yPos += lineHeight;
        ctx.fillText(`Status: ${this.token?.status?.toUpperCase() || '-'}`, canvas.width / 2, yPos);
      }

      // download as PNG
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `ticket-${this.token?.tokenNumber}.png`;
          link.click();
          URL.revokeObjectURL(url);
        }

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Ticket downloaded as image',
          life: 3000
        });
      });
    }, 1500);
  }

  leaveQueue(): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to leave the queue? This action cannot be undone.',
      header: 'Leave Queue',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.queueService.deleteToken();
        this.messageService.add({
          severity: 'warn',
          summary: 'Queue Left',
          detail: 'You have left the queue.',
          life: 3000
        });
      },
      reject: () => {
        this.messageService.add({
          severity: 'info',
          summary: 'Cancelled',
          detail: 'You are still in the queue.',
          life: 2000
        });
      }
    });
  }

  generateToken(): void {
    this.router.navigate(['/patient/new-token']);
  }

  openNotifications(): void {
    this.router.navigate(['/patient', 'notifications']);
  }
}
