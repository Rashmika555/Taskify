import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login.component';
import { RegisterComponent } from './auth/register.component';
import { TaskBoardComponent } from './task-board/task-board.component';
import { authGuard } from './auth/auth.guard';
import { DashboardComponent } from './dashboard.component';
import { ProfileComponent } from './profile.component';

export const routes: Routes = [
  { path: '', redirectTo: 'board', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'board', component: TaskBoardComponent, canActivate: [authGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'board' },
];
