import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputSwitchModule } from 'primeng/inputswitch';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UserProfileService, UserProfile } from '../../../core/services/user-profile.service';

@Component({
    selector: 'app-patient-notification',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, CardModule, ButtonModule, InputSwitchModule],
    templateUrl: './patient-notification.component.html',
    styleUrls: ['./patient-notification.component.css']
})
export class PatientNotificationComponent implements OnInit, OnDestroy {
    activeTab: 'inbox' | 'settings' = 'inbox';
    userProfile: UserProfile = {
        fullName: 'Aimen Durrani',
        email: 'aimenduraniii@gmail.com',
        profilePicture: null,
        initials: 'JD'
    };
    private destroy$ = new Subject<void>();

    constructor(private userProfileService: UserProfileService) { }

    ngOnInit(): void {
        this.userProfileService.profile$.pipe(takeUntil(this.destroy$))
            .subscribe(profile => { this.userProfile = profile; });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    notifications = [
        {
            id: 1,
            type: 'success',
            title: 'Token Generated',
            message: 'Your token A-002 has been successfully created.',
            time: '03:34 PM',
            read: false
        },
        {
            id: 2,
            type: 'info',
            title: 'Wait Time Update',
            message: 'Your estimated wait time is now 15 minutes. Please proceed to the waiting area.',
            time: '03:44 PM',
            read: false
        }
    ];

    settings = {
        inApp: true,
        sms: false,
        whatsapp: true
    };

    markAllRead() {
        this.notifications = this.notifications.map(n => ({ ...n, read: true }));
    }

    toggleSetting(key: 'inApp' | 'sms' | 'whatsapp') {
        this.settings[key] = !this.settings[key];
    }
}
