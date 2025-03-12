import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, retry, timeout, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { FoodItem } from '../models/food-item.model';
import { ApiStatusService } from './api-status.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private apiStatus = inject(ApiStatusService);
  private baseUrl = environment.apiUrl;

  // For development/testing when API isn't available
  private mockFoodDatabase: FoodItem[] = [
    { id: 1, name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, servingSize: '100g' },
    { id: 2, name: 'Brown Rice', calories: 112, protein: 2.6, carbs: 23.5, fat: 0.9, servingSize: '100g' },
    { id: 3, name: 'Broccoli', calories: 34, protein: 2.8, carbs: 6.6, fat: 0.4, servingSize: '100g' },
    { id: 4, name: 'Salmon', calories: 208, protein: 20, carbs: 0, fat: 13, servingSize: '100g' },
    { id: 5, name: 'Sweet Potato', calories: 86, protein: 1.6, carbs: 20, fat: 0.1, servingSize: '100g' },
    { id: 6, name: 'Avocado', calories: 160, protein: 2, carbs: 8.5, fat: 14.7, servingSize: '100g' },
    { id: 7, name: 'Egg', calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3, servingSize: '1 large' },
    { id: 8, name: 'Greek Yogurt', calories: 59, protein: 10, carbs: 3.6, fat: 0.4, servingSize: '100g' },
    { id: 9, name: 'Almonds', calories: 579, protein: 21, carbs: 21.6, fat: 49.9, servingSize: '100g' },
    { id: 10, name: 'Banana', calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3, servingSize: '100g' }
  ];

  // Food Database Endpoints
  getAllFoods(): Observable<FoodItem[]> {
    return this.http.get<FoodItem[]>(`${this.baseUrl}/nutrition/foods`);
  }

  searchFoods(query: string): Observable<FoodItem[]> {
    console.log(`Searching foods with query: "${query}" from ${this.baseUrl}`);
    
    const params = new HttpParams().set('query', query);
    // Add headers that might be needed
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
      // Add any auth headers if needed
      // 'Authorization': 'Bearer your-token-here'
    });
    
    return this.http.get<FoodItem[]>(`${this.baseUrl}/nutrition/foods/search`, { 
      params, 
      headers,
      // Add withCredentials if your API uses cookies for auth
      // withCredentials: true
    })
    .pipe(
      tap(response => {
        console.log('API response received:', response);
        this.apiStatus.trackDataSource('searchFoods', 'api');
      }),
      timeout(10000), // Increased timeout for debugging
      retry(1),
      catchError(error => {
        console.error('API Error Details:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: error.message,
          error: error.error
        });
        
        this.apiStatus.trackDataSource('searchFoods', 'mock');
        return of(this.searchMockFoods(query));
      })
    );
  }

  addFood(food: FoodItem): Observable<FoodItem> {
    return this.http.post<FoodItem>(`${this.baseUrl}/nutrition/foods`, food);
  }

  updateFood(id: number, food: FoodItem): Observable<FoodItem> {
    return this.http.put<FoodItem>(`${this.baseUrl}/nutrition/foods/${id}`, food);
  }

  deleteFood(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/nutrition/foods/${id}`);
  }

  // Nutrition Goals Endpoints
  getNutritionGoals(): Observable<any> {
    return this.http.get(`${this.baseUrl}/nutrition/goals`);
  }

  updateNutritionGoals(goals: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/nutrition/goals`, goals);
  }

  // Nutrition Tracking Endpoints
  getWeeklyNutrition(): Observable<any> {
    return this.http.get(`${this.baseUrl}/nutrition/weekly`);
  }

  // Daily nutrition endpoints
  getDailyNutrition(date: string): Observable<any> {
    const params = new HttpParams().set('date', date);
    return this.http.get(`${this.baseUrl}/nutrition/daily`, { params });
  }

  // Add any other tracking endpoints as needed

  // Error handling
  private handleError(error: HttpErrorResponse, fallbackData?: any): Observable<any> {
    console.error('API Error:', error);
    
    if (error.status === 0) {
      console.log('Using fallback data due to connection error');
      // Return fallback data if available
      if (fallbackData) {
        return of(fallbackData);
      }
    }
    
    return throwError(() => error);
  }

  // Mock data methods for fallback
  private searchMockFoods(query: string): FoodItem[] {
    if (!query) return [];
    
    query = query.toLowerCase();
    return this.mockFoodDatabase.filter(food => 
      food.name.toLowerCase().includes(query)
    );
  }

  testDirectApiConnection(apiUrl: string): Observable<any> {
    console.log(`Testing direct connection to: ${apiUrl}`);
    
    return this.http.get(`${apiUrl}/nutrition/health`, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    }).pipe(
      tap(response => console.log('Direct API test successful:', response)),
      catchError(error => {
        console.error('Direct API test failed:', error);
        return throwError(() => error);
      })
    );
  }

  // Add a food item to a specific day
  addFoodToDay(dayIndex: number, foodItem: FoodItem): Observable<any> {
    return this.http.post(`${this.baseUrl}/nutrition/day/${dayIndex}/foods`, foodItem)
      .pipe(
        catchError(error => {
          console.error('Error adding food item:', error);
          return of(null);
        })
      );
  }

  // Update a food item for a specific day
  updateFoodInDay(dayIndex: number, foodItemId: number, updatedFood: FoodItem): Observable<any> {
    return this.http.put(`${this.baseUrl}/nutrition/day/${dayIndex}/foods/${foodItemId}`, updatedFood)
      .pipe(
        catchError(error => {
          console.error('Error updating food item:', error);
          return of(null);
        })
      );
  }

  // Delete a food item from a specific day
  deleteFoodFromDay(dayIndex: number, foodItemId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/nutrition/day/${dayIndex}/foods/${foodItemId}`)
      .pipe(
        catchError(error => {
          console.error('Error deleting food item:', error);
          return of(null);
        })
      );
  }

  // Move food item between days
  moveFoodBetweenDays(sourceDayIndex: number, targetDayIndex: number, foodItemId: number): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/nutrition/move-food`, 
      { sourceDayIndex, targetDayIndex, foodItemId }
    ).pipe(
      catchError(error => {
        console.error('Error moving food item:', error);
        return of(null);
      })
    );
  }
} 