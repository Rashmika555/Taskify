import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ArcElement, Chart, DoughnutController, Legend, Tooltip } from 'chart.js';
import { TaskService } from './task-board/task.service';
import { AuthService } from './auth/auth.service';
import { Task } from './models/task.model';

Chart.register(ArcElement, DoughnutController, Legend, Tooltip);
type DueStatus = 'Overdue' | 'Due Soon' | 'Upcoming' | 'No Due Date';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div
      class="dashboard-backdrop"
      [class.modal-mode]="modalMode"
      (click)="closeFromBackdrop($event)"
    >
      <section
        class="dashboard-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dashboard-title"
      >
        <header class="dashboard-header">
          <div>
            <span class="eyebrow">Taskify analytics</span>
            <h1 id="dashboard-title">Project Dashboard</h1>
          </div>
          <button class="close-button" type="button" aria-label="Close dashboard" (click)="close()">
            X
          </button>
        </header>
        <section class="stat-grid" aria-label="Task statistics">
          <article>
            <span>Total Tasks</span><strong>{{ totalTasks }}</strong>
          </article>
          <article>
            <span>Completed</span><strong>{{ countColumn('Done') }}</strong>
          </article>
          <article>
            <span>In Progress</span><strong>{{ countColumn('In Progress') }}</strong>
          </article>
          <article>
            <span>Delivered</span><strong>{{ countColumn('Delivered') }}</strong>
          </article>
        </section>
        <section class="analytics-grid">
          <article class="analytics-card">
            <h2>Tasks by Column</h2>
            <div class="chart-wrap"><canvas #columnChart></canvas></div>
            <div class="legend-list">
              <span *ngFor="let item of columnLegend"
                ><i [style.background]="item.color"></i>{{ item.label }}
                <b>{{ item.value }}</b></span
              >
            </div>
          </article>
          <article class="analytics-card">
            <h2>Tasks by Priority</h2>
            <div class="chart-wrap"><canvas #priorityChart></canvas></div>
            <div class="legend-list">
              <span *ngFor="let item of priorityLegend"
                ><i [style.background]="item.color"></i>{{ item.label }}
                <b>{{ item.value }}</b></span
              >
            </div>
          </article>
          <article class="analytics-card due-card">
            <h2>Due Date Status</h2>
            <div class="due-list">
              <div *ngFor="let item of dueLegend" class="due-row">
                <div class="due-label">
                  <i [style.background]="item.color"></i><span>{{ item.label }}</span
                  ><b>{{ item.value }}</b>
                </div>
                <div class="due-track">
                  <div [style.width.%]="dueWidth(item.value)" [style.background]="item.color"></div>
                </div>
              </div>
            </div>
            <p class="due-note">Based on each task's due date and current status.</p>
          </article>
        </section>
        <a *ngIf="!modalMode" routerLink="/board" class="back-link">← Back to board</a>
      </section>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        color: #f8fafc;
      }
      .dashboard-backdrop {
        min-height: 100vh;
        padding: 32px;
        background: linear-gradient(135deg, #0f172a, #1e293b 50%, #1a1f35);
      }
      .dashboard-backdrop.modal-mode {
        position: fixed;
        inset: 0;
        z-index: 50;
        display: grid;
        place-items: center;
        padding: 24px;
        background: rgba(2, 6, 23, 0.84);
        overflow-y: auto;
      }
      .dashboard-panel {
        width: min(1180px, 100%);
        padding: 28px;
        background: #111827;
        border: 1px solid rgba(167, 139, 250, 0.28);
        border-radius: 18px;
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.48);
      }
      .modal-mode .dashboard-panel {
        max-height: calc(100vh - 48px);
        overflow-y: auto;
      }
      .dashboard-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 22px;
      }
      .eyebrow {
        color: #c084fc;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 1.4px;
        text-transform: uppercase;
      }
      h1 {
        margin: 6px 0 0;
        font-size: clamp(27px, 4vw, 38px);
      }
      h2 {
        margin: 0;
        color: #e9d5ff;
        font-size: 16px;
      }
      .close-button {
        width: 34px;
        height: 34px;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.07);
        color: #f8fafc;
        cursor: pointer;
      }
      .close-button:hover {
        background: rgba(236, 72, 153, 0.35);
      }
      .stat-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
        margin-bottom: 18px;
      }
      .stat-grid article,
      .analytics-card {
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 14px;
        background: #172033;
      }
      .stat-grid article {
        padding: 16px;
      }
      .stat-grid span {
        display: block;
        color: #94a3b8;
        font-size: 12px;
        margin-bottom: 8px;
      }
      .stat-grid strong {
        font-size: 27px;
      }
      .analytics-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
      }
      .analytics-card {
        min-width: 0;
        padding: 20px;
      }
      .chart-wrap {
        position: relative;
        height: 210px;
        margin: 18px 0 12px;
      }
      .legend-list {
        display: grid;
        gap: 8px;
        color: #cbd5e1;
        font-size: 12px;
      }
      .legend-list span,
      .due-label {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .legend-list i,
      .due-label i {
        width: 9px;
        height: 9px;
        flex: 0 0 auto;
        border-radius: 50%;
      }
      .legend-list b,
      .due-label b {
        margin-left: auto;
        color: #f8fafc;
      }
      .due-list {
        display: grid;
        gap: 21px;
        margin-top: 35px;
      }
      .due-track {
        height: 8px;
        margin-top: 8px;
        overflow: hidden;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.08);
      }
      .due-track div {
        height: 100%;
        border-radius: inherit;
        transition: width 0.25s ease;
      }
      .due-note {
        margin: 28px 0 0;
        color: #64748b;
        font-size: 12px;
        line-height: 1.5;
      }
      .back-link {
        display: inline-block;
        margin-top: 22px;
        color: #c4b5fd;
        text-decoration: none;
      }
      @media (max-width: 850px) {
        .analytics-grid {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 560px) {
        .dashboard-backdrop {
          padding: 12px;
        }
        .dashboard-panel {
          padding: 18px;
        }
        .stat-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    `,
  ],
})
export class DashboardComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input() tasksInput: Task[] | null = null;
  @Input() columnsInput: string[] = ['Done', 'To-Do', 'In Progress', 'Delivered'];
  @Input() modalMode = false;
  @Output() closed = new EventEmitter<void>();
  @ViewChild('columnChart') columnCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('priorityChart') priorityCanvas?: ElementRef<HTMLCanvasElement>;
  tasks = signal<Task[]>([]);
  private columnChart?: Chart;
  private priorityChart?: Chart;
  readonly columnColors = ['#a78bfa', '#ec4899', '#38bdf8', '#fbbf24', '#34d399', '#fb7185'];
  readonly priorityColors = ['#f87171', '#facc15', '#4ade80'];
  readonly dueColors = ['#f87171', '#fbbf24', '#60a5fa', '#94a3b8'];

  constructor(
    private taskService: TaskService,
    private auth: AuthService,
    private router: Router,
  ) {}
  ngOnInit() {
    if (!this.tasksInput) {
      const user = this.auth.getUser();
      if (user)
        this.taskService.list().subscribe((tasks) => {
          this.tasks.set(tasks.filter((task) => task.ownerId === user.id));
          setTimeout(() => this.updateCharts());
        });
    }
  }
  ngAfterViewInit() {
    this.updateCharts();
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['tasksInput'] && this.tasksInput) this.tasks.set(this.tasksInput);
    if (changes['tasksInput'] || changes['columnsInput']) setTimeout(() => this.updateCharts());
  }
  ngOnDestroy() {
    this.columnChart?.destroy();
    this.priorityChart?.destroy();
  }
  get activeTasks() {
    return this.tasksInput ?? this.tasks();
  }
  get totalTasks() {
    return this.activeTasks.length;
  }
  countColumn(column: string) {
    return this.activeTasks.filter((task) => task.column === column).length;
  }
  get columnLabels() {
    return [...new Set([...this.columnsInput, ...this.activeTasks.map((task) => task.column)])];
  }
  get columnValues() {
    return this.columnLabels.map((label) => this.countColumn(label));
  }
  get priorityLabels() {
    return ['High', 'Medium', 'Low'];
  }
  get priorityValues() {
    return this.priorityLabels.map(
      (priority) => this.activeTasks.filter((task) => task.priority === priority).length,
    );
  }
  get columnLegend() {
    return this.columnLabels.map((label, index) => ({
      label,
      value: this.columnValues[index],
      color: this.columnColors[index % this.columnColors.length],
    }));
  }
  get priorityLegend() {
    return this.priorityLabels.map((label, index) => ({
      label,
      value: this.priorityValues[index],
      color: this.priorityColors[index],
    }));
  }
  get dueValues() {
    return (['Overdue', 'Due Soon', 'Upcoming', 'No Due Date'] as DueStatus[]).map(
      (status) => this.activeTasks.filter((task) => this.dueStatus(task) === status).length,
    );
  }
  get dueLegend() {
    return ['Overdue', 'Due Soon', 'Upcoming', 'No Due Date'].map((label, index) => ({
      label,
      value: this.dueValues[index],
      color: this.dueColors[index],
    }));
  }
  dueWidth(value: number) {
    return this.totalTasks ? (value / this.totalTasks) * 100 : 0;
  }
  private dueStatus(task: Task): DueStatus {
    if (!task.dueDate) return 'No Due Date';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(`${task.dueDate}T00:00:00`);
    const days = Math.ceil((due.getTime() - today.getTime()) / 86400000);
    if (days < 0 && task.column !== 'Done') return 'Overdue';
    if (days <= 7) return 'Due Soon';
    return 'Upcoming';
  }
  private updateCharts() {
    if (!this.columnCanvas?.nativeElement || !this.priorityCanvas?.nativeElement) return;
    this.columnChart?.destroy();
    this.priorityChart?.destroy();
    this.columnChart = this.makeChart(
      this.columnCanvas.nativeElement,
      this.columnLabels,
      this.columnValues,
      this.columnColors,
    );
    this.priorityChart = this.makeChart(
      this.priorityCanvas.nativeElement,
      this.priorityLabels,
      this.priorityValues,
      this.priorityColors,
    );
  }
  private makeChart(canvas: HTMLCanvasElement, labels: string[], data: number[], colors: string[]) {
    return new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: labels.map((_, i) => colors[i % colors.length]),
            borderColor: '#172033',
            borderWidth: 4,
            hoverOffset: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '64%',
        plugins: { legend: { display: false }, tooltip: { enabled: true } },
      },
    });
  }
  close() {
    this.modalMode ? this.closed.emit() : this.router.navigate(['/board']);
  }
  closeFromBackdrop(event: MouseEvent) {
    if (event.target === event.currentTarget && this.modalMode) this.close();
  }
}
