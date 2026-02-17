import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-patient-auth',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    PasswordModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './patient-auth.component.html',
  styleUrls: ['./patient-auth.component.css']
})

export class PatientAuthComponent implements OnInit {
  authForm!: FormGroup;
  isLoginMode = true;
  showPassword = false;

  constructor(private fb: FormBuilder, private router: Router) { }

  ngOnInit(): void {
    this.buildForm();
  }

  private buildForm(): void {
    const passwordValidators = this.isLoginMode
      ? [Validators.required]
      : [Validators.required, Validators.minLength(6), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)];

    this.authForm = this.fb.group({
      ...(this.isLoginMode ? {} : { name: ['', Validators.required] }),
      email: ['', [Validators.required, Validators.email]],
      password: ['', passwordValidators],
      ...(this.isLoginMode ? {} : { phone: ['', [Validators.required, Validators.pattern(/^[0-9]{7,15}$/)]] }),
      ...(this.isLoginMode ? {} : { confirmPassword: ['', Validators.required] })
    }, {
      validators: this.isLoginMode ? null : this.passwordsMatchValidator()
    });
  }

  private passwordsMatchValidator() {
    return (group: FormGroup) => {
      const pw = group.get('password')?.value;
      const cpw = group.get('confirmPassword')?.value;
      return pw && cpw && pw !== cpw ? { mismatch: true } : null;
    };
  }

  get f() {
    return this.authForm.controls;
  }

  toggleMode(): void {
    const name = this.authForm?.get('name')?.value ?? '';
    const email = this.authForm?.get('email')?.value ?? '';
    const phone = this.authForm?.get('phone')?.value ?? '';
    const password = this.authForm?.get('password')?.value ?? '';
    const confirmPassword = this.authForm?.get('confirmPassword')?.value ?? '';
    this.isLoginMode = !this.isLoginMode;
    this.buildForm();
    this.authForm.patchValue({ name, email, phone, password, confirmPassword });
  }

  submit(): void {
    if (this.authForm.invalid) {
      this.authForm.markAllAsTouched();
      return;
    }

    if (this.isLoginMode) {
      console.log('Login', this.authForm.value);
      this.router.navigate(['/patient', 'dashboard']);
    } else {
      console.log('Register', this.authForm.value);
      this.router.navigate(['/patient', 'dashboard']);
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

}
