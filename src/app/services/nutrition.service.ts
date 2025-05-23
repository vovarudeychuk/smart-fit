import { Injectable, inject, signal, computed } from '@angular/core';
import { FoodItem } from '../models/food-item.model';
import { DailyNutrition } from '../models/daily-nutrition.model';
// ApiService removed
import { FirebaseDataService } from './firebase-data.service'; // Added
import { Observable, of } from 'rxjs'; // BehaviorSubject, map, finalize removed for now
import { catchError, tap } from 'rxjs/operators'; // map, finalize removed for now
import { addWeeks, subWeeks, startOfWeek, endOfWeek, format, isSameWeek, addDays, getDay } from 'date-fns';
import { AuthService } from './auth.service';
import { NutritionGoals } from '../models/nutrition-goals.model'; // Added for type safety

@Injectable({
  providedIn: 'root'
})
export class NutritionService {
  // private apiService = inject(ApiService); // Removed
  private firebaseDataService = inject(FirebaseDataService); // Added
  private authService = inject(AuthService);

  // User goals are now managed by the nutritionGoals signal, loaded from FirebaseDataService
  // private calorieGoal = 2000; // Removed
  // private proteinGoal = 150; // Removed
  // private carbsGoal = 200;   // Removed
  // private fatGoal = 65;      // Removed

  // Mock food database removed
  // private foodDatabase: FoodItem[] = [ ... ]; // Removed

  // Obsolete properties - confirmed unused and removing:
  // private currentDate = new Date(); 
  // private weekDates = this.generateWeekDates(); 
  // private today = new Date(); 
  
  // More accurate today index calculation
  private getTodayIndex(): number {
    const today = new Date();
    // Assuming week starts on Monday for consistency with date-fns startOfWeek default or explicit options
    const dayOfWeek = getDay(today); // date-fns getDay: 0 for Sunday, 1 for Monday, ..., 6 for Saturday
    return dayOfWeek === 0 ? 6 : dayOfWeek -1; // Monday is 0, Sunday is 6
  }
  
  // Set the initial day index to today's day of the week
  private currentDayIndex = signal<number>(this.getTodayIndex());
  private weeklyNutrition = signal<DailyNutrition[]>([]);
  private isLoadingWeeklyData = signal<boolean>(false);
  
  // Store nutrition data for multiple weeks
  private nutritionDataByWeek = new Map<string, DailyNutrition[]>();
  
  // Expose loading state as readonly
  isLoadingWeek = this.isLoadingWeeklyData.asReadonly();
  
  // Selected day state
  private _selectedDay = signal<DailyNutrition>({ // Changed to DailyNutrition type
    date: new Date(),
    foodItems: [],
    totalCalories: 0, // Added default totals
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0
  });
  
  // Expose as readonly signal
  selectedDay = this._selectedDay.asReadonly();
  
  // Nutrition goals state - type updated to NutritionGoals
  private nutritionGoals = signal<NutritionGoals>({
    calorieGoal: 2000, // Default values
    proteinGoal: 150,
    carbsGoal: 200,
    fatGoal: 65
  });
  
  // Computed nutrition totals for selected day
  totals = computed(() => {
    const foods = this.selectedDay().foodItems;
    return {
      calories: foods.reduce((sum, food) => sum + food.calories, 0),
      protein: foods.reduce((sum, food) => sum + food.protein, 0),
      carbs: foods.reduce((sum, food) => sum + food.carbs, 0),
      fat: foods.reduce((sum, food) => sum + food.fat, 0)
    };
  });

  // foodCache removed as searchFoodsAsync now directly uses FirebaseDataService
  // private foodCache = new Map<string, FoodItem[]>(); // Confirmed removed

  // Add this property to track current week date
  private currentWeekDate = signal<Date>(new Date());

  // Expose as readonly
  selectedWeekDate = this.currentWeekDate.asReadonly();

  // Computed signals for week range (for display purposes)
  weekStartDate = computed(() => startOfWeek(this.currentWeekDate()));
  weekEndDate = computed(() => endOfWeek(this.currentWeekDate()));
  weekDateRange = computed(() => {
    return {
      start: format(this.weekStartDate(), 'MMM d, yyyy'),
      end: format(this.weekEndDate(), 'MMM d, yyyy')
    };
  });

  constructor() {  
    // Subscribe to user changes
    this.authService.userChanged.subscribe(user => {
      // console.log('User changed, clearing nutrition cache'); // Keep for debugging if needed, or remove
      this.clearCacheAndRefresh();
    });
    
    // Debug logs can be removed or commented out for production
    // const todayIndex = this.getTodayIndex();
    // const today = new Date();
    // console.log('Today:', today.toDateString());
    // console.log('Day of week (0=Sunday):', today.getDay());
    // console.log('Calculated index for today:', todayIndex);
    
    // const weekStart = startOfWeek(today, { weekStartsOn: 1 }); 
    // console.log('Week starts on:', weekStart.toDateString());
    // for (let i = 0; i < 7; i++) {
    //   const date = addDays(weekStart, i);
    //   console.log(`Day ${i}:`, date.toDateString());
    // }
    
    // Load weekly nutrition data first
    this.clearCacheAndRefresh(); // This calls loadWeeklyNutrition
    
    // After data is loaded, navigate to today using the correct index
    // This timeout might still be needed if loadWeeklyNutrition is fully async
    // and doesn't immediately populate weeklyNutrition for navigateToDay to work.
    // However, if loadWeeklyNutrition updates signals that navigateToDay depends on,
    // Angular's reactivity might handle it. For now, keep the timeout.
    setTimeout(() => {
      this.navigateToDay(this.getTodayIndex()); 
      // Also load selected day's data, which should be today
      const todayDate = new Date();
      this.loadDailyData(todayDate); 
    }, 300); // Slightly increased timeout just in case
    
    // Load initial goals
    this.loadNutritionGoals();
  }

  // private generateWeekDates(): Date[] { // Removed as unused - confirmed
  // }

  // private generateMockWeekData(): DailyNutrition[] { // Removed as using Firebase - confirmed
  // }

  // private getRandomFoodItems(count: number): FoodItem[] { // Removed
  // }

  // Public methods
  getCurrentDay() {
    // Add safety check to prevent undefined access
    const weekData = this.weeklyNutrition();
    if (weekData.length === 0) {
      return {
        date: new Date(),
        foodItems: [],
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0
      };
    }
    return weekData[this.currentDayIndex()];
  }

  getCurrentDayIndex() {
    return this.currentDayIndex();
  }

  getWeeklyNutrition() {
    return this.weeklyNutrition;
  }

  // Getter methods for goals now use the signal
  getCalorieGoal() {
    return this.nutritionGoals().calorieGoal;
  }

  getProteinGoal() {
    return this.nutritionGoals().proteinGoal;
  }

  getCarbsGoal() {
    return this.nutritionGoals().carbsGoal;
  }

  getFatGoal() {
    return this.nutritionGoals().fatGoal;
  }

  // Expose nutritionGoals signal directly if preferred by components
  getNutritionGoalsSignal() {
    return this.nutritionGoals.asReadonly();
  }

  navigateToNextDay() {
    if (this.currentDayIndex() < 6) {
      this.currentDayIndex.update(val => val + 1);
    }
  }

  navigateToPreviousDay() {
    if (this.currentDayIndex() > 0) {
      this.currentDayIndex.update(val => val - 1);
    }
  }

  addFoodItem(foodItem: FoodItem) {
    const dayIndex = this.currentDayIndex();
    
    // Optimistically update the UI
    const updatedNutrition = [...this.weeklyNutrition()];
    updatedNutrition[dayIndex] = {
      ...updatedNutrition[dayIndex],
      foodItems: [...updatedNutrition[dayIndex].foodItems, foodItem],
      totalCalories: updatedNutrition[dayIndex].totalCalories + foodItem.calories,
      totalProtein: updatedNutrition[dayIndex].totalProtein + foodItem.protein,
      totalCarbs: updatedNutrition[dayIndex].totalCarbs + foodItem.carbs,
      totalFat: updatedNutrition[dayIndex].totalFat + foodItem.fat
    };
    
    this.weeklyNutrition.set(updatedNutrition);
    
    // Store the updated data for this week - This seems to be local cache logic, will revisit
    // this.saveCurrentWeekData(); // Firebase will be the source of truth.
    
    // Get the current week start date for API call
    const dayData = this.weeklyNutrition()[dayIndex];
    if (!dayData || !dayData.date) {
        console.error("Cannot add food item: day data or date is missing.");
        return;
    }
    const dateStr = this.formatDate(new Date(dayData.date));
    
    // Send to the server
    this.firebaseDataService.addFoodToDay(dateStr, foodItem).then(response => { // Assuming addFoodToDay is async
      console.log('Food item added on server:', response);
      // Optionally, can re-fetch data for the day or week to confirm, or trust optimistic update.
      // For now, we trust optimistic update.
    }).catch(error => {
      console.error('Failed to add food on server, rolling back UI update:', error);
      // TODO: Implement rollback logic here if needed
      // This would involve removing the item from the local weeklyNutrition signal
      // and recalculating totals.
    });
  }

  // searchFoods (synchronous) removed

  searchFoodsAsync(query: string): Observable<FoodItem[]> {
    // foodCache logic can be removed if FirebaseDataService.searchFoods is efficient enough
    // or if caching is handled at a lower level or deemed unnecessary for now.
    // For simplicity, removing foodCache here.
    return this.firebaseDataService.searchFoods(query).pipe(
      tap(foods => {
        console.log(`Found ${foods.length} foods matching "${query}"`);
      }),
      catchError(error => {
        console.error('Error searching foods:', error);
        // Return an empty array if there's an error
        return of([]);
      })
    );
  }

  // Update an existing food item
  updateFoodItem(foodItemId: string, updatedFood: FoodItem): void {
    const currentDayIndex = this.currentDayIndex();
    const currentDay = this.weeklyNutrition()[currentDayIndex];
    
    // Find the food with either id or _id
    const foodIndex = currentDay.foodItems.findIndex(item => item.id === foodItemId); // id is now string
    
    if (foodIndex !== -1) {
      // const originalFood = currentDay.foodItems[foodIndex]; // No longer needed for _id
      // const serverFoodId = foodItemId; // foodItemId is already the string ID
      
      // Update UI first
      const updatedNutrition = [...this.weeklyNutrition()];
      const updatedDay = { ...updatedNutrition[currentDayIndex] };
      updatedDay.foodItems = [...updatedDay.foodItems];
      updatedDay.foodItems[foodIndex] = updatedFood;
      
      this.calculateDayTotals(updatedDay);
      updatedNutrition[currentDayIndex] = updatedDay;
      this.weeklyNutrition.set(updatedNutrition);
      
      // Get the current week start date for API call
      const dayData = updatedNutrition[currentDayIndex];
      if (!dayData || !dayData.date) {
          console.error("Cannot update food item: day data or date is missing.");
          return;
      }
      const dateStr = this.formatDate(new Date(dayData.date));
      
      // Send to server
      this.firebaseDataService.updateFoodInDay(
        dateStr, 
        foodItemId, // foodItemId is already string
        updatedFood
      ).then(() => {
        console.log('Food item updated on server');
      }).catch(error => {
        console.error('Failed to update food on server:', error);
        // TODO: Implement rollback logic
      });
    }
  }

  // Delete a food item
  deleteFoodItem(foodItemId: string): void { // foodItemId is string
    const currentDayIndex = this.currentDayIndex();
    const currentDay = this.weeklyNutrition()[currentDayIndex];
    
    const foodIndex = currentDay.foodItems.findIndex(item => item.id === foodItemId); // id is string
    if (foodIndex !== -1) {
      // Create copies for UI update
      const updatedNutrition = [...this.weeklyNutrition()];
      const updatedDay = { ...updatedNutrition[currentDayIndex] };
      
      // Remove the food item
      updatedDay.foodItems = updatedDay.foodItems.filter(item => item.id !== foodItemId); // id is string, _id removed
      
      // Recalculate totals
      this.calculateDayTotals(updatedDay);
      
      // Update the current day in the weekly nutrition
      updatedNutrition[currentDayIndex] = updatedDay;
      
      // Update UI
      this.weeklyNutrition.set(updatedNutrition);
      
      // Get the current week start date for API call
      const dayData = updatedNutrition[currentDayIndex];
      if (!dayData || !dayData.date) {
          console.error("Cannot delete food item: day data or date is missing.");
          return;
      }
      const dateStr = this.formatDate(new Date(dayData.date));
      
      // Send to server
      this.firebaseDataService.deleteFoodFromDay(dateStr, foodItemId).then(() => {
        console.log('Food item deleted on server');
      }).catch(error => {
        console.error('Failed to delete food on server:', error);
        // TODO: Implement rollback logic
      });
    }
  }

  // Add this method to the NutritionService class 
  // This method is fine as it's internal logic
  private calculateDayTotals(day: DailyNutrition): void {
    day.totalCalories = day.foodItems.reduce((sum, item) => sum + item.calories, 0);
    day.totalProtein = day.foodItems.reduce((sum, item) => sum + item.protein, 0);
    day.totalCarbs = day.foodItems.reduce((sum, item) => sum + item.carbs, 0);
    day.totalFat = day.foodItems.reduce((sum, item) => sum + item.fat, 0);
  }

  navigateToDay(dayIndex: number): void {
    if (dayIndex >= 0 && dayIndex < this.weeklyNutrition().length) {
      this.currentDayIndex.set(dayIndex);
    }
  }

  getAllDays(): DailyNutrition[] {
    return this.weeklyNutrition();
  }

  // Add this method to your NutritionService class
  reorderFoodItems(reorderedItems: FoodItem[]): void {
    const updatedNutrition = [...this.weeklyNutrition()];
    const dayIndex = this.currentDayIndex();
    
    // Update the food items array with the new order
    updatedNutrition[dayIndex] = {
      ...updatedNutrition[dayIndex],
      foodItems: reorderedItems
    };
    
    // Update the state
    this.weeklyNutrition.set(updatedNutrition);
  }

  // Load data for a specific date
  loadDailyData(date: Date): void { // date is Date object
    const dateStr = this.formatDate(date); // Convert to YYYY-MM-DD string
    
    this.firebaseDataService.getDailyNutrition(dateStr).pipe(
      tap(data => {
        if (data) {
          this._selectedDay.set({
            ...data,
            date: new Date(data.date), // Ensure date is a Date object
            foodItems: data.foodItems || []
          });
        } else {
          // If no data, set to an empty state for that date
          this._selectedDay.set({
            date: date, // Keep the selected date
            foodItems: [],
            totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0
          });
        }
      }),
      catchError(error => {
        console.error('Error loading daily data:', error);
        this._selectedDay.set({ // Reset to empty state on error
          date: date,
          foodItems: [],
          totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0
        });
        return of(null);
      })
    ).subscribe();
  }
  
  // Load nutrition goals from FirebaseDataService
  private loadNutritionGoals(): void {
    this.firebaseDataService.getNutritionGoals().pipe(
      tap(goals => {
        if (goals) {
          this.nutritionGoals.set(goals);
        } else {
          // Set to default if no goals found or error
          this.nutritionGoals.set({ calorieGoal: 2000, proteinGoal: 150, carbsGoal: 200, fatGoal: 65 });
        }
      }),
      catchError(error => {
        console.error('Error loading nutrition goals:', error);
        // Fallback to default goals on error
        this.nutritionGoals.set({ calorieGoal: 2000, proteinGoal: 150, carbsGoal: 200, fatGoal: 65 });
        return of(null);
      })
    ).subscribe();
  }
  
  // Update nutrition goals using FirebaseDataService
  updateNutritionGoals(goals: NutritionGoals): void { // Type to NutritionGoals
    this.firebaseDataService.updateNutritionGoals(goals).then(() => {
      this.nutritionGoals.set(goals); // Optimistic update or re-fetch
      console.log('Nutrition goals updated successfully.');
    }).catch(error => {
      console.error('Error updating nutrition goals:', error);
      // Optionally handle UI rollback or error message
    });
  }
  
  // Helper to format date as YYYY-MM-DD - This is fine
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  // Handle food item move (for drag and drop)
  handleFoodMove(event: { foodItemId: string, sourceDayIndex: number, targetDayIndex: number }): void {
    const { foodItemId, sourceDayIndex, targetDayIndex } = event;
    
    const weeklyData = this.weeklyNutrition();
    const sourceDay = weeklyData[sourceDayIndex];

    if (!sourceDay || !sourceDay.date) {
      console.error('Source day data or date is missing for food move.');
      return;
    }

    const foodItemToMove = sourceDay.foodItems.find(item => item.id === foodItemId);

    if (!foodItemToMove) {
      console.error(`Food item with ID ${foodItemId} not found in source day.`);
      return;
    }
    
    // Create a deep copy of the food item to avoid issues with object references
    const foodItemCopy = { ...foodItemToMove };

    // Create updated nutrition data
    const updatedNutrition = [...weeklyData];
    
    // Remove from source day
    const updatedSourceDay = { ...updatedNutrition[sourceDayIndex] };
    updatedSourceDay.foodItems = updatedSourceDay.foodItems.filter(item => item.id !== foodItemId);
    this.calculateDayTotals(updatedSourceDay);
    updatedNutrition[sourceDayIndex] = updatedSourceDay;
    
    // Add to target day
    const updatedTargetDay = { ...updatedNutrition[targetDayIndex] };
    // Corrected to use foodItemCopy, which is a defined variable holding the item to move.
    updatedTargetDay.foodItems = [...updatedTargetDay.foodItems, foodItemCopy]; 
    this.calculateDayTotals(updatedTargetDay);
    updatedNutrition[targetDayIndex] = updatedTargetDay;
    
    // Update UI
    this.weeklyNutrition.set(updatedNutrition);
    
    // Get the current week start date for API call
    const targetDay = weeklyData[targetDayIndex];
    if (!targetDay || !targetDay.date) {
        console.error('Target day data or date is missing for food move.');
        return;
    }
    const sourceDateStr = this.formatDate(new Date(sourceDay.date));
    const targetDateStr = this.formatDate(new Date(targetDay.date));
    
    // Send to server
    // Ensure foodItemCopy is not undefined before passing
    this.firebaseDataService.moveFoodBetweenDays(sourceDateStr, targetDateStr, foodItemId, foodItemCopy).then(() => {
      // console.log('Food item moved on server'); // Keep for debugging or remove
    }).catch(error => {
      console.error('Failed to move food on server:', error);
      // TODO: Implement rollback for UI
    });
  }

  private loadWeeklyNutrition(): void {
    this.isLoadingWeeklyData.set(true);
    const currentWkDate = this.currentWeekDate();
    const weekKey = this.getWeekKey(currentWkDate);

    if (this.nutritionDataByWeek.has(weekKey)) {
      this.weeklyNutrition.set(this.nutritionDataByWeek.get(weekKey)!);
      this.isLoadingWeeklyData.set(false); // Ensure loading state is reset
      return;
    }

    const sDate = startOfWeek(currentWkDate, { weekStartsOn: 1 }); 
    const eDate = endOfWeek(currentWkDate, { weekStartsOn: 1 }); 
    const startDateStr = this.formatDate(sDate); 
    const endDateStr = this.formatDate(eDate);

    this.firebaseDataService.getWeeklyNutrition(startDateStr, endDateStr).pipe(
      tap(firebaseWeekData => {
        // console.log('Weekly nutrition loaded from FirebaseDataService:', firebaseWeekData); // Keep for debugging or remove
        
        const validFirebaseWeekData = Array.isArray(firebaseWeekData) ? firebaseWeekData : [];

        // Create a map of existing data by date string for efficient lookup
        const existingDataMap = new Map<string, DailyNutrition>();
        validFirebaseWeekData.forEach(day => {
          // Ensure day.date is correctly formatted as string for key, or convert if it's Timestamp/Date
          let dateKey: string;
          if (typeof day.date === 'string') {
            dateKey = day.date;
          } else if (day.date instanceof Date) {
            dateKey = this.formatDate(day.date);
          } else if (day.date && typeof (day.date as any).toDate === 'function') { // Firestore Timestamp
            dateKey = this.formatDate((day.date as any).toDate());
          } else {
            console.warn('Invalid date format in weekly data:', day);
            return; // Skip this entry
          }
          existingDataMap.set(dateKey, { ...day, date: new Date(dateKey) }); // Store with Date object
        });

        // Create a full week array (7 days), using existing data or empty days
        const completeWeekData = this.createEmptyWeekData(sDate); // sDate is start of week
        const processedWeekData = completeWeekData.map(emptyDay => {
          const dateKey = this.formatDate(emptyDay.date);
          return existingDataMap.get(dateKey) || emptyDay;
        });
        
        this.weeklyNutrition.set(processedWeekData);
        this.nutritionDataByWeek.set(weekKey, processedWeekData); // Cache it
      }),
      catchError(error => {
        console.error('Error loading weekly nutrition data:', error);
        const emptyWeek = this.createEmptyWeekData(sDate);
        this.weeklyNutrition.set(emptyWeek);
        this.nutritionDataByWeek.set(weekKey, emptyWeek); // Cache empty week on error
        return of([]); // Return empty array or handle as appropriate
      }),
      // finalize removed for now, as isLoadingWeeklyData.set(false) is in multiple places
    ).subscribe(() => {
        this.isLoadingWeeklyData.set(false); // Set to false after subscribe completes (success or error handled by catchError)
    });
  }

  // Public method to refresh weekly data - This seems fine.
  refreshWeeklyData(): void {
    this.loadWeeklyNutrition();
  }

  // Create empty week data structure starting from a specific date
  private createEmptyWeekData(weekStartDate: Date): DailyNutrition[] {
    // weekStartDate is already the start of the week
    return Array(7).fill(null).map((_, index) => {
      const date = addDays(weekStartDate, index); 
      return {
        date: date,
        foodItems: [],
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0
      };
    });
  }

  // Navigation methods
  goToPreviousWeek() {
    // Save current week data before navigating
    this.saveCurrentWeekData();
    
    const prevWeek = subWeeks(this.currentWeekDate(), 1);
    this.currentWeekDate.set(prevWeek);
    this.loadWeeklyNutrition();
  }

  goToNextWeek() {
    // Save current week data before navigating
    this.saveCurrentWeekData();
    
    const nextWeek = addWeeks(this.currentWeekDate(), 1);
    this.currentWeekDate.set(nextWeek);
    this.loadWeeklyNutrition();
  }

  goToCurrentWeek() {
    this.currentWeekDate.set(new Date());
    this.loadWeeklyNutrition();
  }

  // Store the current week's data in our local cache
  private saveCurrentWeekData(): void {
    const weekKey = this.getWeekKey(this.currentWeekDate());
    this.nutritionDataByWeek.set(weekKey, this.weeklyNutrition());
  }

  clearCache(): void {
    this.nutritionDataByWeek.clear();
    // console.log('Nutrition cache cleared'); // Keep for debugging or remove
  }
  
  // Get a unique key for a week based on its start date
  private getWeekKey(date: Date): string {
    // Ensure week starts on Monday for key consistency
    const weekStart = startOfWeek(date, { weekStartsOn: 1 }); 
    const userId = this.authService.currentUser()?.uid || 'default_guest'; // Handle potential null UID
    return `${userId}_${format(weekStart, 'yyyy-MM-dd')}`;
  }
  
  // Navigate to the week containing the given date - This seems fine.
  navigateToWeekContaining(date: Date): void {
    // console.log('Navigating to week containing date:', date); // Keep for debugging or remove
    
    this.saveCurrentWeekData();
    this.currentWeekDate.set(new Date(date));
    this.loadWeeklyNutrition();
    
    setTimeout(() => {
      const daysInWeek = this.getAllDays();
      const targetDayIndex = daysInWeek.findIndex(day => 
        this.isSameDay(new Date(day.date), date)
      );
      
      // console.log('Found target day index for navigateToWeekContaining:', targetDayIndex); // Keep for debugging or remove
      
      if (targetDayIndex !== -1) {
        this.navigateToDay(targetDayIndex);
      }
    }, 200); // Adjusted timeout, ensure it's sufficient for loadWeeklyNutrition to update signals
  }
  
  // Helper to check if two dates are the same day - This is fine
  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() && 
           date1.getMonth() === date2.getMonth() && 
           date1.getDate() === date2.getDate();
  }

  clearCacheAndRefresh(): void {
    // console.log('Clearing nutrition cache and refreshing data'); 
    this.nutritionDataByWeek.clear();
    this.loadWeeklyNutrition();
  }
}