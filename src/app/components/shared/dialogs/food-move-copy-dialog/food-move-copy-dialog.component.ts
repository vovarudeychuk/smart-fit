import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface FoodMoveCopyDialogData {
  foodName: string;
  fromDate: Date;
  toDate: Date;
}

export type FoodMoveCopyResult = 'move' | 'copy' | 'cancel';

@Component({
  selector: 'app-food-move-copy-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>Change Date</h2>
      <mat-dialog-content>
        <p>Would you like to move or copy "{{ data.foodName }}" from {{ formatDate(data.fromDate) }} to {{ formatDate(data.toDate) }}?</p>
        
        <div class="options-container">
          <div class="option-card" (click)="dialogRef.close('move')">
            <div class="option-icon move">
              <mat-icon>moving</mat-icon>
            </div>
            <div class="option-label">Move</div>
            <div class="option-description">Remove from original date and add to new date</div>
          </div>
          
          <div class="option-card" (click)="dialogRef.close('copy')">
            <div class="option-icon copy">
              <mat-icon>content_copy</mat-icon>
            </div>
            <div class="option-label">Copy</div>
            <div class="option-description">Keep on original date and add to new date</div>
          </div>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button (click)="dialogRef.close('cancel')">Cancel</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: `
    .dialog-container {
      color: rgba(0, 0, 0, 0.87);
      background-color: white;
      min-width: 320px;
    }
    
    .options-container {
      display: flex;
      gap: 16px;
      margin: 20px 0;
      
      @media (max-width: 480px) {
        flex-direction: column;
        gap: 12px;
      }
    }
    
    .option-card {
      flex: 1;
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      
      &:hover {
        background-color: rgba(0, 0, 0, 0.02);
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }
    }
    
    .option-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
      
      &.move {
        background-color: rgba(33, 150, 243, 0.1);
        color: #2196F3;
      }
      
      &.copy {
        background-color: rgba(76, 175, 80, 0.1);
        color: #4CAF50;
      }
      
      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
    }
    
    .option-label {
      font-weight: 500;
      font-size: 16px;
      margin-bottom: 8px;
    }
    
    .option-description {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
      line-height: 1.4;
    }
  `
})
export class FoodMoveCopyDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<FoodMoveCopyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FoodMoveCopyDialogData
  ) {}
  
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  }
} 