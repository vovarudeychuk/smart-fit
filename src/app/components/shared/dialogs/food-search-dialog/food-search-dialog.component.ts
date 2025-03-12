import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs/operators';
import { Observable, of, startWith } from 'rxjs';
import { NutritionService } from '../../../../services/nutrition.service';
import { FoodItem } from '../../../../models/food-item.model';
import { FoodQuantityDialogComponent } from '../food-quantity-dialog/food-quantity-dialog.component';
import { signal } from '@angular/core';

@Component({
  selector: 'app-food-search-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    ReactiveFormsModule,
    MatInputModule, 
    MatFormFieldModule, 
    MatButtonModule,
    MatListModule,
    MatIconModule,
    MatAutocompleteModule,
    MatDialogModule
  ],
  template: `
    <div class="food-search-dialog">
      
      <mat-dialog-content>
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search for food</mat-label>
          <input matInput
                type="text"
                placeholder="Example: chicken, rice, etc."
                [formControl]="searchControl"
                [matAutocomplete]="auto"
                #searchInput>
          <button mat-icon-button matSuffix *ngIf="searchControl.value" (click)="clearSearch()">
            <mat-icon>close</mat-icon>
          </button>
          <mat-icon matPrefix>search</mat-icon>
          
          <mat-autocomplete #auto="matAutocomplete" (optionSelected)="openFoodDialog($event.option.value)">
            @for (food of filteredFoods | async; track food.id) {
              <mat-option [value]="food">
                <div class="food-option">
                  <span class="food-name">{{ food.name }}</span>
                  <span class="food-details">{{ food.calories }} kcal ({{ food.servingSize }})</span>
                </div>
              </mat-option>
            }
          </mat-autocomplete>
        </mat-form-field>
        
        @if (searchResults().length > 0) {
          <div class="search-results">
            <mat-list>
              @for (food of searchResults(); track food.id) {
                <mat-list-item (click)="addFood(food)">
                  <div class="food-item">
                    <span class="food-name">{{ food.name }}</span>
                    <span class="food-details">
                      {{ food.calories }} kcal | 
                      P: {{ food.protein }}g | 
                      C: {{ food.carbs }}g | 
                      F: {{ food.fat }}g | 
                      ({{ food.servingSize }})
                    </span>
                  </div>
                  <button mat-icon-button color="primary">
                    <mat-icon>add</mat-icon>
                  </button>
                </mat-list-item>
              }
            </mat-list>
          </div>
        }
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close class="cancel-button">Cancel</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: `
    .food-search-dialog {
      max-width: 600px;
      width: 100%;
      overflow-x: hidden;
    }
    
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    }
    
    ::ng-deep .mat-mdc-dialog-title {
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
        background-color: rgba(103, 58, 183, 0.12);
        color: #673ab7;
      }
    }
    
    ::ng-deep .mat-mdc-form-field {
      width: 100%;
    }
    
    ::ng-deep .mat-mdc-text-field-wrapper {
      border-radius: 8px !important;
      background-color: rgba(0, 0, 0, 0.02) !important;
    }
    
    // Ensure autocomplete text is visible
    ::ng-deep .mat-mdc-autocomplete-panel {
      background-color: white !important; 
      color: rgba(0, 0, 0, 0.87) !important;
    }
    
    ::ng-deep .mat-mdc-option {
      color: rgba(0, 0, 0, 0.87) !important;
    }
    
    .food-option {
      display: flex;
      flex-direction: column;
      color: rgba(0, 0, 0, 0.87) !important;
    }
    
    .food-name {
      font-weight: 500;
      color: rgba(0, 0, 0, 0.87) !important;
    }
    
    .food-details {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6) !important;
    }
    
    ::ng-deep .mat-mdc-option {
      min-height: 56px !important;
    }
    
    // Fix highlight colors
    ::ng-deep .mat-mdc-option:hover,
    ::ng-deep .mat-mdc-option.mat-mdc-option-active {
      background-color: rgba(0, 0, 0, 0.04) !important;
    }
    
    ::ng-deep .mat-mdc-option.mdc-list-item--selected {
      background-color: rgba(103, 58, 183, 0.12) !important;
    }
    
    // Input text color
    ::ng-deep .mat-mdc-input-element {
      color: rgba(0, 0, 0, 0.87) !important;
    }
    
    .search-results {
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 8px;
      margin-top: 8px;
      background-color: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    ::ng-deep .mat-mdc-list-item {
      cursor: pointer;
      transition: background-color 0.2s ease;
      
      &:hover {
        background-color: rgba(0, 0, 0, 0.04);
      }
    }
    
    .food-item {
      display: flex;
      flex-direction: column;
      width: 100%;
    }
  `
})
export class FoodSearchDialogComponent {
  private nutritionService = inject(NutritionService);
  private dialogRef = inject(MatDialogRef<FoodSearchDialogComponent>);
  
  searchControl = new FormControl('');
  filteredFoods: Observable<FoodItem[]>;
  searchResults = signal<FoodItem[]>([]);
  
  constructor() {
    // Setup the autocomplete with debounce
    this.filteredFoods = this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      filter(value => typeof value === 'string'),
      switchMap((value: string) => {
        return value && value.length >= 2 
          ? of(this.nutritionService.searchFoods(value))
          : of([]);
      })
    );
    
    // Auto-focus the search input when dialog opens
    setTimeout(() => {
      const searchInput = document.querySelector('.food-search-dialog input') as HTMLElement;
      if (searchInput) {
        searchInput.focus();
      }
    }, 0);
  }
  
  clearSearch() {
    this.searchControl.setValue('');
    this.searchResults.set([]);
  }
  
  openFoodDialog(food: FoodItem) {
    // Close this dialog
    this.dialogRef.close({ action: 'openQuantityDialog', food });
  }
  
  addFood(food: FoodItem) {
    this.nutritionService.addFoodItem({...food});
    this.dialogRef.close();
  }
} 