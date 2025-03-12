import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { ApiStatusService } from '../../../services/api-status.service';

@Component({
  selector: 'app-api-status',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule, MatBadgeModule],
  template: `
    <div class="api-status-indicator" [ngClass]="apiStatus()">
      <mat-icon 
        [matTooltip]="getStatusTooltip()"
        [ngClass]="apiStatus()">
        {{getStatusIcon()}}
      </mat-icon>
      <span class="status-label" *ngIf="showLabel">
        {{apiStatus() === 'connected' ? 'Using API' : 
          apiStatus() === 'disconnected' ? 'Using Mock Data' : 'Checking API...'}}
      </span>
    </div>
  `,
  styles: `
    .api-status-indicator {
      display: flex;
      align-items: center;
      padding: 4px 8px;
      border-radius: 16px;
      margin: 8px;
      
      &.connected {
        background-color: rgba(76, 175, 80, 0.1);
      }
      
      &.disconnected {
        background-color: rgba(255, 152, 0, 0.1);
      }
      
      &.checking {
        background-color: rgba(33, 150, 243, 0.1);
      }
      
      mat-icon {
        font-size: 18px;
        height: 18px;
        width: 18px;
        
        &.connected {
          color: #4caf50;
        }
        
        &.disconnected {
          color: #ff9800;
        }
        
        &.checking {
          color: #2196f3;
        }
      }
      
      .status-label {
        margin-left: 4px;
        font-size: 12px;
      }
    }
  `
})
export class ApiStatusComponent {
  private statusService = inject(ApiStatusService);
  
  apiStatus = this.statusService.apiStatus;
  showLabel = true; // Set to false for icon-only view
  
  getStatusIcon(): string {
    switch (this.apiStatus()) {
      case 'connected':
        return 'cloud_done';
      case 'disconnected':
        return 'cloud_off';
      default:
        return 'sync';
    }
  }
  
  getStatusTooltip(): string {
    switch (this.apiStatus()) {
      case 'connected':
        return 'Connected to API - using real data';
      case 'disconnected':
        return 'API not available - using mock data';
      default:
        return 'Checking API status...';
    }
  }
}
