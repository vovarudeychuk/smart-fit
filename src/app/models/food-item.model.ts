export interface FoodItem {
  id?: number | string;
  _id?: string;  // Add MongoDB _id property
  name: string;
  calories: number;
  protein: number; // in grams
  carbs: number;   // in grams
  fat: number;     // in grams
  servingSize: string;
} 