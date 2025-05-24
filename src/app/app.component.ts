import { Component, inject, ViewChild, OnInit, OnDestroy, signal, computed, ElementRef, Renderer2 } from '@angular/core';
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
import { BackgroundGeneratorService } from './services/background-generator.service';
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
            
            <div class="header-controls">
              <!-- Background animation button -->
              <button class="control-btn" 
                      (click)="refreshBackground()" 
                      [title]="'Animate background objects'">
                <mat-icon>auto_awesome</mat-icon>
              </button>
              
              <!-- Hide/Show Button -->
              <button class="control-btn hide-btn" 
                      (click)="toggleSidebar()" 
                      [title]="isSidebarCollapsed() ? 'Expand sidebar' : 'Collapse sidebar'">
                <mat-icon>{{ isSidebarCollapsed() ? 'chevron_right' : 'chevron_left' }}</mat-icon>
              </button>
            </div>
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
      
      <div class="main-content" 
           [class.with-sidebar]="authService.isAuthenticated()"
           [style]="backgroundStyles()">
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
        flex-direction: column;
      }
    }

    .header-controls {
      display: flex;
      gap: 6px;
      margin-left: auto;
      
      .sidebar-nav.collapsed & {
        margin-left: 0;
        margin-top: 8px;
      }
    }

    .control-btn {
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
        transform: scale(1.05);
      }
      
      &.active {
        background: rgba(255, 255, 255, 0.3);
        opacity: 1;
        box-shadow: 0 0 8px rgba(255, 255, 255, 0.4);
      }
      
      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
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
      transition: all 0.6s ease-in-out;
      position: relative;
      min-height: 100vh;
      
      /* Ensure background covers the entire area */
      background-attachment: fixed;
      background-repeat: repeat;
      
      @media (min-width: 769px) {
        &.with-sidebar {
          /* Content adjusts automatically with flexbox */
        }
      }
      
      @media (max-width: 768px) {
        padding-bottom: 70px; /* Make room for bottom nav */
        background-attachment: scroll; /* Better performance on mobile */
      }
      
      /* Much lighter overlay to ensure content readability */
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.2);
        pointer-events: none;
        z-index: 1;
      }
      
      /* Ensure router-outlet content is above everything */
      router-outlet {
        position: relative;
        z-index: 10;
      }
      
      /* All child components should be above the overlay and 3D elements */
      > * {
        position: relative;
        z-index: 10;
      }
      
      /* Specific high z-index for important content */
      .page-content,
      .component-content,
      .card,
      .mat-card,
      .content-wrapper {
        position: relative;
        z-index: 15;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 8px;
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
export class AppComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  dialog = inject(MatDialog);
  nutritionService = inject(NutritionService);
  router = inject(Router);
  consoleHelpersService = inject(ConsoleHelpersService);
  backgroundGeneratorService = inject(BackgroundGeneratorService);
  renderer = inject(Renderer2);
  elementRef = inject(ElementRef);
  
  // Loading state for navigation
  isNavigating = signal(false);
  
  // Sidebar collapse state
  isSidebarCollapsed = signal(false);
  
  // Current style tag for animations
  private currentStyleTag: HTMLStyleElement | null = null;
  private currentAnimatedElements: HTMLElement[] = [];
  
  // Dynamic background styles
  backgroundStyles = computed(() => {
    const background = this.backgroundGeneratorService.getCurrentBackground();
    if (background) {
      this.applyAnimatedBackground(background);
      return background.css;
    }
    return 'background-color: #f8f9fa;';
  });
  
  ngOnInit(): void {
    // Initialize dynamic background
    this.backgroundGeneratorService.initializeBackground();
    
    // Listen to router events for loading state only
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

  ngOnDestroy(): void {
    // Clean up 3D animations
    this.cleanupAnimations();
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

  // Animate all existing 3D objects
  refreshBackground(): void {
    this.animateAllObjects();
    console.log('Background objects animated!');
  }

  // Create animated wave effect across all background objects
  private animateAllObjects(): void {
    if (this.currentAnimatedElements.length === 0) {
      console.log('No animated elements to animate');
      return;
    }

    // Create a fast wave animation that affects all objects
    this.currentAnimatedElements.forEach((element, index) => {
      const delay = index * 30; // Faster 30ms delay between each object
      
      setTimeout(() => {
        // Add temporary animation class
        this.addTemporaryAnimation(element, index);
      }, delay);
    });

    console.log(`Animating ${this.currentAnimatedElements.length} objects with HUGE wave effect`);
  }

  // Add temporary HUGE animation effects to an element
  private addTemporaryAnimation(element: HTMLElement, index: number): void {
    // Store original styles
    const originalTransform = element.style.transform || '';
    const originalTransition = element.style.transition || '';
    
    // Add FAST and dramatic transition
    this.renderer.setStyle(element, 'transition', 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)');
    
    // Different HUGE animation effects based on element type/index
    const animationType = index % 6; // More variety with 6 types
    
    switch (animationType) {
      case 0: // MASSIVE bounce up with spin
        this.renderer.setStyle(element, 'transform', `${originalTransform} translateY(-80px) scale(2.5) rotateZ(45deg) rotateX(30deg)`);
        this.renderer.setStyle(element, 'filter', 'brightness(2) drop-shadow(0 0 30px #ff6b6b)');
        break;
      case 1: // EXTREME spin and scale
        this.renderer.setStyle(element, 'transform', `${originalTransform} scale(3) rotateZ(360deg) rotateY(360deg) rotateX(180deg)`);
        this.renderer.setStyle(element, 'filter', 'brightness(2.2) drop-shadow(0 0 40px #4ecdc4)');
        break;
      case 2: // HUGE pulse and explosive glow
        this.renderer.setStyle(element, 'transform', `${originalTransform} scale(2.8) rotateZ(25deg)`);
        this.renderer.setStyle(element, 'filter', 'brightness(2.5) drop-shadow(0 0 50px #ffd93d) saturate(2)');
        break;
      case 3: // WILD shake and wobble
        this.renderer.setStyle(element, 'transform', `${originalTransform} translateX(60px) translateY(-40px) rotateZ(-45deg) scale(2.2)`);
        this.renderer.setStyle(element, 'filter', 'brightness(1.8) drop-shadow(0 0 35px #6c5ce7)');
        break;
      case 4: // TORNADO spin with translation
        this.renderer.setStyle(element, 'transform', `${originalTransform} translateX(-50px) translateY(-60px) scale(2.6) rotateZ(270deg) rotateY(180deg)`);
        this.renderer.setStyle(element, 'filter', 'brightness(2.1) drop-shadow(0 0 45px #fd79a8) hue-rotate(90deg)');
        break;
      case 5: // EXPLOSION effect
        this.renderer.setStyle(element, 'transform', `${originalTransform} translateY(-70px) translateX(40px) scale(3.2) rotateZ(-60deg) rotateX(45deg)`);
        this.renderer.setStyle(element, 'filter', 'brightness(2.8) drop-shadow(0 0 60px #00b894) contrast(1.5)');
        break;
    }
    
    // Return to original state FAST
    setTimeout(() => {
      this.renderer.setStyle(element, 'transition', 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)');
      this.renderer.setStyle(element, 'transform', originalTransform);
      this.renderer.setStyle(element, 'filter', '');
      
      // Restore original transition after animation completes
      setTimeout(() => {
        this.renderer.setStyle(element, 'transition', originalTransition);
      }, 400);
    }, 300);
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

  private applyAnimatedBackground(background: any): void {
    // Clean up previous animations
    this.cleanupAnimations();
    
    // Always create fitness 3D background
    if (background.type === 'fitness3d' && background.keyframes) {
      this.createFitness3DBackground(background);
    }
  }

  private cleanupAnimations(): void {
    // Remove previous style tag
    if (this.currentStyleTag) {
      this.renderer.removeChild(document.head, this.currentStyleTag);
      this.currentStyleTag = null;
    }
    
    // Remove previous animated elements
    this.currentAnimatedElements.forEach(element => {
      if (element.parentNode) {
        this.renderer.removeChild(element.parentNode, element);
      }
    });
    this.currentAnimatedElements = [];
  }

  private createFitness3DBackground(background: any): void {
    // Create and inject keyframes
    this.currentStyleTag = this.renderer.createElement('style');
    this.renderer.setAttribute(this.currentStyleTag, 'type', 'text/css');
    this.renderer.appendChild(this.currentStyleTag, this.renderer.createText(background.keyframes));
    this.renderer.appendChild(document.head, this.currentStyleTag);
    
    // Get the main content element
    const mainContent = this.elementRef.nativeElement.querySelector('.main-content');
    if (!mainContent) return;
    
    // Create fitness-themed 3D elements
    this.createFitnessElements(mainContent);
  }

  private createFitnessElements(container: HTMLElement): void {
    // Create floating dumbbells
    this.createDumbbells(container);
    
    // Create kettlebells
    this.createKettlebells(container);
    
    // Create medicine balls
    this.createMedicineBalls(container);
    
    // Create weight plates
    this.createWeightPlates(container);
    
    // Create barbells
    this.createBarbells(container);
    
    // Create food objects
    this.createFoodObjects(container);
  }

  private createFoodObjects(container: HTMLElement): void {
    // Create fruits
    this.createFruits(container);
    
    // Create vegetables
    this.createVegetables(container);
    
    // Create nutrition items
    this.createNutritionItems(container);
  }

  private createDumbbells(container: HTMLElement): void {
    const dumbbellCount = 4;
    
    for (let i = 0; i < dumbbellCount; i++) {
      const dumbbell = this.renderer.createElement('div');
      const size = 40 + (i * 10); // 40, 50, 60, 70px
      const x = 15 + (i * 20); // Spaced across screen
      const y = 20 + (Math.random() * 60); // Random vertical position
      const delay = i * 8; // Staggered animation

      // Create dumbbell shape using pseudo elements
      this.renderer.setStyle(dumbbell, 'position', 'absolute');
      this.renderer.setStyle(dumbbell, 'left', `${x}%`);
      this.renderer.setStyle(dumbbell, 'top', `${y}%`);
      this.renderer.setStyle(dumbbell, 'width', `${size}px`);
      this.renderer.setStyle(dumbbell, 'height', `${size * 0.3}px`);
      this.renderer.setStyle(dumbbell, 'background', 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)');
      this.renderer.setStyle(dumbbell, 'border-radius', '20px');
      this.renderer.setStyle(dumbbell, 'box-shadow', '0 0 20px rgba(102, 126, 234, 0.3)');
      this.renderer.setStyle(dumbbell, 'animation', `fitness3d_screensaver_dumbbell 20s ease-in-out infinite`);
      this.renderer.setStyle(dumbbell, 'animation-delay', `${delay}s`);
      this.renderer.setStyle(dumbbell, 'transform-style', 'preserve-3d');
      this.renderer.setStyle(dumbbell, 'pointer-events', 'none');
      this.renderer.setStyle(dumbbell, 'z-index', '-5');
      this.renderer.setStyle(dumbbell, 'opacity', '0.7');
      
      // Add dumbbell ends
      const leftEnd = this.renderer.createElement('div');
      this.renderer.setStyle(leftEnd, 'position', 'absolute');
      this.renderer.setStyle(leftEnd, 'left', '-8px');
      this.renderer.setStyle(leftEnd, 'top', '-10px');
      this.renderer.setStyle(leftEnd, 'width', '16px');
      this.renderer.setStyle(leftEnd, 'height', `${size * 0.3 + 20}px`);
      this.renderer.setStyle(leftEnd, 'background', 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)');
      this.renderer.setStyle(leftEnd, 'border-radius', '8px');
      
      const rightEnd = this.renderer.createElement('div');
      this.renderer.setStyle(rightEnd, 'position', 'absolute');
      this.renderer.setStyle(rightEnd, 'right', '-8px');
      this.renderer.setStyle(rightEnd, 'top', '-10px');
      this.renderer.setStyle(rightEnd, 'width', '16px');
      this.renderer.setStyle(rightEnd, 'height', `${size * 0.3 + 20}px`);
      this.renderer.setStyle(rightEnd, 'background', 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)');
      this.renderer.setStyle(rightEnd, 'border-radius', '8px');
      
      this.renderer.appendChild(dumbbell, leftEnd);
      this.renderer.appendChild(dumbbell, rightEnd);
      this.renderer.appendChild(container, dumbbell);
      this.currentAnimatedElements.push(dumbbell);
    }
  }

  private createKettlebells(container: HTMLElement): void {
    const kettlebellCount = 3;
    
    for (let i = 0; i < kettlebellCount; i++) {
      const kettlebell = this.renderer.createElement('div');
      const size = 45 + (i * 15); // 45, 60, 75px
      const x = 10 + (i * 30); // Spaced across left side
      const y = 60 + (Math.random() * 30); // Lower area
      const delay = i * 10; // Staggered animation
      
      // Kettlebell body (main ball)
      this.renderer.setStyle(kettlebell, 'position', 'absolute');
      this.renderer.setStyle(kettlebell, 'left', `${x}%`);
      this.renderer.setStyle(kettlebell, 'top', `${y}%`);
      this.renderer.setStyle(kettlebell, 'width', `${size}px`);
      this.renderer.setStyle(kettlebell, 'height', `${size}px`);
      this.renderer.setStyle(kettlebell, 'background', 'linear-gradient(135deg, #2c3e50 0%, #34495e 50%, #2c3e50 100%)');
      this.renderer.setStyle(kettlebell, 'border-radius', '50%');
      this.renderer.setStyle(kettlebell, 'box-shadow', '0 0 25px rgba(44, 62, 80, 0.4)');
      this.renderer.setStyle(kettlebell, 'animation', `fitness3d_screensaver_geometric 25s ease-in-out infinite`);
      this.renderer.setStyle(kettlebell, 'animation-delay', `${delay}s`);
      this.renderer.setStyle(kettlebell, 'transform-style', 'preserve-3d');
      this.renderer.setStyle(kettlebell, 'pointer-events', 'none');
      this.renderer.setStyle(kettlebell, 'z-index', '-7');
      this.renderer.setStyle(kettlebell, 'opacity', '0.6');

      // Kettlebell handle
      const handle = this.renderer.createElement('div');
      this.renderer.setStyle(handle, 'position', 'absolute');
      this.renderer.setStyle(handle, 'top', '-15px');
      this.renderer.setStyle(handle, 'left', '50%');
      this.renderer.setStyle(handle, 'transform', 'translateX(-50%)');
      this.renderer.setStyle(handle, 'width', `${size * 0.6}px`);
      this.renderer.setStyle(handle, 'height', '30px');
      this.renderer.setStyle(handle, 'border', '8px solid #34495e');
      this.renderer.setStyle(handle, 'border-bottom', 'none');
      this.renderer.setStyle(handle, 'border-radius', '15px 15px 0 0');
      this.renderer.setStyle(handle, 'background', 'transparent');
      
      this.renderer.appendChild(kettlebell, handle);
      this.renderer.appendChild(container, kettlebell);
      this.currentAnimatedElements.push(kettlebell);
    }
  }

  private createMedicineBalls(container: HTMLElement): void {
    const ballCount = 4;
    
    for (let i = 0; i < ballCount; i++) {
      const ball = this.renderer.createElement('div');
      const size = 35 + (i * 12); // 35, 47, 59, 71px
      const x = 55 + (i * 15); // Right side positioning
      const y = 40 + (Math.random() * 50); // Random vertical
      const delay = i * 7; // Staggered animation

      this.renderer.setStyle(ball, 'position', 'absolute');
      this.renderer.setStyle(ball, 'left', `${x}%`);
      this.renderer.setStyle(ball, 'top', `${y}%`);
      this.renderer.setStyle(ball, 'width', `${size}px`);
      this.renderer.setStyle(ball, 'height', `${size}px`);
      this.renderer.setStyle(ball, 'background', 'radial-gradient(circle at 30% 30%, #e74c3c, #c0392b, #a93226)');
      this.renderer.setStyle(ball, 'border-radius', '50%');
      this.renderer.setStyle(ball, 'box-shadow', 'inset -10px -10px 20px rgba(0,0,0,0.3), 0 0 20px rgba(231, 76, 60, 0.3)');
      this.renderer.setStyle(ball, 'animation', `fitness3d_screensaver_geometric 22s ease-in-out infinite`);
      this.renderer.setStyle(ball, 'animation-delay', `${delay}s`);
      this.renderer.setStyle(ball, 'transform-style', 'preserve-3d');
      this.renderer.setStyle(ball, 'pointer-events', 'none');
      this.renderer.setStyle(ball, 'z-index', '-6');
      this.renderer.setStyle(ball, 'opacity', '0.5');
      
      // Add texture lines to medicine ball
      for (let j = 0; j < 3; j++) {
        const line = this.renderer.createElement('div');
        this.renderer.setStyle(line, 'position', 'absolute');
        this.renderer.setStyle(line, 'top', `${20 + j * 20}%`);
        this.renderer.setStyle(line, 'left', '10%');
        this.renderer.setStyle(line, 'width', '80%');
        this.renderer.setStyle(line, 'height', '2px');
        this.renderer.setStyle(line, 'background', 'rgba(0,0,0,0.2)');
        this.renderer.setStyle(line, 'border-radius', '1px');

        this.renderer.appendChild(ball, line);
      }

      this.renderer.appendChild(container, ball);
      this.currentAnimatedElements.push(ball);
    }
  }

  private createWeightPlates(container: HTMLElement): void {
    const plateCount = 5;
    
    for (let i = 0; i < plateCount; i++) {
      const plate = this.renderer.createElement('div');
      const size = 40 + (i * 8); // 40, 48, 56, 64, 72px
      const x = 75 + (Math.random() * 20); // Right area
      const y = 15 + (i * 15); // Stacked vertically
      const delay = i * 6; // Staggered animation

      this.renderer.setStyle(plate, 'position', 'absolute');
      this.renderer.setStyle(plate, 'left', `${x}%`);
      this.renderer.setStyle(plate, 'top', `${y}%`);
      this.renderer.setStyle(plate, 'width', `${size}px`);
      this.renderer.setStyle(plate, 'height', `${size}px`);
      this.renderer.setStyle(plate, 'background', 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 50%, #95a5a6 100%)');
      this.renderer.setStyle(plate, 'border-radius', '50%');
      this.renderer.setStyle(plate, 'border', '3px solid #34495e');
      this.renderer.setStyle(plate, 'box-shadow', 'inset 0 0 10px rgba(0,0,0,0.3), 0 0 15px rgba(149, 165, 166, 0.3)');
      this.renderer.setStyle(plate, 'animation', `fitness3d_screensaver_geometric 18s linear infinite`);
      this.renderer.setStyle(plate, 'animation-delay', `${delay}s`);
      this.renderer.setStyle(plate, 'transform-style', 'preserve-3d');
      this.renderer.setStyle(plate, 'pointer-events', 'none');
      this.renderer.setStyle(plate, 'z-index', '-9');
      this.renderer.setStyle(plate, 'opacity', '0.4');

      // Center hole
      const hole = this.renderer.createElement('div');
      this.renderer.setStyle(hole, 'position', 'absolute');
      this.renderer.setStyle(hole, 'top', '50%');
      this.renderer.setStyle(hole, 'left', '50%');
      this.renderer.setStyle(hole, 'transform', 'translate(-50%, -50%)');
      this.renderer.setStyle(hole, 'width', `${size * 0.3}px`);
      this.renderer.setStyle(hole, 'height', `${size * 0.3}px`);
      this.renderer.setStyle(hole, 'background', '#2c3e50');
      this.renderer.setStyle(hole, 'border-radius', '50%');
      this.renderer.setStyle(hole, 'box-shadow', 'inset 0 0 5px rgba(0,0,0,0.5)');

      this.renderer.appendChild(plate, hole);
      this.renderer.appendChild(container, plate);
      this.currentAnimatedElements.push(plate);
    }
  }

  private createBarbells(container: HTMLElement): void {
    const barbellCount = 2;
    
    for (let i = 0; i < barbellCount; i++) {
      const barbell = this.renderer.createElement('div');
      const length = 120 + (i * 40); // 120, 160px
      const x = 20 + (i * 40); // Positioned across screen
      const y = 10 + (i * 70); // Top area
      const delay = i * 15; // Staggered animation

      // Barbell bar (main shaft)
      this.renderer.setStyle(barbell, 'position', 'absolute');
      this.renderer.setStyle(barbell, 'left', `${x}%`);
      this.renderer.setStyle(barbell, 'top', `${y}%`);
      this.renderer.setStyle(barbell, 'width', `${length}px`);
      this.renderer.setStyle(barbell, 'height', '12px');
      this.renderer.setStyle(barbell, 'background', 'linear-gradient(90deg, #bdc3c7 0%, #ecf0f1 50%, #bdc3c7 100%)');
      this.renderer.setStyle(barbell, 'border-radius', '6px');
      this.renderer.setStyle(barbell, 'box-shadow', '0 0 15px rgba(189, 195, 199, 0.4)');
      this.renderer.setStyle(barbell, 'animation', `fitness3d_screensaver_geometric 35s ease-in-out infinite`);
      this.renderer.setStyle(barbell, 'animation-delay', `${delay}s`);
      this.renderer.setStyle(barbell, 'transform-style', 'preserve-3d');
      this.renderer.setStyle(barbell, 'pointer-events', 'none');
      this.renderer.setStyle(barbell, 'z-index', '-8');
      this.renderer.setStyle(barbell, 'opacity', '0.5');

      // Left weight (more rounded/cylindrical)
      const leftWeight = this.renderer.createElement('div');
      this.renderer.setStyle(leftWeight, 'position', 'absolute');
      this.renderer.setStyle(leftWeight, 'left', '-22px');
      this.renderer.setStyle(leftWeight, 'top', '-12px');
      this.renderer.setStyle(leftWeight, 'width', '44px');
      this.renderer.setStyle(leftWeight, 'height', '36px');
      this.renderer.setStyle(leftWeight, 'background', 'radial-gradient(ellipse at center, #34495e 0%, #2c3e50 70%, #1a252f 100%)');
      this.renderer.setStyle(leftWeight, 'border-radius', '50%');
      this.renderer.setStyle(leftWeight, 'box-shadow', '0 0 15px rgba(44, 62, 80, 0.5)');
      
      // Right weight (more rounded/cylindrical)
      const rightWeight = this.renderer.createElement('div');
      this.renderer.setStyle(rightWeight, 'position', 'absolute');
      this.renderer.setStyle(rightWeight, 'right', '-22px');
      this.renderer.setStyle(rightWeight, 'top', '-12px');
      this.renderer.setStyle(rightWeight, 'width', '44px');
      this.renderer.setStyle(rightWeight, 'height', '36px');
      this.renderer.setStyle(rightWeight, 'background', 'radial-gradient(ellipse at center, #34495e 0%, #2c3e50 70%, #1a252f 100%)');
      this.renderer.setStyle(rightWeight, 'border-radius', '50%');
      this.renderer.setStyle(rightWeight, 'box-shadow', '0 0 15px rgba(44, 62, 80, 0.5)');

      this.renderer.appendChild(barbell, leftWeight);
      this.renderer.appendChild(barbell, rightWeight);
      this.renderer.appendChild(container, barbell);
      this.currentAnimatedElements.push(barbell);
    }
  }

  private createFruits(container: HTMLElement): void {
    const fruits = [
      { name: 'apple', color: '#ff6b6b', size: 35, shadow: 'rgba(255, 107, 107, 0.3)' },
      { name: 'orange', color: '#ffa500', size: 38, shadow: 'rgba(255, 165, 0, 0.3)' },
      { name: 'banana', color: '#ffe135', size: 45, shadow: 'rgba(255, 225, 53, 0.3)' },
      { name: 'grape', color: '#9b59b6', size: 25, shadow: 'rgba(155, 89, 182, 0.3)' }
    ];

    fruits.forEach((fruit, i) => {
      const fruitElement = this.renderer.createElement('div');
      const x = 15 + (i * 22); // Spaced across left-center area
      const y = 35 + (Math.random() * 40); // Random vertical
      const delay = i * 9; // Staggered animation

      this.renderer.setStyle(fruitElement, 'position', 'absolute');
      this.renderer.setStyle(fruitElement, 'left', `${x}%`);
      this.renderer.setStyle(fruitElement, 'top', `${y}%`);
      this.renderer.setStyle(fruitElement, 'width', `${fruit.size}px`);
      this.renderer.setStyle(fruitElement, 'height', `${fruit.size}px`);
      
      // Fruit-specific styling
      if (fruit.name === 'banana') {
        this.renderer.setStyle(fruitElement, 'background', `linear-gradient(45deg, ${fruit.color}, #f1c40f)`);
        this.renderer.setStyle(fruitElement, 'border-radius', '50% 50% 50% 50% / 60% 60% 40% 40%');
      } else if (fruit.name === 'grape') {
        this.renderer.setStyle(fruitElement, 'background', `radial-gradient(circle at 30% 30%, ${fruit.color}, #8e44ad)`);
        this.renderer.setStyle(fruitElement, 'border-radius', '50%');
        // Add grape cluster effect
        for (let j = 0; j < 3; j++) {
          const grape = this.renderer.createElement('div');
          this.renderer.setStyle(grape, 'position', 'absolute');
          this.renderer.setStyle(grape, 'width', '8px');
          this.renderer.setStyle(grape, 'height', '8px');
          this.renderer.setStyle(grape, 'background', fruit.color);
          this.renderer.setStyle(grape, 'border-radius', '50%');
          this.renderer.setStyle(grape, 'top', `${10 + j * 6}px`);
          this.renderer.setStyle(grape, 'left', `${8 + (j % 2) * 8}px`);
          this.renderer.appendChild(fruitElement, grape);
        }
      } else {
        this.renderer.setStyle(fruitElement, 'background', `radial-gradient(circle at 30% 30%, ${fruit.color}, ${fruit.color}dd)`);
        this.renderer.setStyle(fruitElement, 'border-radius', '50%');
      }

      this.renderer.setStyle(fruitElement, 'box-shadow', `0 0 15px ${fruit.shadow}`);
      this.renderer.setStyle(fruitElement, 'animation', `fitness3d_screensaver_geometric 20s ease-in-out infinite`);
      this.renderer.setStyle(fruitElement, 'animation-delay', `${delay}s`);
      this.renderer.setStyle(fruitElement, 'transform-style', 'preserve-3d');
      this.renderer.setStyle(fruitElement, 'pointer-events', 'none');
      this.renderer.setStyle(fruitElement, 'z-index', '-7');
      this.renderer.setStyle(fruitElement, 'opacity', '0.6');

      // Add fruit stem/leaf
      if (fruit.name === 'apple' || fruit.name === 'orange') {
        const stem = this.renderer.createElement('div');
        this.renderer.setStyle(stem, 'position', 'absolute');
        this.renderer.setStyle(stem, 'top', '-3px');
        this.renderer.setStyle(stem, 'left', '50%');
        this.renderer.setStyle(stem, 'transform', 'translateX(-50%)');
        this.renderer.setStyle(stem, 'width', '6px');
        this.renderer.setStyle(stem, 'height', '8px');
        this.renderer.setStyle(stem, 'background', '#27ae60');
        this.renderer.setStyle(stem, 'border-radius', '3px');
        this.renderer.appendChild(fruitElement, stem);
      }

      this.renderer.appendChild(container, fruitElement);
      this.currentAnimatedElements.push(fruitElement);
    });
  }

  private createVegetables(container: HTMLElement): void {
    const vegetables = [
      { name: 'broccoli', color: '#27ae60', size: 40, shadow: 'rgba(39, 174, 96, 0.3)' },
      { name: 'carrot', color: '#e67e22', size: 35, shadow: 'rgba(230, 126, 34, 0.3)' },
      { name: 'tomato', color: '#e74c3c', size: 32, shadow: 'rgba(231, 76, 60, 0.3)' }
    ];

    vegetables.forEach((veggie, i) => {
      const veggieElement = this.renderer.createElement('div');
      const x = 60 + (i * 15); // Right-center area
      const y = 20 + (Math.random() * 50); // Random vertical
      const delay = i * 11; // Staggered animation

      this.renderer.setStyle(veggieElement, 'position', 'absolute');
      this.renderer.setStyle(veggieElement, 'left', `${x}%`);
      this.renderer.setStyle(veggieElement, 'top', `${y}%`);
      this.renderer.setStyle(veggieElement, 'width', `${veggie.size}px`);
      this.renderer.setStyle(veggieElement, 'height', `${veggie.size}px`);
      
      // Vegetable-specific styling
      if (veggie.name === 'broccoli') {
        this.renderer.setStyle(veggieElement, 'background', `radial-gradient(circle at 50% 30%, #2ecc71, ${veggie.color})`);
        this.renderer.setStyle(veggieElement, 'border-radius', '40% 40% 50% 50%');
        // Add broccoli florets
        for (let j = 0; j < 5; j++) {
          const floret = this.renderer.createElement('div');
          this.renderer.setStyle(floret, 'position', 'absolute');
          this.renderer.setStyle(floret, 'width', '8px');
          this.renderer.setStyle(floret, 'height', '8px');
          this.renderer.setStyle(floret, 'background', '#2ecc71');
          this.renderer.setStyle(floret, 'border-radius', '50%');
          const angle = (j * 72) * Math.PI / 180;
          const radius = 12;
          this.renderer.setStyle(floret, 'top', `${15 + radius * Math.sin(angle)}px`);
          this.renderer.setStyle(floret, 'left', `${15 + radius * Math.cos(angle)}px`);
          this.renderer.appendChild(veggieElement, floret);
        }
      } else if (veggie.name === 'carrot') {
        this.renderer.setStyle(veggieElement, 'background', `linear-gradient(180deg, #f39c12, ${veggie.color})`);
        this.renderer.setStyle(veggieElement, 'border-radius', '50% 50% 80% 80%');
        // Add carrot lines
        for (let j = 0; j < 3; j++) {
          const line = this.renderer.createElement('div');
          this.renderer.setStyle(line, 'position', 'absolute');
          this.renderer.setStyle(line, 'width', '80%');
          this.renderer.setStyle(line, 'height', '1px');
          this.renderer.setStyle(line, 'background', 'rgba(0,0,0,0.1)');
          this.renderer.setStyle(line, 'top', `${30 + j * 8}%`);
          this.renderer.setStyle(line, 'left', '10%');
          this.renderer.appendChild(veggieElement, line);
        }
      } else {
        this.renderer.setStyle(veggieElement, 'background', `radial-gradient(circle at 30% 30%, ${veggie.color}, #c0392b)`);
        this.renderer.setStyle(veggieElement, 'border-radius', '50%');
      }

      this.renderer.setStyle(veggieElement, 'box-shadow', `0 0 12px ${veggie.shadow}`);
      this.renderer.setStyle(veggieElement, 'animation', `fitness3d_screensaver_geometric 24s ease-in-out infinite`);
      this.renderer.setStyle(veggieElement, 'animation-delay', `${delay}s`);
      this.renderer.setStyle(veggieElement, 'transform-style', 'preserve-3d');
      this.renderer.setStyle(veggieElement, 'pointer-events', 'none');
      this.renderer.setStyle(veggieElement, 'z-index', '-8');
      this.renderer.setStyle(veggieElement, 'opacity', '0.5');

      this.renderer.appendChild(container, veggieElement);
      this.currentAnimatedElements.push(veggieElement);
    });
  }

  private createNutritionItems(container: HTMLElement): void {
    // Create water bottles
    this.createWaterBottles(container);
    
    // Create protein shakes
    this.createProteinShakes(container);
  }

  private createWaterBottles(container: HTMLElement): void {
    const bottleCount = 3;
    
    for (let i = 0; i < bottleCount; i++) {
      const bottle = this.renderer.createElement('div');
      const width = 25;
      const height = 50 + (i * 10); // 50, 60, 70px
      const x = 75 + (i * 8); // Right side
      const y = 50 + (Math.random() * 30); // Lower area
      const delay = i * 13; // Staggered animation

      this.renderer.setStyle(bottle, 'position', 'absolute');
      this.renderer.setStyle(bottle, 'left', `${x}%`);
      this.renderer.setStyle(bottle, 'top', `${y}%`);
      this.renderer.setStyle(bottle, 'width', `${width}px`);
      this.renderer.setStyle(bottle, 'height', `${height}px`);
      this.renderer.setStyle(bottle, 'background', 'linear-gradient(180deg, #3498db 0%, #2980b9 70%, #3498db 100%)');
      this.renderer.setStyle(bottle, 'border-radius', '8px 8px 12px 12px');
      this.renderer.setStyle(bottle, 'box-shadow', '0 0 15px rgba(52, 152, 219, 0.4)');
      this.renderer.setStyle(bottle, 'animation', `fitness3d_screensaver_geometric 26s ease-in-out infinite`);
      this.renderer.setStyle(bottle, 'animation-delay', `${delay}s`);
      this.renderer.setStyle(bottle, 'transform-style', 'preserve-3d');
      this.renderer.setStyle(bottle, 'pointer-events', 'none');
      this.renderer.setStyle(bottle, 'z-index', '-9');
      this.renderer.setStyle(bottle, 'opacity', '0.6');

      // Bottle cap
      const cap = this.renderer.createElement('div');
      this.renderer.setStyle(cap, 'position', 'absolute');
      this.renderer.setStyle(cap, 'top', '-8px');
      this.renderer.setStyle(cap, 'left', '50%');
      this.renderer.setStyle(cap, 'transform', 'translateX(-50%)');
      this.renderer.setStyle(cap, 'width', '18px');
      this.renderer.setStyle(cap, 'height', '16px');
      this.renderer.setStyle(cap, 'background', '#2c3e50');
      this.renderer.setStyle(cap, 'border-radius', '4px 4px 0 0');

      // Water level
      const water = this.renderer.createElement('div');
      this.renderer.setStyle(water, 'position', 'absolute');
      this.renderer.setStyle(water, 'bottom', '5px');
      this.renderer.setStyle(water, 'left', '3px');
      this.renderer.setStyle(water, 'right', '3px');
      this.renderer.setStyle(water, 'height', '70%');
      this.renderer.setStyle(water, 'background', 'rgba(255, 255, 255, 0.3)');
      this.renderer.setStyle(water, 'border-radius', '4px 4px 8px 8px');

      this.renderer.appendChild(bottle, cap);
      this.renderer.appendChild(bottle, water);
      this.renderer.appendChild(container, bottle);
      this.currentAnimatedElements.push(bottle);
    }
  }

  private createProteinShakes(container: HTMLElement): void {
    const shakeCount = 2;
    
    for (let i = 0; i < shakeCount; i++) {
      const shake = this.renderer.createElement('div');
      const width = 30;
      const height = 45;
      const x = 5 + (i * 35); // Left side positioning
      const y = 75 + (Math.random() * 15); // Bottom area
      const delay = i * 18; // Staggered animation

      this.renderer.setStyle(shake, 'position', 'absolute');
      this.renderer.setStyle(shake, 'left', `${x}%`);
      this.renderer.setStyle(shake, 'top', `${y}%`);
      this.renderer.setStyle(shake, 'width', `${width}px`);
      this.renderer.setStyle(shake, 'height', `${height}px`);
      this.renderer.setStyle(shake, 'background', i === 0 ? 
        'linear-gradient(180deg, #8e44ad 0%, #9b59b6 50%, #8e44ad 100%)' :
        'linear-gradient(180deg, #e67e22 0%, #f39c12 50%, #e67e22 100%)');
      this.renderer.setStyle(shake, 'border-radius', '6px 6px 15px 15px');
      this.renderer.setStyle(shake, 'box-shadow', `0 0 12px ${i === 0 ? 'rgba(142, 68, 173, 0.4)' : 'rgba(230, 126, 34, 0.4)'}`);
      this.renderer.setStyle(shake, 'animation', `fitness3d_screensaver_geometric 30s ease-in-out infinite`);
      this.renderer.setStyle(shake, 'animation-delay', `${delay}s`);
      this.renderer.setStyle(shake, 'transform-style', 'preserve-3d');
      this.renderer.setStyle(shake, 'pointer-events', 'none');
      this.renderer.setStyle(shake, 'z-index', '-10');
      this.renderer.setStyle(shake, 'opacity', '0.5');

      // Shake label
      const label = this.renderer.createElement('div');
      this.renderer.setStyle(label, 'position', 'absolute');
      this.renderer.setStyle(label, 'top', '30%');
      this.renderer.setStyle(label, 'left', '10%');
      this.renderer.setStyle(label, 'right', '10%');
      this.renderer.setStyle(label, 'height', '40%');
      this.renderer.setStyle(label, 'background', 'rgba(255, 255, 255, 0.8)');
      this.renderer.setStyle(label, 'border-radius', '3px');

      this.renderer.appendChild(shake, label);
      this.renderer.appendChild(container, shake);
      this.currentAnimatedElements.push(shake);
    }
  }
}
