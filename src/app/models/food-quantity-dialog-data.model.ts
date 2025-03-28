import { FoodItem } from "./food-item.model";

export interface FoodQuantityDialogData {
    food: FoodItem;
    initialQuantity?: number;
    initialServingSize?: number;
    targetDate?: Date;
  }