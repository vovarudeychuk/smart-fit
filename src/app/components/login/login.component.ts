import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>Login</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput formControlName="email" type="email" placeholder="Email" required>
              <mat-error *ngIf="loginForm.get('email')?.hasError('required')">
                Email is required
              </mat-error>
              <mat-error *ngIf="loginForm.get('email')?.hasError('email')">
                Please enter a valid email address
              </mat-error>
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput formControlName="password" type="password" placeholder="Password" required>
              <mat-error *ngIf="loginForm.get('password')?.hasError('required')">
                Password is required
              </mat-error>
            </mat-form-field>
            
            <div class="button-container">
              <button 
                mat-raised-button 
                color="primary" 
                type="submit" 
                [disabled]="loginForm.invalid || isLoading()"
              >
                {{ isLoading() ? 'Logging in...' : 'Login' }}
              </button>
              <button 
                mat-button 
                type="button" 
                (click)="navigateToRegister()"
              >
                Create an account
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
    
    }
    .login-card {
      max-width: 400px;
      width: 100%;
      padding: 20px;
    }
    .full-width {
      width: 100%;
      margin-bottom: 15px;
    }
    .button-container {
      display: flex;
      justify-content: space-between;
      margin-top: 20px;
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  
  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });
  
  isLoading = signal(false);
  
  async onSubmit(): Promise<void> { // Changed to async
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      const { email, password } = this.loginForm.value;
      
      try {
        await this.authService.login(email, password); // AuthService.login is now async
        // Navigation will be handled by auth state listener or can be explicit here
        this.router.navigate(['/dashboard']); 
      } catch (error: any) { // Catch error from async function
        this.snackBar.open(error.message || 'Login failed. Please try again.', 'Close', { // error.message comes from mapFirebaseAuthError
          duration: 5000,
          horizontalPosition: 'center',
            verticalPosition: 'bottom',
          });
      } finally {
        this.isLoading.set(false);
      }
    }
  }
  
  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }
} 