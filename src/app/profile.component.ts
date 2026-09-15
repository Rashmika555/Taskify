import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from './auth/auth.service';
import { ToastComponent } from './services/toast.component';
import { ToastService } from './services/toast.service';

type ProfileModal = 'edit' | 'password' | 'reset' | null;

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ToastComponent],
  template: `
    <main class="profile">
      <a routerLink="/board" class="back">← Back to board</a>
      <section class="profile-card">
        <div class="avatar">{{ initial }}</div>
        <h1>{{ auth.getUser()?.name }}</h1>
        <p>{{ auth.getUser()?.email }}</p>

        <div class="settings">
          <h2>Profile Settings</h2>
          <button class="setting-button" type="button" (click)="openEdit()">✎ <span>Edit Profile</span></button>
          <button class="setting-button" type="button" (click)="openPassword()">🔑 <span>Change Password</span></button>
          <button class="setting-button" type="button" (click)="openReset()">↻ <span>Reset Password</span></button>
          <button class="setting-button logout-button" type="button" (click)="logout()">↪ <span>Logout</span></button>
        </div>
      </section>
    </main>

    <div *ngIf="modal" class="modal" (click)="closeModal()">
      <section class="modal-card" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
        <button class="close" type="button" aria-label="Close" (click)="closeModal()">X</button>

        <ng-container *ngIf="modal === 'edit'">
          <h2>Edit Profile</h2>
          <label>Name / Username<input [(ngModel)]="editName" required /></label>
          <label>Email<input [(ngModel)]="editEmail" type="email" required /></label>
          <p *ngIf="formError" class="form-error">{{ formError }}</p>
          <div class="modal-actions"><button type="button" class="secondary" (click)="closeModal()">Cancel</button><button type="button" (click)="saveProfile()">Save Changes</button></div>
        </ng-container>

        <ng-container *ngIf="modal === 'password'">
          <h2>Change Password</h2>
          <label>Current Password<div class="password-field"><input [(ngModel)]="currentPassword" [type]="showCurrent ? 'text' : 'password'" required /><button type="button" (click)="showCurrent = !showCurrent" [attr.aria-label]="showCurrent ? 'Hide password' : 'Show password'">{{ showCurrent ? '◉' : '◌' }}</button></div></label>
          <label>New Password<div class="password-field"><input [(ngModel)]="newPassword" [type]="showNew ? 'text' : 'password'" required /><button type="button" (click)="showNew = !showNew" [attr.aria-label]="showNew ? 'Hide password' : 'Show password'">{{ showNew ? '◉' : '◌' }}</button></div></label>
          <label>Confirm New Password<div class="password-field"><input [(ngModel)]="confirmPassword" [type]="showConfirm ? 'text' : 'password'" required /><button type="button" (click)="showConfirm = !showConfirm" [attr.aria-label]="showConfirm ? 'Hide password' : 'Show password'">{{ showConfirm ? '◉' : '◌' }}</button></div></label>
          <p *ngIf="formError" class="form-error">{{ formError }}</p>
          <div class="modal-actions"><button type="button" class="secondary" (click)="closeModal()">Cancel</button><button type="button" (click)="savePassword()">Change Password</button></div>
        </ng-container>

        <ng-container *ngIf="modal === 'reset'">
          <h2>Reset Password</h2>
          <p class="modal-copy">Enter your email address:</p>
          <label>Email<input [(ngModel)]="resetEmail" type="email" required /></label>
          <p class="form-error">Password reset email is unavailable because this local authentication setup has no email provider.</p>
          <div class="modal-actions"><button type="button" class="secondary" (click)="closeModal()">Cancel</button><button type="button" (click)="sendResetLink()">Send Reset Link</button></div>
        </ng-container>
      </section>
    </div>
    <app-toast-center></app-toast-center>
  `,
  styles: [`
    :host { display:block; min-height:100vh; color:#f8fafc; background:linear-gradient(135deg,#0f172a,#1e293b 50%,#1a1f35); }
    .profile { max-width:700px; margin:auto; padding:48px 24px; } .back { color:#c4b5fd; text-decoration:none; }
    .profile-card { margin-top:40px; padding:42px; text-align:center; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:18px; } .avatar { width:76px; height:76px; margin:auto; display:grid; place-items:center; border-radius:50%; background:linear-gradient(135deg,#ec4899,#a855f7); font-size:32px; font-weight:800; } h1 { margin:14px 0 8px; } p { color:#94a3b8; }
    .settings { margin-top:34px; padding-top:26px; border-top:1px solid rgba(255,255,255,.1); text-align:left; } .settings h2 { margin:0 0 18px; text-align:center; color:#e9d5ff; font-size:20px; } .setting-button { width:100%; display:flex; align-items:center; gap:12px; margin:10px 0; padding:13px 16px; border:1px solid rgba(167,139,250,.3); border-radius:10px; color:#f8fafc; background:rgba(124,58,237,.18); cursor:pointer; font-weight:700; text-align:left; } .setting-button:hover { background:rgba(168,85,247,.35); } .logout-button { border-color:rgba(236,72,153,.35); background:rgba(236,72,153,.14); }
    .modal { position:fixed; inset:0; z-index:60; display:grid; place-items:center; padding:20px; background:rgba(2,6,23,.78); } .modal-card { position:relative; width:min(440px,100%); display:grid; gap:14px; padding:30px; border:1px solid rgba(167,139,250,.3); border-radius:16px; background:#111827; box-shadow:0 24px 70px rgba(0,0,0,.5); } .modal-card h2 { margin:0 0 4px; color:#e9d5ff; } .close { position:absolute; top:14px; right:14px; border:0; background:transparent; color:#cbd5e1; cursor:pointer; } label { display:grid; gap:7px; color:#cbd5e1; font-size:13px; font-weight:600; } input { width:100%; box-sizing:border-box; padding:11px 12px; border:1px solid rgba(255,255,255,.12); border-radius:9px; color:#f8fafc; background:rgba(255,255,255,.07); } input:focus { outline:none; border-color:#a78bfa; } .password-field { display:flex; } .password-field input { border-radius:9px 0 0 9px; } .password-field button { width:42px; border:1px solid rgba(255,255,255,.12); border-left:0; border-radius:0 9px 9px 0; color:#c4b5fd; background:rgba(255,255,255,.07); cursor:pointer; } .modal-copy { margin:0; } .form-error { margin:0; color:#fca5a5; font-size:12px; } .modal-actions { display:flex; justify-content:flex-end; gap:10px; margin-top:8px; } .modal-actions button { padding:10px 15px; border:0; border-radius:9px; color:white; background:linear-gradient(135deg,#7c3aed,#a78bfa); cursor:pointer; font-weight:700; } .modal-actions .secondary { color:#cbd5e1; border:1px solid rgba(255,255,255,.15); background:rgba(255,255,255,.08); }
    @media (max-width:520px) { .profile { padding:28px 14px; } .profile-card { padding:28px 18px; } .modal-card { padding:26px 18px; } }
  `],
})
export class ProfileComponent {
  modal: ProfileModal = null;
  editName = '';
  editEmail = '';
  resetEmail = '';
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  formError = '';
  showCurrent = false;
  showNew = false;
  showConfirm = false;

  constructor(public auth: AuthService, private toast: ToastService, private router: Router) {}

  get initial() { return this.auth.getUser()?.name?.charAt(0)?.toUpperCase() || '?'; }

  openEdit() { const user = this.auth.getUser(); this.editName = user?.name || ''; this.editEmail = user?.email || ''; this.formError = ''; this.modal = 'edit'; }
  openPassword() { this.currentPassword = ''; this.newPassword = ''; this.confirmPassword = ''; this.formError = ''; this.modal = 'password'; }
  openReset() { this.resetEmail = this.auth.getUser()?.email || ''; this.formError = ''; this.modal = 'reset'; }
  closeModal() { this.modal = null; this.formError = ''; }

  saveProfile() {
    if (!this.editName.trim() || !this.editEmail.trim()) { this.formError = 'Name and email are required'; return; }
    if (!this.auth.updateProfile(this.editName, this.editEmail)) { this.formError = 'Unable to update profile. Check the email is not already in use.'; this.toast.show('Unable to update profile'); return; }
    this.toast.show('Profile updated successfully'); this.closeModal();
  }

  async savePassword() {
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) { this.formError = 'All password fields are required'; return; }
    if (this.newPassword !== this.confirmPassword) { this.formError = 'Passwords do not match'; return; }
    if (this.newPassword.length < 6) { this.formError = 'New password must be at least 6 characters'; return; }
    if (!await this.auth.changePassword(this.currentPassword, this.newPassword)) { this.formError = 'Current password is incorrect'; this.toast.show('Unable to change password'); return; }
    this.toast.show('Password changed successfully'); this.closeModal();
  }

  sendResetLink() { this.toast.show('Unable to send password reset email. No email provider is configured.'); }

  logout() { this.toast.show('Logged out successfully'); this.auth.logout(); }
}
