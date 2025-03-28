import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-nutrition-progress-bar',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="progress-item">
      <div class="progress-header">
        <div class="label-with-icon">
          <div [ngClass]="color" class="nutrient-icon-container">
            <mat-icon class="nutrient-icon">{{getNutrientIcon()}}</mat-icon>
          </div>
          <span class="label">{{ label }}</span>
        </div>
        <span class="value-display">
          <span class="current-value">{{ currentValue | number:'1.0-1' }}</span> / {{ goalValue }} {{ unit }}
        </span>
      </div>
      
      <div class="meter">
        <div class="progress-segments">
          <!-- Normal progress (up to 100%) -->
          <div 
            *ngIf="normalPercentage > 0" 
            [style.width.%]="normalPercentage"
            class="normal-segment animate-width" 
            [ngClass]="color">
          </div>
          
          <!-- Excess progress (beyond 100%) -->
          <div 
            *ngIf="excessPercentage > 0" 
            [style.width.%]="excessPercentage"
            class="excess-segment animate-width">
          </div>
          
          <!-- Empty space -->
          <div 
            *ngIf="emptyPercentage > 0" 
            [style.width.%]="emptyPercentage"
            class="empty-segment">
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    .progress-item {
      margin-bottom: 16px;
      background-color: #ffffff;
      border-radius: 12px;
      padding: 12px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
      
      @media (min-width: 1200px) {
        padding: 14px;
      }
    }
    
    .progress-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
      align-items: center;
      
      @media (max-width: 480px) {
        font-size: 12px;
      }
      
      @media (min-width: 1200px) {
        font-size: 15px;
      }
    }
    
    .label-with-icon {
      display: flex;
      align-items: center;
    }
    
    .label {
      font-weight: 500;
      color: rgba(0, 0, 0, 0.87);
    }
    
    .value-display {
      color: rgba(0, 0, 0, 0.6);
      
      .current-value {
        font-weight: 600;
        color: rgba(0, 0, 0, 0.87);
      }
      
      @media (max-width: 480px) {
        font-size: 11px;
      }
    }
    
    .nutrient-icon-container {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 8px;
      margin-right: 8px;
      
      @media (max-width: 480px) {
        width: 24px;
        height: 24px;
        border-radius: 6px;
      }
      
      @media (min-width: 1200px) {
        width: 30px;
        height: 30px;
      }
      
      &.ccal {
        background-color: rgba(156, 39, 176, 0.1);
      }
      
      &.protein {
        background-color: rgba(76, 175, 80, 0.1);
      }
      
      &.carbs {
        background-color: rgba(33, 150, 243, 0.1);
      }
      
      &.fat {
        background-color: rgba(255, 152, 0, 0.1);
      }
    }
    
    .nutrient-icon {
      font-size: 16px;
      height: 16px;
      width: 16px;
      
      @media (max-width: 480px) {
        font-size: 14px;
        height: 14px;
        width: 14px;
      }
      
      @media (min-width: 1200px) {
        font-size: 18px;
        height: 18px;
        width: 18px;
      }
      
      &.ccal {
        color: #9c27b0;
      }
      
      &.protein {
        color: #4caf50;
      }
      
      &.carbs {
        color: #2196f3;
      }
      
      &.fat {
        color: #ff9800;
      }
    }
    
    .meter {
      height: 10px;
      background: rgba(0, 0, 0, 0.08);
      border-radius: 6px;
      overflow: hidden;
      
      @media (max-width: 480px) {
        height: 8px;
        border-radius: 4px;
      }
      
      @media (min-width: 1200px) {
        height: 12px;
      }
    }
    
    .progress-segments {
      display: flex;
      width: 100%;
      height: 100%;
    }
    
    .animate-width {
      transition: width 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
    
    .normal-segment {
      height: 100%;
      
      &.primary {
        background-color: #673ab7; /* Purple */
      }
      
      &.accent {
        background-color: #ff4081; /* Pink */
      }
      
      &.warn {
        background-color: #f44336; /* Red */
      }
      
      &.ccal {
        background-color: #9c27b0;
        background-image: linear-gradient(45deg, #9c27b0, #ce93d8);
      }
      
      &.protein {
        background-color: #4caf50;
        background-image: linear-gradient(45deg, #4caf50, #81c784);
      }
      
      &.carbs {
        background-color: #2196f3;
        background-image: linear-gradient(45deg, #2196f3, #90caf9);
      } 
      
      &.fat {
        background-color: #ff9800;
        background-image: linear-gradient(45deg, #ff9800, #ffcc80);
      }
      
      &:first-child {
        border-top-left-radius: 6px;
        border-bottom-left-radius: 6px;
        
        @media (max-width: 480px) {
          border-radius: 4px;
        }
      }
    }
  
    .excess-segment {
      height: 100%;
      background-color: #f44336;
      background-image: linear-gradient(45deg, #f44336, #ef9a9a);
      
      &:last-child {
        border-top-right-radius: 6px;
        border-bottom-right-radius: 6px;
        
        @media (max-width: 480px) {
          border-radius: 4px;
        }
      }
    }
    
    .empty-segment {
      height: 100%;
      
      &:last-child {
        border-top-right-radius: 6px;
        border-bottom-right-radius: 6px;
        
        @media (max-width: 480px) {
          border-radius: 4px;
        }
      }
    }
  `
})
export class NutritionProgressBarComponent {
  @Input() label: string = '';
  @Input() currentValue: number = 0;
  @Input() goalValue: number = 100;
  @Input() unit: string = '';
  @Input() color: 'primary' | 'accent' | 'warn' | 'ccal' | 'carbs' | 'protein' | 'fat'  = 'primary';
  
  // Calculate percentages based on the total bar width (100%)
  get normalPercentage(): number {
    if (this.currentValue <= this.goalValue) {
      // If under goal, show actual percentage of goal
      return (this.currentValue / this.goalValue) * 100;
    } else {
      // If over goal, the normal part takes a percentage of the total display
      // which is based on the ratio between goal and current value
      return (this.goalValue / Math.max(this.currentValue, this.goalValue)) * 100;
    }
  }
  
  get excessPercentage(): number {
    if (this.currentValue <= this.goalValue) {
      return 0;
    } else {
      // Excess part takes the remaining percentage
      return ((this.currentValue - this.goalValue) / Math.max(this.currentValue, this.goalValue)) * 100;
    }
  }
  
  get emptyPercentage(): number {
    if (this.currentValue >= this.goalValue) {
      return 0;
    } else {
      // Empty part is what's left
      return ((this.goalValue - this.currentValue) / this.goalValue) * 100;
    }
  }
  
  getNutrientIcon(): string {
    switch(this.color) {
      case 'ccal': return 'local_fire_department';
      case 'protein': return 'fitness_center';
      case 'carbs': return 'bakery_dining';
      case 'fat': return 'egg_alt';
      default: return 'pie_chart';
    }
  }
}