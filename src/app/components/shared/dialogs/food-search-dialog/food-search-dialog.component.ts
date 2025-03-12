import { Component, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatRippleModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
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
    MatDialogModule,
    MatRippleModule,
    MatChipsModule
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
            @for (food of searchResults(); track food.id) {
              <div 
                class="food-result-item" 
                matRipple 
                (click)="addFood(food)"
              >
                <div class="food-item-content">
                  <div class="food-icon" [ngClass]="getFoodCategory(food)">
                    <mat-icon>{{getFoodIcon(food)}}</mat-icon>
                  </div>
                  <div class="food-details-container">
                    <span class="food-name">{{ food.name }}</span>
                    <div class="food-macros">
                      <span class="calories">{{ food.calories }} kcal</span>
                      <span class="divider">·</span>
                      <span class="macros">
                        <span class="protein">P: {{ food.protein }}g</span>
                        <span class="carbs">C: {{ food.carbs }}g</span>
                        <span class="fat">F: {{ food.fat }}g</span>
                      </span>
                    </div>
                    <div class="food-serving">
                      <mat-chip-option selected disableRipple>{{ food.servingSize }}</mat-chip-option>
                    </div>
                  </div>
                  <button mat-icon-button color="primary">
                    <mat-icon>add</mat-icon>
                  </button>
                </div>
              </div>
            }
          </div>
        } @else if (searchControl.value && searchControl.value.length >= 2) {
          <div class="no-results">
            <mat-icon>search_off</mat-icon>
            <p>No results found for "{{ searchControl.value }}"</p>
            <small>Try different keywords or check spelling</small>
          </div>
        } @else if (!searchControl.value) {
          <div class="quick-categories">
            <h3>Popular Categories</h3>
            <div class="category-grid">
              <div class="category-item" (click)="quickSearch('protein')">
                <div class="category-icon protein">
                  <mat-icon>fitness_center</mat-icon>
                </div>
                <div class="category-name">Protein</div>
              </div>
              <div class="category-item" (click)="quickSearch('carbs')">
                <div class="category-icon carbs">
                  <mat-icon>bakery_dining</mat-icon>
                </div>
                <div class="category-name">Carbs</div>
              </div>
              <div class="category-item" (click)="quickSearch('fat')">
                <div class="category-icon fat">
                  <mat-icon>egg_alt</mat-icon>
                </div>
                <div class="category-name">Fats</div>
              </div>
              <div class="category-item" (click)="quickSearch('fruit')">
                <div class="category-icon fruit">
                  <mat-icon>nutrition</mat-icon>
                </div>
                <div class="category-name">Fruits</div>
              </div>
            </div>
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
      max-height: 400px;
      overflow-y: auto;
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 12px;
      margin-top: 16px;
      background-color: white;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    }
    
    .food-result-item {
      padding: 12px 16px;
      cursor: pointer;
      transition: background-color 0.2s ease;
      border-bottom: 1px solid rgba(0, 0, 0, 0.04);
      
      &:last-child {
        border-bottom: none;
      }
      
      &:hover {
        background-color: rgba(0, 0, 0, 0.02);
      }
    }
    
    .food-item-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .food-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 40px;
      height: 40px;
      border-radius: 8px;
      
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
      
      &.fruit {
        background-color: rgba(156, 39, 176, 0.15);
        color: #9c27b0;
      }
      
      &.mixed {
        background-color: rgba(103, 58, 183, 0.15);
        color: #673ab7;
      }
    }
    
    .food-details-container {
      flex: 1;
      min-width: 0;
    }
    
    .food-macros {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 4px;
      color: rgba(0, 0, 0, 0.6);
      font-size: 14px;
      
      .calories {
        color: #9c27b0;
        font-weight: 500;
      }
      
      .divider {
        margin: 0 4px;
      }
      
      .protein {
        color: #4caf50;
        margin-right: 8px;
      }
      
      .carbs {
        color: #2196f3;
        margin-right: 8px;
      }
      
      .fat {
        color: #ff9800;
      }
    }
    
    .food-serving {
      margin-top: 8px;
      
      ::ng-deep .mdc-evolution-chip {
        height: 24px !important;
        font-size: 12px !important;
        background-color: rgba(103, 58, 183, 0.08) !important;
      }
      
      ::ng-deep .mat-mdc-chip-selected {
        background-color: rgba(103, 58, 183, 0.12) !important;
        color: #673ab7 !important;
      }
    }
    
    .quick-categories {
      margin-top: 20px;
      
      h3 {
        font-size: 16px;
        font-weight: 500;
        margin-bottom: 16px;
        color: rgba(0, 0, 0, 0.87);
      }
      
      .category-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 16px;
      }
      
      .category-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        padding: 16px 8px;
        border-radius: 12px;
        transition: all 0.2s ease;
        
        &:hover {
          background-color: rgba(0, 0, 0, 0.04);
          transform: translateY(-2px);
        }
        
        .category-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 12px;
          margin-bottom: 8px;
          
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
          
          &.fruit {
            background-color: rgba(156, 39, 176, 0.15);
            color: #9c27b0;
          }
        }
        
        .category-name {
          font-size: 14px;
          font-weight: 500;
        }
      }
    }
    
    .no-results {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 16px;
      text-align: center;
      color: rgba(0, 0, 0, 0.6);
      
      mat-icon {
        font-size: 48px;
        height: 48px;
        width: 48px;
        margin-bottom: 16px;
        color: rgba(0, 0, 0, 0.2);
      }
      
      p {
        font-size: 16px;
        margin-bottom: 8px;
      }
      
      small {
        font-size: 14px;
      }
    }
  `
})
export class FoodSearchDialogComponent implements AfterViewInit {
  private nutritionService = inject(NutritionService);
  private dialogRef = inject(MatDialogRef<FoodSearchDialogComponent>);
  
  @ViewChild('searchInput') searchInput!: ElementRef;
  
  searchControl = new FormControl('');
  filteredFoods: Observable<FoodItem[]>;
  searchResults = signal<FoodItem[]>([]);
  
  // Popular food categories for quick selection
  foodCategories = [
    { name: 'Protein', icon: 'fitness_center', class: 'protein', query: 'protein' },
    { name: 'Carbs', icon: 'bakery_dining', class: 'carbs', query: 'carbs' },
    { name: 'Fats', icon: 'egg_alt', class: 'fat', query: 'fat' },
    { name: 'Fruits', icon: 'nutrition', class: 'fruit', query: 'fruit' }
  ];
  
  constructor() {
    // Setup the autocomplete with debounce
    this.filteredFoods = this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      filter(value => typeof value === 'string'),
      switchMap((value: string) => {
        if (value && value.length >= 2) {
          const results = this.nutritionService.searchFoods(value);
          this.searchResults.set(results);
          return of(results.slice(0, 5)); // Show only top 5 in autocomplete
        } else {
          this.searchResults.set([]);
          return of([]);
        }
      })
    );
  }
  
  ngAfterViewInit() {
    // Auto-focus the search input after view is initialized
    setTimeout(() => {
      if (this.searchInput) {
        this.searchInput.nativeElement.focus();
      }
    }, 300);
  }
  
  clearSearch() {
    this.searchControl.setValue('');
    this.searchResults.set([]);
  }
  
  openFoodDialog(food: FoodItem) {
    // Close this dialog and tell parent to open quantity dialog
    this.dialogRef.close({ action: 'openQuantityDialog', food });
  }
  
  addFood(food: FoodItem) {
    this.openFoodDialog(food);
  }
  
  quickSearch(category: string) {
    this.searchControl.setValue(category);
  }
  
  // Helper methods for food categorization
  getFoodCategory(food: FoodItem): string {
    if (!food || food.calories === 0) return 'mixed';
    
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