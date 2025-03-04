import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-nutrition-progress-bar',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="progress-item">
      <div class="progress-label">
        <span class="label-with-icon">
          <mat-icon [ngClass]="color" class="nutrient-icon">{{getNutrientIcon()}}</mat-icon>
          {{ label }}
        </span>
        <span>{{ currentValue | number:'1.0-1' }} / {{ goalValue }} {{ unit }}</span>
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
      margin-bottom: 8px;
    }
    
    .progress-label {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      font-size: 14px;
      align-items: center;
    }
    
    .label-with-icon {
      display: flex;
      align-items: center;
    }
    
    .nutrient-icon {
      font-size: 18px;
      height: 18px;
      width: 18px;
      margin-right: 4px;
      border-radius: 50%;
      padding: 2px;
      
      &.ccal {
        background-color: rgba(156, 39, 176, 0.1);
        color: #9c27b0;
      }
      
      &.protein {
        background-color: rgba(76, 175, 80, 0.1);
        color: #4caf50;
      }
      
      &.carbs {
        background-color: rgba(33, 150, 243, 0.1);
        color: #2196f3;
      }
      
      &.fat {
        background-color: rgba(255, 152, 0, 0.1);
        color: #ff9800;
      }
    }
    
    .progress-label span {
      color: rgba(0, 0, 0, 0.87);
    }
    
    .meter {
      height: 8px;
      background: rgba(0, 0, 0, 0.12);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 4px;
    }
    
    .progress-segments {
      display: flex;
      width: 100%;
      height: 100%;
    }
    
    .animate-width {
      transition: width 0.6s ease-out;
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
      }
      
      &.protein {
        background-color: #4caf50;
      }
      
      &.carbs {
        background-color: #2196f3;
      } 
      
      &.fat {
        background-color: #ff9800;
      }
      
      &:first-child {
        border-top-left-radius: 4px;
        border-bottom-left-radius: 4px;
      }
    }
  
    .excess-segment {
      height: 100%;
      background-color: #f44336;
      
      &:last-child {
        border-top-right-radius: 4px;
        border-bottom-right-radius: 4px;
      }
    }
    
    .empty-segment {
      height: 100%;
      
      &:last-child {
        border-top-right-radius: 4px;
        border-bottom-right-radius: 4px;
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