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
      <div class="dashboard-content">
        <div class="main-column">
          <mat-card>
            <mat-card-header>
              <mat-card-title>Your Food Journal</mat-card-title>
              <mat-card-subtitle>Track what you eat and your progress</mat-card-subtitle>
            </mat-card-header>
            
            <mat-card-content>
              <app-day-navigator></app-day-navigator>
              
              <mat-divider class="divider"></mat-divider>
              
              <app-food-list></app-food-list>
            </mat-card-content>
          </mat-card>
        </div>
        
        <div class="side-column">
          <mat-card>
            <mat-card-header>
              <mat-card-title>Daily Progress</mat-card-title>
              <mat-card-subtitle>Your nutritional goals for today</mat-card-subtitle>
            </mat-card-header>
            
            <mat-card-content>
              <div class="progress-section">
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
            </mat-card-content>
          </mat-card>
          
          <mat-card>
            <mat-card-header>
              <mat-card-title>Tips</mat-card-title>
              <mat-card-subtitle>Helpful information</mat-card-subtitle>
            </mat-card-header>
            
            <mat-card-content>
              <div class="tip-content">
                <mat-icon color="primary">lightbulb</mat-icon>
                <p>Try to balance your macronutrients throughout the day for sustained energy.</p>
              </div>
              
              <div class="tip-content">
                <mat-icon color="primary">water_drop</mat-icon>
                <p>Don't forget to stay hydrated! Aim for at least 8 glasses of water daily.</p>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
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