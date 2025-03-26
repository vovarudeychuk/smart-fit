import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from './services/auth.service';
import { FoodSearchDialogComponent } from './components/shared/dialogs/food-search-dialog/food-search-dialog.component';
import { FoodQuantityDialogComponent } from './components/shared/dialogs/food-quantity-dialog/food-quantity-dialog.component';
import { NutritionService } from './services/nutrition.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    RouterLink,
    RouterLinkActive,
    MatToolbarModule, 
    MatButtonModule, 
    MatIconModule,
    MatMenuModule,
    MatDialogModule
  ],
  template: `
    <div class="app-container">
      <div class="content">
        <router-outlet></router-outlet>
      </div>
      
      <!-- Bottom Navigation Bar -->
      <div class="bottom-nav">
        @if (authService.isAuthenticated()) {
          <div class="nav-button" routerLink="/dashboard" routerLinkActive="active">
            <mat-icon>dashboard</mat-icon>
            <span>Dashboard</span>
          </div>
          
          <div class="nav-button" routerLink="/journal" routerLinkActive="active">
            <mat-icon>book</mat-icon>
            <span>Journal</span>
          </div>
          
          <div class="nav-button" (click)="openAddFoodModal()">
            <mat-icon>add_circle</mat-icon>
            <span>Add Food</span>
          </div>
          
          <div class="nav-button" [matMenuTriggerFor]="menu">
            <mat-icon>more_vert</mat-icon>
            <span>More</span>
          </div>
          
          <mat-menu #menu="matMenu">
            <button mat-menu-item routerLink="/profile">
              <mat-icon>person</mat-icon>
              <span>Profile</span>
            </button>
            <button mat-menu-item (click)="logout()">
              <mat-icon>exit_to_app</mat-icon>
              <span>Logout</span>
            </button>
          </mat-menu>
        } @else {
          <div class="nav-button" routerLink="/login" routerLinkActive="active">
            <mat-icon>login</mat-icon>
            <span>Login</span>
          </div>
          <div class="nav-button" routerLink="/register" routerLinkActive="active">
            <mat-icon>person_add</mat-icon>
            <span>Register</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100%;
    }
    
    .content {
      flex: 1;
      overflow-y: auto;
      padding-bottom: 70px; /* Make room for bottom nav */
    }
    
    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 60px;
      background-color: #3f51b5;
      color: white;
      display: flex;
      justify-content: space-around;
      align-items: center;
      box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.1);
      z-index: 1000;
    }
    
    .nav-button {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      flex: 1;
      cursor: pointer;
      transition: background-color 0.3s;
      padding: 0 12px;
    }
    
    .nav-button:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
    
    .nav-button.active {
      background-color: rgba(255, 255, 255, 0.2);
    }
    
    .nav-button mat-icon {
      margin-bottom: 2px;
    }
    
    .nav-button span {
      font-size: 12px;
    }
  `]
})
export class AppComponent {
  authService = inject(AuthService);
  dialog = inject(MatDialog);
  nutritionService = inject(NutritionService);
  
  logout(): void {
    this.authService.logout();
  }

  openAddFoodModal(): void {
    const searchDialogRef = this.dialog.open(FoodSearchDialogComponent, {
      width: '90%',
      maxWidth: '600px',
      maxHeight: '80vh',
      panelClass: ['search-dialog', 'mat-elevation-z8'],
      autoFocus: false,
      restoreFocus: true
    });

    searchDialogRef.afterClosed().subscribe(result => {
      if (result && result.action === 'openQuantityDialog') {
        // Open the food quantity dialog
        this.openFoodQuantityDialog(result.food);
      }
    });
  }

  openFoodQuantityDialog(food: any) {
    const dialogRef = this.dialog.open(FoodQuantityDialogComponent, {
      width: '90%',
      maxWidth: '450px',
      data: { food },
      panelClass: ['quantity-dialog', 'mat-elevation-z8']
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.nutritionService.addFoodItem(result.food);
      }
    });
  }
}
