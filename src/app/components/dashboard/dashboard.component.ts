import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { NutritionService } from '../../services/nutrition.service';
import { DayNavigatorComponent } from '../day-navigator/day-navigator.component';
import { FoodListComponent } from '../food-list/food-list.component';
import { FoodSearchComponent } from '../food-search/food-search.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    MatCardModule, 
    MatProgressBarModule, 
    MatIconModule, 
    MatButtonModule,
    MatDividerModule,
    DayNavigatorComponent,
    FoodListComponent,
    FoodSearchComponent
  ],
  template: `
    <div class="dashboard-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>SmartFit Nutrition Tracker</mat-card-title>
          <mat-card-subtitle>Keep track of your daily nutrition goals</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <app-day-navigator></app-day-navigator>
          
          <div class="progress-section">
            <h3>Daily Progress</h3>
            
            <div class="progress-item">
              <div class="progress-label">
                <span>Calories</span>
                <span>{{ currentDay().totalCalories }} / {{ calorieGoal }} kcal</span>
              </div>
              <mat-progress-bar 
                mode="determinate" 
                [value]="caloriePercentage()" 
                [color]="caloriePercentage() > 100 ? 'warn' : 'primary'">
              </mat-progress-bar>
            </div>
            
            <div class="progress-item">
              <div class="progress-label">
                <span>Protein</span>
                <span>{{ currentDay().totalProtein | number:'1.0-1' }} / {{ proteinGoal }}g</span>
              </div>
              <mat-progress-bar 
                mode="determinate" 
                [value]="proteinPercentage()" 
                [color]="proteinPercentage() > 100 ? 'warn' : 'accent'">
              </mat-progress-bar>
            </div>
            
            <div class="progress-item">
              <div class="progress-label">
                <span>Carbs</span>
                <span>{{ currentDay().totalCarbs | number:'1.0-1' }} / {{ carbsGoal }}g</span>
              </div>
              <mat-progress-bar 
                mode="determinate" 
                [value]="carbsPercentage()"
                [color]="carbsPercentage() > 100 ? 'warn' : 'primary'">
              </mat-progress-bar>
            </div>
            
            <div class="progress-item">
              <div class="progress-label">
                <span>Fat</span>
                <span>{{ currentDay().totalFat | number:'1.0-1' }} / {{ fatGoal }}g</span>
              </div>
              <mat-progress-bar 
                mode="determinate" 
                [value]="fatPercentage()"
                [color]="fatPercentage() > 100 ? 'warn' : 'accent'">
              </mat-progress-bar>
            </div>
          </div>
          
          <mat-divider class="divider"></mat-divider>
          
          <h3>Today's Food</h3>
          <app-food-list></app-food-list>
          
          <mat-divider class="divider"></mat-divider>
          
          <h3>Add Food</h3>
          <app-food-search></app-food-search>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  private nutritionService = inject(NutritionService);
  
  // Get reference to current day data
  currentDay = computed(() => this.nutritionService.getCurrentDay());
  
  // Convenience getters for nutritional goals
  calorieGoal = this.nutritionService.getCalorieGoal();
  proteinGoal = this.nutritionService.getProteinGoal();
  carbsGoal = this.nutritionService.getCarbsGoal();
  fatGoal = this.nutritionService.getFatGoal();
  
  // Calculate percentages for progress bars
  caloriePercentage = computed(() => 
    (this.currentDay().totalCalories / this.calorieGoal) * 100
  );
  
  proteinPercentage = computed(() => 
    (this.currentDay().totalProtein / this.proteinGoal) * 100
  );
  
  carbsPercentage = computed(() => 
    (this.currentDay().totalCarbs / this.carbsGoal) * 100
  );
  
  fatPercentage = computed(() => 
    (this.currentDay().totalFat / this.fatGoal) * 100
  );
} 