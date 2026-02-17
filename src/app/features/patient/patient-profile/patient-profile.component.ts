import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
//primeng
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
//services
import { AuthService } from '../../../core/services/auth.service';
import { UserProfileService, UserProfile } from '../../../core/services/user-profile.service';

@Component({
    selector: 'app-patient-profile',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterLink,
        ButtonModule,
        InputTextModule,
        DialogModule,
        ToastModule,
        CardModule
    ],
    providers: [MessageService],
    templateUrl: './patient-profile.component.html',
    styleUrls: ['./patient-profile.component.css']
})
export class PatientProfileComponent implements OnInit {
    // User profile data
    userProfile: UserProfile = {
        fullName: 'Aimen Durrani',
        email: 'aimenduraniii@gmail.com',
        profilePicture: null,
        initials: 'JD'
    };

    // Form controls
    editNameForm!: FormGroup;
    editEmailForm!: FormGroup;
    changePasswordForm!: FormGroup;

    // Dialog visibility states
    showEditNameDialog = false;
    showEditEmailDialog = false;
    showChangePasswordDialog = false;

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private messageService: MessageService,
        private authService: AuthService,
        private userProfileService: UserProfileService
    ) { }

    ngOnInit(): void {
        this.initializeForms();
        this.loadUserProfile();
        this.userProfileService.profile$.subscribe(profile => {
            this.userProfile = profile;
        });
    }

    private initializeForms(): void {
        // Edit Name 
        this.editNameForm = this.fb.group({
            firstName: ['', [Validators.required, Validators.minLength(2)]],
            lastName: ['', [Validators.required, Validators.minLength(2)]]
        });

        // Edit Email 
        this.editEmailForm = this.fb.group({
            currentEmail: [{ value: '', disabled: true }, Validators.required],
            newEmail: ['', [Validators.required, Validators.email]],
            confirmEmail: ['', [Validators.required, Validators.email]]
        }, { validators: this.emailMatchValidator });

        // Change Password 
        this.changePasswordForm = this.fb.group({
            currentPassword: ['', [Validators.required, Validators.minLength(6)]],
            newPassword: ['', [Validators.required, Validators.minLength(6), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)]],
            confirmPassword: ['', [Validators.required, Validators.minLength(6)]]
        }, { validators: this.passwordMatchValidator });
    }

    private loadUserProfile(): void {
        this.userProfile = this.userProfileService.getProfile();
        const names = this.userProfile.fullName.split(' ');
        this.editNameForm.patchValue({
            firstName: names[0],
            lastName: names[1] || ''
        });
        this.editEmailForm.patchValue({
            currentEmail: this.userProfile.email
        });
    }

    // Validators
    emailMatchValidator(group: FormGroup): Record<string, unknown> | null {
        const newEmail = group.get('newEmail')?.value;
        const confirmEmail = group.get('confirmEmail')?.value;
        if (newEmail && confirmEmail && newEmail !== confirmEmail) {
            group.get('confirmEmail')?.setErrors({ emailMismatch: true });
            return { emailMismatch: true };
        } else {
            const errors = group.get('confirmEmail')?.errors;
            if (errors) {
                delete errors['emailMismatch'];
                if (Object.keys(errors).length === 0) {
                    group.get('confirmEmail')?.setErrors(null);
                }
            }
        }
        return null;
    }

    passwordMatchValidator(group: FormGroup): Record<string, unknown> | null {
        const newPassword = group.get('newPassword')?.value;
        const confirmPassword = group.get('confirmPassword')?.value;
        if (newPassword && confirmPassword && newPassword !== confirmPassword) {
            group.get('confirmPassword')?.setErrors({ passwordMismatch: true });
            return { passwordMismatch: true };
        } else {
            const errors = group.get('confirmPassword')?.errors;
            if (errors) {
                delete errors['passwordMismatch'];
                if (Object.keys(errors).length === 0) {
                    group.get('confirmPassword')?.setErrors(null);
                }
            }
        }
        return null;
    }
    // Edit Name func
    openEditNameDialog(): void {
        const names = this.userProfile.fullName.split(' ');
        this.editNameForm.patchValue({
            firstName: names[0],
            lastName: names[1] || ''
        });
        this.showEditNameDialog = true;
    }

    saveEditName(): void {
        if (this.editNameForm.invalid) {
            return;
        }
        const { firstName, lastName } = this.editNameForm.value;
        const fullName = `${firstName} ${lastName}`;
        this.userProfileService.updateFullName(fullName);
        this.showEditNameDialog = false;
        this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Name updated successfully',
            life: 3000
        });
    }

    cancelEditName(): void {
        this.showEditNameDialog = false;
        this.editNameForm.reset();
    }

    // Edit Email func
    openEditEmailDialog(): void {
        this.editEmailForm.patchValue({
            currentEmail: this.userProfile.email,
            newEmail: '',
            confirmEmail: ''
        });
        this.showEditEmailDialog = true;
    }

    saveEditEmail(): void {
        if (this.editEmailForm.invalid) {
            return;
        }
        const { newEmail } = this.editEmailForm.value;
        this.userProfileService.updateEmail(newEmail);
        this.showEditEmailDialog = false;
        this.editEmailForm.reset();
        this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Email updated successfully',
            life: 3000
        });
    }

    cancelEditEmail(): void {
        this.showEditEmailDialog = false;
        this.editEmailForm.reset();
    }

    // Change Password func
    openChangePasswordDialog(): void {
        this.changePasswordForm.reset();
        this.showChangePasswordDialog = true;
    }

    saveChangePassword(): void {
        if (this.changePasswordForm.invalid) {
            return;
        }
        //ssend to backend pending
        this.showChangePasswordDialog = false;
        this.changePasswordForm.reset();
        this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Password updated successfully',
            life: 3000
        });
    }

    cancelChangePassword(): void {
        this.showChangePasswordDialog = false;
        this.changePasswordForm.reset();
    }

    // Logout
    logout(): void {
        this.authService.logout();
        this.router.navigate(['/']);
    }

    //for form validation display HELPER METHODS
    get editNameFirstName() {
        return this.editNameForm.get('firstName');
    }

    get editNameLastName() {
        return this.editNameForm.get('lastName');
    }

    get editEmailNewEmail() {
        return this.editEmailForm.get('newEmail');
    }

    get editEmailConfirmEmail() {
        return this.editEmailForm.get('confirmEmail');
    }

    get changePasswordCurrentPassword() {
        return this.changePasswordForm.get('currentPassword');
    }

    get changePasswordNewPassword() {
        return this.changePasswordForm.get('newPassword');
    }

    get changePasswordConfirmPassword() {
        return this.changePasswordForm.get('confirmPassword');
    }
}
