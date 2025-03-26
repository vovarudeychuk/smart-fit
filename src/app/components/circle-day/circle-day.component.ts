import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { CdkDropList, DragDropModule } from '@angular/cdk/drag-drop';
import { FoodItem } from '../../models/food-item.model';

@Component({
  selector: 'app-circle-day',
  standalone: true,
  imports: [CommonModule, MatIconModule, DragDropModule],
  template: `
    <div 
      class="day-circle" 
      [class.active]="isActive"
      [class.today]="isToday"
      [class.past]="isPast"
      [class.future]="isFuture"
      [class.drop-target]="isDragOver"
      cdkDropList
      id="day-{{ dayIndex }}"
      [cdkDropListData]="{dayIndex: dayIndex, date: date}"
      [cdkDropListConnectedTo]="['food-list']"
      (cdkDropListDropped)="onDropped($event)"
      (cdkDropListEntered)="isDragOver = true"
      (cdkDropListExited)="isDragOver = false"
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
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      position: relative;
      
      /* Base styling */
      background-color: rgba(0, 0, 0, 0.08);
      color: rgba(0, 0, 0, 0.87);
      
      &:hover {
        background-color: rgba(103, 58, 183, 0.12);
        transform: scale(1.05);
      }
      
      &.drop-target {
        border: 2px dashed #673ab7;
        animation: pulse 1.5s infinite;
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
        transform: scale(1.1);
        box-shadow: 0 3px 5px -1px rgba(0,0,0,.2), 
                    0 6px 10px 0 rgba(0,0,0,.14), 
                    0 1px 18px 0 rgba(0,0,0,.12);
        
        /* Special case for active today */
        &.today {
          border-color: white;
          box-shadow: 0 0 0 2px #ff4081, 
                      0 3px 5px -1px rgba(0,0,0,.2), 
                      0 6px 10px 0 rgba(0,0,0,.14), 
                      0 1px 18px 0 rgba(0,0,0,.12);
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
      
      /* Responsive sizes */
      @media (min-width: 400px) {
        width: 40px;
        height: 40px;
      }
      
      @media (min-width: 480px) {
        width: 44px;
        height: 44px;
      }
      
      @media (min-width: 600px) {
        width: 48px;
        height: 48px;
      }
    }
    
    .day-label {
      font-size: 14px;
      font-weight: 500;
      text-transform: uppercase;
      line-height: 1;
      
      @media (min-width: 480px) {
        font-size: 16px;
      }
    }
    
    .check-mark {
      position: absolute;
      bottom: -3px;
      right: -3px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: white;
      border: 1.5px solid;
      transition: all 0.3s ease;
      animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      
      mat-icon {
        font-size: 10px;
        height: 10px;
        width: 10px;
        line-height: 10px;
      }
      
      /* Responsive sizes */
      @media (min-width: 480px) {
        bottom: -4px;
        right: -4px;
        width: 18px;
        height: 18px;
        border: 2px solid;
        
        mat-icon {
          font-size: 12px;
          height: 12px;
          width: 12px;
          line-height: 12px;
        }
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
    
    @keyframes pulse {
      0% {
        transform: scale(1.05);
        box-shadow: 0 0 0 0 rgba(103, 58, 183, 0.5);
      }
      70% {
        transform: scale(1.1);
        box-shadow: 0 0 0 10px rgba(103, 58, 183, 0);
      }
      100% {
        transform: scale(1.05);
        box-shadow: 0 0 0 0 rgba(103, 58, 183, 0);
      }
    }
    
    @keyframes popIn {
      0% {
        transform: scale(0);
      }
      70% {
        transform: scale(1.2);
      }
      100% {
        transform: scale(1);
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
  @Input() dayIndex: number = 0;
  @Output() daySelected = new EventEmitter<void>();
  @Output() onFoodDrop = new EventEmitter<any>();
  
  isDragOver = false;
  
  // Added a method to emit the event and reset isDragOver
  onDropped(event: any): void {
    this.onFoodDrop.emit(event);
    this.isDragOver = false; // Make sure we reset the drop-target style
  }
  
  getDayLabel(): string {
    return new Date(this.date).toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
  }
  
  getCompletionClass(): string {
    if (!this.hasFoodItems) return '';
    
    // Calculate percentage of goal reached
    const percentage = (this.totalCalories / this.calorieGoal) * 100;
    
    if (percentage < 80) {
      return 'incomplete'; // Less than 80% of goal - orange
    } else if (percentage <= 120) {
      return 'complete'; // Between 80% and 120% of goal - green
    } else {
      return 'excess'; // More than 120% of goal - red
    }
  }
} 