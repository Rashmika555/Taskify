import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../models/user.model';

const USERS_KEY = 'taskify_users_v1';
const SESSION_KEY = 'taskify_current_user_v1';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private users = signal<User[]>(this.loadUsers());
  currentUser = signal<User | null>(this.loadSession());

  constructor(private router: Router) {}

  private loadUsers(): User[] {
    try {
      const raw = localStorage.getItem(USERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveUsers() {
    localStorage.setItem(USERS_KEY, JSON.stringify(this.users()));
  }

  private loadSession(): User | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private saveSession() {
    if (this.currentUser()) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(this.currentUser()));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }

  private makeId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  }

  private async hashPassword(password: string): Promise<string> {
    const bytes = new TextEncoder().encode(password);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  async register(name: string, email: string, password: string) {
    const existing = this.users().find((u) => u.email === email.toLowerCase());
    if (existing) {
      throw new Error('Email already used');
    }
    const user: User = { id: this.makeId(), name, email: email.toLowerCase(), passwordHash: await this.hashPassword(password) };
    this.users.set([...this.users(), user]);
    this.saveUsers();
    this.currentUser.set(user);
    this.saveSession();
    return user;
  }

  async login(email: string, password: string) {
    const passwordHash = await this.hashPassword(password);
    const user = this.users().find((u) => u.email === email.toLowerCase() && (u.passwordHash === passwordHash || u.password === password));
    if (!user) throw new Error('Invalid credentials');
    if (!user.passwordHash) {
      const migrated = { ...user, passwordHash, password: undefined };
      this.users.set(this.users().map((item) => item.id === user.id ? migrated : item));
      this.saveUsers();
    }
    this.currentUser.set(this.users().find((item) => item.id === user.id) || user);
    this.saveSession();
    return user;
  }

  logout() {
    this.currentUser.set(null);
    this.saveSession();
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!this.currentUser();
  }

  getUser(): User | null {
    return this.currentUser();
  }

  updateProfile(name: string, email: string): boolean {
    const current = this.currentUser();
    if (!current) return false;
    const normalizedEmail = email.trim().toLowerCase();
    const duplicate = this.users().some((user) => user.id !== current.id && user.email === normalizedEmail);
    if (!name.trim() || !normalizedEmail || duplicate) return false;

    const updated = { ...current, name: name.trim(), email: normalizedEmail };
    this.users.set(this.users().map((user) => user.id === current.id ? updated : user));
    this.saveUsers();
    this.currentUser.set(updated);
    this.saveSession();
    return true;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    const current = this.currentUser();
    if (!current || newPassword.length < 6) return false;
    const currentHash = await this.hashPassword(currentPassword);
    if (current.passwordHash !== currentHash && current.password !== currentPassword) return false;
    const updated = { ...current, passwordHash: await this.hashPassword(newPassword), password: undefined };
    this.users.set(this.users().map((user) => user.id === current.id ? updated : user));
    this.saveUsers();
    this.currentUser.set(updated);
    this.saveSession();
    return true;
  }
}
