import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="profile-container">
      <mat-card class="profile-card" *ngIf="user()">
        <mat-card-header>
          <div mat-card-avatar class="profile-avatar">
            <mat-icon>person</mat-icon>
          </div>
          <mat-card-title>{{ user()?.displayName || user()?.email || 'User Profile' }}</mat-card-title>
          <mat-card-subtitle *ngIf="user()?.displayName && user()?.email">{{ user()?.email }}</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p><strong>Email:</strong> {{ user()?.email }}</p>
          <p *ngIf="user()?.uid"><strong>User ID:</strong> {{ user()?.uid }}</p> 
          <!-- Optionally display UID for debugging or info -->
          <p><strong>Member since:</strong> {{ memberSince }}</p> 
          <!-- 'memberSince' is still current date, Firebase metadata.creationTime could be used in future -->
        </mat-card-content>
        <mat-card-actions>
          <button mat-button color="primary">Edit Profile</button>
          <button mat-button (click)="logout()">Logout</button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .profile-container {
      display: flex;
      justify-content: center;
      padding: 30px;
    }
    .profile-card {
      max-width: 600px;
      width: 100%;
    }
    .profile-avatar {
      background-color: #f5f5f5;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `]
})
export class ProfileComponent {
  private authService = inject(AuthService);
  // user is now a signal directly from AuthService
  user = this.authService.currentUser; 
  // memberSince is still the current date. Firebase user.metadata.creationTime could be used for actual creation date.
  memberSince = new Date().toLocaleDateString(); 
  
  logout(): void {
    this.authService.logout();
  }
} 