import { Injectable, inject } from '@angular/core';
import {
  Firestore, addDoc, collection, collectionData, deleteDoc, doc, docData, updateDoc, DocumentReference,
  runTransaction, arrayUnion, arrayRemove, query, where, documentId, setDoc, Timestamp
} from '@angular/fire/firestore';
import { Observable, from, map, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { FoodItem } from '../models/food-item.model';
import { AuthService } from './auth.service';
import { NutritionGoals } from '../models/nutrition-goals.model';
import { DailyNutrition } from '../models/daily-nutrition.model';

@Injectable({
  providedIn: 'root'
})
export class FirebaseDataService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  private readonly usersCollectionPath = 'users';
  private readonly foodsCollectionPath = 'foods';
  private readonly nutritionGoalsSubcollection = 'nutritionGoals';
  private readonly dailyEntriesSubcollection = 'dailyEntries';
  private readonly userGoalsDocId = 'userGoals'; // Specific ID for the single goals document

  constructor() {
    // console.log('FirebaseDataService initialized, current user UID:', this.authService.currentUser()?.uid);
  }

  // --- Helper Methods ---
  private getCurrentUserId(): string | null {
    return this.authService.currentUser()?.uid || null;
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

  // --- Food Database Methods (existing) ---

  getAllFoods(): Observable<FoodItem[]> {
    const foodsCollection = collection(this.firestore, this.foodsCollectionPath);
    return (collectionData(foodsCollection, { idField: 'id' }) as Observable<FoodItem[]>)
      .pipe(
        catchError(error => {
          console.error('Error fetching all foods:', error);
          return of([]); // Return empty array on error
        })
      );
  }

  getFoodById(foodId: string): Observable<FoodItem | undefined> {
    const foodDocRef = doc(this.firestore, `${this.foodsCollectionPath}/${foodId}`);
    return (docData(foodDocRef, { idField: 'id' }) as Observable<FoodItem | undefined>)
      .pipe(
        catchError(error => {
          console.error(`Error fetching food by ID ${foodId}:`, error);
          return of(undefined); // Return undefined on error
        })
      );
  }

  searchFoods(queryText: string): Observable<FoodItem[]> {
    if (!queryText || queryText.trim() === '') {
      return this.getAllFoods(); // Or return of([]) if no query means no results
    }
    const lowerCaseQuery = queryText.toLowerCase();
    return this.getAllFoods().pipe(
      map(foods => 
        foods.filter(food => 
          (food.name?.toLowerCase().includes(lowerCaseQuery)) 
          // food.brand was removed as it does not exist on FoodItem model
          // Add other fields to search if necessary, e.g. food.description?.toLowerCase().includes(lowerCaseQuery)
        )
      ),
      catchError(error => {
        console.error('Error searching foods:', error);
        return of([]);
      })
    );
  }

  async addFood(foodData: Omit<FoodItem, 'id'>): Promise<DocumentReference> {
    const foodsCollection = collection(this.firestore, this.foodsCollectionPath);
    try {
      const docRef = await addDoc(foodsCollection, foodData);
      return docRef;
    } catch (error) {
      console.error('Error adding food:', error);
      throw error; // Rethrow or handle as needed
    }
  }

  async updateFood(foodId: string, foodData: Partial<FoodItem>): Promise<void> {
    const foodDocRef = doc(this.firestore, `${this.foodsCollectionPath}/${foodId}`);
    try {
      await updateDoc(foodDocRef, foodData);
    } catch (error) {
      console.error(`Error updating food ${foodId}:`, error);
      throw error;
    }
  }

  async deleteFood(foodId: string): Promise<void> {
    const foodDocRef = doc(this.firestore, `${this.foodsCollectionPath}/${foodId}`);
    try {
      await deleteDoc(foodDocRef);
    } catch (error) {
      console.error(`Error deleting food ${foodId}:`, error);
      throw error;
    }
  }

  // --- Nutrition Goals Methods ---
  getNutritionGoals(): Observable<NutritionGoals | null> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return of(null);
    }
    const goalsDocRef = doc(this.firestore, `${this.usersCollectionPath}/${userId}/${this.nutritionGoalsSubcollection}/${this.userGoalsDocId}`);
    return (docData(goalsDocRef) as Observable<NutritionGoals | null>).pipe(
      catchError(error => {
        console.error('Error fetching nutrition goals:', error);
        // Return null if doc doesn't exist or other error
        return of(null);
      })
    );
  }

  async updateNutritionGoals(goals: NutritionGoals): Promise<void> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return Promise.reject(new Error('User not logged in'));
    }
    const goalsDocRef = doc(this.firestore, `${this.usersCollectionPath}/${userId}/${this.nutritionGoalsSubcollection}/${this.userGoalsDocId}`);
    try {
      await setDoc(goalsDocRef, goals, { merge: true }); // merge: true creates if not exists, updates if exists
    } catch (error) {
      console.error('Error updating nutrition goals:', error);
      throw error;
    }
  }

  // --- Daily Nutrition Tracking Methods ---
  getDailyNutrition(date: string): Observable<DailyNutrition | null> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return of(null);
    }
    const entryDocRef = doc(this.firestore, `${this.usersCollectionPath}/${userId}/${this.dailyEntriesSubcollection}/${date}`);
    return (docData(entryDocRef) as Observable<DailyNutrition | null>).pipe(
      catchError(error => {
        console.error(`Error fetching daily nutrition for date ${date}:`, error);
        return of(null);
      })
    );
  }

  async addFoodToDay(date: string, foodItem: FoodItem): Promise<void> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return Promise.reject(new Error('User not logged in'));
    }
    const entryDocRef = doc(this.firestore, `${this.usersCollectionPath}/${userId}/${this.dailyEntriesSubcollection}/${date}`);

    try {
      await runTransaction(this.firestore, async (transaction) => {
        const entryDoc = await transaction.get(entryDocRef);
        let currentData: DailyNutrition;

        if (!entryDoc.exists()) {
          currentData = {
            date: new Date(date), // Store as JS Date; Firestore will convert to Timestamp
            foodItems: [foodItem],
            ...this.calculateTotals([foodItem])
          };
        } else {
          const existingData = entryDoc.data() as DailyNutrition;
          const updatedFoodItems = [...(existingData.foodItems || []), foodItem];
          currentData = {
            ...existingData,
            foodItems: updatedFoodItems,
            ...this.calculateTotals(updatedFoodItems)
          };
        }
        transaction.set(entryDocRef, currentData);
      });
    } catch (error) {
      console.error(`Error adding food to day ${date}:`, error);
      throw error;
    }
  }

  async updateFoodInDay(date: string, foodItemId: string, updatedFood: FoodItem): Promise<void> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return Promise.reject(new Error('User not logged in'));
    }
    if (!foodItemId) {
      return Promise.reject(new Error('Food item ID is required for update'));
    }
    const entryDocRef = doc(this.firestore, `${this.usersCollectionPath}/${userId}/${this.dailyEntriesSubcollection}/${date}`);

    try {
      await runTransaction(this.firestore, async (transaction) => {
        const entryDoc = await transaction.get(entryDocRef);
        if (!entryDoc.exists()) {
          throw new Error(`No nutrition entry found for date ${date}`);
        }

        const currentData = entryDoc.data() as DailyNutrition;
        const itemIndex = currentData.foodItems.findIndex(item => item.id === foodItemId);

        if (itemIndex === -1) {
          throw new Error(`Food item with ID ${foodItemId} not found in entry for date ${date}`);
        }

        const updatedFoodItems = [...currentData.foodItems];
        updatedFoodItems[itemIndex] = { ...updatedFood, id: foodItemId }; // Ensure ID is maintained

        const newTotals = this.calculateTotals(updatedFoodItems);
        transaction.set(entryDocRef, { ...currentData, foodItems: updatedFoodItems, ...newTotals });
      });
    } catch (error) {
      console.error(`Error updating food in day ${date}:`, error);
      throw error;
    }
  }

  async deleteFoodFromDay(date: string, foodItemId: string): Promise<void> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return Promise.reject(new Error('User not logged in'));
    }
    const entryDocRef = doc(this.firestore, `${this.usersCollectionPath}/${userId}/${this.dailyEntriesSubcollection}/${date}`);

    try {
      await runTransaction(this.firestore, async (transaction) => {
        const entryDoc = await transaction.get(entryDocRef);
        if (!entryDoc.exists()) {
          // If document doesn't exist, nothing to delete.
          return;
        }

        const currentData = entryDoc.data() as DailyNutrition;
        const updatedFoodItems = currentData.foodItems.filter(item => item.id !== foodItemId);

        if (updatedFoodItems.length === currentData.foodItems.length) {
          // Item not found, or array was empty. No change needed.
          // Or, if the entry should be deleted if empty:
          // if (updatedFoodItems.length === 0) { transaction.delete(entryDocRef); return; }
        }
        
        const newTotals = this.calculateTotals(updatedFoodItems);
        // If all items are removed, one might choose to delete the document or leave it with empty totals/items
        if (updatedFoodItems.length === 0) {
            // Option 1: Delete the document if empty
            // transaction.delete(entryDocRef); 
            // Option 2: Keep the document but with empty items and zero totals
             transaction.set(entryDocRef, { ...currentData, foodItems: [], ...this.calculateTotals([]) });
        } else {
            transaction.set(entryDocRef, { ...currentData, foodItems: updatedFoodItems, ...newTotals });
        }
      });
    } catch (error) {
      console.error(`Error deleting food from day ${date}:`, error);
      throw error;
    }
  }

  getWeeklyNutrition(startDate: string, endDate: string): Observable<DailyNutrition[]> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return of([]);
    }
    const entriesCollectionRef = collection(this.firestore, `${this.usersCollectionPath}/${userId}/${this.dailyEntriesSubcollection}`);
    const q = query(entriesCollectionRef, where(documentId(), '>=', startDate), where(documentId(), '<=', endDate));
    
    return (collectionData(q) as Observable<DailyNutrition[]>).pipe(
      catchError(error => {
        console.error('Error fetching weekly nutrition data:', error);
        return of([]);
      })
    );
  }

  async moveFoodBetweenDays(sourceDate: string, targetDate: string, foodItemId: string, foodItem: FoodItem): Promise<void> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return Promise.reject(new Error('User not logged in'));
    }
    if (!foodItem || !foodItemId) {
        return Promise.reject(new Error('Food item and ID are required.'));
    }

    const sourceDocRef = doc(this.firestore, `${this.usersCollectionPath}/${userId}/${this.dailyEntriesSubcollection}/${sourceDate}`);
    const targetDocRef = doc(this.firestore, `${this.usersCollectionPath}/${userId}/${this.dailyEntriesSubcollection}/${targetDate}`);

    try {
      await runTransaction(this.firestore, async (transaction) => {
        // 1. Get source day document
        const sourceDoc = await transaction.get(sourceDocRef);
        if (!sourceDoc.exists()) {
          throw new Error(`Source document for date ${sourceDate} does not exist.`);
        }
        const sourceData = sourceDoc.data() as DailyNutrition;
        
        // 2. Remove foodItem from source day
        const sourceFoodItemsUpdated = sourceData.foodItems.filter(item => item.id !== foodItemId);
        if (sourceFoodItemsUpdated.length === sourceData.foodItems.length) {
            // This means the item wasn't found in the source, could be an error or a no-op
            console.warn(`Food item ${foodItemId} not found in source date ${sourceDate}.`);
            // Depending on desired behavior, one might throw an error here or just proceed
        }
        const sourceTotalsUpdated = this.calculateTotals(sourceFoodItemsUpdated);

        // 3. Get target day document (or prepare for new one)
        const targetDoc = await transaction.get(targetDocRef);
        let targetDataNew: DailyNutrition;

        if (!targetDoc.exists()) {
          targetDataNew = {
            date: new Date(targetDate), // Store as JS Date
            foodItems: [foodItem], // Add the actual foodItem object passed to the function
            ...this.calculateTotals([foodItem])
          };
        } else {
          const targetDataExisting = targetDoc.data() as DailyNutrition;
          const targetFoodItemsUpdated = [...(targetDataExisting.foodItems || []), foodItem];
          targetDataNew = {
            ...targetDataExisting,
            foodItems: targetFoodItemsUpdated,
            ...this.calculateTotals(targetFoodItemsUpdated)
          };
        }

        // 4. Perform updates
        if (sourceFoodItemsUpdated.length === 0) {
            // Option 1: Delete source doc if empty
            // transaction.delete(sourceDocRef);
            // Option 2: Update with empty items/totals
            transaction.set(sourceDocRef, { ...sourceData, foodItems: [], ...this.calculateTotals([]) });
        } else {
            transaction.set(sourceDocRef, { ...sourceData, foodItems: sourceFoodItemsUpdated, ...sourceTotalsUpdated });
        }
        transaction.set(targetDocRef, targetDataNew);
      });
    } catch (error) {
      console.error(`Error moving food from ${sourceDate} to ${targetDate}:`, error);
      throw error;
    }
  }
}
