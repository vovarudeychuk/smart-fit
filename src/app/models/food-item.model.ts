export interface FoodItem {
  id?: string; // Firestore document ID
  name: string;
  calories: number;
  protein: number; // in grams
  carbs: number;   // in grams
  fat: number;     // in grams
  servingSize: string;
} 