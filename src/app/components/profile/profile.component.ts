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
      <mat-card class="profile-card">
        <mat-card-header>
          <div mat-card-avatar class="profile-avatar">
            <mat-icon>person</mat-icon>
          </div>
          <mat-card-title>{{ user?.firstName || '' }} {{ user?.lastName || '' }}</mat-card-title>
          <mat-card-subtitle>{{ user?.username }}</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p><strong>Email:</strong> {{ user?.email }}</p>
          <p><strong>Member since:</strong> {{ memberSince }}</p>
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
  user: User | null = this.authService.currentUser();
  memberSince = new Date().toLocaleDateString();
  
  logout(): void {
    this.authService.logout();
  }
} 