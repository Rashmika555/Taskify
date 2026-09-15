import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from './auth.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="auth-container">
      <div class="background-gradient"></div>
      <form [formGroup]="form" (ngSubmit)="submit()" class="auth-card">
        <div class="auth-header">
          <h1 class="brand-title">Taskify</h1>
          <p class="auth-subtitle">Create your account</p>
        </div>
        
        <div class="form-group">
          <label>Full Name</label>
          <input 
            formControlName="name" 
            placeholder="John Doe" 
            class="form-input"
          />
          <span class="error" *ngIf="form.get('name')?.invalid && form.get('name')?.touched">
            Name is required
          </span>
        </div>

        <div class="form-group">
          <label>Email</label>
          <input 
            formControlName="email" 
            placeholder="your@email.com" 
            class="form-input"
            type="email"
          />
          <span class="error" *ngIf="form.get('email')?.invalid && form.get('email')?.touched">
            Please enter a valid email
          </span>
        </div>

        <div class="form-group">
          <label>Password</label>
          <input 
            formControlName="password" 
            placeholder="Create a strong password" 
            class="form-input"
            type="password"
          />
          <span class="error" *ngIf="form.get('password')?.invalid && form.get('password')?.touched">
            Password is required
          </span>
        </div>

        <button type="submit" class="btn-register" [disabled]="form.invalid">
          <span>Create Account</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </button>

        <div class="auth-footer">
          <p>Already have an account? <a routerLink="/login" class="link-accent">Login here</a></p>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
    :host { 
      --primary-gradient: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%);
      --secondary-gradient: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%);
      --accent-gradient: linear-gradient(135deg, #f97316 0%, #fbbf24 100%);
    }
    
    .auth-container {
      position: relative;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #1a1f35 100%);
    }
    
    .background-gradient {
      position: absolute;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    
    .background-gradient::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -20%;
      width: 800px;
      height: 800px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(124, 58, 237, 0.25) 0%, transparent 70%);
      filter: blur(60px);
      animation: pulse 8s ease-in-out infinite;
    }
    
    .background-gradient::after {
      content: '';
      position: absolute;
      bottom: -40%;
      left: -10%;
      width: 600px;
      height: 600px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, transparent 70%);
      filter: blur(60px);
      animation: pulse 10s ease-in-out infinite 2s;
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 0.8; }
      50% { transform: scale(1.1); opacity: 1; }
    }
    
    .auth-card {
      position: relative;
      z-index: 10;
      background: rgba(15, 23, 42, 0.7);
      backdrop-filter: blur(30px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 25px;
      padding: 48px 40px;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3), 0 0 1px rgba(124, 58, 237, 0.5);
      animation: slideDown 0.6s ease-out;
    }
    
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .auth-header {
      text-align: center;
      margin-bottom: 36px;
    }
    
    .brand-title {
      font-size: 42px;
      font-weight: 800;
      background: var(--primary-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin: 0 0 12px 0;
      letter-spacing: -1px;
    }
    
    .auth-subtitle {
      font-size: 16px;
      color: #cbd5e1;
      margin: 0;
      font-weight: 400;
    }
    
    .form-group {
      margin-bottom: 24px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .form-group label {
      font-size: 12px;
      font-weight: 700;
      color: #e2e8f0;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .form-input {
      padding: 14px 18px;
      border: 1.5px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.08);
      font-size: 15px;
      transition: all 0.3s ease;
      font-family: inherit;
      color: #f1f5f9;
    }
    
    .form-input:focus {
      outline: none;
      border-color: rgba(124, 58, 237, 0.8);
      background: rgba(255, 255, 255, 0.12);
      box-shadow: 0 0 20px rgba(124, 58, 237, 0.3), inset 0 0 20px rgba(124, 58, 237, 0.1);
    }
    
    .form-input::placeholder {
      color: #94a3b8;
    }
    
    .error {
      font-size: 12px;
      color: #f87171;
      margin-top: -6px;
      font-weight: 500;
    }
    
    .btn-register {
      width: 100%;
      padding: 14px 24px;
      margin-top: 12px;
      background: var(--primary-gradient);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      position: relative;
      overflow: hidden;
    }
    
    .btn-register::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
      transition: left 0.5s ease;
    }
    
    .btn-register:hover:not(:disabled)::before {
      left: 100%;
    }
    
    .btn-register:hover:not(:disabled) {
      transform: translateY(-3px);
      box-shadow: 0 20px 40px rgba(124, 58, 237, 0.4);
    }
    
    .btn-register:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .auth-footer {
      text-align: center;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .auth-footer p {
      font-size: 14px;
      color: #cbd5e1;
      margin: 0;
    }
    
    .link-accent {
      color: #a78bfa;
      text-decoration: none;
      font-weight: 700;
      transition: all 0.3s ease;
    }
    
    .link-accent:hover {
      color: #c4b5fd;
      text-decoration: underline;
    }
    `
  ],
})
export class RegisterComponent {
  form: any;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router, private toast: ToastService) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  async submit() {
    try {
      const { name, email, password } = this.form.value as any;
      await this.auth.register(name, email, password);
      this.toast.show('Registered & logged in');
      this.router.navigate(['/board']);
    } catch (e: any) {
      this.toast.show(e.message || 'Registration failed');
    }
  }
}
