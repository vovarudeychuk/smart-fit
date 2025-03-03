import { Injectable, signal } from '@angular/core';
import { FoodItem } from '../models/food-item.model';
import { DailyNutrition } from '../models/daily-nutrition.model';

@Injectable({
  providedIn: 'root'
})
export class NutritionService {
  // User goals (could be moved to user settings in a real app)
  private calorieGoal = 2000;
  private proteinGoal = 150; // grams
  private carbsGoal = 200;   // grams
  private fatGoal = 65;      // grams

  // Mock food database
  private foodDatabase: FoodItem[] = [
    { id: 1, name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, servingSize: '100g' },
    { id: 2, name: 'Brown Rice', calories: 112, protein: 2.6, carbs: 23.5, fat: 0.9, servingSize: '100g' },
    { id: 3, name: 'Broccoli', calories: 34, protein: 2.8, carbs: 6.6, fat: 0.4, servingSize: '100g' },
    { id: 4, name: 'Salmon', calories: 208, protein: 20, carbs: 0, fat: 13, servingSize: '100g' },
    { id: 5, name: 'Sweet Potato', calories: 86, protein: 1.6, carbs: 20, fat: 0.1, servingSize: '100g' },
    { id: 6, name: 'Avocado', calories: 160, protein: 2, carbs: 8.5, fat: 14.7, servingSize: '100g' },
    { id: 7, name: 'Egg', calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3, servingSize: '1 large' },
    { id: 8, name: 'Greek Yogurt', calories: 59, protein: 10, carbs: 3.6, fat: 0.4, servingSize: '100g' },
    { id: 9, name: 'Almonds', calories: 579, protein: 21, carbs: 21.6, fat: 49.9, servingSize: '100g' },
    { id: 10, name: 'Banana', calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3, servingSize: '100g' },
  ];

  // Generate dates for the current week
  private currentDate = new Date();
  private weekDates = this.generateWeekDates();

  // Create signals for reactive state
  private currentDayIndex = signal<number>(0);
  private weeklyNutrition = signal<DailyNutrition[]>(this.generateMockWeekData());

  constructor() {}

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
      
      // Calculate totals
      const totalCalories = randomFoodItems.reduce((sum, item) => sum + item.calories, 0);
      const totalProtein = randomFoodItems.reduce((sum, item) => sum + item.protein, 0);
      const totalCarbs = randomFoodItems.reduce((sum, item) => sum + item.carbs, 0);
      const totalFat = randomFoodItems.reduce((sum, item) => sum + item.fat, 0);
      
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

  private getRandomFoodItems(count: number): FoodItem[] {
    const items: FoodItem[] = [];
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * this.foodDatabase.length);
      items.push({...this.foodDatabase[randomIndex]});
    }
    return items;
  }

  // Public methods
  getCurrentDay() {
    return this.weeklyNutrition()[this.currentDayIndex()];
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
    const updatedNutrition = [...this.weeklyNutrition()];
    const dayIndex = this.currentDayIndex();
    
    updatedNutrition[dayIndex] = {
      ...updatedNutrition[dayIndex],
      foodItems: [...updatedNutrition[dayIndex].foodItems, foodItem],
      totalCalories: updatedNutrition[dayIndex].totalCalories + foodItem.calories,
      totalProtein: updatedNutrition[dayIndex].totalProtein + foodItem.protein,
      totalCarbs: updatedNutrition[dayIndex].totalCarbs + foodItem.carbs,
      totalFat: updatedNutrition[dayIndex].totalFat + foodItem.fat
    };
    
    this.weeklyNutrition.set(updatedNutrition);
  }

  searchFoods(query: string): FoodItem[] {
    if (!query || query.trim() === '') {
      return [];
    }
    
    query = query.toLowerCase();
    return this.foodDatabase.filter(food => 
      food.name.toLowerCase().includes(query)
    );
  }

  // Update an existing food item
  updateFoodItem(foodItemId: string, updatedFood: FoodItem): void {
    const currentDayIndex = this.currentDayIndex();
    const currentDay = this.weeklyNutrition()[currentDayIndex];
    
    const foodIndex = currentDay.foodItems.findIndex(item => item.id.toString() === foodItemId);
    if (foodIndex !== -1) {
      // Create a copy of the weekly nutrition data
      const updatedNutrition = [...this.weeklyNutrition()];
      
      // Create a copy of the current day
      const updatedDay = { ...updatedNutrition[currentDayIndex] };
      
      // Create a copy of the food items array with the updated item
      updatedDay.foodItems = [...updatedDay.foodItems];
      updatedDay.foodItems[foodIndex] = updatedFood;
      
      // Recalculate totals
      this.calculateDayTotals(updatedDay);
      
      // Update the current day in the weekly nutrition
      updatedNutrition[currentDayIndex] = updatedDay;
      
      // Update the signal with the new state
      this.weeklyNutrition.set(updatedNutrition);
    }
  }

  // Delete a food item
  deleteFoodItem(foodItemId: string): void {
    const currentDayIndex = this.currentDayIndex();
    const currentDay = this.weeklyNutrition()[currentDayIndex];
    
    const foodIndex = currentDay.foodItems.findIndex(item => item.id.toString() === foodItemId);
    if (foodIndex !== -1) {
      // Create a copy of the weekly nutrition data
      const updatedNutrition = [...this.weeklyNutrition()];
      
      // Create a copy of the current day
      const updatedDay = { ...updatedNutrition[currentDayIndex] };
      
      // Remove the food item
      updatedDay.foodItems = updatedDay.foodItems.filter(item => item.id.toString() !== foodItemId);
      
      // Recalculate totals
      this.calculateDayTotals(updatedDay);
      
      // Update the current day in the weekly nutrition
      updatedNutrition[currentDayIndex] = updatedDay;
      
      // Update the signal with the new state
      this.weeklyNutrition.set(updatedNutrition);
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
} 