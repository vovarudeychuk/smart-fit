import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { NutritionService } from '../../services/nutrition.service';
import { FoodQuantityDialogComponent, ConfirmDialogComponent, FoodMoveCopyDialogComponent } from '../shared/dialogs';
import { FoodItem } from '../../models/food-item.model';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-food-list',
  standalone: true,
  imports: [CommonModule, MatListModule, MatIconModule, MatButtonModule, DragDropModule],
  template: `
  <div class="food-list-container">
    <div class="food-list mat-elevation-z1">
      <div class="food-list-header">
        <h3 class="list-heading">Today's Food</h3>
        <span class="food-count" *ngIf="currentDay().foodItems.length > 0">
          {{ currentDay().foodItems.length }} items
        </span>
      </div>
      
      @if (currentDay().foodItems.length > 0) {
        <mat-list cdkDropList 
          id="food-list" 
          [cdkDropListData]="currentDay().foodItems" 
          [cdkDropListConnectedTo]="getDropListIds()"
          (cdkDropListDropped)="drop($event)">
          @for (food of currentDay().foodItems; track food.id + '-' + $index) {
            <mat-list-item cdkDrag [cdkDragData]="food">
              <div class="food-item-container">
                <div class="food-item-left">
                  <div class="drag-handle" cdkDragHandle>
                    <mat-icon>drag_indicator</mat-icon>
                  </div>
                  
                  <div class="food-icon" [ngClass]="getFoodCategory(food)">
                    <mat-icon>{{getFoodIcon(food)}}</mat-icon>
                  </div>
                </div>
                
                <div class="food-item">
                  <div class="food-name-row">
                    <span class="food-name">{{ food.name }}</span>
                    <span class="calories">{{ food.calories }} kcal</span>
                  </div>
                  <div class="food-details">
                    <div class="macros">
                      <span class="macro protein">P: {{ food.protein }}g</span>
                      <span class="macro carbs">C: {{ food.carbs }}g</span>
                      <span class="macro fat">F: {{ food.fat }}g</span>
                    </div>
                    <span class="serving-size">({{ food.servingSize }})</span>
                  </div>
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
  </div>
`,
  styles: `
    .food-list-container {
      width: 100%;
      padding: 0;
    }
    
    .food-list {
      background-color: white;
      border-radius: 12px;
      margin: 0 0 24px;
      overflow: hidden;
    }
    
    .food-list-header {
      background-color: #f8f8f8;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      
      @media (max-width: 480px) {
        padding: 12px;
      }
    }
    
    .list-heading {
      margin: 0;
      font-size: 18px;
      color: rgba(0, 0, 0, 0.87);
      font-weight: 500;
      
      @media (max-width: 480px) {
        font-size: 16px;
      }
    }
    
    .food-count {
      color: rgba(0, 0, 0, 0.6);
      font-size: 14px;
      
      @media (max-width: 480px) {
        font-size: 12px;
      }
    }
    
    .empty-message {
      padding: 20px 16px;
      text-align: center;
      color: rgba(0, 0, 0, 0.6);
    }
    
    .food-item-container {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 12px 0;
      
      @media (max-width: 480px) {
        padding: 8px 0;
      }
    }
    
    .food-item-left {
      display: flex;
      align-items: center;
    }
    
    .drag-handle {
      cursor: move;
      color: rgba(0, 0, 0, 0.3);
      margin-right: 4px;
      
      &:hover {
        color: rgba(0, 0, 0, 0.6);
      }
      
      @media (max-width: 480px) {
        margin-right: 0;
        
        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          line-height: 18px;
        }
      }
    }
    
    .food-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 8px;
      margin-right: 16px;
      
      &.protein {
        background-color: rgba(76, 175, 80, 0.1);
        
        mat-icon {
          color: #4caf50;
        }
      }
      
      &.carbs {
        background-color: rgba(33, 150, 243, 0.1);
        
        mat-icon {
          color: #2196f3;
        }
      }
      
      &.fat {
        background-color: rgba(255, 152, 0, 0.1);
        
        mat-icon {
          color: #ff9800;
        }
      }
      
      &.mixed {
        background-color: rgba(156, 39, 176, 0.1);
        
        mat-icon {
          color: #9c27b0;
        }
      }
      
      @media (max-width: 480px) {
        width: 28px;
        height: 28px;
        margin-right: 8px;
        border-radius: 6px;
        
        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
          line-height: 16px;
        }
      }
    }
    
    .food-item {
      flex: 1;
      margin: 0 12px;
      display: flex;
      flex-direction: column;
      
      @media (max-width: 480px) {
        margin: 0 6px;
      }
    }
    
    .food-name-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }
    
    .food-name {
      font-weight: 500;
      font-size: 16px;
      
      @media (max-width: 480px) {
        font-size: 14px;
      }
    }
    
    .food-details {
      display: flex;
      align-items: center;
      margin-top: 6px;
      
      @media (max-width: 480px) {
        margin-top: 2px;
        flex-direction: column;
        align-items: flex-start;
      }
    }
    
    .calories {
      color: #9c27b0;
      font-weight: 500;
      font-size: 14px;
      
      @media (max-width: 480px) {
        font-size: 12px;
      }
    }
    
    .macros {
      display: flex;
      gap: 8px;
      
      @media (max-width: 480px) {
        gap: 4px;
        margin-top: 2px;
      }
    }
    
    .macro {
      font-size: 12px;
      padding: 2px 8px;
      border-radius: 4px;
      
      @media (max-width: 480px) {
        font-size: 10px;
        padding: 1px 6px;
        border-radius: 3px;
      }
    }
    
    .protein {
      background-color: rgba(76, 175, 80, 0.1);
      color: #4caf50;
    }
    
    .carbs {
      background-color: rgba(33, 150, 243, 0.1);
      color: #2196f3;
    }
    
    .fat {
      background-color: rgba(255, 152, 0, 0.1);
      color: #ff9800;
    }
    
    .serving-size {
      color: rgba(0, 0, 0, 0.6);
      font-size: 12px;
      margin-left: 16px;
      
      @media (max-width: 600px) {
        margin-left: 0;
        margin-top: 2px;
        font-size: 10px;
      }
    }
    
    .food-actions {
      display: flex;
      
      button {
        margin-left: 4px;
      }
      
      @media (max-width: 480px) {
        flex-direction: column;
        
        button {
          margin-left: 0;
          margin-bottom: 2px;
          
          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
            line-height: 18px;
          }
        }
      }
    }
    
    /* Override styles from the SCSS file */
    ::ng-deep .mat-mdc-list-item {
      padding: 4px 16px !important;
      height: auto !important;
      
      &:hover {
        background-color: rgba(0, 0, 0, 0.02);
      }
      
      @media (max-width: 480px) {
        padding: 2px 10px !important;
      }
    }
    
    ::ng-deep .mat-mdc-list-item:not(:last-child)::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 16px;
      right: 16px;
      height: 1px;
      background-color: rgba(0,0,0,0.06);
      
      @media (max-width: 480px) {
        left: 10px;
        right: 10px;
      }
    }
    
    /* Drag and drop styling */
    .cdk-drag-preview {
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
      border-radius: 4px;
      background-color: white;
      padding: 8px 16px;
    }

    /* Add drag handle cue */
    .cdk-drag-placeholder {
      opacity: 0;
    }

    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .mat-list.cdk-drop-list-dragging .mat-list-item:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
  `
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
    
    // Get current date from the nutritionService
    const currentDate = this.nutritionService.getCurrentDay().date;
    
    // Open dialog with this food
    const dialogRef = this.dialog.open(FoodQuantityDialogComponent, {
      width: '400px',
      maxWidth: '95vw',
      data: { 
        food: baseFood,
        initialQuantity: quantity,
        initialServingSize: servingSize,
        targetDate: new Date(currentDate)
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Food list - Edit food result:', result);
        
        // If the target date has changed, show the move/copy dialog
        if (result.targetDate && !this.isSameDay(result.targetDate, currentDate)) {
          console.log('Food list - Date was changed, asking user to move or copy');
          
          // Show the move/copy dialog to let the user decide
          const moveOrCopyDialogRef = this.dialog.open(FoodMoveCopyDialogComponent, {
            width: '450px',
            maxWidth: '95vw',
            data: {
              foodName: food.name,
              fromDate: new Date(currentDate),
              toDate: new Date(result.targetDate)
            }
          });
          
          moveOrCopyDialogRef.afterClosed().subscribe(action => {
            if (action === 'move') {
              // Move operation: delete from current day and add to new day
              console.log('Food list - User chose to move the food');
              this.nutritionService.deleteFoodItem(food.id.toString());
              
              // Navigate to the new date and add the updated food
              this.nutritionService.navigateToWeekContaining(result.targetDate);
              
              // Wait for navigation to complete before adding
              setTimeout(() => {
                this.nutritionService.addFoodItem(result.food);
              }, 150);
            } 
            else if (action === 'copy') {
              // Copy operation: keep in current day and add to new day
              console.log('Food list - User chose to copy the food');
              
              // First update the food in the current day
              this.nutritionService.updateFoodItem(food.id.toString(), result.food);
              
              // Then create a copy with a new ID for the target date
              const foodCopy = {
                ...result.food,
                id: Date.now() // New unique ID for the copy
              };
              
              // Navigate to the target date
              this.nutritionService.navigateToWeekContaining(result.targetDate);
              
              // Wait for navigation to complete before adding
              setTimeout(() => {
                this.nutritionService.addFoodItem(foodCopy);
              }, 150);
            }
            else {
              // Cancel operation: just update the food in the current day
              console.log('Food list - User cancelled move/copy operation');
              this.nutritionService.updateFoodItem(food.id.toString(), result.food);
            }
          });
        } else {
          // Just update the food in the current day (no date change)
          console.log('Food list - Updating food in current day');
          this.nutritionService.updateFoodItem(food.id.toString(), result.food);
        }
      }
    });
  }
  
  // Helper method to check if two dates are the same day
  private isSameDay(date1: Date, date2: Date): boolean {
    date1 = new Date(date1);
    date2 = new Date(date2);
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }
  
  deleteFood(food: FoodItem): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      maxWidth: '95vw',
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