import { Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { NutritionService } from '../../services/nutrition.service';
import { DayNavigatorComponent } from '../day-navigator/day-navigator.component';
import { FoodListComponent } from '../food-list/food-list.component';
import { NutritionProgressBarComponent } from '../shared/nutrition-progress-bar/nutrition-progress-bar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    DayNavigatorComponent,
    FoodListComponent,
    NutritionProgressBarComponent
],
  template: `
    <div class="dashboard-container">
      <mat-card>
        <mat-card-content>
          <app-day-navigator></app-day-navigator>

          <mat-divider class="divider"></mat-divider>
          
          <div class="progress-section">
            <h3>Daily Progress</h3>
            
            <div class="progress-grid">
              <app-nutrition-progress-bar
                label="Calories"
                [currentValue]="currentDay().totalCalories"
                [goalValue]="calorieGoal"
                unit="kcal"
                color="ccal"
                >
              </app-nutrition-progress-bar>
              
              <app-nutrition-progress-bar
                label="Protein"
                [currentValue]="currentDay().totalProtein"
                [goalValue]="proteinGoal"
                unit="g"
                color="protein">
              </app-nutrition-progress-bar>
              
              <app-nutrition-progress-bar
                label="Carbs"
                [currentValue]="currentDay().totalCarbs"
                [goalValue]="carbsGoal"
                unit="g"
                color="carbs">
              </app-nutrition-progress-bar>
              
              <app-nutrition-progress-bar
                label="Fat"
                [currentValue]="currentDay().totalFat"
                [goalValue]="fatGoal"
                unit="g"
                color="fat">
              </app-nutrition-progress-bar>
            </div>
          </div>
          
          <mat-divider class="divider"></mat-divider>
          
          <h3>Today's Food</h3>
          <app-food-list></app-food-list>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private nutritionService = inject(NutritionService);
  
  // Get reference to current day data
  currentDay = computed(() => this.nutritionService.getCurrentDay());
  
  // Convenience getters for nutritional goals
  calorieGoal = this.nutritionService.getCalorieGoal();
  proteinGoal = this.nutritionService.getProteinGoal();
  carbsGoal = this.nutritionService.getCarbsGoal();
  fatGoal = this.nutritionService.getFatGoal();
  
  ngOnInit(): void {
    // No initialization needed
  }
} 