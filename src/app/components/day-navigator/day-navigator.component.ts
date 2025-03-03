import { Component, inject, computed, OnInit } from '@angular/core';
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
          [isToday]="isToday(day.date)"
          [isPast]="isPastDay(day.date)"
          [isFuture]="isFutureDay(day.date)"
          [totalCalories]="day.totalCalories"
          [calorieGoal]="calorieGoal"
          [hasFoodItems]="day.foodItems.length > 0"
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
export class DayNavigatorComponent implements OnInit {
  private nutritionService = inject(NutritionService);
  
  // Use computed to create a reactive property that reflects the current day data
  currentDay = computed(() => this.nutritionService.getCurrentDay());
  calorieGoal = this.nutritionService.getCalorieGoal();
  
  // For debugging
  ngOnInit() {
    // Set current day index to today
    const today = new Date();
    const dayOfWeek = today.getDay();
    this.nutritionService.navigateToDay(dayOfWeek);
    
    // Existing debug code
    const days = this.getAllDays();
    days.forEach((day, index) => {
      console.log(`Day ${index}:`, {
        date: day.date,
        isToday: this.isToday(day.date),
        isPast: this.isPastDay(day.date),
        isFuture: this.isFutureDay(day.date),
        totalCalories: day.totalCalories,
        foodItems: day.foodItems.length
      });
    });
  }
  
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
  
  isToday(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to beginning of day
    
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0); // Reset time to beginning of day
    
    return today.getTime() === compareDate.getTime();
  }
  
  isPastDay(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to beginning of day
    
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0); // Reset time to beginning of day
    
    return compareDate.getTime() < today.getTime();
  }
  
  isFutureDay(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to beginning of day
    
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0); // Reset time to beginning of day
    
    return compareDate.getTime() > today.getTime();
  }
} 