import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
// ApiStatusService has been removed

@Component({
  selector: 'app-api-status',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule, MatBadgeModule],
  template: `
    <div class="api-status-indicator connected">
      <mat-icon 
        matTooltip="Connected to Firebase"
        class="connected">
        cloud_done
      </mat-icon>
      <span class="status-label" *ngIf="showLabel">
        Firebase Connected
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
      
      &.connected { // Only 'connected' class will be used now
        background-color: rgba(76, 175, 80, 0.1); // Greenish background
      }
      
      mat-icon {
        font-size: 18px;
        height: 18px;
        width: 18px;
        
        &.connected { // Only 'connected' class will be used now
          color: #4caf50; // Green icon color
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
  // ApiStatusService and related logic have been removed.
  // The component now displays a static "Firebase Connected" status.
  showLabel = true; // Set to false for icon-only view
  
  // getStatusIcon and getStatusTooltip are no longer needed as status is static.
}
