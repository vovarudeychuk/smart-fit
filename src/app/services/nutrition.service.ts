import { Injectable, inject, signal, computed } from '@angular/core';
import { FoodItem } from '../models/food-item.model';
import { DailyNutrition } from '../models/daily-nutrition.model';
import { ApiService } from './api.service';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap, finalize } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NutritionService {
  private apiService = inject(ApiService);
  
  // User goals (could be moved to user settings in a real app)
  private calorieGoal = 2000;
  private proteinGoal = 150; // grams
  private carbsGoal = 200;   // grams
  private fatGoal = 65;      // grams

  // Mock food database
  private foodDatabase: FoodItem[] = [
    { id: 1, name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, servingSize: '100g' },
    { id: 2, name: 'Brown Rice', calories: 112, protein: 2.6, carbs: 23.5, fat: 0.9, servingSize: '100g' },
  ];

  // Generate dates for the current week
  private currentDate = new Date();
  private weekDates = this.generateWeekDates();

  // Create signals for reactive state
  private currentDayIndex = signal<number>(0);
  private weeklyNutrition = signal<DailyNutrition[]>(this.createEmptyWeekData());
  private isLoadingWeeklyData = signal<boolean>(false);
  
  // Expose loading state as readonly
  isLoadingWeek = this.isLoadingWeeklyData.asReadonly();
  
  // Selected day state
  private _selectedDay = signal<{ date: Date, foodItems: FoodItem[] }>({
    date: new Date(),
    foodItems: []
  });
  
  // Expose as readonly signal
  selectedDay = this._selectedDay.asReadonly();
  
  // Nutrition goals state
  private nutritionGoals = signal<{
    calorieGoal: number;
    proteinGoal: number;
    carbsGoal: number;
    fatGoal: number;
  }>({
    calorieGoal: 2000,
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

  // Add the missing foodCache property
  private foodCache = new Map<string, FoodItem[]>();

  constructor() {  
    // Load weekly nutrition data from API first
    this.loadWeeklyNutrition();
    
    // After data is loaded, navigate to today
    this.navigateToDay(this.currentDate.getDay())
    
    // Load initial goals from API
    this.loadNutritionGoals();
    
    // Load today's data
    this.loadDailyData(new Date());
  }

  private generateWeekDates(): Date[] {
    const dates: Date[] = [];
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    // Generate dates for Sun-Sat containing the current date
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - dayOfWeek + i);
      dates.push(date);
    }
    
    return dates;
  }

  private generateMockWeekData(): DailyNutrition[] {
    return this.weekDates.map(date => {
      // Generate random food items for each day
      const randomFoodItems = this.getRandomFoodItems(Math.floor(Math.random() * 4) + 1);
      
      // Calculate totals with proper type annotations
      const totalCalories = randomFoodItems.reduce((sum: number, item: FoodItem) => sum + item.calories, 0);
      const totalProtein = randomFoodItems.reduce((sum: number, item: FoodItem) => sum + item.protein, 0);
      const totalCarbs = randomFoodItems.reduce((sum: number, item: FoodItem) => sum + item.carbs, 0);
      const totalFat = randomFoodItems.reduce((sum: number, item: FoodItem) => sum + item.fat, 0);
      
      return {
        date: date,
        foodItems: randomFoodItems,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat
      };
    });
  }

  // Add the missing getRandomFoodItems method
  private getRandomFoodItems(count: number): FoodItem[] {
    const items: FoodItem[] = [];
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * this.foodDatabase.length);
      items.push(this.foodDatabase[randomIndex]);
    }
    return items;
  }

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

  getCalorieGoal() {
    return this.calorieGoal;
  }

  getProteinGoal() {
    return this.proteinGoal;
  }

  getCarbsGoal() {
    return this.carbsGoal;
  }

  getFatGoal() {
    return this.fatGoal;
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
    
    // Send to the server
    this.apiService.addFoodToDay(dayIndex, foodItem).pipe(
      tap(response => {
        console.log('Food item added on server:', response);
      }),
      catchError(error => {
        console.error('Failed to add food on server, rolling back UI update:', error);
        // Could implement rollback logic here if needed
        return of(null);
      })
    ).subscribe();
  }

  searchFoods(query: string): FoodItem[] {
    // First check cache
    if (this.foodCache.has(query)) {
      return this.foodCache.get(query) || [];
    }
    
    // If not in cache, we'll return an empty array for now
    // and update it asynchronously from the API
    this.apiService.searchFoods(query).pipe(
      tap(foods => {
        // Store in cache for future use
        this.foodCache.set(query, foods);
        
        // If search term is still the same, update the UI
        // This logic might need to be moved to components
      })
    ).subscribe();
    
    return [];
  }

  searchFoodsAsync(query: string): Observable<FoodItem[]> {
    return this.apiService.searchFoods(query).pipe(
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
    
    const foodIndex = currentDay.foodItems.findIndex(item => item.id.toString() === foodItemId);
    if (foodIndex !== -1) {
      // Create a copy of the weekly nutrition data for UI update
      const updatedNutrition = [...this.weeklyNutrition()];
      const updatedDay = { ...updatedNutrition[currentDayIndex] };
      updatedDay.foodItems = [...updatedDay.foodItems];
      updatedDay.foodItems[foodIndex] = updatedFood;
      
      this.calculateDayTotals(updatedDay);
      updatedNutrition[currentDayIndex] = updatedDay;
      
      // Update UI state
      this.weeklyNutrition.set(updatedNutrition);
      
      // Send to server
      this.apiService.updateFoodInDay(currentDayIndex, parseInt(foodItemId), updatedFood).pipe(
        tap(response => {
          console.log('Food item updated on server:', response);
        }),
        catchError(error => {
          console.error('Failed to update food on server:', error);
          return of(null);
        })
      ).subscribe();
    }
  }

  // Delete a food item
  deleteFoodItem(foodItemId: string): void {
    const currentDayIndex = this.currentDayIndex();
    const currentDay = this.weeklyNutrition()[currentDayIndex];
    
    const foodIndex = currentDay.foodItems.findIndex(item => item.id.toString() === foodItemId);
    if (foodIndex !== -1) {
      // Create copies for UI update
      const updatedNutrition = [...this.weeklyNutrition()];
      const updatedDay = { ...updatedNutrition[currentDayIndex] };
      
      // Remove the food item
      updatedDay.foodItems = updatedDay.foodItems.filter(item => item.id.toString() !== foodItemId);
      
      // Recalculate totals
      this.calculateDayTotals(updatedDay);
      
      // Update the current day in the weekly nutrition
      updatedNutrition[currentDayIndex] = updatedDay;
      
      // Update UI
      this.weeklyNutrition.set(updatedNutrition);
      
      // Send to server
      this.apiService.deleteFoodFromDay(currentDayIndex, parseInt(foodItemId)).pipe(
        tap(response => {
          console.log('Food item deleted on server:', response);
        }),
        catchError(error => {
          console.error('Failed to delete food on server:', error);
          return of(null);
        })
      ).subscribe();
    }
  }

  // Add this method to the NutritionService class
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
  loadDailyData(date: Date): void {
    const dateStr = this.formatDate(date);
    
    this.apiService.getDailyNutrition(dateStr).pipe(
      tap(data => {
        this._selectedDay.set({
          date: date,
          foodItems: data.foodItems || []
        });
      }),
      catchError(error => {
        console.error('Error loading daily data:', error);
        // Reset to empty state for this day
        this._selectedDay.set({
          date: date,
          foodItems: []
        });
        return of(null);
      })
    ).subscribe();
  }
  
  // Load nutrition goals from API
  private loadNutritionGoals(): void {
    this.apiService.getNutritionGoals().pipe(
      tap(goals => {
        this.nutritionGoals.set(goals);
      }),
      catchError(error => {
        console.error('Error loading nutrition goals:', error);
        return of(null);
      })
    ).subscribe();
  }
  
  // Update nutrition goals
  updateNutritionGoals(goals: any): void {
    this.apiService.updateNutritionGoals(goals).pipe(
      tap(() => {
        this.nutritionGoals.set(goals);
      }),
      catchError(error => {
        console.error('Error updating nutrition goals:', error);
        return of(null);
      })
    ).subscribe();
  }
  
  // Helper to format date as YYYY-MM-DD
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  // Handle food item move (for drag and drop)
  handleFoodMove(event: { foodItemId: number, sourceDayIndex: number, targetDayIndex: number }): void {
    const { foodItemId, sourceDayIndex, targetDayIndex } = event;
    
    // Find the food item in the source day
    const sourceDay = this.weeklyNutrition()[sourceDayIndex];
    const foodItemIndex = sourceDay.foodItems.findIndex(item => item.id === foodItemId);
    
    if (foodItemIndex === -1) {
      console.error('Food item not found in source day');
      return;
    }
    
    // Get the food item
    const foodItem = { ...sourceDay.foodItems[foodItemIndex] };
    
    // Create updated nutrition data
    const updatedNutrition = [...this.weeklyNutrition()];
    
    // Remove from source day
    const updatedSourceDay = { ...updatedNutrition[sourceDayIndex] };
    updatedSourceDay.foodItems = updatedSourceDay.foodItems.filter(item => item.id !== foodItemId);
    this.calculateDayTotals(updatedSourceDay);
    updatedNutrition[sourceDayIndex] = updatedSourceDay;
    
    // Add to target day
    const updatedTargetDay = { ...updatedNutrition[targetDayIndex] };
    updatedTargetDay.foodItems = [...updatedTargetDay.foodItems, foodItem];
    this.calculateDayTotals(updatedTargetDay);
    updatedNutrition[targetDayIndex] = updatedTargetDay;
    
    // Update UI
    this.weeklyNutrition.set(updatedNutrition);
    
    // Send to server
    this.apiService.moveFoodBetweenDays(sourceDayIndex, targetDayIndex, foodItemId).pipe(
      tap(response => {
        console.log('Food item moved on server:', response);
      }),
      catchError(error => {
        console.error('Failed to move food on server:', error);
        return of(null);
      })
    ).subscribe();
  }

  private loadWeeklyNutrition(): void {
    this.isLoadingWeeklyData.set(true);
    
    this.apiService.getWeeklyNutrition().pipe(
      tap(weekData => {
        // Update the signal with data from API
        this.weeklyNutrition.set(weekData);
        console.log('Weekly nutrition loaded from API:', weekData);
      }),
      catchError(error => {
        console.error('Error loading weekly nutrition from API:', error);
        // Fall back to locally generated mock data
        const mockData = this.generateMockWeekData();
        this.weeklyNutrition.set(mockData);
        console.log('Using local mock data as fallback');
        return of(null);
      }),
      finalize(() => {
        this.isLoadingWeeklyData.set(false);
      })
    ).subscribe();
  }

  // Public method to refresh weekly data
  refreshWeeklyData(): void {
    this.loadWeeklyNutrition();
  }

  // Create empty week data structure
  private createEmptyWeekData(): DailyNutrition[] {
    return this.generateWeekDates().map(date => ({
      date: date,
      foodItems: [],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0
    }));
  }
} 