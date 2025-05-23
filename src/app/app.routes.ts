import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ProfileComponent } from './components/profile/profile.component';
import { Router } from '@angular/router';

// Auth guard function
export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (authService.isAuthenticated()) {
    return true;
  }
  
  // Navigate to login page with a return url
  router.navigate(['/login']);
  return false;
};

// Guard to prevent authenticated users from accessing login/register
export const nonAuthGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (!authService.isAuthenticated()) {
    return true;
  }
  
  // If already authenticated, redirect to dashboard
  router.navigate(['/dashboard']);
  return false;
};

export const routes: Routes = [
  { 
    path: 'login', 
    component: LoginComponent,
    canActivate: [nonAuthGuard]
  },
  { 
    path: 'register', 
    component: RegisterComponent,
    canActivate: [nonAuthGuard]
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
  {
    path: 'mock-data',
    loadComponent: () => import('./components/mock-data-manager/mock-data-manager.component').then(m => m.MockDataManagerComponent),
    canActivate: [authGuard]
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
