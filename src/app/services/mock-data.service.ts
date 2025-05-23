import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, setDoc, addDoc, writeBatch } from '@angular/fire/firestore';
import { FoodItem } from '../models/food-item.model';
import { NutritionGoals } from '../models/nutrition-goals.model';
import { DailyNutrition } from '../models/daily-nutrition.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class MockDataService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  constructor() {}

  // Generate mock food database
  private getMockFoods(): Omit<FoodItem, 'id'>[] {
    return [
      // Proteins
      { name: 'Chicken Breast (Grilled)', calories: 165, protein: 31, carbs: 0, fat: 3.6, servingSize: '100g' },
      { name: 'Salmon (Grilled)', calories: 206, protein: 22, carbs: 0, fat: 12, servingSize: '100g' },
      { name: 'Eggs (Large)', calories: 155, protein: 13, carbs: 1.1, fat: 11, servingSize: '2 eggs' },
      { name: 'Greek Yogurt (Plain)', calories: 59, protein: 10, carbs: 3.6, fat: 0.4, servingSize: '100g' },
      { name: 'Tuna (Canned in Water)', calories: 116, protein: 25, carbs: 0, fat: 1, servingSize: '100g' },
      { name: 'Lean Ground Beef', calories: 250, protein: 26, carbs: 0, fat: 15, servingSize: '100g' },
      { name: 'Cottage Cheese', calories: 98, protein: 11, carbs: 3.4, fat: 4.3, servingSize: '100g' },
      { name: 'Protein Powder (Whey)', calories: 110, protein: 25, carbs: 2, fat: 1, servingSize: '30g scoop' },
      
      // Carbohydrates
      { name: 'Brown Rice (Cooked)', calories: 112, protein: 2.6, carbs: 23, fat: 0.9, servingSize: '100g' },
      { name: 'Quinoa (Cooked)', calories: 120, protein: 4.4, carbs: 22, fat: 1.9, servingSize: '100g' },
      { name: 'Sweet Potato (Baked)', calories: 86, protein: 1.6, carbs: 20, fat: 0.1, servingSize: '100g' },
      { name: 'Oats (Dry)', calories: 389, protein: 16.9, carbs: 66, fat: 6.9, servingSize: '100g' },
      { name: 'Whole Wheat Bread', calories: 247, protein: 13, carbs: 41, fat: 4.2, servingSize: '100g' },
      { name: 'Banana', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, servingSize: '1 medium' },
      { name: 'Apple', calories: 52, protein: 0.3, carbs: 14, fat: 0.2, servingSize: '1 medium' },
      { name: 'Pasta (Whole Wheat, Cooked)', calories: 124, protein: 5, carbs: 25, fat: 1.1, servingSize: '100g' },
      
      // Healthy Fats
      { name: 'Avocado', calories: 160, protein: 2, carbs: 9, fat: 15, servingSize: '100g' },
      { name: 'Almonds', calories: 579, protein: 21, carbs: 22, fat: 50, servingSize: '100g' },
      { name: 'Olive Oil', calories: 884, protein: 0, carbs: 0, fat: 100, servingSize: '100g' },
      { name: 'Walnuts', calories: 654, protein: 15, carbs: 14, fat: 65, servingSize: '100g' },
      { name: 'Peanut Butter', calories: 588, protein: 25, carbs: 20, fat: 50, servingSize: '100g' },
      { name: 'Chia Seeds', calories: 486, protein: 17, carbs: 42, fat: 31, servingSize: '100g' },
      
      // Vegetables
      { name: 'Broccoli (Steamed)', calories: 34, protein: 2.8, carbs: 7, fat: 0.4, servingSize: '100g' },
      { name: 'Spinach (Raw)', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, servingSize: '100g' },
      { name: 'Carrots (Raw)', calories: 41, protein: 0.9, carbs: 10, fat: 0.2, servingSize: '100g' },
      { name: 'Bell Peppers', calories: 31, protein: 1, carbs: 7, fat: 0.3, servingSize: '100g' },
      { name: 'Cucumber', calories: 16, protein: 0.7, carbs: 4, fat: 0.1, servingSize: '100g' },
      { name: 'Tomatoes', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, servingSize: '100g' },
      
      // Dairy
      { name: 'Milk (2%)', calories: 50, protein: 3.3, carbs: 4.8, fat: 2, servingSize: '100ml' },
      { name: 'Cheddar Cheese', calories: 402, protein: 25, carbs: 1.3, fat: 33, servingSize: '100g' },
      { name: 'Mozzarella Cheese', calories: 280, protein: 28, carbs: 2.2, fat: 17, servingSize: '100g' },
      
      // Snacks/Meals
      { name: 'Protein Bar', calories: 200, protein: 20, carbs: 15, fat: 8, servingSize: '1 bar' },
      { name: 'Energy Bar', calories: 150, protein: 4, carbs: 30, fat: 3, servingSize: '1 bar' },
      { name: 'Mixed Nuts', calories: 607, protein: 20, carbs: 21, fat: 54, servingSize: '100g' }
    ];
  }

  // Generate sample nutrition goals
  private getMockNutritionGoals(): NutritionGoals {
    return {
      calorieGoal: 2200,
      proteinGoal: 140,
      carbsGoal: 275,
      fatGoal: 73
    };
  }

  // Generate sample daily nutrition entries for the past week
  private getMockDailyEntries(): { date: string; entry: Omit<DailyNutrition, 'date'> }[] {
    const entries = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Create sample meals for each day
      const dailyFoods = this.generateSampleDayMeals(i);
      const totals = this.calculateTotals(dailyFoods);
      
      entries.push({
        date: dateString,
        entry: {
          foodItems: dailyFoods,
          totalCalories: totals.totalCalories,
          totalProtein: totals.totalProtein,
          totalCarbs: totals.totalCarbs,
          totalFat: totals.totalFat
        }
      });
    }
    
    return entries;
  }

  // Generate realistic meals for a day
  private generateSampleDayMeals(dayIndex: number): FoodItem[] {
    const meals = [
      // Day 0 (today)
      [
        { id: 'temp1', name: 'Oats (Dry)', calories: 156, protein: 6.8, carbs: 26, fat: 2.8, servingSize: '40g' },
        { id: 'temp2', name: 'Banana', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, servingSize: '1 medium' },
        { id: 'temp3', name: 'Chicken Breast (Grilled)', calories: 330, protein: 62, carbs: 0, fat: 7.2, servingSize: '200g' },
        { id: 'temp4', name: 'Brown Rice (Cooked)', calories: 168, protein: 3.9, carbs: 34, fat: 1.4, servingSize: '150g' },
        { id: 'temp5', name: 'Broccoli (Steamed)', calories: 34, protein: 2.8, carbs: 7, fat: 0.4, servingSize: '100g' },
        { id: 'temp6', name: 'Greek Yogurt (Plain)', calories: 118, protein: 20, carbs: 7.2, fat: 0.8, servingSize: '200g' },
        { id: 'temp7', name: 'Almonds', calories: 173, protein: 6.3, carbs: 6.6, fat: 15, servingSize: '30g' }
      ],
      // Day 1 (yesterday)
      [
        { id: 'temp8', name: 'Eggs (Large)', calories: 155, protein: 13, carbs: 1.1, fat: 11, servingSize: '2 eggs' },
        { id: 'temp9', name: 'Whole Wheat Bread', calories: 124, protein: 6.5, carbs: 20, fat: 2.1, servingSize: '50g' },
        { id: 'temp10', name: 'Salmon (Grilled)', calories: 309, protein: 33, carbs: 0, fat: 18, servingSize: '150g' },
        { id: 'temp11', name: 'Quinoa (Cooked)', calories: 180, protein: 6.6, carbs: 33, fat: 2.9, servingSize: '150g' },
        { id: 'temp12', name: 'Spinach (Raw)', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, servingSize: '100g' },
        { id: 'temp13', name: 'Protein Powder (Whey)', calories: 110, protein: 25, carbs: 2, fat: 1, servingSize: '30g scoop' }
      ],
      // Add more varied days...
      [
        { id: 'temp14', name: 'Greek Yogurt (Plain)', calories: 118, protein: 20, carbs: 7.2, fat: 0.8, servingSize: '200g' },
        { id: 'temp15', name: 'Apple', calories: 52, protein: 0.3, carbs: 14, fat: 0.2, servingSize: '1 medium' },
        { id: 'temp16', name: 'Lean Ground Beef', calories: 375, protein: 39, carbs: 0, fat: 23, servingSize: '150g' },
        { id: 'temp17', name: 'Sweet Potato (Baked)', calories: 129, protein: 2.4, carbs: 30, fat: 0.2, servingSize: '150g' }
      ]
    ];
    
    // Cycle through meals or provide default
    return meals[dayIndex % meals.length] || meals[0];
  }

  private calculateTotals(items: FoodItem[]): { totalCalories: number; totalProtein: number; totalCarbs: number; totalFat: number; } {
    return items.reduce((acc, item) => {
      acc.totalCalories += item.calories || 0;
      acc.totalProtein += item.protein || 0;
      acc.totalCarbs += item.carbs || 0;
      acc.totalFat += item.fat || 0;
      return acc;
    }, { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 });
  }

  // Main method to populate Firebase with mock data
  async populateFirebaseWithMockData(): Promise<void> {
    const userId = this.authService.currentUser()?.uid;
    if (!userId) {
      throw new Error('User must be logged in to populate mock data');
    }

    try {
      console.log('Starting to populate Firebase with mock data...');
      
      // 1. Populate global foods collection
      await this.populateFoodsCollection();
      
      // 2. Populate user's nutrition goals
      await this.populateUserNutritionGoals(userId);
      
      // 3. Populate user's daily entries
      await this.populateUserDailyEntries(userId);
      
      console.log('✅ Mock data population completed successfully!');
      
    } catch (error) {
      console.error('❌ Error populating mock data:', error);
      throw error;
    }
  }

  private async populateFoodsCollection(): Promise<void> {
    console.log('Populating foods collection...');
    const batch = writeBatch(this.firestore);
    const foodsCollection = collection(this.firestore, 'foods');
    const mockFoods = this.getMockFoods();
    
    for (const food of mockFoods) {
      const docRef = doc(foodsCollection);
      batch.set(docRef, food);
    }
    
    await batch.commit();
    console.log(`✅ Added ${mockFoods.length} foods to the database`);
  }

  private async populateUserNutritionGoals(userId: string): Promise<void> {
    console.log('Setting user nutrition goals...');
    const goalsDocRef = doc(this.firestore, `users/${userId}/nutritionGoals/userGoals`);
    const mockGoals = this.getMockNutritionGoals();
    
    await setDoc(goalsDocRef, mockGoals);
    console.log('✅ User nutrition goals set');
  }

  private async populateUserDailyEntries(userId: string): Promise<void> {
    console.log('Populating user daily entries...');
    const dailyEntries = this.getMockDailyEntries();
    
    for (const { date, entry } of dailyEntries) {
      const entryDocRef = doc(this.firestore, `users/${userId}/dailyEntries/${date}`);
      const entryWithDate = {
        ...entry,
        date: new Date(date)
      };
      await setDoc(entryDocRef, entryWithDate);
    }
    
    console.log(`✅ Added ${dailyEntries.length} daily entries`);
  }

  // Method to clear all mock data (useful for testing)
  async clearUserData(): Promise<void> {
    const userId = this.authService.currentUser()?.uid;
    if (!userId) {
      throw new Error('User must be logged in to clear data');
    }

    try {
      console.log('Clearing user data...');
      
      // Clear nutrition goals
      const goalsDocRef = doc(this.firestore, `users/${userId}/nutritionGoals/userGoals`);
      await setDoc(goalsDocRef, {});
      
      // Note: Clearing daily entries would require querying and deleting each document
      // For now, we'll just log that this would need to be implemented
      console.log('⚠️ Daily entries clearing not implemented - would require batch deletion');
      
      console.log('✅ User data cleared');
      
    } catch (error) {
      console.error('❌ Error clearing user data:', error);
      throw error;
    }
  }
} 