import { Component, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatNativeDateModule, DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NutritionService } from '../../services/nutrition.service';
import { CircleDayComponent } from '../circle-day/circle-day.component';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { FoodItem } from '../../models/food-item.model';
import { FoodQuantityDialogComponent, FoodMoveCopyDialogComponent } from '../shared/dialogs';

@Component({
  selector: 'app-day-navigator',
  standalone: true,
  imports: [
    CommonModule, 
    MatButtonModule, 
    MatIconModule, 
    CircleDayComponent, 
    DragDropModule,
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    FormsModule
  ],
  template: `
  <div class="day-navigator">
      <button mat-mini-fab class="nav-button" (click)="navigateToPreviousDay()">
        <mat-icon>arrow_back</mat-icon>
      </button>
      
      <div class="date-display" (click)="datepicker.open()">
        <div class="day-name">{{ formatDayName(currentDay().date) }}</div>
        <div class="date-container">
          <div class="date">{{ formatDate(currentDay().date) }}</div>
          <mat-icon class="calendar-icon">calendar_today</mat-icon>
        </div>
        
        <!-- Hidden datepicker input -->
        <mat-form-field appearance="fill" class="hidden-datepicker">
          <input matInput [matDatepicker]="datepicker" 
                 [value]="currentDay().date"
                 (dateChange)="onDateSelected($event)">
          <mat-datepicker #datepicker></mat-datepicker>
        </mat-form-field>
      </div>
      
      <button mat-mini-fab class="nav-button" (click)="navigateToNextDay()">
        <mat-icon>arrow_forward</mat-icon>
      </button>
    </div>

    <div class="week-circles">
      @for (day of getAllDays(); track $index) {
        <app-circle-day 
          [date]="day.date" 
          [isActive]="getCurrentDayIndex() === $index"
          [isToday]="isToday(day.date)"
          [isPast]="isPastDay(day.date)"
          [isFuture]="isFutureDay(day.date)"
          [totalCalories]="day.totalCalories"
          [calorieGoal]="calorieGoal()"
          [hasFoodItems]="day.foodItems.length > 0"
          [dayIndex]="$index"
          (daySelected)="navigateToDay($index)"
          (onFoodDrop)="handleFoodDrop($event, $index)">
        </app-circle-day>
      }
    </div>
  `,
  styles: [`
    .week-circles {
      display: flex;
      justify-content: space-between;
      padding: 16px 8px;
      margin-bottom: 8px;
      overflow-x: auto;
      scroll-behavior: smooth;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none; /* Firefox */
      -ms-overflow-style: none; /* Internet Explorer and Edge */
      
      &::-webkit-scrollbar {
        display: none; /* Chrome, Safari, and Opera */
      }
      
      app-circle-day {
        margin: 0 4px;
        flex-shrink: 0;
      }
      
      @media (max-width: 480px) {
        padding: 12px 4px;
        justify-content: flex-start;
        
        app-circle-day {
          margin: 0 3px;
        }
      }
    }
    
    .day-navigator {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 16px 0;
      padding: 0 8px;
      
      @media (max-width: 480px) {
        margin: 8px 0;
      }
      
      @media (min-width: 481px) {
        padding: 0 16px;
      }
    }
    
    .nav-button {
      @media (max-width: 480px) {
        width: 32px;
        height: 32px;
        line-height: 32px;
        
        ::ng-deep .mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
          line-height: 16px;
        }
      }
    }
    
    .date-display {
      text-align: center;
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 0 8px;
      cursor: pointer;
      position: relative;
      transition: background-color 0.2s ease;
      border-radius: 8px;
      
      &:hover {
        background-color: rgba(0, 0, 0, 0.04);
      }
      
      @media (min-width: 481px) {
        padding: 0 16px;
      }
    }
    
    .date-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    
    .calendar-icon {
      font-size: 16px;
      height: 16px;
      width: 16px;
      color: rgba(0, 0, 0, 0.54);
    }
    
    .hidden-datepicker {
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;
      overflow: hidden;
    }
    
    .day-name {
      font-size: 18px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.87);
      margin-bottom: 4px;
      
      @media (max-width: 480px) {
        font-size: 16px;
        margin-bottom: 2px;
      }
    }
    
    .date {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
      
      @media (max-width: 480px) {
        font-size: 12px;
      }
    }
  `]
})
export class DayNavigatorComponent implements OnInit {
  private nutritionService = inject(NutritionService);
  private dialog = inject(MatDialog);
  
  // Use computed to create a reactive property that reflects the current day data
  currentDay = computed(() => this.nutritionService.getCurrentDay());
  calorieGoal = this.nutritionService.calorieGoal; // Assign the signal directly
  
  ngOnInit() {

  }
  
  navigateToDay(dayIndex: number): void {
    this.nutritionService.navigateToDay(dayIndex);
  }
  
  navigateToPreviousDay(): void {
    const currentIndex = this.getCurrentDayIndex();
    if (currentIndex > 0) {
      // Stay within the same week
      this.navigateToDay(currentIndex - 1);
    } else {
      // Go to previous week (to the last day of previous week)
      this.nutritionService.goToPreviousWeek().subscribe({
        complete: () => this.navigateToDay(6), // Navigate to last day of previous week
        error: (err) => console.error('Error navigating to previous week:', err)
      });
    }
  }
  
  navigateToNextDay(): void {
    const currentIndex = this.getCurrentDayIndex();
    if (currentIndex < 6) {
      // Stay within the same week
      this.navigateToDay(currentIndex + 1);
    } else {
      // Go to next week (to the first day of next week)
      this.nutritionService.goToNextWeek().subscribe({
        complete: () => this.navigateToDay(0), // Navigate to first day of next week
        error: (err) => console.error('Error navigating to next week:', err)
      });
    }
  }
  
  onDateSelected(event: any): void {
    const selectedDate = new Date(event.value);
    console.log('Date selected:', selectedDate);
    
    // Show loading state if needed
    // this.isLoading = true;
    
    // Navigate to the selected date
    this.navigateToSelectedDate(selectedDate);
  }
  
  navigateToSelectedDate(date: Date): void {
    console.log('Day navigator - Navigating to selected date:', date);
    
    // Navigate to the week containing the selected date
    // The NutritionService will handle finding the correct day index
    this.nutritionService.navigateToWeekContaining(date);
  }
  
  private getTodayIndex(): number {
    const days = this.getAllDays();
    const today = new Date();
    
    // Find today's index
    const todayIndex = days.findIndex(day => this.isToday(new Date(day.date)));
    return todayIndex !== -1 ? todayIndex : 0; // Default to first day if not found
  }
  
  private isSameDay(date1: Date, date2: Date): boolean {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear() && 
           d1.getMonth() === d2.getMonth() && 
           d1.getDate() === d2.getDate();
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
    
    // Check if we have data from the dragged item and it's a valid FoodItem
    if (event.item?.data && this.isValidFoodItem(event.item.data)) {
      const foodItem = event.item.data as FoodItem;
      console.log('Food dropped on day', dayIndex, foodItem);
      
      // Get the current day for comparison
      const currentDate = this.nutritionService.getCurrentDay().date;
      
      // Get the target day's date
      const targetDay = this.nutritionService.getAllDays()[dayIndex];
      const targetDate = new Date(targetDay.date);
      
      // Check if the target day is different from the current day
      if (!this.isSameDay(currentDate, targetDate)) {
        // If dropping on a different day, directly show the move/copy dialog
        const moveOrCopyDialogRef = this.dialog.open(FoodMoveCopyDialogComponent, {
          width: '450px',
          maxWidth: '95vw',
          data: {
            foodName: foodItem.name,
            fromDate: new Date(currentDate),
            toDate: targetDate
          }
        });
        
        moveOrCopyDialogRef.afterClosed().subscribe(action => {
          if (action === 'move' || action === 'copy') {
            // Move or copy operation
            console.log(`Day navigator - User chose to ${action} the food`);
            
            // Extract quantity and serving size from the original food item
            let quantity = 1;
            let servingSize = 100;
            
            if (foodItem.servingSize) {
              const servingSizeMatch = foodItem.servingSize.match(/^(\d+(?:\.\d+)?)\s*x\s*(\d+)g$/);
              if (servingSizeMatch) {
                quantity = parseFloat(servingSizeMatch[1]);
                servingSize = parseInt(servingSizeMatch[2], 10);
              }
            }
            
            // Create a base food item with standardized values
            const baseFood: FoodItem = {
              ...foodItem,
              // Create a new ID to avoid conflicts
              id: Date.now(),
              calories: foodItem.calories / (quantity * (servingSize / 100)),
              protein: foodItem.protein / (quantity * (servingSize / 100)),
              carbs: foodItem.carbs / (quantity * (servingSize / 100)),
              fat: foodItem.fat / (quantity * (servingSize / 100)),
              servingSize: '100g' // Reset to standard serving
            };
            
            // Open food quantity dialog with the target date
            const dialogRef = this.dialog.open(FoodQuantityDialogComponent, {
              width: '400px',
              data: { 
                food: baseFood,
                initialQuantity: quantity,
                initialServingSize: servingSize,
                targetDate: targetDate
              }
            });
            
            // When dialog closes, add the food if user confirmed
            dialogRef.afterClosed().subscribe(result => {
              if (result) {
                // If it's a move operation, remove from the original day
                if (action === 'move') {
                  const foodIdToDelete = foodItem.id?.toString();
                  if (foodIdToDelete) {
                    this.nutritionService.deleteFoodItem(foodIdToDelete);
                  } else {
                    console.error("Food item ID missing for delete during move operation:", foodItem);
                  }
                }
                
                // Navigate to the target date then add food
                this.nutritionService.navigateToWeekContaining(targetDate).subscribe({
                  complete: () => {
                    this.nutritionService.addFoodItem(result.food);
                  },
                  error: (err) => console.error('Error navigating or adding food during drop:', err)
                });
              }
            });
          }
          // If canceled, do nothing
        });
      } else {
        // If dropping on the same day, just show the quantity dialog
        
        // Extract quantity and serving size from the original food item
        let quantity = 1;
        let servingSize = 100;
        
        if (foodItem.servingSize) {
          const servingSizeMatch = foodItem.servingSize.match(/^(\d+(?:\.\d+)?)\s*x\s*(\d+)g$/);
          if (servingSizeMatch) {
            quantity = parseFloat(servingSizeMatch[1]);
            servingSize = parseInt(servingSizeMatch[2], 10);
          }
        }
        
        // Create a base food item with standardized values
        const baseFood: FoodItem = {
          ...foodItem,
          // Create a new ID to avoid conflicts
          id: Date.now(),
          calories: foodItem.calories / (quantity * (servingSize / 100)),
          protein: foodItem.protein / (quantity * (servingSize / 100)),
          carbs: foodItem.carbs / (quantity * (servingSize / 100)),
          fat: foodItem.fat / (quantity * (servingSize / 100)),
          servingSize: '100g' // Reset to standard serving
        };
        
        // Open food quantity dialog
        const dialogRef = this.dialog.open(FoodQuantityDialogComponent, {
          width: '400px',
          data: { 
            food: baseFood,
            initialQuantity: quantity,
            initialServingSize: servingSize,
            targetDate: targetDate
          }
        });
        
        // When dialog closes, add the food if user confirmed
        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            this.nutritionService.addFoodItem(result.food);
          }
        });
      }
    } else {
      console.error('Invalid or missing food item data in the dragged item', event);
    }
  }
  
  // Helper method to validate if the dragged data is a valid FoodItem
  private isValidFoodItem(data: any): boolean {
    return data &&
      typeof data === 'object' &&
      'name' in data &&
      'calories' in data && typeof data.calories === 'number' &&
      'protein' in data && typeof data.protein === 'number' &&
      'carbs' in data && typeof data.carbs === 'number' &&
      'fat' in data && typeof data.fat === 'number';
  }
} 