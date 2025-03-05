import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { NutritionService } from '../../services/nutrition.service';
import { FoodQuantityDialogComponent } from '../food-quantity-dialog/food-quantity-dialog.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { FoodItem } from '../../models/food-item.model';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-food-list',
  standalone: true,
  imports: [CommonModule, MatListModule, MatIconModule, MatButtonModule, DragDropModule],
  template: `
  <div class="food-list mat-elevation-z1">
    @if (currentDay().foodItems.length > 0) {
      <mat-list cdkDropList 
        id="food-list" 
        [cdkDropListData]="currentDay().foodItems" 
        [cdkDropListConnectedTo]="getDropListIds()"
        (cdkDropListDropped)="drop($event)">
        @for (food of currentDay().foodItems; track food.id + '-' + $index) {
          <mat-list-item cdkDrag [cdkDragData]="food">
            <div class="food-item-container">
              <div class="drag-handle" cdkDragHandle>
                <mat-icon>drag_indicator</mat-icon>
              </div>
              
              <div class="food-icon" [ngClass]="getFoodCategory(food)">
                <mat-icon>{{getFoodIcon(food)}}</mat-icon>
              </div>
              
              <div class="food-item">
                <span class="food-name">{{ food.name }}</span>
                <span class="food-details">
                  <span [style.color]="'#9c27b0'">{{ food.calories }} kcal</span> | 
                  <span [style.color]="'#4caf50'">P: {{ food.protein }}g</span> | 
                  <span [style.color]="'#2196f3'">C: {{ food.carbs }}g</span> | 
                  <span [style.color]="'#ff9800'">F: {{ food.fat }}g</span> | 
                  ({{ food.servingSize }})
                </span>
              </div>
              <div class="food-actions">
                <button mat-icon-button color="primary" (click)="editFood(food)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="deleteFood(food)">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
          </mat-list-item>
        }
      </mat-list>
    } @else {
      <p class="empty-message">No food items added yet for this day.</p>
    }
  </div>
`,
  styleUrl: './food-list.component.scss'
})
export class FoodListComponent {
  private nutritionService = inject(NutritionService);
  private dialog = inject(MatDialog);
  
  currentDay = computed(() => this.nutritionService.getCurrentDay());
  
  getDropListIds(): string[] {
    return Array.from({ length: 7 }, (_, i) => `day-${i}`);
  }
  
  editFood(food: FoodItem): void {
    // Extract quantity and serving size from the food item
    let quantity = 1;
    let servingSize = 100;
    
    // Check if the serving size has the expected format (e.g., "2 x 150g")
    const servingSizeMatch = food.servingSize.match(/^(\d+(?:\.\d+)?)\s*x\s*(\d+)g$/);
    if (servingSizeMatch) {
      quantity = parseFloat(servingSizeMatch[1]);
      servingSize = parseInt(servingSizeMatch[2], 10);
    }
    
    // Create a base food item with standard values per 100g
    const baseFood: FoodItem = {
      ...food,
      calories: food.calories / (quantity * (servingSize / 100)),
      protein: food.protein / (quantity * (servingSize / 100)),
      carbs: food.carbs / (quantity * (servingSize / 100)),
      fat: food.fat / (quantity * (servingSize / 100)),
      servingSize: '100g' // Reset to standard serving
    };
    
    // Open dialog with this food
    const dialogRef = this.dialog.open(FoodQuantityDialogComponent, {
      width: '400px',
      data: { 
        food: baseFood,
        initialQuantity: quantity,
        initialServingSize: servingSize
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Update the food item - convert id to string
        this.nutritionService.updateFoodItem(food.id.toString(), result.food);
      }
    });
  }
  
  deleteFood(food: FoodItem): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Food Item',
        message: `Are you sure you want to remove ${food.name} from your food log?`
      }
    });
    
    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        // Convert id to string
        this.nutritionService.deleteFoodItem(food.id.toString());
      }
    });
  }

  drop(event: CdkDragDrop<FoodItem[]>): void {
    if (event.previousContainer === event.container) {
      // Handle reordering within food list
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.nutritionService.reorderFoodItems(event.container.data);
    }
  }

  // Add these new methods for food categorization
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