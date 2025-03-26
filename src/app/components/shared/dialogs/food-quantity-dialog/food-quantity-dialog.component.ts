import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { FoodItem } from '../../../../models/food-item.model';
import { FoodQuantityDialogData } from '../../../../models/food-quantity-dialog-data.model';

export interface FoodQuantityResult {
  food: FoodItem;
  quantity: number;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

@Component({
  selector: 'app-food-quantity-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule
  ],
  templateUrl: './food-quantity-dialog.component.html',
  styleUrls: ['./food-quantity-dialog.component.scss']
})
export class FoodQuantityDialogComponent implements OnInit {
  food: FoodItem;
  mealType: string = 'meal';
  quantity: number = 1;
  servingSize: number = 100;
  baseServingSize: number = 100;
  
  // Calculated totals
  totalCalories: number = 0;
  totalProtein: number = 0;
  totalCarbs: number = 0;
  totalFat: number = 0;

  constructor(
    public dialogRef: MatDialogRef<FoodQuantityDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FoodQuantityDialogData
  ) {
    this.food = data.food;
    
    // Parse servingSize string to get numeric value
    const servingSizeMatch = this.food.servingSize.match(/(\d+)/);
    if (servingSizeMatch && servingSizeMatch[1]) {
      this.servingSize = parseInt(servingSizeMatch[1], 10);
      this.baseServingSize = this.servingSize;
    }
    
    // If food already has a quantity (editing mode)
    if (data.initialQuantity) {
      this.quantity = data.initialQuantity;
    }
    
    // If initial serving size is provided
    if (data.initialServingSize) {
      this.servingSize = data.initialServingSize;
    }
    
    this.updateTotals();
  }

  ngOnInit(): void {
    // Any additional initialization
  }

  updateTotals(): void {
    // Calculate nutritional totals based on serving size and quantity
    const ratio = this.servingSize / this.baseServingSize * this.quantity;
    
    this.totalCalories = Math.round(this.food.calories * ratio);
    this.totalProtein = Math.round(this.food.protein * ratio * 10) / 10;
    this.totalCarbs = Math.round(this.food.carbs * ratio * 10) / 10;
    this.totalFat = Math.round(this.food.fat * ratio * 10) / 10;
  }

  saveFood(): void {
    // Create a copy of the food with adjusted quantity
    const adjustedFood = { ...this.food };
    
    // Return the result
    const result: FoodQuantityResult = {
      food: adjustedFood,
      quantity: this.quantity,
      totalCalories: this.totalCalories,
      totalProtein: this.totalProtein,
      totalCarbs: this.totalCarbs,
      totalFat: this.totalFat
    };
    
    this.dialogRef.close(result);
  }

  cancelDialog(): void {
    this.dialogRef.close();
  }

  increaseQuantity(): void {
    this.quantity += 1;
    this.updateTotals();
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity -= 1;
      this.updateTotals();
    }
  }

  getFoodCategory(): string {
    // Determine the food's primary macronutrient category
    if (this.food.protein >= this.food.carbs && this.food.protein >= this.food.fat) {
      return 'protein';
    } else if (this.food.carbs >= this.food.protein && this.food.carbs >= this.food.fat) {
      return 'carbs';
    } else if (this.food.fat >= this.food.protein && this.food.fat >= this.food.carbs) {
      return 'fat';
    } else {
      return 'mixed';
    }
  }

  getFoodIcon(): string {
    const category = this.getFoodCategory();
    
    switch (category) {
      case 'protein':
        return 'fitness_center';
      case 'carbs':
        return 'grain';
      case 'fat':
        return 'water_drop';
      default:
        return 'restaurant';
    }
  }
} 