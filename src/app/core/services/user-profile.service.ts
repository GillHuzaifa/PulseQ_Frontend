import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface UserProfile {
    fullName: string;
    email: string;
    profilePicture: string | null;
    initials: string;
}

@Injectable({
    providedIn: 'root'
})
export class UserProfileService {
    private defaultProfile: UserProfile = {
        fullName: 'Aimen Durrani',
        email: 'aimenduraniii@gmail.com',
        profilePicture: null,
        initials: 'JD'
    };

    private profileSubject = new BehaviorSubject<UserProfile>(this.defaultProfile);
    public profile$ = this.profileSubject.asObservable();

    constructor() {
        this.loadProfile();
    }

    private loadProfile(): void {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                const storedProfile = window.localStorage.getItem('userProfile');
                if (storedProfile) {
                    const profile = JSON.parse(storedProfile);
                    this.profileSubject.next(profile);
                }
            }
        } catch (e) {
            // Ignore 
        }
    }

    getProfile(): UserProfile {
        return this.profileSubject.getValue();
    }

    saveProfile(profile: UserProfile): void {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.setItem('userProfile', JSON.stringify(profile));

                console.log('[UserProfileService] saveProfile called:', profile);
                this.profileSubject.next(profile);
            }
        } catch (e) {
            // Ignore 
        }
    }

    updateProfilePicture(picture: string | null): void {
        const currentProfile = this.profileSubject.getValue();
        const updatedProfile = { ...currentProfile, profilePicture: picture };
        this.saveProfile(updatedProfile);
    }

    updateFullName(fullName: string): void {
        const names = fullName.split(' ');
        const initials = `${names[0]?.charAt(0) || ''}${names[1]?.charAt(0) || ''}`.toUpperCase();
        const currentProfile = this.profileSubject.getValue();
        const updatedProfile = { ...currentProfile, fullName, initials };
        this.saveProfile(updatedProfile);
    }

    updateEmail(email: string): void {
        const currentProfile = this.profileSubject.getValue();
        const updatedProfile = { ...currentProfile, email };
        this.saveProfile(updatedProfile);
    }
}
