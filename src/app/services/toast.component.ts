import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-center',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-wrap">
      <div *ngFor="let t of toasts" class="toast">{{ t.message }}</div>
    </div>
  `,
  styles: [
    `:host { position: fixed; inset: auto 0 24px 0; display:flex; justify-content:center; pointer-events:none; }
    .toast-wrap { display:flex; flex-direction:column; gap:8px; align-items:center; pointer-events:none; }
    .toast { pointer-events:auto; background:#111827; color:white; padding:12px 18px; border-radius:10px; min-width:220px; text-align:center; box-shadow:0 6px 18px rgba(0,0,0,.3); opacity:0.98; }
    `,
  ],
})
export class ToastComponent {
  constructor(public to: ToastService) {}

  get toasts() {
    return this.to.toasts();
  }
}
