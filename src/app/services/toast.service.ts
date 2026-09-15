import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);

  private makeId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  }

  show(message: string, ms = 3000) {
    const t: Toast = { id: this.makeId(), message };
    this.toasts.set([...this.toasts(), t]);
    setTimeout(() => this.dismiss(t.id), ms);
  }

  dismiss(id: string) {
    this.toasts.set(this.toasts().filter((t) => t.id !== id));
  }
}
