import { Component, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FoodItem } from '../../../../models/food-item.model';
import { FoodQuantityDialogData } from '../../../../models/food-quantity-dialog-data.model';

export interface FoodQuantityResult {
  food: FoodItem;
  quantity: number;
  servingSize: number;
}

@Component({
  selector: 'app-food-quantity-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatDialogModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './food-quantity-dialog.component.html',
  styleUrl: './food-quantity-dialog.component.scss'
})
export class FoodQuantityDialogComponent {
  private dialogRef = inject(MatDialogRef<FoodQuantityDialogComponent>);
  
  quantity = 1;
  servingSize = 100; // Default to 100g
  
  // Don't initialize these here - do it in the constructor
  totalCalories!: number;
  totalProtein!: number;
  totalCarbs!: number;
  totalFat!: number;
  
  constructor(@Inject(MAT_DIALOG_DATA) public data: FoodQuantityDialogData) {
    // Initialize with provided values or defaults
    this.quantity = data.initialQuantity || 1;
    this.servingSize = data.initialServingSize || 100;
    
    // Initialize calculated values
    this.totalCalories = this.data.food.calories;
    this.totalProtein = this.data.food.protein;
    this.totalCarbs = this.data.food.carbs;
    this.totalFat = this.data.food.fat;
    
    // If we have initial values, update the totals
    if (data.initialQuantity || data.initialServingSize) {
      this.updateTotals();
    }
  }
  
  updateTotals() {
    // Calculate based on proportional serving size
    const servingRatio = this.quantity * (this.servingSize / 100);
    
    this.totalCalories = this.data.food.calories * servingRatio;
    this.totalProtein = this.data.food.protein * servingRatio;
    this.totalCarbs = this.data.food.carbs * servingRatio;
    this.totalFat = this.data.food.fat * servingRatio;
  }
  
  saveFood() {
    // Create a modified food item with adjusted values
    const adjustedFood: FoodItem = {
      ...this.data.food,
      calories: this.totalCalories,
      protein: this.totalProtein,
      carbs: this.totalCarbs,
      fat: this.totalFat,
      servingSize: `${this.quantity} x ${this.servingSize}g`
    };
    
    this.dialogRef.close({
      food: adjustedFood,
      quantity: this.quantity,
      servingSize: this.servingSize
    });
  }
  
  // Helper method to categorize foods
  getFoodCategory(food: FoodItem): string {
    const proteinRatio = food.protein * 4 / food.calories;
    const carbsRatio = food.carbs * 4 / food.calories;
    const fatRatio = food.fat * 9 / food.calories;
    
    // Determine the dominant macronutrient
    if (proteinRatio > 0.4) return 'protein';
    if (carbsRatio > 0.4) return 'carbs';
    if (fatRatio > 0.4) return 'fat';
    return 'mixed';
  }
  
  // Helper method to get appropriate icons
  getFoodIcon(food: FoodItem): string {
    const category = this.getFoodCategory(food);
    
    switch(category) {
      case 'protein': return 'fitness_center';
      case 'carbs': return 'bakery_dining';
      case 'fat': return 'egg_alt';
      default: return 'restaurant';
    }
  }
} 