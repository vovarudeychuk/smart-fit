import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-circle-day',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div 
      class="day-circle" 
      [class.active]="isActive"
      [class.today]="isToday"
      [class.past]="isPast"
      [class.future]="isFuture"
      (click)="daySelected.emit()">
      <div class="day-label">{{ getDayLabel() }}</div>
      
      @if (isPast && hasFoodItems) {
        <div class="check-mark" [class]="getCompletionClass()">
          <mat-icon>check</mat-icon>
        </div>
      }
    </div>
  `,
  styles: `
    .day-circle {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      
      /* Base styling */
      background-color: rgba(0, 0, 0, 0.08);
      color: rgba(0, 0, 0, 0.87);
      
      &:hover {
        background-color: rgba(103, 58, 183, 0.12);
      }
      
      /* Past day styling - always applied when .past class is present */
      &.past {
        background-color: rgba(0, 0, 0, 0.05);
        color: rgba(0, 0, 0, 0.6);
        opacity: 0.7;
        background-image: repeating-linear-gradient(
          45deg,
          transparent,
          transparent 5px,
          rgba(0, 0, 0, 0.05) 5px,
          rgba(0, 0, 0, 0.05) 10px
        );
      }
      
      /* Future day styling - always applied when .future class is present */
      &.future {
        background-color: rgba(0, 0, 0, 0.08);
        color: rgba(0, 0, 0, 0.87);
      }
      
      /* Today styling - always applied when .today class is present */
      &.today {
        border: 2px solid #ff4081;
      }
      
      /* Active styling - overrides other styles when selected */
      &.active {
        background-color: #673ab7;
        color: white;
        
        /* Special case for active today */
        &.today {
          border-color: white;
          box-shadow: 0 0 0 2px #ff4081;
        }
        
        /* Special case for active past day */
        &.past {
          background-color: #9575cd; /* Lighter purple */
          opacity: 0.9;
          background-image: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 5px,
            rgba(255, 255, 255, 0.1) 5px,
            rgba(255, 255, 255, 0.1) 10px
          );
        }
      }
    }
    
    .day-label {
      font-size: 18px;
      font-weight: 500;
      text-transform: uppercase;
      line-height: 1;
    }
    
    .check-mark {
      position: absolute;
      bottom: -6px;
      right: -6px;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: white;
      border: 2px solid;
      
      mat-icon {
        font-size: 14px;
        height: 14px;
        width: 14px;
        line-height: 14px;
      }
      
      &.incomplete {
        border-color: #ff9800; /* Orange for in progress */
        color: #ff9800;
      }
      
      &.complete {
        border-color: #4caf50; /* Green for successful */
        color: #4caf50;
      }
      
      &.excess {
        border-color: #f44336; /* Red for excess */
        color: #f44336;
      }
    }
  `
})
export class CircleDayComponent {
  @Input() date: Date = new Date();
  @Input() isActive: boolean = false;
  @Input() isToday: boolean = false;
  @Input() isPast: boolean = false;
  @Input() isFuture: boolean = false;
  @Input() totalCalories: number = 0;
  @Input() calorieGoal: number = 0;
  @Input() hasFoodItems: boolean = false;
  @Output() daySelected = new EventEmitter<void>();
  
  getDayLabel(): string {
    return new Date(this.date).toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
  }
  
  getCompletionClass(): string {
    if (!this.hasFoodItems || this.totalCalories === 0) {
      return '';
    }
    
    const percentage = (this.totalCalories / this.calorieGoal) * 100;
    
    if (percentage < 90) {
      return 'incomplete';
    } else if (percentage > 110) {
      return 'excess';
    } else {
      return 'complete';
    }
  }
} 