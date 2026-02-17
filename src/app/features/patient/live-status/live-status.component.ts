import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { Router, RouterLink } from '@angular/router';
import { QueueService, Token } from '../../../core/services/queue.service';
import { UserProfileService, UserProfile } from '../../../core/services/user-profile.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-live-status',
    standalone: true,
    imports: [CommonModule, CardModule, ButtonModule, RouterLink],
    templateUrl: './live-status.component.html',
    styleUrl: './live-status.component.css'
})
export class LiveStatusComponent implements OnInit, OnDestroy {
    hasToken = false;
    activeToken: Token | null = null;
    queuePosition = 5; // dummy 
    currentServingToken = 'A-001'; // dummy 
    estimatedWaitMinutes = 15; // Will be updated from token
    expectedTime = '10:45 AM'; // dummy 
    progressPercentage = 60; // Will be calculated based on position
    userProfile: UserProfile = {
        fullName: 'Aimen Durrani',
        email: 'aimenduraniii@gmail.com',
        profilePicture: null,
        initials: 'AD'
    };
    private destroy$ = new Subject<void>();

    constructor(
        private queueService: QueueService,
        private userProfileService: UserProfileService,
        private router: Router
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
                this.activeToken = token;
                this.hasToken = !!token;
                if (token) {
                    this.updateDynamicData(token);
                }
            });
    }

    private updateDynamicData(token: Token): void {
        // Parse estimated wait time from token (e.g., "15 min" -> 15)
        const waitMatch = (token.estimatedWait || '').match(/\d+/);
        if (waitMatch) {
            this.estimatedWaitMinutes = parseInt(waitMatch[0], 10);
        }

        // DUMMY DATA IN ACTUAL  APP IT WOULD COME FROM THE API 
        this.queuePosition = Math.floor(Math.random() * 10) + 1;
        this.progressPercentage = Math.min(100, (10 - this.queuePosition) * 10);

        // Calculate expected time based on estimated wait
        const now = new Date();
        now.setMinutes(now.getMinutes() + this.estimatedWaitMinutes);
        this.expectedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    goToGenerate(): void {
        this.router.navigate(['/patient/new-token']);
    }

    openNotifications(): void {
        this.router.navigate(['/patient', 'notifications']);
    }
}
