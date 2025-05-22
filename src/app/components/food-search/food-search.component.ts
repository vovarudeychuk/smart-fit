import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { trigger, transition, style, animate } from '@angular/animations';
import { NutritionService } from '../../services/nutrition.service';
import { FoodSearchDialogComponent } from '../shared/dialogs/food-search-dialog/food-search-dialog.component';
import { FoodQuantityDialogComponent, FoodMoveCopyDialogComponent } from '../shared/dialogs';

@Component({
  selector: 'app-food-search',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  animations: [
    trigger('buttonAnimation', [
      transition(':enter', [
        style({ transform: 'scale(0)', opacity: 0 }),
        animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)', 
          style({ transform: 'scale(1)', opacity: 1 }))
      ])
    ])
  ],
  template: `
    <div class="add-food-button-container">
      <button 
        mat-fab 
        extended
        color="primary" 
        (click)="openSearchDialog()"
        matTooltip="Search and add food"
        aria-label="Add food button"
        @buttonAnimation>
        <mat-icon>add</mat-icon>
        Add Food
      </button>
    </div>
  `,
  styles: `
    .add-food-button-container {
      display: flex;
      justify-content: center;
      margin: 24px 0;
      color: white;
      
      button {
        background-color: #673ab7;
        
        transform: scale(1);
        transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
        box-shadow: 0 4px 12px rgba(103, 58, 183, 0.3);
        padding: 0 24px;
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(103, 58, 183, 0.4);
        }
        
        mat-icon {
          margin-right: 8px;
        }
      }
      
      /* Responsive styles */
      @media (max-width: 599px) {
        button {
          padding: 0 16px;
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
      panelClass: ['search-dialog', 'mat-elevation-z8'],
      autoFocus: false,
      restoreFocus: true
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.action === 'openQuantityDialog') {
        // Open the food quantity dialog
        this.openFoodQuantityDialog(result.food);
      }
    });
  }
  
  openFoodQuantityDialog(food: any) {
    // Use current date as default target date
    const currentDate = this.nutritionService.getCurrentDay().date;
    
    const dialogRef = this.dialog.open(FoodQuantityDialogComponent, {
      width: '90%',
      maxWidth: '450px',
      data: { 
        food,
        targetDate: new Date(currentDate)
      },
      panelClass: ['quantity-dialog', 'mat-elevation-z8']
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Food search - Food quantity dialog result:', result);
        
        // If a specific date was selected, navigate to that date and add the food
        if (result.targetDate && !this.isSameDay(new Date(currentDate), new Date(result.targetDate))) {
          // Show the move/copy dialog to let the user decide
          const moveOrCopyDialogRef = this.dialog.open(FoodMoveCopyDialogComponent, {
            width: '450px',
            maxWidth: '95vw',
            data: {
              foodName: result.food.name,
              fromDate: new Date(currentDate),
              toDate: new Date(result.targetDate)
            }
          });
          
          moveOrCopyDialogRef.afterClosed().subscribe(action => {
            if (action === 'move' || action === 'copy') {
              // Both move and copy are the same for a newly added item
              // since it hasn't been added to any day yet
              console.log(`Food search - User chose to ${action} the food`);
              
              // Navigate to the selected date and then add food item
              this.nutritionService.navigateToWeekContaining(result.targetDate).subscribe({
                complete: () => {
                  this.nutritionService.addFoodItem(result.food);
                },
                error: (err) => {
                  console.error('Error navigating to week or adding food item:', err);
                  // Optionally, display a snackbar or other error indication to the user
                }
              });
            }
            // If canceled, do nothing
          });
        } else {
          // Just add to current day
          this.nutritionService.addFoodItem(result.food);
        }
      }
    });
  }
  
  // Helper method to check if two dates are the same day
  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }
} 