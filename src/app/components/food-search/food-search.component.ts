import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NutritionService } from '../../services/nutrition.service';
import { FoodSearchDialogComponent } from '../shared/dialogs/food-search-dialog/food-search-dialog.component';
import { FoodQuantityDialogComponent } from '../shared/dialogs/food-quantity-dialog/food-quantity-dialog.component';

@Component({
  selector: 'app-food-search',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  template: `
    <div class="add-food-button-container">
      <button 
        mat-fab 
        color="primary" 
        (click)="openSearchDialog()"
        matTooltip="Add food"
        aria-label="Add food button">
        <mat-icon>add</mat-icon>
      </button>
    </div>
  `,
  styles: `
    .add-food-button-container {
      display: flex;
      justify-content: center;
      margin: 16px 0;
      
      button {
        background-color: #673ab7;
        transform: scale(1);
        transition: transform 0.2s ease;
        
        &:hover {
          transform: scale(1.05);
        }
      }
    }
  `
})
export class FoodSearchComponent {
  private dialog = inject(MatDialog);
  private nutritionService = inject(NutritionService);
  
  openSearchDialog() {
    const dialogRef = this.dialog.open(FoodSearchDialogComponent, {
      width: '90%',
      maxWidth: '600px',
      maxHeight: '80vh',
      panelClass: 'search-dialog'
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.action === 'openQuantityDialog') {
        // Open the food quantity dialog
        this.openFoodQuantityDialog(result.food);
      }
    });
  }
  
  openFoodQuantityDialog(food: any) {
    const dialogRef = this.dialog.open(FoodQuantityDialogComponent, {
      width: '400px',
      data: { food }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.nutritionService.addFoodItem(result.food);
      }
    });
  }
} 