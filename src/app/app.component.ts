import { Component, inject, ViewChild, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { AuthService } from './services/auth.service';
import { FoodSearchDialogComponent } from './components/shared/dialogs/food-search-dialog/food-search-dialog.component';
import { FoodQuantityDialogComponent, FoodMoveCopyDialogComponent } from './components/shared/dialogs';
import { NutritionService } from './services/nutrition.service';
import { ConsoleHelpersService } from './services/console-helpers.service';

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
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  template: `
    <div class="app-container">
      <!-- Loading spinner overlay -->
      @if (isNavigating()) {
        <div class="loading-overlay">
          <mat-spinner diameter="50"></mat-spinner>
        </div>
      }

      <!-- Left Sidebar Navigation - Only show when authenticated and on desktop -->
      @if (authService.isAuthenticated()) {
        <nav class="sidebar-nav" 
             [class.collapsed]="isSidebarCollapsed()"
             (dblclick)="onSidebarDoubleClick()">
          
          <!-- Sidebar Header -->
          <div class="sidebar-header">
            @if (!isSidebarCollapsed()) {
              <mat-icon class="app-icon">fitness_center</mat-icon>
              <h2 class="app-title">SmartFit</h2>
            } @else {
              <mat-icon class="app-icon-collapsed">fitness_center</mat-icon>
            }
            
            <!-- Hide/Show Button -->
            <button class="hide-btn" 
                    (click)="toggleSidebar()" 
                    [title]="isSidebarCollapsed() ? 'Expand sidebar' : 'Collapse sidebar'">
              <mat-icon>{{ isSidebarCollapsed() ? 'chevron_right' : 'chevron_left' }}</mat-icon>
            </button>
          </div>
          
          <!-- Navigation Items -->
          <div class="nav-items">
            <a class="nav-item" 
               routerLink="/dashboard" 
               routerLinkActive="active"
               [title]="isSidebarCollapsed() ? 'Dashboard' : ''">
              <mat-icon>dashboard</mat-icon>
              @if (!isSidebarCollapsed()) {
                <span>Dashboard</span>
              }
            </a>
            
            <a class="nav-item" 
               routerLink="/journal" 
               routerLinkActive="active"
               [title]="isSidebarCollapsed() ? 'Journal' : ''">
              <mat-icon>book</mat-icon>
              @if (!isSidebarCollapsed()) {
                <span>Journal</span>
              }
            </a>
            
            <div class="nav-item add-item" 
                 (click)="openAddFoodModal()"
                 [title]="isSidebarCollapsed() ? 'Add Food' : ''">
              <mat-icon>add_circle</mat-icon>
              @if (!isSidebarCollapsed()) {
                <span>Add Food</span>
              }
            </div>
            
            <a class="nav-item" 
               routerLink="/profile" 
               routerLinkActive="active"
               [title]="isSidebarCollapsed() ? 'Profile' : ''">
              <mat-icon>person</mat-icon>
              @if (!isSidebarCollapsed()) {
                <span>Profile</span>
              }
            </a>
            
            <a class="nav-item" 
               routerLink="/mock-data" 
               routerLinkActive="active"
               [title]="isSidebarCollapsed() ? 'Mock Data' : ''">
              <mat-icon>build</mat-icon>
              @if (!isSidebarCollapsed()) {
                <span>Mock Data</span>
              }
            </a>
          </div>
          
          <!-- Sidebar Footer -->
          <div class="sidebar-footer">
            <div class="nav-item logout-item" 
                 (click)="logout()"
                 [title]="isSidebarCollapsed() ? 'Logout' : ''">
              <mat-icon>exit_to_app</mat-icon>
              @if (!isSidebarCollapsed()) {
                <span>Logout</span>
              }
            </div>
          </div>
        </nav>
      }
      
      <div class="main-content" [class.with-sidebar]="authService.isAuthenticated()">
        <router-outlet></router-outlet>
      </div>
      
      <!-- Bottom Navigation - Only show when authenticated and on mobile -->
      @if (authService.isAuthenticated()) {
        <nav class="bottom-nav">
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
            <button mat-menu-item routerLink="/mock-data">
              <mat-icon>build</mat-icon>
              <span>Mock Data</span>
            </button>
            <button mat-menu-item (click)="logout()">
              <mat-icon>exit_to_app</mat-icon>
              <span>Logout</span>
            </button>
          </mat-menu>
        </nav>
      }
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      height: 100vh;
      width: 100%;
      position: relative;
      
      @media (max-width: 768px) {
        flex-direction: column;
      }
    }
    
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(255, 255, 255, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      backdrop-filter: blur(2px);
    }

    /* SIDEBAR NAVIGATION - Desktop */
    .sidebar-nav {
      width: 260px;
      background: linear-gradient(180deg, #673ab7 0%, #8e24aa 100%);
      color: white;
      display: flex;
      flex-direction: column;
      box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      transition: width 0.3s ease;
      user-select: none; /* Prevent text selection on double-click */
      position: relative;
      
      &.collapsed {
        width: 70px;
        
        /* Add subtle visual indicator for collapsed state */
        &::after {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 2px;
          height: 100%;
          background: rgba(255, 255, 255, 0.2);
        }
      }
      
      @media (max-width: 768px) {
        display: none; /* Hide sidebar on mobile */
      }
    }

    .sidebar-header {
      padding: 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      gap: 12px;
      position: relative;
      min-height: 70px;
      
      .sidebar-nav.collapsed & {
        padding: 15px 5px;
        justify-content: center;
        gap: 0;
        min-height: 60px;
      }
    }

    .app-icon {
      font-size: 32px !important;
      width: 32px !important;
      height: 32px !important;
      color: white;
      transition: all 0.3s ease;
    }

    .app-icon-collapsed {
      font-size: 28px !important;
      width: 28px !important;
      height: 28px !important;
      color: white;
      transition: all 0.3s ease;
      opacity: 0.9;
    }

    .app-title {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: white;
      opacity: 1;
      transition: opacity 0.2s ease;
      
      .sidebar-nav.collapsed & {
        opacity: 0;
        width: 0;
        overflow: hidden;
      }
    }

    .hide-btn {
      position: absolute;
      top: 50%;
      right: 8px;
      transform: translateY(-50%);
      background: rgba(255, 255, 255, 0.15);
      border: none;
      border-radius: 6px;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      color: white;
      opacity: 0.8;
      
      &:hover {
        background: rgba(255, 255, 255, 0.25);
        opacity: 1;
        transform: translateY(-50%) scale(1.05);
      }
      
      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
      
      .sidebar-nav.collapsed & {
        right: 50%;
        transform: translateY(-50%) translateX(50%);
        
        &:hover {
          transform: translateY(-50%) translateX(50%) scale(1.05);
        }
      }
    }

    .nav-items {
      flex: 1;
      padding: 15px 0;
      
      .sidebar-nav.collapsed & {
        padding: 10px 0;
      }
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 14px 20px;
      color: rgba(255, 255, 255, 0.85);
      text-decoration: none;
      cursor: pointer;
      transition: all 0.25s ease;
      border: none;
      background: none;
      width: 100%;
      font-size: 15px;
      position: relative;
      margin: 2px 0;
      border-radius: 0 25px 25px 0;
      
      .sidebar-nav.collapsed & {
        padding: 16px 0;
        justify-content: center;
        gap: 0;
        margin: 3px 12px;
        border-radius: 8px;
        width: auto;
      }
      
      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
        color: white;
        
        .sidebar-nav:not(.collapsed) & {
          background-color: rgba(255, 255, 255, 0.12);
          padding-left: 24px;
        }
        
        .sidebar-nav.collapsed & {
          background-color: rgba(255, 255, 255, 0.2);
          margin: 3px 8px;
          border-radius: 12px;
        }
      }
      
      &.active {
        background-color: rgba(255, 255, 255, 0.2);
        color: white;
        border-right: 3px solid white;
        
        .sidebar-nav.collapsed & {
          border-right: none;
          border-radius: 12px;
          margin: 3px 8px;
          background-color: rgba(255, 255, 255, 0.25);
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
        }
        
        mat-icon {
          color: white;
        }
      }
      
      mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
        color: rgba(255, 255, 255, 0.85);
        transition: all 0.25s ease;
        
        .sidebar-nav.collapsed & {
          font-size: 24px;
          width: 24px;
          height: 24px;
        }
      }
      
      span {
        font-weight: 500;
        opacity: 1;
        transition: all 0.25s ease;
        white-space: nowrap;
        
        .sidebar-nav.collapsed & {
          opacity: 0;
          width: 0;
          overflow: hidden;
        }
      }
    }

    .add-item {
      background: rgba(255, 255, 255, 0.15);
      margin: 6px 20px;
      border-radius: 25px;
      border-right: none !important;
      
      .sidebar-nav.collapsed & {
        margin: 6px 12px;
        border-left: none !important;
        box-shadow: none !important;
        border-radius: 12px;
        width: auto;
      }
      
      &:hover {
        background: rgba(255, 255, 255, 0.25);
        
        .sidebar-nav:not(.collapsed) & {
          transform: scale(1.02);
          padding-left: 24px;
        }
        
        .sidebar-nav.collapsed & {
          background: rgba(255, 255, 255, 0.3);
          margin: 6px 8px;
        }
      }
      
      &.active {
        .sidebar-nav.collapsed & {
          background-color: rgba(255, 255, 255, 0.3);
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
        }
      }
    }

    .sidebar-footer {
      padding: 15px 0;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      
      .sidebar-nav.collapsed & {
        padding: 10px 0;
      }
    }

    .logout-item {
      color: rgba(255, 255, 255, 0.7);
      
      &:hover {
        color: #ff6b6b;
        background-color: rgba(255, 107, 107, 0.12);
        
        .sidebar-nav:not(.collapsed) & {
          padding-left: 24px;
        }
        
        .sidebar-nav.collapsed & {
          background-color: rgba(255, 107, 107, 0.2);
          border-radius: 12px;
          margin: 3px 8px;
        }
      }
    }

    /* MAIN CONTENT */
    .main-content {
      flex: 1;
      overflow-y: auto;
      background-color: #f8f9fa;
      transition: margin-left 0.3s ease;
      
      @media (min-width: 769px) {
        &.with-sidebar {
          /* Content adjusts automatically with flexbox */
        }
      }
      
      @media (max-width: 768px) {
        padding-bottom: 70px; /* Make room for bottom nav */
      }
    }

    /* BOTTOM NAVIGATION - Mobile */
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
      
      @media (min-width: 769px) {
        display: none; /* Hide bottom nav on desktop */
      }
      
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
      text-decoration: none;
      
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
    
    /* Special styling for add button in bottom nav */
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
  consoleHelpersService = inject(ConsoleHelpersService);
  
  // Loading state for navigation
  isNavigating = signal(false);
  
  // Sidebar collapse state
  isSidebarCollapsed = signal(false);
  
  ngOnInit(): void {
    // Listen to router events for loading state
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.isNavigating.set(true);
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.isNavigating.set(false);
      }
    });

    // Log screen size for debugging responsive navigation
    console.log('Screen width:', window.innerWidth);
    window.addEventListener('resize', () => {
      console.log('Screen resized to:', window.innerWidth);
    });
  }

  // Toggle sidebar collapse state
  toggleSidebar(): void {
    this.isSidebarCollapsed.set(!this.isSidebarCollapsed());
    console.log('Sidebar collapsed:', this.isSidebarCollapsed());
  }

  // Handle double-click on sidebar to toggle
  onSidebarDoubleClick(): void {
    this.toggleSidebar();
  }

  async logout(): Promise<void> {
    console.log('AppComponent: Starting logout process');
    try {
      await this.authService.logout();
      console.log('AppComponent: Logout successful, navigating to login');
      
      // Navigate to login - the route guards will handle checking auth state
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('AppComponent: Logout error:', error);
      // Still navigate to login even if logout fails
      this.router.navigate(['/login']);
    }
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
        console.log('App component - Food quantity dialog result:', result);
        
        // If a specific date was selected, navigate to that date and add the food
        if (result.targetDate && !this.isSameDay(result.targetDate, currentDate)) {
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
              console.log(`App component - User chose to ${action} the food`);
              
              // Navigate to the selected date
              this.nutritionService.navigateToWeekContaining(result.targetDate);
              
              // Wait for navigation to complete before adding
              setTimeout(() => {
                this.nutritionService.addFoodItem(result.food);
              }, 150);
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
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }
}
