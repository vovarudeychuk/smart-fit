import { Component, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { NutritionService } from '../../services/nutrition.service';
import { CircleDayComponent } from '../circle-day/circle-day.component';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { FoodItem } from '../../models/food-item.model';
import { FoodQuantityDialogComponent } from '../food-quantity-dialog/food-quantity-dialog.component';

@Component({
  selector: 'app-day-navigator',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, CircleDayComponent, DragDropModule],
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
          [dayIndex]="$index"
          (daySelected)="navigateToDay($index)"
          (onFoodDrop)="handleFoodDrop($event, $index)">
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
  private dialog = inject(MatDialog);
  
  // Use computed to create a reactive property that reflects the current day data
  currentDay = computed(() => this.nutritionService.getCurrentDay());
  calorieGoal = this.nutritionService.getCalorieGoal();
  
  ngOnInit() {

  }
  
  navigateToDay(dayIndex: number): void {
    this.nutritionService.navigateToDay(dayIndex);
  }
  
  navigateToPreviousDay(): void {
    const currentIndex = this.getCurrentDayIndex();
    if (currentIndex > 0) {
      this.navigateToDay(currentIndex - 1);
    }
  }
  
  navigateToNextDay(): void {
    const currentIndex = this.getCurrentDayIndex();
    if (currentIndex < 6) {
      this.navigateToDay(currentIndex + 1);
    }
  }
  
  getCurrentDayIndex(): number {
    return this.nutritionService.getCurrentDayIndex();
  }
  
  getAllDays() {
    return this.nutritionService.getAllDays();
  }
  
  formatDayName(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
  }
  
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  }
  
  isToday(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate.getTime() === today.getTime();
  }
  
  isPastDay(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    
    return compareDate.getTime() < today.getTime();
  }
  
  isFutureDay(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    
    return compareDate.getTime() > today.getTime();
  }
  
  // Handle food item being dropped on a day circle
  handleFoodDrop(event: CdkDragDrop<any>, dayIndex: number): void {
    console.log('Food drop event:', event);
    
    // Check if we have data from the dragged item
    if (event.item && event.item.data) {
      const foodItem = event.item.data as FoodItem;
      console.log('Food dropped on day', dayIndex, foodItem);
      
      // Navigate to the target day
      this.navigateToDay(dayIndex);
      
      // Extract quantity and serving size from the original food item
      let quantity = 1;
      let servingSize = 100;
      
      const servingSizeMatch = foodItem.servingSize.match(/^(\d+(?:\.\d+)?)\s*x\s*(\d+)g$/);
      if (servingSizeMatch) {
        quantity = parseFloat(servingSizeMatch[1]);
        servingSize = parseInt(servingSizeMatch[2], 10);
      }
      
      // Create a base food item with standardized values
      const baseFood: FoodItem = {
        ...foodItem,
        // Create a new ID to avoid conflicts - make sure it's a number or string based on your model
        id: Date.now(),
        calories: foodItem.calories / (quantity * (servingSize / 100)),
        protein: foodItem.protein / (quantity * (servingSize / 100)),
        carbs: foodItem.carbs / (quantity * (servingSize / 100)),
        fat: foodItem.fat / (quantity * (servingSize / 100)),
        servingSize: '100g' // Reset to standard serving
      };
      
      // Open food quantity dialog to let user adjust quantity
      const dialogRef = this.dialog.open(FoodQuantityDialogComponent, {
        width: '400px',
        data: { 
          food: baseFood,
          initialQuantity: quantity,
          initialServingSize: servingSize
        }
      });
      
      // When dialog closes, add the food if user confirmed
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.nutritionService.addFoodItem(result.food);
        }
      });
    } else {
      console.error('No data found in the dragged item', event);
    }
  }
} 