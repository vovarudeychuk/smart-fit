import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MockDataService } from '../../services/mock-data.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-mock-data-manager',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Mock Data Manager</mat-card-title>
        <mat-card-subtitle>Populate Firebase with test data for development</mat-card-subtitle>
      </mat-card-header>
      
      <mat-card-content>
        <div class="data-info">
          <h3>This will populate your Firebase with:</h3>
          <ul>
            <li>🍎 <strong>33 Food Items</strong> - Complete nutrition database with proteins, carbs, fats, and vegetables</li>
            <li>🎯 <strong>Nutrition Goals</strong> - Sample daily targets (2200 cal, 140g protein, etc.)</li>
            <li>📊 <strong>7 Days of Food Logs</strong> - Realistic daily nutrition entries for the past week</li>
          </ul>
          
          <div class="warning-box">
            <strong>⚠️ Note:</strong> You must be logged in with Firebase Authentication to use this feature.
            This will add data to your account.
          </div>
        </div>
      </mat-card-content>
      
      <mat-card-actions>
        <button 
          mat-raised-button 
          color="primary" 
          (click)="populateData()"
          [disabled]="isLoading || !isUserLoggedIn"
          class="populate-btn">
          <mat-spinner diameter="20" *ngIf="isLoading"></mat-spinner>
          {{ isLoading ? 'Populating...' : 'Populate Mock Data' }}
        </button>
        
        <button 
          mat-stroked-button 
          color="warn" 
          (click)="clearData()"
          [disabled]="isLoading || !isUserLoggedIn"
          class="clear-btn">
          Clear User Data
        </button>
        
        <div *ngIf="!isUserLoggedIn" class="login-warning">
          Please log in to use the mock data manager.
        </div>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    mat-card {
      max-width: 600px;
      margin: 20px auto;
    }
    
    .data-info ul {
      margin: 16px 0;
      padding-left: 20px;
    }
    
    .data-info li {
      margin: 8px 0;
      font-size: 14px;
    }
    
    .warning-box {
      background-color: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 4px;
      padding: 12px;
      margin: 16px 0;
      font-size: 14px;
    }
    
    mat-card-actions {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }
    
    .populate-btn, .clear-btn {
      min-width: 140px;
    }
    
    .populate-btn mat-spinner {
      margin-right: 8px;
    }
    
    .login-warning {
      color: #d32f2f;
      font-size: 14px;
      font-weight: 500;
    }
  `]
})
export class MockDataManagerComponent {
  private mockDataService = inject(MockDataService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  
  isLoading = false;
  
  get isUserLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }
  
  async populateData(): Promise<void> {
    if (!this.isUserLoggedIn) {
      this.snackBar.open('Please log in first', 'Dismiss', { duration: 3000 });
      return;
    }
    
    this.isLoading = true;
    
    try {
      await this.mockDataService.populateFirebaseWithMockData();
      
      this.snackBar.open(
        '🎉 Mock data populated successfully! Check your dashboard.', 
        'Dismiss', 
        { 
          duration: 5000,
          panelClass: ['success-snackbar']
        }
      );
      
    } catch (error: any) {
      console.error('Error populating mock data:', error);
      
      this.snackBar.open(
        `❌ Error: ${error.message || 'Failed to populate mock data'}`, 
        'Dismiss', 
        { 
          duration: 5000,
          panelClass: ['warning-snackbar']
        }
      );
      
    } finally {
      this.isLoading = false;
    }
  }
  
  async clearData(): Promise<void> {
    if (!this.isUserLoggedIn) {
      this.snackBar.open('Please log in first', 'Dismiss', { duration: 3000 });
      return;
    }
    
    if (!confirm('Are you sure you want to clear your user data? This action cannot be undone.')) {
      return;
    }
    
    this.isLoading = true;
    
    try {
      await this.mockDataService.clearUserData();
      
      this.snackBar.open(
        '🗑️ User data cleared successfully!', 
        'Dismiss', 
        { 
          duration: 3000,
          panelClass: ['success-snackbar']
        }
      );
      
    } catch (error: any) {
      console.error('Error clearing user data:', error);
      
      this.snackBar.open(
        `❌ Error: ${error.message || 'Failed to clear user data'}`, 
        'Dismiss', 
        { 
          duration: 5000,
          panelClass: ['warning-snackbar']
        }
      );
      
    } finally {
      this.isLoading = false;
    }
  }
} 