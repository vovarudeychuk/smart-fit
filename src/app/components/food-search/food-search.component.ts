import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { NutritionService } from '../../services/nutrition.service';
import { FoodItem } from '../../models/food-item.model';
import { FoodQuantityDialogComponent } from '../shared/dialogs';
import { debounceTime, distinctUntilChanged, filter, map, switchMap } from 'rxjs/operators';
import { Observable, of, startWith } from 'rxjs';

@Component({
  selector: 'app-food-search',
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
    <div class="food-search">
      <mat-form-field appearance="outline" class="search-field">
        <mat-label>Search for food</mat-label>
        <input matInput
               type="text"
               placeholder="Example: chicken, rice, etc."
               [formControl]="searchControl"
               [matAutocomplete]="auto">
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
        <div class="search-results mat-elevation-z2">
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
    </div>
  `,
  styleUrl: './food-search.component.scss'
})
export class FoodSearchComponent {
  private nutritionService = inject(NutritionService);
  private dialog = inject(MatDialog);
  
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
  }
  
  clearSearch() {
    this.searchControl.setValue('');
    this.searchResults.set([]);
  }
  
  openFoodDialog(food: FoodItem) {
    const dialogRef = this.dialog.open(FoodQuantityDialogComponent, {
      width: '400px',
      data: { food }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.nutritionService.addFoodItem(result.food);
        this.clearSearch();
      }
    });
  }
  
  addFood(food: FoodItem) {
    this.nutritionService.addFoodItem({...food});
    this.clearSearch();
  }
} 