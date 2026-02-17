import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
//PRIMENG
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
//SERVICE
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { QueueService } from '../../../core/services/queue.service';
import { UserProfileService, UserProfile } from '../../../core/services/user-profile.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface Hospital {
    id: string;
    name: string;
}

interface Department {
    id: string;
    name: string;
    label: string;
}

interface Doctor {
    id: string;
    name: string;
    specialization: string;
}

// Custom validator phone numbers
function pakistaniPhoneValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
        return null;
    }

    const phone = control.value.trim();

    // Pakistani phone number patterns:
    // +923XX XXXXXXX or +923XXXXXXXXX (mobile with country code)
    // 03XX XXXXXXX or 03XXXXXXXXX (mobile with leading 0)
    // 3XX XXXXXXX or 3XXXXXXXXX (mobile without leading 0)
    // +924XX XXXXXXX or +924XXXXXXXXX (landline with country code)
    // 04XX XXXXXXX or 04XXXXXXXXX (landline with leading 0)
    // 4XX XXXXXXX or 4XXXXXXXXX (landline without leading 0)

    const pakistaniPhoneRegex = /^(\+92|0)?[3-4]\d{9,10}$/;

    if (pakistaniPhoneRegex.test(phone.replace(/[\s-]/g, ''))) {
        return null;
    }

    return { invalidPakistaniPhone: true };
}

@Component({
    selector: 'app-new-token',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterLink,
        ButtonModule,
        DropdownModule,
        InputTextareaModule,
        InputTextModule,
        CardModule,
        ToastModule
    ],
    providers: [MessageService],
    templateUrl: './new-token.component.html',
    styleUrls: ['./new-token.component.css']
})
export class NewTokenComponent implements OnInit, OnDestroy {

    tokenForm!: FormGroup;
    step = 1; // 1 = select hospital/department/doctor, 2 = patient details + reason
    userProfile: UserProfile = {
        fullName: 'Aimen Durrani',
        email: 'aimenduraniii@gmail.com',
        profilePicture: null,
        initials: 'AD'
    };
    private destroy$ = new Subject<void>();

    hospitals: Hospital[] = [
        { id: 'hospital-1', name: 'Ali Medical Center' },
        { id: 'hospital-2', name: 'AL Khidmat Hospital' },
        { id: 'hospital-3', name: 'KRL Hospital' },
        { id: 'hospital-4', name: 'Deira Hospital' }
    ];

    departments: Department[] = [
        { id: 'dept-1', name: 'cardiology', label: 'Cardiology' },
        { id: 'dept-2', name: 'neurology', label: 'Neurology' },
        { id: 'dept-3', name: 'orthopedics', label: 'Orthopedics' },
        { id: 'dept-4', name: 'general', label: 'General Medicine' }
    ];

    doctors: Doctor[] = [
        { id: 'doc-1', name: 'Dr. Ahmad Khan', specialization: 'cardiology' },
        { id: 'doc-2', name: 'Dr. Fatima Ali', specialization: 'cardiology' },
        { id: 'doc-3', name: 'Dr. Hassan Hussein', specialization: 'neurology' },
        { id: 'doc-4', name: 'Dr. Aisha Mohamed', specialization: 'orthopedics' },
        { id: 'doc-5', name: 'Dr. Omar Ibrahim', specialization: 'general' },
        { id: 'D001', name: 'Dr. Sarah Khan', specialization: 'general' }
    ];

    filteredDoctors: Doctor[] = [];
    assignAnyDoctor = false;

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private messageService: MessageService,
        private queueService: QueueService,
        private userProfileService: UserProfileService
    ) { }

    ngOnInit(): void {
        this.userProfileService.profile$.pipe(takeUntil(this.destroy$))
            .subscribe(profile => {
                this.userProfile = profile;
            });

        this.tokenForm = this.fb.group({
            hospital: [null, Validators.required],
            department: [null, Validators.required],
            doctor: [null],
            patientName: ['', Validators.required],
            phone: ['', [Validators.required, pakistaniPhoneValidator]],
            age: [null],
            gender: ['Male'],
            specialNotes: [''],
            reason: ['', [Validators.required, Validators.minLength(5)]]
        });

        //  disable doctor selection until a department is chosen
        this.tokenForm.get('doctor')?.disable();

        this.tokenForm.get('department')?.valueChanges.subscribe((dept: Department | null) => {
            if (dept) {
                this.filteredDoctors = this.doctors.filter(
                    d => d.specialization === dept.name
                );
                // reset and enable doctor control when a department is selected
                this.tokenForm.get('doctor')?.reset();
                // Auto-assign if checkbox is enabled
                if (this.assignAnyDoctor && this.filteredDoctors.length > 0) {
                    const randomDoctor = this.filteredDoctors[Math.floor(Math.random() * this.filteredDoctors.length)];
                    this.tokenForm.get('doctor')?.setValue(randomDoctor);
                    this.tokenForm.get('doctor')?.disable();
                } else {
                    this.tokenForm.get('doctor')?.enable();
                }
            } else {
                this.filteredDoctors = [];
                // no department selected -> disable doctor control
                this.tokenForm.get('doctor')?.reset();
                this.tokenForm.get('doctor')?.disable();
            }
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    nextStep(): void {
        const hosp = this.tokenForm.get('hospital')?.value;
        const dept = this.tokenForm.get('department')?.value;
        const doctor = this.tokenForm.get('doctor')?.value;
        if (!hosp || !dept) {
            this.tokenForm.get('hospital')?.markAsTouched();
            this.tokenForm.get('department')?.markAsTouched();
            return;
        }

        if (this.filteredDoctors && this.filteredDoctors.length > 0) {
            if (!doctor) {
                this.tokenForm.get('doctor')?.markAsTouched();
                return;
            }
        }

        this.step = 2;
    }

    previousStep(): void {
        this.step = 1;
    }

    get f() {
        return this.tokenForm.controls;
    }

    submitForm(): void {
        // If user is on step 1, move to step 2 instead of submitting
        if (this.step === 1) {
            this.nextStep();
            return;
        }

        if (this.tokenForm.invalid) {
            this.tokenForm.markAllAsTouched();
            return;
        }

        const value = this.tokenForm.value;

        const patientId = this.userProfile?.email || `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const extras = {
            hospital: value.hospital.name,
            doctor: value.doctor?.name || 'Any',
            patientName: value.patientName,
            patientPhone: value.phone,
            patientAge: value.age,
            patientGender: value.gender,
            specialNotes: value.specialNotes,
            reasonForVisit: value.reason,
            estimatedWait: '15–20 min'
        } as Partial<any>;

        const created = this.queueService.addTokenFor(patientId, value.doctor?.id || '', value.department.label, extras as any);

        this.messageService.add({
            severity: 'success',
            summary: 'Token Generated',
            detail: `Token ${created.tokenNumber} created successfully`,
            life: 4000
        });

        setTimeout(() => {
            this.router.navigate(['/patient/dashboard']);
        }, 2000);
    }
    //DOCTOR ASSIGNMENNT
    toggleAssignAnyDoctor(): void {
        this.assignAnyDoctor = !this.assignAnyDoctor;
        const dept = this.tokenForm.get('department')?.value;
        if (dept && this.filteredDoctors.length > 0) {
            if (this.assignAnyDoctor) {
                // Auto-assign a random available doctor
                const randomDoctor = this.filteredDoctors[Math.floor(Math.random() * this.filteredDoctors.length)];
                this.tokenForm.get('doctor')?.setValue(randomDoctor);
                this.tokenForm.get('doctor')?.disable();
            } else {
                // Allow manual selection
                this.tokenForm.get('doctor')?.reset();
                this.tokenForm.get('doctor')?.enable();
            }
        }
    }

    cancelForm(): void {
        this.router.navigate(['/patient/dashboard']);
    }

    openNotifications(): void {
        this.router.navigate(['/patient', 'notifications']);
    }
}
