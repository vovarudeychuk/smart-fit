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
  selector: 'app-register',
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
    <div class="register-container">
      <mat-card class="register-card">
        <mat-card-header>
          <mat-card-title>Create Account</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Username</mat-label>
              <input matInput formControlName="username" placeholder="Username" required>
              <mat-error *ngIf="registerForm.get('username')?.hasError('required')">
                Username is required
              </mat-error>
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput formControlName="email" type="email" placeholder="Email" required>
              <mat-error *ngIf="registerForm.get('email')?.hasError('required')">
                Email is required
              </mat-error>
              <mat-error *ngIf="registerForm.get('email')?.hasError('email')">
                Please enter a valid email
              </mat-error>
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput formControlName="password" type="password" placeholder="Password" required>
              <mat-error *ngIf="registerForm.get('password')?.hasError('required')">
                Password is required
              </mat-error>
              <mat-error *ngIf="registerForm.get('password')?.hasError('minlength')">
                Password must be at least 6 characters
              </mat-error>
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>First Name</mat-label>
              <input matInput formControlName="firstName" placeholder="First Name">
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Last Name</mat-label>
              <input matInput formControlName="lastName" placeholder="Last Name">
            </mat-form-field>
            
            <div class="button-container">
              <button 
                mat-raised-button 
                color="primary" 
                type="submit" 
                [disabled]="registerForm.invalid || isLoading()"
              >
                {{ isLoading() ? 'Registering...' : 'Register' }}
              </button>
              <button 
                mat-button 
                type="button" 
                (click)="navigateToLogin()"
              >
                Already have an account?
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .register-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background-color: #f5f5f5;
    }
    .register-card {
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
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  
  registerForm: FormGroup = this.fb.group({
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    firstName: [''],
    lastName: ['']
  });
  
  isLoading = signal(false);
  
  async onSubmit(): Promise<void> { // Changed to async
    if (this.registerForm.valid) {
      this.isLoading.set(true);
      const { username, email, password, firstName, lastName } = this.registerForm.value;
      
      // Construct userData for the new AuthService.register method
      // Using username as displayName. Alternatively, could use firstName + lastName.
      const userData = {
        email,
        password,
        displayName: username 
      };
      
      try {
        await this.authService.register(userData); // AuthService.register is now async
        // Navigation will be handled by auth state listener or can be explicit here
        this.router.navigate(['/dashboard']);
      } catch (error: any) { // Catch error from async function
        this.snackBar.open(error.message || 'Registration failed. Please try again.', 'Close', { // error.message comes from mapFirebaseAuthError
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        });
      } finally {
        this.isLoading.set(false);
      }
    }
  }
  
  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }
} 