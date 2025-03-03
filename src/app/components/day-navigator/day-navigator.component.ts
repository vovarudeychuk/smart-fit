import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NutritionService } from '../../services/nutrition.service';
import { CircleDayComponent } from '../circle-day/circle-day.component';

@Component({
  selector: 'app-day-navigator',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, CircleDayComponent],
  template: `
    <div class="week-circles">
      @for (day of getAllDays(); track $index) {
        <app-circle-day 
          [date]="day.date" 
          [isActive]="getCurrentDayIndex() === $index"
          (daySelected)="navigateToDay($index)">
        </app-circle-day>
      }
    </div>
    
    <div class="day-navigator">
      <button mat-mini-fab color="primary" 
              (click)="navigateToPreviousDay()" 
              [disabled]="getCurrentDayIndex() === 0">
        <mat-icon>arrow_back</mat-icon>
      </button>
      
      <div class="date-display">
        <div class="day-name">{{ formatDayName(currentDay().date) }}</div>
        <div class="date">{{ formatDate(currentDay().date) }}</div>
      </div>
      
      <button mat-mini-fab color="primary"
              (click)="navigateToNextDay()" 
              [disabled]="getCurrentDayIndex() === 6">
        <mat-icon>arrow_forward</mat-icon>
      </button>
    </div>
  `,
  styleUrl: './day-navigator.component.scss'
})
export class DayNavigatorComponent {
  private nutritionService = inject(NutritionService);
  
  // Use computed to create a reactive property that reflects the current day data
  currentDay = computed(() => this.nutritionService.getCurrentDay());
  
  getCurrentDayIndex(): number {
    return this.nutritionService.getCurrentDayIndex();
  }
  
  getAllDays() {
    return this.nutritionService.getAllDays();
  }
  
  navigateToDay(dayIndex: number) {
    this.nutritionService.navigateToDay(dayIndex);
  }
  
  navigateToNextDay() {
    this.nutritionService.navigateToNextDay();
  }
  
  navigateToPreviousDay() {
    this.nutritionService.navigateToPreviousDay();
  }
  
  formatDayName(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
  }
  
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  }
} 