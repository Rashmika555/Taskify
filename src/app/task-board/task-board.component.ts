import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService } from './task.service';
import { Task } from '../models/task.model';
import { AuthService } from '../auth/auth.service';
import {
  CdkDrag,
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../services/toast.service';
import { ToastComponent } from '../services/toast.component';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { DashboardComponent } from '../dashboard.component';

const COLUMNS_KEY = 'taskify_columns_v1';
const DEFAULT_COLUMNS = ['Done', 'To-Do', 'In Progress', 'Delivered'];

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [CommonModule, DragDropModule, FormsModule, ToastComponent, DashboardComponent],
  templateUrl: './task-board.component.html',
  styleUrls: ['./task-board.component.css'],
})
export class TaskBoardComponent implements OnInit {
  loading = signal(false);
  columns = signal<string[]>(this.loadColumns());
  tasks = signal<Task[]>([]);

  filter: string = 'Reset';
  sort: string = 'Newest';

  // local simple modal state
  showAddTask = false;
  showAddColumn = false;
  showProfileMenu = false;
  showDashboard = false;
  editingTask: Task | null = null;
  taskColumn = 'To-Do';
  pendingDelete: { type: 'task' | 'column'; task?: Task; column?: string } | null = null;
  newColumnName = '';

  // form fields for add/edit
  formTitle = '';
  formDescription = '';
  formDue = '';
  formPriority: 'Low' | 'Medium' | 'High' = 'Low';

  constructor(
    private svc: TaskService,
    public auth: AuthService,
    private toast: ToastService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  readonly stats = computed(() => {
    const tasks = this.tasks();
    return {
      total: tasks.length,
      done: tasks.filter((task) => task.column === 'Done').length,
      todo: tasks.filter((task) => task.column === 'To-Do').length,
      progress: tasks.filter((task) => task.column === 'In Progress').length,
      delivered: tasks.filter((task) => task.column === 'Delivered').length,
    };
  });

  readonly completion = computed(() =>
    this.stats().total ? Math.round((this.stats().done / this.stats().total) * 100) : 0,
  );

  private loadColumns(): string[] {
    try {
      const stored = localStorage.getItem(COLUMNS_KEY);
      const columns = stored ? (JSON.parse(stored) as string[]) : DEFAULT_COLUMNS;
      return [...new Set([...columns, 'Delivered'])];
    } catch {
      return [...DEFAULT_COLUMNS];
    }
  }

  private saveColumns() {
    localStorage.setItem(COLUMNS_KEY, JSON.stringify(this.columns()));
  }

  load() {
    this.loading.set(true);
    this.svc.list().subscribe({
      next: (t) => {
        const user = this.auth.getUser();
        const ownedTasks = user ? t.filter((x) => x.ownerId === user.id) : [];
        this.tasks.set(this.withPositions(ownedTasks));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private withPositions(tasks: Task[]): Task[] {
    const nextPositions = new Map<string, number>();
    return [...tasks]
      .sort(
        (a, b) => (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER),
      )
      .map((task) => {
        const position = nextPositions.get(task.column) ?? 0;
        nextPositions.set(task.column, position + 1);
        return task.position === position ? task : { ...task, position };
      });
  }

  addColumn() {
    const name = this.newColumnName.trim();
    if (!name) return;
    if (this.columns().includes(name)) return;
    this.columns.set([...this.columns(), name]);
    this.saveColumns();
    this.newColumnName = '';
    this.showAddColumn = false;
    this.toast.show('Column added successfully');
  }

  openAddColumn() {
    this.newColumnName = '';
    this.showAddColumn = true;
  }

  cancelAddColumn() {
    this.newColumnName = '';
    this.showAddColumn = false;
  }

  removeColumn(name: string) {
    if (['To-Do', 'In Progress', 'Done', 'Delivered'].includes(name)) return;
    this.pendingDelete = { type: 'column', column: name };
  }

  confirmDelete() {
    const pending = this.pendingDelete;
    this.pendingDelete = null;
    if (!pending) return;
    if (pending.type === 'task' && pending.task?.id !== undefined) {
      this.svc.delete(pending.task.id).subscribe({
        next: () => {
          this.toast.show('Task deleted successfully');
          this.load();
        },
        error: () => this.toast.show('Unable to delete task'),
      });
      return;
    }
    const name = pending.column;
    if (!name) return;
    this.columns.set(this.columns().filter((c) => c !== name));
    this.saveColumns();
    // move tasks in that column to To-Do
    const movedTasks = this.tasks().filter((t) => t.column === name);
    const moved = this.tasks().map((t) => (t.column === name ? { ...t, column: 'To-Do' } : t));
    this.tasks.set(moved);
    (movedTasks.length
      ? forkJoin(movedTasks.map((task) => this.svc.update({ ...task, column: 'To-Do' })))
      : forkJoin([])
    ).subscribe({
      next: () => this.toast.show('Column deleted successfully'),
      error: () => this.toast.show('Unable to delete column'),
    });
  }

  openAdd(column = 'To-Do') {
    this.editingTask = null;
    this.formTitle = '';
    this.formDescription = '';
    this.formDue = '';
    this.formPriority = 'Low';
    this.taskColumn = column;
    this.showAddTask = true;
  }

  submitTask() {
    const title = this.formTitle.trim();
    if (!title) {
      this.toast.show('Task title is required');
      return;
    }
    const user = this.auth.getUser();
    if (!user) return;

    const base: Task = {
      title,
      description: this.formDescription,
      column: this.taskColumn,
      dueDate: this.formDue || undefined,
      priority: this.formPriority,
      ownerId: user.id,
      createdAt: new Date().toISOString(),
    };

    const editing = this.editingTask;
    if (editing) {
      const updated: Task = { ...editing, ...base, id: editing.id };
      this.svc.update(updated).subscribe({
        next: () => {
          this.toast.show('Task updated successfully');
          this.load();
          this.showAddTask = false;
        },
        error: () =>
          this.toast.show('Unable to save task. Please make sure the task server is running.'),
      });
    } else {
      this.svc.create(base).subscribe({
        next: () => {
          this.toast.show('Task added successfully');
          this.load();
          this.showAddTask = false;
        },
        error: () =>
          this.toast.show('Unable to save task. Please make sure the task server is running.'),
      });
    }
  }

  editTask(t: Task) {
    this.editingTask = t;
    this.formTitle = t.title;
    this.formDescription = t.description || '';
    this.formDue = t.dueDate || '';
    this.formPriority = t.priority;
    this.taskColumn = t.column;
    this.showAddTask = true;
  }

  deleteTask(t: Task) {
    if (t.id === undefined) return;
    this.pendingDelete = { type: 'task', task: t };
  }

  drop(event: CdkDragDrop<Task[]>, column: string) {
    const source = [...event.previousContainer.data];
    const destination =
      event.previousContainer === event.container ? source : [...event.container.data];
    const movedTask = source[event.previousIndex];
    if (!movedTask) return;

    if (event.previousContainer === event.container) {
      moveItemInArray(destination, event.previousIndex, event.currentIndex);
      this.applyTaskOrder(column, destination);
      return;
    }

    transferArrayItem(source, destination, event.previousIndex, event.currentIndex);
    const sourceColumn = movedTask.column;
    const moved = { ...movedTask, column };
    destination[event.currentIndex] = moved;
    this.setColumnOrder(sourceColumn, source);
    this.setColumnOrder(column, destination);
    this.persistTasks([...source, ...destination], 'Task moved successfully');
  }

  dropColumn(event: CdkDragDrop<string[]>) {
    const reordered = [...this.columns()];
    moveItemInArray(reordered, event.previousIndex, event.currentIndex);
    this.columns.set(reordered);
    this.saveColumns();
    this.toast.show('Column order saved');
  }

  canEnterColumnList = (drag: CdkDrag<unknown>) => typeof drag.data === 'string';
  canEnterTaskList = (drag: CdkDrag<unknown>) => typeof drag.data !== 'string';

  private applyTaskOrder(column: string, ordered: Task[]) {
    this.setColumnOrder(column, ordered);
    this.persistTasks(ordered, 'Task order saved');
  }

  private setColumnOrder(column: string, ordered: Task[]) {
    const updates = new Map(
      ordered.map((task, index) => [task.id, { ...task, column, position: index }]),
    );
    this.tasks.set(this.tasks().map((task) => updates.get(task.id) ?? task));
  }

  private persistTasks(tasks: Task[], successMessage: string) {
    const updates = tasks.filter((task) => task.id !== undefined);
    (updates.length
      ? forkJoin(updates.map((task) => this.svc.update(task)))
      : forkJoin([])
    ).subscribe({
      next: () => this.toast.show(successMessage),
      error: () => this.toast.show('Unable to save task order'),
    });
  }

  getTasksByColumn(col: string): Task[] {
    const filtered = this.tasks()
      .filter((t) => t.column === col)
      .sort(
        (a, b) => (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER),
      );
    if (this.sort === 'Oldest')
      return [...filtered].sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
    if (['Low', 'Medium', 'High'].includes(this.sort))
      return filtered.filter((task) => task.priority === this.sort);
    return [...filtered].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  isOverdue(t: Task) {
    if (!t.dueDate) return false;
    if (t.column === 'Done') return false;
    return new Date(t.dueDate) < new Date();
  }

  toggleProfileMenu(event: MouseEvent) {
    event.stopPropagation();
    this.showProfileMenu = !this.showProfileMenu;
  }

  closeProfileMenu() {
    this.showProfileMenu = false;
  }

  navigate(path: string) {
    this.closeProfileMenu();
    if (path === '/dashboard') {
      this.showDashboard = true;
      return;
    }
    this.router.navigate([path]);
  }

  openDashboard() {
    this.showDashboard = true;
  }

  logout() {
    this.closeProfileMenu();
    this.auth.logout();
  }
}
