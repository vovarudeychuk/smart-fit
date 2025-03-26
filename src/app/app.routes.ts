import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ProfileComponent } from './components/profile/profile.component';

// Auth guard function
export const authGuard = () => {
  const authService = inject(AuthService);
  
  if (authService.isAuthenticated()) {
    return true;
  }
  
  return { path: '/login' };
};

export const routes: Routes = [
  { 
    path: 'login', 
    component: LoginComponent,
    // Prevent accessing login when already authenticated
    canActivate: [() => !inject(AuthService).isAuthenticated() || { path: '/dashboard' }]
  },
  { 
    path: 'register', 
    component: RegisterComponent,
    // Prevent accessing register when already authenticated
    canActivate: [() => !inject(AuthService).isAuthenticated() || { path: '/dashboard' }]
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'journal',
    loadComponent: () => import('./components/journal/journal.component').then(m => m.JournalComponent),
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard]
  },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' }
];
