import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-admin-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CardModule, ButtonModule, InputTextModule, ToastModule],
  providers: [MessageService],
  templateUrl: './admin-auth.component.html',
  styleUrl: './admin-auth.component.css'
})
export class AdminAuthComponent implements OnInit {
  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private messageService: MessageService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void { }

  get f() {
    return this.loginForm.controls;
  }

  submitForm() {
    if (this.loginForm.invalid) {
      this.messageService.add({ severity: 'warn', summary: 'Error', detail: 'Please fill in all fields correctly', life: 3000 });
      return;
    }

    // mock admin login (CALL AUTH SERVICE WHEN WORKING APP - PENDING)
    const email = this.loginForm.get('email')?.value;
    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Logged in successfully', life: 2000 });

    setTimeout(() => {
      this.router.navigate(['/admin', 'dashboard']);
    }, 1500);
  }

  goBack() {
    this.router.navigate(['/']);
  }
}
