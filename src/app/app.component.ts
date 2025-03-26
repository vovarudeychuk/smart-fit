import { Component, inject, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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
    MatDialogModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="app-container">
      <div class="content">
        <router-outlet></router-outlet>
      </div>
      
      <!-- Bottom Navigation Bar - Only show when authenticated -->
      @if (authService.isAuthenticated()) {
        <div class="bottom-nav">
          <div class="nav-button" routerLink="/dashboard" routerLinkActive="active">
            <mat-icon>dashboard</mat-icon>
            <span>Dashboard</span>
          </div>
          
          <div class="nav-button" routerLink="/journal" routerLinkActive="active">
            <mat-icon>book</mat-icon>
            <span>Journal</span>
          </div>
          
          <div class="nav-button add-button" (click)="openAddFoodModal()">
            <div class="add-circle">
              <mat-icon>add</mat-icon>
            </div>
            <span>Add Food</span>
          </div>
          
          <div class="nav-button" [matMenuTriggerFor]="menu">
            <mat-icon>more_horiz</mat-icon>
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
        </div>
      }
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
      
      @media (max-width: 480px) {
        padding-bottom: 76px;
      }
    }
    
    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 64px;
      background-color: #ffffff;
      color: #555555;
      display: flex;
      justify-content: space-around;
      align-items: center;
      box-shadow: 0 -1px 8px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      border-top-left-radius: 16px;
      border-top-right-radius: 16px;
      padding: 0 12px;
      
      @media (max-width: 480px) {
        height: 60px;
      }
      
      @media (max-width: 360px) {
        padding: 0 4px;
      }
    }
    
    .nav-button {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      flex: 1;
      cursor: pointer;
      transition: all 0.3s;
      padding: 0 12px;
      position: relative;
      
      @media (max-width: 360px) {
        padding: 0 8px;
      }
      
      mat-icon {
        color: #555555;
        margin-bottom: 4px;
        transition: all 0.3s;
        
        @media (max-width: 480px) {
          font-size: 22px;
          height: 22px;
          width: 22px;
          line-height: 22px;
        }
      }
      
      span {
        font-size: 12px;
        transition: all 0.3s;
        
        @media (max-width: 480px) {
          font-size: 11px;
        }
        
        @media (max-width: 360px) {
          font-size: 10px;
        }
      }
    }
    
    .nav-button:hover {
      mat-icon, span {
        color: #673ab7;
      }
    }
    
    .nav-button.active {
      mat-icon, span {
        color: #673ab7;
        font-weight: 500;
      }
      
      &::after {
        content: '';
        position: absolute;
        width: 30px;
        height: 3px;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        background-color: #673ab7;
        border-radius: 8px 8px 0 0;
      }
    }
    
    /* Special styling for add button */
    .add-button {
      margin-top: -24px;
      
      .add-circle {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background-color: #673ab7;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 2px;
        box-shadow: 0 4px 8px rgba(103, 58, 183, 0.3);
        
        mat-icon {
          color: white;
          margin-bottom: 0;
        }
        
        @media (max-width: 480px) {
          width: 44px;
          height: 44px;
        }
      }
      
      &:hover .add-circle {
        background-color: #7b52d3;
        transform: translateY(-2px);
        box-shadow: 0 6px 10px rgba(103, 58, 183, 0.4);
      }
    }
  `]
})
export class AppComponent implements OnInit {
  authService = inject(AuthService);
  dialog = inject(MatDialog);
  nutritionService = inject(NutritionService);
  router = inject(Router);
  
  ngOnInit(): void {
    // Verify authentication status on app startup
    this.authService.verifyAuth().subscribe(isAuthenticated => {
      if (!isAuthenticated) {
        // If not authenticated, redirect to login
        this.router.navigate(['/login']);
      }
    });
  }
  
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
