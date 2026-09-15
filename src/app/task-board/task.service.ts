import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Task } from '../models/task.model';
import { Observable } from 'rxjs';

const BASE = 'http://localhost:3000/tasks';

@Injectable({ providedIn: 'root' })
export class TaskService {
  constructor(private http: HttpClient) {}

  list(): Observable<Task[]> {
    return this.http.get<Task[]>(BASE);
  }

  create(task: Task) {
    return this.http.post<Task>(BASE, task, { observe: 'body' as const });
  }

  update(task: Task) {
    return this.http.put<Task>(`${BASE}/${task.id}`, task);
  }

  delete(id: string | number) {
    return this.http.delete(`${BASE}/${id}`);
  }
}
