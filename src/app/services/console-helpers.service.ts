import { Injectable, inject } from '@angular/core';
import { MockDataService } from './mock-data.service';
import { FirebaseDataService } from './firebase-data.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ConsoleHelpersService {
  private mockDataService = inject(MockDataService);
  private firebaseDataService = inject(FirebaseDataService);
  private authService = inject(AuthService);

  constructor() {
    // Make helper functions available globally for console access
    if (typeof window !== 'undefined') {
      (window as any).firebaseHelpers = {
        populateMockData: () => this.populateMockData(),
        clearUserData: () => this.clearUserData(),
        checkAuth: () => this.checkAuth(),
        listFoods: () => this.listFoods(),
        getUserGoals: () => this.getUserGoals(),
        help: () => this.showHelp()
      };
      
      console.log('🔥 Firebase helpers loaded! Type firebaseHelpers.help() in console for available commands.');
    }
  }

  private async populateMockData(): Promise<void> {
    try {
      await this.mockDataService.populateFirebaseWithMockData();
      console.log('✅ Mock data populated successfully!');
    } catch (error) {
      console.error('❌ Error:', error);
    }
  }

  private async clearUserData(): Promise<void> {
    try {
      await this.mockDataService.clearUserData();
      console.log('✅ User data cleared!');
    } catch (error) {
      console.error('❌ Error:', error);
    }
  }

  private checkAuth(): void {
    const user = this.authService.currentUser();
    const isAuth = this.authService.isAuthenticated();
    
    console.log('🔐 Authentication Status:', {
      isAuthenticated: isAuth,
      currentUser: user
    });
  }

  private async listFoods(): Promise<void> {
    try {
      this.firebaseDataService.getAllFoods().subscribe(foods => {
        console.log('🍎 Foods in database:', foods);
        console.log(`Total foods: ${foods.length}`);
      });
    } catch (error) {
      console.error('❌ Error fetching foods:', error);
    }
  }

  private async getUserGoals(): Promise<void> {
    try {
      this.firebaseDataService.getNutritionGoals().subscribe(goals => {
        console.log('🎯 User nutrition goals:', goals);
      });
    } catch (error) {
      console.error('❌ Error fetching goals:', error);
    }
  }

  private showHelp(): void {
    console.log(`
🔥 Firebase Helper Commands:

📊 Data Management:
  firebaseHelpers.populateMockData()  - Populate Firebase with mock nutrition data
  firebaseHelpers.clearUserData()     - Clear user's nutrition data
  
🔍 Data Inspection:
  firebaseHelpers.listFoods()         - List all foods in database
  firebaseHelpers.getUserGoals()      - Show user's nutrition goals
  
🔐 Authentication:
  firebaseHelpers.checkAuth()         - Check current authentication status
  
ℹ️  Other:
  firebaseHelpers.help()              - Show this help menu

Example usage:
  > firebaseHelpers.checkAuth()
  > firebaseHelpers.populateMockData()
  > firebaseHelpers.listFoods()
    `);
  }
} 