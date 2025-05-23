import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ProfileComponent } from './components/profile/profile.component';
import { Router } from '@angular/router';

// Auth guard function - using real-time auth state
export const authGuard = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  console.log('AuthGuard: Checking authentication...');
  
  // Get current real-time auth state from Firebase
  const isAuthenticated = await authService.getCurrentAuthState();
  
  console.log('AuthGuard: Real-time auth state:', isAuthenticated);
  
  if (isAuthenticated) {
    console.log('AuthGuard: Access granted');
    return true;
  }
  
  console.log('AuthGuard: Access denied, redirecting to login');
  router.navigate(['/login']);
  return false;
};

// Guard to prevent authenticated users from accessing login/register - using real-time auth state
export const nonAuthGuard = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  console.log('NonAuthGuard: Checking authentication...');
  
  // Get current real-time auth state from Firebase
  const isAuthenticated = await authService.getCurrentAuthState();
  
  console.log('NonAuthGuard: Real-time auth state:', isAuthenticated);
  
  if (!isAuthenticated) {
    console.log('NonAuthGuard: Access granted (user not authenticated)');
    return true;
  }
  
  console.log('NonAuthGuard: User already authenticated, redirecting to dashboard');
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
