import { FoodItem } from './food-item.model';

export interface DailyNutrition {
  date: Date;
  foodItems: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
} 