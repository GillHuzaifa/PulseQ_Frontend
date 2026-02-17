import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputGroupModule } from 'primeng/inputgroup';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-doctor-auth',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    InputGroupModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './doctor-auth.component.html',
  styleUrl: './doctor-auth.component.css'
})
export class DoctorAuthComponent implements OnInit {
  loginForm!: FormGroup;
  isLoginMode = true; // toggle between login and register

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  submitForm(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const value = this.loginForm.value;

    this.messageService.add({
      severity: 'success',
      summary: 'Login Successful',
      detail: `Welcome, Dr. ${value.email.split('@')[0]}`,
      life: 2000
    });

    setTimeout(() => {
      this.router.navigate(['/doctor/dashboard']);
    }, 1500);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
