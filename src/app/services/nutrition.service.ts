import { Injectable, inject, signal, computed } from '@angular/core';
import { FoodItem } from '../models/food-item.model';
import { DailyNutrition } from '../models/daily-nutrition.model';
import { Observable, of, from } from 'rxjs';
import { catchError, map, tap, finalize, switchMap } from 'rxjs/operators';
import { addWeeks, subWeeks, startOfWeek, endOfWeek, format, isSameWeek, addDays, getDay } from 'date-fns';
import { AuthService } from './auth.service';
import { Firestore, collection, doc, query, where, collectionData, docData, setDoc, updateDoc, deleteDoc, runTransaction } from '@angular/fire/firestore';

// Firestore Collection Constants
const FOODS_COLLECTION = 'foods';
const USER_GOALS_COLLECTION = 'user_nutrition_goals';
const USER_DAILY_LOGS_COLLECTION = 'user_daily_logs';

@Injectable({
  providedIn: 'root'
})
export class NutritionService {
  private firestore: Firestore = inject(Firestore);
  private authService: AuthService = inject(AuthService);

  // User goals - will be loaded from Firestore
  // private calorieGoal, proteinGoal, carbsGoal, fatGoal properties are removed.
  // Public computed signals will be used instead.

  // Generate dates for the current week
  private currentDate = new Date();
  private weekDates = this.generateWeekDates();

  // Get today's day of the week (0-6, where 0 is Sunday)
  private today = new Date();
  
  // More accurate today index calculation
  private getTodayIndex(): number {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    // Adjust based on your week start day.
    // Date.getDay() returns 0 for Sunday, 1 for Monday, ..., 6 for Saturday.
    // Our week starts on Monday (index 0) and ends on Sunday (index 6).
    return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
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
    calorieGoal: 2000, // Default
    proteinGoal: 150,  // Default
    carbsGoal: 200,    // Default
    fatGoal: 65        // Default
  });

  // Public computed signals for individual goals
  public calorieGoal = computed(() => this.nutritionGoals().calorieGoal);
  public proteinGoal = computed(() => this.nutritionGoals().proteinGoal);
  public carbsGoal = computed(() => this.nutritionGoals().carbsGoal);
  public fatGoal = computed(() => this.nutritionGoals().fatGoal);
  
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
      console.log('User changed, clearing nutrition cache');
      this.clearCacheAndRefresh();
    });
    
    // Debug today's index calculation
    const todayIndex = this.getTodayIndex();
    const today = new Date();
    console.log('Today:', today.toDateString());
    console.log('Day of week (0=Sunday):', today.getDay());
    console.log('Calculated index for today:', todayIndex);
    
    // Check what dates are in your week
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Assuming Monday is start
    console.log('Week starts on:', weekStart.toDateString());
    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i);
      console.log(`Day ${i}:`, date.toDateString());
    }
    
    // Load weekly nutrition data from API first
    this.clearCache();
    this.loadWeeklyNutrition().subscribe({ // Subscribe in constructor to load initial data
      next: () => {
        // Initial load successful, navigate to today
        const todayIndex = this.getTodayIndex();
        const currentWeekData = this.weeklyNutrition();
        if (todayIndex >= 0 && todayIndex < currentWeekData.length) {
            this.navigateToDay(todayIndex);
        } else if (currentWeekData.length > 0) {
            this.navigateToDay(0); // Fallback to first day if todayIndex is out of bounds
        }
      },
      error: err => console.error('Error during initial loadWeeklyNutrition in constructor:', err)
    });
    
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

  // Old getter methods are removed. Components will use the public signals.

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

  async addFoodItem(foodItem: FoodItem): Promise<void> {
    const currentUser = this.authService.currentUser();
    const selectedDayData = this.selectedDay(); // This is the day displayed in detail view
    
    if (!currentUser || !currentUser.uid) {
      console.error('User not logged in. Cannot add food item.');
      return;
    }
    if (!selectedDayData || !selectedDayData.date) {
      console.error('No selected day to add food item to.');
      return;
    }

    const userId = currentUser.uid;
    const dateStr = this.formatDate(selectedDayData.date); // YYYY-MM-DD
    const dailyLogDocId = `${userId}_${dateStr}`;
    const dailyLogDocRef = doc(this.firestore, `${USER_DAILY_LOGS_COLLECTION}/${dailyLogDocId}`);

    try {
      await runTransaction(this.firestore, async (transaction) => {
        const dailyLogSnap = await transaction.get(dailyLogDocRef);
        let currentFoodItems: FoodItem[] = [];
        let currentTotals = { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 };

        if (dailyLogSnap.exists()) {
          const existingData = dailyLogSnap.data() as DailyNutrition;
          currentFoodItems = existingData.foodItems || [];
          currentTotals = { // Use existing totals or recalculate if necessary
            totalCalories: existingData.totalCalories || 0,
            totalProtein: existingData.totalProtein || 0,
            totalCarbs: existingData.totalCarbs || 0,
            totalFat: existingData.totalFat || 0,
          };
        }

        // Add new food item
        // Ensure new food items have a unique ID if not already present (e.g., for client-side temporary ID)
        const newFoodItemWithId = { ...foodItem, id: foodItem.id || Date.now().toString() };
        const updatedFoodItems = [...currentFoodItems, newFoodItemWithId];
        
        // Recalculate totals
        const newTotals = this.calculateTotalsForFoodItems(updatedFoodItems);

        const dailyLogData: DailyNutrition = {
          userId: userId,
          date: dateStr,
          foodItems: updatedFoodItems,
          ...newTotals
        };

        transaction.set(dailyLogDocRef, dailyLogData, { merge: !dailyLogSnap.exists() }); // merge if exists, otherwise set
      });

      console.log('Food item added/updated in Firestore successfully.');
      // After successful Firestore update, refresh local state for the selected day and potentially the week view
      this.loadDailyData(selectedDayData.date); // Refresh _selectedDay
      this.refreshWeeklyData(); // This will re-fetch the week's data, including the updated day
      
    } catch (error) {
      console.error('Error adding food item to Firestore:', error);
      // Handle error (e.g., show a notification to the user)
    }
  }

  private calculateTotalsForFoodItems(foodItems: FoodItem[]): { totalCalories: number, totalProtein: number, totalCarbs: number, totalFat: number } {
    return {
      totalCalories: foodItems.reduce((sum, item) => sum + item.calories, 0),
      totalProtein: foodItems.reduce((sum, item) => sum + item.protein, 0),
      totalCarbs: foodItems.reduce((sum, item) => sum + item.carbs, 0),
      totalFat: foodItems.reduce((sum, item) => sum + item.fat, 0)
    };
  }

  searchFoodsAsync(queryText: string): Observable<FoodItem[]> {
    if (!queryText || queryText.trim() === '') {
      return of([]);
    }
    const foodsCollection = collection(this.firestore, FOODS_COLLECTION);
    // Simple "starts with" like search. Case-sensitive by default in Firestore.
    // For case-insensitive, you'd typically store a lowercase version of the name.
    const q = query(foodsCollection, 
                    where('name', '>=', queryText), 
                    where('name', '<=', queryText + '\uf8ff')
                   );
    return collectionData(q, { idField: 'id' }) as Observable<FoodItem[]>;
  }

  // Update an existing food item
  async updateFoodItem(foodItemId: string, updatedFood: FoodItem): Promise<void> {
    const currentUser = this.authService.currentUser();
    const selectedDayData = this.selectedDay();

    if (!currentUser || !currentUser.uid) {
      console.error('User not logged in. Cannot update food item.');
      return;
    }
    if (!selectedDayData || !selectedDayData.date) {
      console.error('No selected day to update food item in.');
      return;
    }
    if (!foodItemId) {
      console.error('Food item ID is missing. Cannot update.');
      return;
    }

    const userId = currentUser.uid;
    const dateStr = this.formatDate(selectedDayData.date);
    const dailyLogDocId = `${userId}_${dateStr}`;
    const dailyLogDocRef = doc(this.firestore, `${USER_DAILY_LOGS_COLLECTION}/${dailyLogDocId}`);

    try {
      await runTransaction(this.firestore, async (transaction) => {
        const dailyLogSnap = await transaction.get(dailyLogDocRef);
        if (!dailyLogSnap.exists()) {
          throw new Error("Daily log document not found. Cannot update food item.");
        }

        const existingData = dailyLogSnap.data() as DailyNutrition;
        let currentFoodItems = existingData.foodItems || [];
        
        const foodIndex = currentFoodItems.findIndex(item => item.id === foodItemId || item._id === foodItemId);

        if (foodIndex === -1) {
          throw new Error("Food item not found in the daily log. Cannot update.");
        }

        // Update the specific food item
        currentFoodItems[foodIndex] = { ...currentFoodItems[foodIndex], ...updatedFood, id: foodItemId }; // Ensure ID consistency

        const newTotals = this.calculateTotalsForFoodItems(currentFoodItems);
        const dailyLogData: DailyNutrition = {
          userId: userId,
          date: dateStr,
          foodItems: currentFoodItems,
          ...newTotals
        };
        transaction.set(dailyLogDocRef, dailyLogData); // Overwrite with updated data
      });

      console.log('Food item updated in Firestore successfully.');
      this.loadDailyData(selectedDayData.date); // Refresh _selectedDay
      this.refreshWeeklyData(); // Refresh week view
    } catch (error) {
      console.error('Error updating food item in Firestore:', error);
    }
  }

  async deleteFoodItem(foodItemId: string): Promise<void> {
    const currentUser = this.authService.currentUser();
    const selectedDayData = this.selectedDay();

    if (!currentUser || !currentUser.uid) {
      console.error('User not logged in. Cannot delete food item.');
      return;
    }
    if (!selectedDayData || !selectedDayData.date) {
      console.error('No selected day to delete food item from.');
      return;
    }
    if (!foodItemId) {
      console.error('Food item ID is missing. Cannot delete.');
      return;
    }

    const userId = currentUser.uid;
    const dateStr = this.formatDate(selectedDayData.date);
    const dailyLogDocId = `${userId}_${dateStr}`;
    const dailyLogDocRef = doc(this.firestore, `${USER_DAILY_LOGS_COLLECTION}/${dailyLogDocId}`);

    try {
      await runTransaction(this.firestore, async (transaction) => {
        const dailyLogSnap = await transaction.get(dailyLogDocRef);
        if (!dailyLogSnap.exists()) {
          // If the log doesn't exist, there's nothing to delete.
          console.warn("Daily log document not found. Cannot delete food item.");
          return; 
        }

        const existingData = dailyLogSnap.data() as DailyNutrition;
        let currentFoodItems = existingData.foodItems || [];
        
        const updatedFoodItems = currentFoodItems.filter(item => item.id !== foodItemId && item._id !== foodItemId);

        if (updatedFoodItems.length === currentFoodItems.length) {
          console.warn("Food item not found in the daily log. No deletion performed.");
          // No change, so no need to update Firestore, but good to log.
          return;
        }

        const newTotals = this.calculateTotalsForFoodItems(updatedFoodItems);
        
        // If all food items are removed, consider deleting the document or leaving it with empty foodItems array.
        // For now, update with empty array.
        const dailyLogData: DailyNutrition = {
          userId: userId,
          date: dateStr,
          foodItems: updatedFoodItems,
          ...newTotals
        };
        transaction.set(dailyLogDocRef, dailyLogData);
      });

      console.log('Food item deleted from Firestore successfully.');
      this.loadDailyData(selectedDayData.date); // Refresh _selectedDay
      this.refreshWeeklyData(); // Refresh week view
    } catch (error) {
      console.error('Error deleting food item from Firestore:', error);
    }
  }

  // private calculateDayTotals(day: DailyNutrition): void { // Replaced by calculateTotalsForFoodItems or done within transactions
  //   day.totalCalories = day.foodItems.reduce((sum, item) => sum + item.calories, 0);
  //   day.totalProtein = day.foodItems.reduce((sum, item) => sum + item.protein, 0);
  //   day.totalCarbs = day.foodItems.reduce((sum, item) => sum + item.carbs, 0);
  //   day.totalFat = day.foodItems.reduce((sum, item) => sum + item.fat, 0);
  // }

  navigateToDay(dayIndex: number): void {
    // This method might need adjustment based on how weeklyNutrition is structured with Firestore data.
    // It assumes weeklyNutrition() is an array of DailyNutrition objects for the current week.
    const currentWeekData = this.weeklyNutrition();
    if (dayIndex >= 0 && dayIndex < currentWeekData.length) {
      this.currentDayIndex.set(dayIndex);
      // Also update _selectedDay to reflect the navigation within the week view
      const newSelectedDayData = currentWeekData[dayIndex];
      if (newSelectedDayData && newSelectedDayData.date) {
         this._selectedDay.set({
            date: new Date(newSelectedDayData.date), // Ensure it's a Date object
            foodItems: newSelectedDayData.foodItems || []
        });
      } else {
        // Fallback if data is somehow missing for that day index
        const fallbackDate = addDays(this.weekStartDate(), dayIndex);
        this._selectedDay.set({ date: fallbackDate, foodItems: [] });
      }
    }
  }

  getAllDays(): DailyNutrition[] {
    return this.weeklyNutrition();
  }

  // Add this method to your NutritionService class
  async reorderFoodItems(reorderedItems: FoodItem[]): Promise<void> {
    const dayIndex = this.currentDayIndex();
    const weeklyData = this.weeklyNutrition();

    if (dayIndex < 0 || dayIndex >= weeklyData.length) {
      console.error('Invalid day index for reordering food items.');
      return;
    }

    const currentDayData = weeklyData[dayIndex];
    if (!currentDayData || !currentDayData.date) {
      console.error('Current day data or date is missing for reordering.');
      return;
    }
    
    // Optimistically update UI state
    const updatedWeeklyData = [...weeklyData];
    updatedWeeklyData[dayIndex] = {
      ...currentDayData,
      foodItems: reorderedItems
    };
    this.weeklyNutrition.set(updatedWeeklyData);

    // Persist to Firestore
    const currentUser = this.authService.currentUser();
    if (!currentUser || !currentUser.uid) {
      console.error('User not logged in. Cannot save reordered food items.');
      // Optionally revert UI update here if strict consistency is required without login
      return;
    }

    const userId = currentUser.uid;
    // Ensure currentDayData.date is treated as a Date object if it's a string from Firestore
    const dateStr = this.formatDate(new Date(currentDayData.date)); 
    const dailyLogDocId = `${userId}_${dateStr}`;
    const dailyLogDocRef = doc(this.firestore, `${USER_DAILY_LOGS_COLLECTION}/${dailyLogDocId}`);

    try {
      // We only update the foodItems field. If the document doesn't exist,
      // this will fail, which is okay as reordering implies items exist.
      // If it could be that a day has items locally but not in Firestore yet (e.g. offline),
      // then setDoc with merge might be needed, but that implies creating a new log.
      // For reordering, it's assumed the log and items exist.
      await updateDoc(dailyLogDocRef, { foodItems: reorderedItems });
      console.log('Food items reordered and saved to Firestore.');
      // Refresh the selected day's data to ensure it's in sync, though UI is already updated.
      // this.loadDailyData(new Date(currentDayData.date)); // Might be redundant if UI is source of truth
    } catch (error) {
      console.error('Error saving reordered food items to Firestore:', error);
      // Revert optimistic UI update if Firestore update fails
      this.weeklyNutrition.set(weeklyData); // Revert to original weeklyData
      // Optionally, show an error to the user
    }
  }

  // Load data for a specific date from Firestore
  loadDailyData(date: Date): void {
    const currentUser = this.authService.currentUser();
    if (!currentUser || !currentUser.uid) {
      // console.warn('No user logged in, cannot load daily data.'); // Already logged in loadWeeklyNutrition
      this._selectedDay.set({ date: date, foodItems: [] });
      return;
    }
    const userId = currentUser.uid;
    const dateStr = this.formatDate(date); // YYYY-MM-DD format
    const docId = `${userId}_${dateStr}`;
    const dailyLogDocRef = doc(this.firestore, `${USER_DAILY_LOGS_COLLECTION}/${docId}`);

    docData(dailyLogDocRef).pipe(
      map((logData: any) => { // Type as DailyNutrition if structure matches
        if (logData && logData.foodItems) {
          return {
            date: date, // Keep the original Date object
            foodItems: logData.foodItems.map((item: any) => ({...item, id: item.id || item._id})) as FoodItem[] // Ensure 'id' field
          };
        } else {
          return { date: date, foodItems: [] };
        }
      }),
      tap(dayData => this._selectedDay.set(dayData)),
      catchError(error => {
        console.error('Error loading daily data from Firestore:', error);
        this._selectedDay.set({ date: date, foodItems: [] }); // Reset on error
        return of({ date: date, foodItems: [] }); // Or handle error appropriately
      })
    ).subscribe();
  }
  
  // Load nutrition goals from Firestore
  private loadNutritionGoals(): void {
    const currentUser = this.authService.currentUser();
    if (!currentUser || !currentUser.uid) {
      // console.warn('No user logged in, cannot load nutrition goals.'); // Already logged in constructor
      this.nutritionGoals.set({ calorieGoal: 2000, proteinGoal: 150, carbsGoal: 200, fatGoal: 65 }); // Default
      return;
    }
    const userId = currentUser.uid;
    const goalsDocRef = doc(this.firestore, `${USER_GOALS_COLLECTION}/${userId}`);
    
    docData(goalsDocRef).pipe(
      tap((goals: any) => {
        if (goals) {
          this.nutritionGoals.set(goals);
        } else {
          // No goals set for user, use defaults (already set in nutritionGoals signal definition)
          // Or ensure default object is set if Firestore returns null/undefined for a non-existent doc
          this.nutritionGoals.set({ calorieGoal: 2000, proteinGoal: 150, carbsGoal: 200, fatGoal: 65 });
          console.log('No nutrition goals found for user, using defaults.');
        }
      }),
      catchError(error => {
        console.error('Error loading nutrition goals from Firestore:', error);
        // Fallback to defaults in case of error (already set in nutritionGoals signal definition)
        this.nutritionGoals.set({ calorieGoal: 2000, proteinGoal: 150, carbsGoal: 200, fatGoal: 65 });
        return of(null);
      })
    ).subscribe();
  }
  
  // Update nutrition goals in Firestore
  updateNutritionGoals(goals: { calorieGoal: number; proteinGoal: number; carbsGoal: number; fatGoal: number; }): void {
    const currentUser = this.authService.currentUser();
    if (!currentUser || !currentUser.uid) {
      // console.error('No user logged in, cannot update nutrition goals.'); // Logged in constructor
      return;
    }
    const userId = currentUser.uid;
    const goalsDocRef = doc(this.firestore, `${USER_GOALS_COLLECTION}/${userId}`);
    
    from(setDoc(goalsDocRef, goals, { merge: true })).pipe(
      tap(() => {
        this.nutritionGoals.set(goals); // Only update the main signal
        // console.log('Nutrition goals updated in Firestore.');
      }),
      catchError(error => {
        console.error('Error updating nutrition goals in Firestore:', error);
        return of(null);
      })
    ).subscribe();
  }
  
  // Helper to format date as YYYY-MM-DD
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  async handleFoodMove(event: { foodItemId: string, sourceDate: Date, targetDate: Date }): Promise<void> {
    const { foodItemId, sourceDate, targetDate } = event;
    const currentUser = this.authService.currentUser();

    if (!currentUser || !currentUser.uid) {
      console.error('User not logged in. Cannot move food item.');
      return;
    }
    if (!foodItemId || !sourceDate || !targetDate) {
      console.error('Missing data for food move.');
      return;
    }
     // Prevent moving to the same day - though UI should ideally prevent this scenario
    if (this.isSameDay(sourceDate, targetDate)) {
        console.warn('Source and target dates are the same. No move operation performed.');
        return;
    }

    const userId = currentUser.uid;
    const sourceDateStr = this.formatDate(sourceDate);
    const targetDateStr = this.formatDate(targetDate);

    const sourceDocId = `${userId}_${sourceDateStr}`;
    const targetDocId = `${userId}_${targetDateStr}`;

    const sourceDocRef = doc(this.firestore, `${USER_DAILY_LOGS_COLLECTION}/${sourceDocId}`);
    const targetDocRef = doc(this.firestore, `${USER_DAILY_LOGS_COLLECTION}/${targetDocId}`);

    try {
      let foodItemToMove: FoodItem | undefined;

      await runTransaction(this.firestore, async (transaction) => {
        const sourceSnap = await transaction.get(sourceDocRef);
        const targetSnap = await transaction.get(targetDocRef);

        if (!sourceSnap.exists()) {
          // This case should ideally not happen if food item exists on sourceDate
          console.error("Source day log does not exist. Cannot move item.");
          throw new Error("Source day log does not exist.");
        }
        
        let sourceData = sourceSnap.data() as DailyNutrition;
        // Ensure foodItems is an array, default to empty if undefined or null
        let sourceFoodItems = Array.isArray(sourceData.foodItems) ? sourceData.foodItems : [];
        
        const itemIndex = sourceFoodItems.findIndex(item => (item.id === foodItemId || item._id === foodItemId));
        if (itemIndex === -1) {
          console.error("Food item not found in source day. Cannot move item.");
          throw new Error("Food item not found in source day.");
        }

        foodItemToMove = { ...sourceFoodItems[itemIndex] }; 
        sourceFoodItems.splice(itemIndex, 1); 

        const newSourceTotals = this.calculateTotalsForFoodItems(sourceFoodItems);
        transaction.set(sourceDocRef, { ...sourceData, foodItems: sourceFoodItems, ...newSourceTotals });

        let targetFoodItems: FoodItem[] = [];
        let targetData: Partial<DailyNutrition> = {};

        if (targetSnap.exists()) {
          targetData = targetSnap.data() as DailyNutrition;
          // Ensure foodItems is an array, default to empty if undefined or null
          targetFoodItems = Array.isArray(targetData.foodItems) ? targetData.foodItems : [];
        } else {
          // If target day log doesn't exist, initialize with basic structure
          targetData = { userId, date: targetDateStr };
        }
        
        targetFoodItems.push(foodItemToMove); // Add item to target
        const newTargetTotals = this.calculateTotalsForFoodItems(targetFoodItems);
        
        transaction.set(targetDocRef, { ...targetData, foodItems: targetFoodItems, ...newTargetTotals }, { merge: true });
      });

      console.log('Food item moved successfully in Firestore.');
      // Refresh data for both affected days and the current week view
      this.loadDailyData(sourceDate);
      // Only load target if it's different from source to avoid double load if something went wrong with date check
      if (!this.isSameDay(sourceDate, targetDate)) {
        this.loadDailyData(targetDate);
      }
      this.refreshWeeklyData();
    } catch (error) {
      console.error('Error moving food item:', error);
      // Potentially add user-facing error message here
    }
  }

  // Returns Observable that completes when data is loaded and signals are set.
  loadWeeklyNutrition(): Observable<void> {
    const currentUser = this.authService.currentUser();
    if (!currentUser || !currentUser.uid) {
      this.weeklyNutrition.set(this.createEmptyWeekData(this.currentWeekDate()));
      this.isLoadingWeeklyData.set(false);
      return of(undefined); // Or throwError if preferred for unauthenticated state
    }

    this.isLoadingWeeklyData.set(true);
    const userId = currentUser.uid;
    const weekViewStart = startOfWeek(this.currentWeekDate(), { weekStartsOn: 1 });
    const weekViewEnd = endOfWeek(this.currentWeekDate(), { weekStartsOn: 1 });
    const startDateStr = this.formatDate(weekViewStart);
    const endDateStr = this.formatDate(weekViewEnd);

    const logsCollectionRef = collection(this.firestore, USER_DAILY_LOGS_COLLECTION);
    const q = query(logsCollectionRef,
                    where('userId', '==', userId),
                    where('date', '>=', startDateStr),
                    where('date', '<=', endDateStr)
                  );

    return collectionData(q, { idField: 'docId' }).pipe(
      map((dailyLogsFromFirestore: DailyNutrition[]) => {
        const template = this.createEmptyWeekData(this.currentWeekDate());
        dailyLogsFromFirestore.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const weekWithData = template.map(dayInTemplate => {
          const foundLog = dailyLogsFromFirestore.find(
            log => this.formatDate(new Date(log.date)) === this.formatDate(new Date(dayInTemplate.date))
          );
          const foodItems = foundLog && Array.isArray(foundLog.foodItems) ? foundLog.foodItems.map(item => ({...item, id: item.id || item._id})) : [];
          return foundLog ? { ...dayInTemplate, ...foundLog, date: new Date(foundLog.date), foodItems } : dayInTemplate;
        });
        return weekWithData;
      }),
      tap(processedWeekData => {
        this.weeklyNutrition.set(processedWeekData);
        // Caller is responsible for calling navigateToDay if needed after subscription.
        // For example, navigateToWeekContaining will handle this.
      }),
      catchError(error => {
        console.error('Error loading weekly nutrition from Firestore:', error);
        this.weeklyNutrition.set(this.createEmptyWeekData(this.currentWeekDate()));
        return of([]); // Propagate empty array or throwError
      }),
      mapTo(undefined), // Ensure Observable<void>
      finalize(() => {
        this.isLoadingWeeklyData.set(false);
      })
    );
  }

  refreshWeeklyData(): Observable<void> { // Also return Observable<void>
    return this.loadWeeklyNutrition();
  }
  
  private createEmptyWeekData(weekStartDateInput: Date = new Date()): DailyNutrition[] {
    // Ensure that the week data always starts from Monday, consistent with getTodayIndex and loadWeeklyNutrition
    const actualWeekStartDate = startOfWeek(weekStartDateInput, { weekStartsOn: 1 }); 
    
    return Array(7).fill(null).map((_, i) => {
      const dateForDay = addDays(actualWeekStartDate, i);
      return {
        date: dateForDay, // Store as Date object
        foodItems: [],
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0
        // No userId here, it's part of the document structure in Firestore
      };
    });
  }

  goToPreviousWeek() {
    // No need to save current week data explicitly with Firestore backend, reads are live.
    const prevWeekDate = subWeeks(this.currentWeekDate(), 1);
    this.currentWeekDate.set(prevWeekDate);
    return this.loadWeeklyNutrition(); // Return Observable<void>
  }

  goToNextWeek(): Observable<void> { // Add return type
    const nextWeekDate = addWeeks(this.currentWeekDate(), 1);
    this.currentWeekDate.set(nextWeekDate);
    return this.loadWeeklyNutrition(); // Return Observable<void>
  }

  goToCurrentWeek(): Observable<void> { // Add return type
    this.currentWeekDate.set(new Date()); // Set to today
    return this.loadWeeklyNutrition(); // Return Observable<void>
  }

  // No longer need saveCurrentWeekData, clearCache, or getWeekKey with Firestore as the backend.
  // nutritionDataByWeek (Map) is also removed.
  
  // Navigate to the week containing the given date
  // This will trigger loadWeeklyNutrition which then updates currentDayIndex and _selectedDay
  navigateToWeekContaining(date: Date): Observable<void> {
    console.log('Navigating to week containing date:', date);
    this.currentWeekDate.set(new Date(date));
    
    return this.loadWeeklyNutrition().pipe(
      tap(() => {
        // After week data is loaded and weeklyNutrition signal is updated by loadWeeklyNutrition,
        // find the index of the target date and navigate to it.
        const weekData = this.weeklyNutrition();
        const targetDayIndex = weekData.findIndex(d =>
          this.formatDate(new Date(d.date)) === this.formatDate(new Date(date))
        );
        if (targetDayIndex !== -1) {
          this.navigateToDay(targetDayIndex);
        } else {
          // If target date not found (e.g. an empty week was loaded), navigate to first day of the week
          if (weekData.length > 0) {
            this.navigateToDay(0);
          }
        }
      }),
      mapTo(undefined) // Ensure it returns Observable<void>
    );
  }
  
  // Helper to check if two dates are the same day
  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() && 
           date1.getMonth() === date2.getMonth() && 
           date1.getDate() === date2.getDate();
  }

  clearCacheAndRefresh(): void {
    this.loadWeeklyNutrition().subscribe({ // Subscribe as this is a top-level action
        next: () => console.log('Cache cleared and data refreshed.'),
        error: err => console.error('Error during clearCacheAndRefresh:', err)
    });
  }
}