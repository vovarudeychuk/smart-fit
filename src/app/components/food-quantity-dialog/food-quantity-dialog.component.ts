import { Component, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FoodItem } from '../../models/food-item.model';
import { FoodQuantityDialogData } from '../../models/food-quantity-dialog-data.model';

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
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2 mat-dialog-title>
          <mat-icon [ngClass]="getFoodCategory(data.food)">{{getFoodIcon(data.food)}}</mat-icon>
          Add {{ data.food.name }}
        </h2>
        <button mat-icon-button mat-dialog-close class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <mat-dialog-content>
        <div class="food-info">
          <div class="food-title">{{ data.food.name }}</div>
          
          <div class="nutrition-grid">
            <div class="nutrition-item">
              <div class="nutrition-value ccal">{{ data.food.calories }}</div>
              <div class="nutrition-label">calories</div>
            </div>
            
            <div class="nutrition-item">
              <div class="nutrition-value protein">{{ data.food.protein }}g</div>
              <div class="nutrition-label">protein</div>
            </div>
            
            <div class="nutrition-item">
              <div class="nutrition-value carbs">{{ data.food.carbs }}g</div>
              <div class="nutrition-label">carbs</div>
            </div>
            
            <div class="nutrition-item">
              <div class="nutrition-value fat">{{ data.food.fat }}g</div>
              <div class="nutrition-label">fat</div>
            </div>
          </div>
          
          <div class="serving-info">Per {{ data.food.servingSize }}</div>
        </div>

        <div class="quantity-inputs">
          <mat-form-field appearance="outline" color="primary">
            <mat-label>Number of servings</mat-label>
            <input 
              matInput 
              type="number"
              min="0.25" 
              step="0.25" 
              [(ngModel)]="quantity" 
              (input)="updateTotals()">
            <mat-icon matSuffix>local_dining</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" color="primary">
            <mat-label>Grams</mat-label>
            <input 
              matInput 
              type="number" 
              min="1"
              [(ngModel)]="servingSize" 
              (input)="updateTotals()">
            <span matSuffix>g</span>
          </mat-form-field>
        </div>

        <div class="totals-container">
          <h3>Total nutrition</h3>
          
          <div class="totals-grid">
            <div class="total-item">
              <div class="total-icon ccal">
                <mat-icon>local_fire_department</mat-icon>
              </div>
              <div class="total-content">
                <div class="total-value">{{ totalCalories | number:'1.0-0' }} kcal</div>
                <div class="total-label">Calories</div>
              </div>
            </div>
            
            <div class="total-item">
              <div class="total-icon protein">
                <mat-icon>fitness_center</mat-icon>
              </div>
              <div class="total-content">
                <div class="total-value">{{ totalProtein | number:'1.0-1' }}g</div>
                <div class="total-label">Protein</div>
              </div>
            </div>
            
            <div class="total-item">
              <div class="total-icon carbs">
                <mat-icon>bakery_dining</mat-icon>
              </div>
              <div class="total-content">
                <div class="total-value">{{ totalCarbs | number:'1.0-1' }}g</div>
                <div class="total-label">Carbs</div>
              </div>
            </div>
            
            <div class="total-item">
              <div class="total-icon fat">
                <mat-icon>egg_alt</mat-icon>
              </div>
              <div class="total-content">
                <div class="total-value">{{ totalFat | number:'1.0-1' }}g</div>
                <div class="total-label">Fat</div>
              </div>
            </div>
          </div>
        </div>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close class="cancel-button">Cancel</button>
        <button mat-raised-button color="primary" (click)="saveFood()" class="save-button">
          <mat-icon>add_circle</mat-icon>
          Add Food
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: `
    /* Fix for dialog background */
    ::ng-deep .mat-mdc-dialog-container {
      --mdc-dialog-container-color: white !important;
      border-radius: 16px !important;
      overflow: hidden;
    }
    
    .dialog-container {
      color: rgba(0, 0, 0, 0.87);
      background-color: white;
      min-width: 350px;
      max-width: 450px; 
      width: 100%;
      box-sizing: border-box; 
      overflow-x: hidden;
      overflow-y: hidden;

    }
    
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 8px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    }
    
    /* Dialog title */
    .mat-mdc-dialog-title {
      color: rgba(0, 0, 0, 0.87) !important;
      font-size: 20px !important;
      font-weight: 500 !important;
      display: flex !important;
      align-items: center !important;
      letter-spacing: 0.15px;
      margin-bottom: 0 !important;
  
      mat-icon {
        margin-right: 8px;
        font-size: 24px;
        height: 24px;
        width: 24px;
        padding: 4px;
        border-radius: 50%;
        
        &.protein {
          background-color: rgba(76, 175, 80, 0.12);
          color: #4caf50;
        }
        
        &.carbs {
          background-color: rgba(33, 150, 243, 0.12);
          color: #2196f3;
        }
        
        &.fat {
          background-color: rgba(255, 152, 0, 0.12);
          color: #ff9800;
        }
        
        &.mixed {
          background-color: rgba(156, 39, 176, 0.12);
          color: #9c27b0;
        }
      }
    }

    .close-button {
      margin-right: 8px;
      margin-top: -6px;
    }
    
    
    /* Dialog content and scrolling fix */
    ::ng-deep .mat-mdc-dialog-content {
      display: block !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
      overflow-x: hidden !important;
      overflow-y: hidden !important;

      padding: 0 20px !important;
    }
    
    /* Fix for number input wheel event */
    ::ng-deep input[type=number] {
      -moz-appearance: textfield; /* Firefox */
    }
    
    ::ng-deep input::-webkit-outer-spin-button,
    ::ng-deep input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    
    /* Form field text color */
    ::ng-deep .mat-mdc-form-field-input-control {
      color: rgba(0, 0, 0, 0.87) !important;
    }
    
    /* Form field label color */
    ::ng-deep .mat-mdc-form-field-label {
      color: rgba(0, 0, 0, 0.6) !important;
    }
    
    /* Form field focus color */
    ::ng-deep .mat-mdc-form-field.mat-focused .mat-mdc-form-field-ripple {
      background-color: #673ab7 !important;
    }
    
    /* Food info section */
    .food-info {
      margin-bottom: 24px;
      margin-top: 24px;
      padding: 16px;
      border-radius: 12px;
      background-color: rgba(0, 0, 0, 0.03);
      color: rgba(0, 0, 0, 0.87);
      box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.05);
      animation: fadeIn 0.3s ease-out;
    }
    
    .food-title {
      font-size: 18px;
      font-weight: 500;
      margin-bottom: 12px;
      color: #673ab7;
      letter-spacing: 0.15px;
    }
    
    .nutrition-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
      gap: 8px;
      margin: 16px 0;
    }
    
    .nutrition-item {
      text-align: center;
      width: 100%;
      box-sizing: border-box;
    }
    
    .nutrition-value {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 4px;
      
      &.ccal {
        color: #3F51B5;
      }
      
      &.protein {
        color: #4caf50;
      }
      
      &.carbs {
        color: #2196f3;
      }
      
      &.fat {
        color: #ff9800;
      }
    }
    
    .nutrition-label {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .serving-info {
      font-style: italic;
      font-size: 13px;
      color: rgba(0, 0, 0, 0.6);
      text-align: center;
      margin-top: 8px;
    }
    
    /* Quantity inputs */
    .quantity-inputs {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin: 16px 0;
      width: 100%;
    }
    
    .quantity-inputs mat-form-field {
      flex: 1;
      min-width: 120px;
      box-sizing: border-box;
    }
    
    /* Total nutrition section */
    .totals-container {
      background-color: rgba(103, 58, 183, 0.05);
      border-radius: 12px;
      padding: 16px;
      color: rgba(0, 0, 0, 0.87);
      animation: fadeIn 0.3s ease-out;
    }
    
    .totals-container h3 {
      margin-top: 0;
      margin-bottom: 16px;
      color: #673ab7;
      font-size: 16px;
      font-weight: 500;
      letter-spacing: 0.15px;
    }
    
    .totals-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      gap: 16px;
      margin-top: 16px;
      width: 100%;
    }
    
    .total-item {
      display: flex;
      align-items: center;
      width: 100%;
      box-sizing: border-box;
    }
    
    .total-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 8px;
      margin-right: 12px;
      
      &.ccal {
        background-color: rgba(63, 81, 181, 0.15);
        color: #3F51B5;
      }
      
      &.protein {
        background-color: rgba(76, 175, 80, 0.15);
        color: #4caf50;
      }
      
      &.carbs {
        background-color: rgba(33, 150, 243, 0.15);
        color: #2196f3;
      }
      
      &.fat {
        background-color: rgba(255, 152, 0, 0.15);
        color: #ff9800;
      }
    }
    
    .total-content {
      flex: 1;
    }
    
    .total-value {
      font-size: 16px;
      font-weight: 500;
      line-height: 1.2;
    }
    
    .total-label {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
    }
    
    /* Dialog actions */
    ::ng-deep .mat-mdc-dialog-actions {
      /* padding: 12px 24px 24px !important; */
      gap: 16px;
    }
    
    .cancel-button {
      color: rgba(0, 0, 0, 0.6) !important;
      letter-spacing: 0.5px;
    }
    
    .save-button {
      background-color: #673ab7 !important;
      color: white !important;
      /* font-weight: 500 !important; */
      /* letter-spacing: 0.5px; */
      /* padding: 0 24px !important; */
      
      mat-icon {
        margin-right: 8px;
      }
    }
    
    /* Add a more specific rule to prevent horizontal overflow */
    ::ng-deep .mat-mdc-dialog-surface {
      overflow-x: hidden !important;
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
  
  // Add this helper method to categorize foods
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
  
  // Add this helper method to get appropriate icons
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