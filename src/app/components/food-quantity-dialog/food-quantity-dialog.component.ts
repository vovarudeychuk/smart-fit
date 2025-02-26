import { Component, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FoodItem } from '../../models/food-item.model';

export interface FoodQuantityDialogData {
  food: FoodItem;
  initialQuantity?: number;
  initialServingSize?: number;
}

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
    MatButtonModule
  ],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>Add {{ data.food.name }}</h2>
      <mat-dialog-content>
        <div class="food-info">
          <div><strong>{{ data.food.name }}</strong></div>
          <div class="nutrition-info">
            <span>{{ data.food.calories }} kcal</span> | 
            <span>Protein: {{ data.food.protein }}g</span> | 
            <span>Carbs: {{ data.food.carbs }}g</span> | 
            <span>Fat: {{ data.food.fat }}g</span>
          </div>
          <div class="serving-info">Per {{ data.food.servingSize }}</div>
        </div>

        <div class="quantity-inputs">
          <mat-form-field appearance="outline">
            <mat-label>Number of servings</mat-label>
            <input 
              matInput 
              type="number"
              min="0.25" 
              step="0.25" 
              [(ngModel)]="quantity" 
              (input)="updateTotals()">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Grams</mat-label>
            <input 
              matInput 
              type="number" 
              min="1"
              [(ngModel)]="servingSize" 
              (input)="updateTotals()">
          </mat-form-field>
        </div>

        <div class="totals">
          <h3>Total nutrition</h3>
          <div>Calories: {{ totalCalories | number:'1.0-0' }} kcal</div>
          <div>Protein: {{ totalProtein | number:'1.0-1' }}g</div>
          <div>Carbs: {{ totalCarbs | number:'1.0-1' }}g</div>
          <div>Fat: {{ totalFat | number:'1.0-1' }}g</div>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Cancel</button>
        <button mat-raised-button color="primary" (click)="saveFood()">Add Food</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: `
    /* Fix for dark dialog background */
    ::ng-deep .mat-mdc-dialog-container {
      --mdc-dialog-container-color: white !important;
    }
    
    .dialog-container {
      color: rgba(0, 0, 0, 0.87);
      background-color: white;
    }
    
    /* Dialog title */
    ::ng-deep .mat-mdc-dialog-title {
      color: rgba(0, 0, 0, 0.87) !important;
    }
    
    /* Dialog content */
    ::ng-deep .mat-mdc-dialog-content {
      color: rgba(0, 0, 0, 0.87) !important;
    }
    
    /* Form field text color */
    ::ng-deep .mat-mdc-form-field-input-control {
      color: rgba(0, 0, 0, 0.87) !important;
    }
    
    /* Form field label color */
    ::ng-deep .mat-mdc-form-field-label {
      color: rgba(0, 0, 0, 0.6) !important;
    }
    
    .food-info {
      margin-bottom: 20px;
      padding: 16px;
      border-radius: 8px;
      background-color: rgba(0, 0, 0, 0.04);
      color: rgba(0, 0, 0, 0.87);
    }
    
    .nutrition-info {
      margin: 8px 0;
      color: rgba(0, 0, 0, 0.6);
    }
    
    .serving-info {
      font-style: italic;
      font-size: 14px;
      color: rgba(0, 0, 0, 0.5);
    }
    
    .quantity-inputs {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
    }
    
    .quantity-inputs mat-form-field {
      flex: 1;
    }
    
    .totals {
      margin-top: 20px;
      padding: 16px;
      border-radius: 8px;
      background-color: rgba(0, 0, 0, 0.04);
      color: rgba(0, 0, 0, 0.87);
    }
    
    .totals h3 {
      margin-top: 0;
      margin-bottom: 8px;
      color: rgba(0, 0, 0, 0.87);
    }
  `
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
} 