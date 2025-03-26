import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, of, tap, timer } from 'rxjs';
import { environment } from '../../environments/environment';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class ApiStatusService {
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  
  // Signal for the current API connection status
  apiStatus = signal<'connected' | 'disconnected' | 'checking'>('checking');
  
  // Track which data sources are being used
  dataSourceUsed = signal<{[key: string]: 'api' | 'mock'}>({});
  
  // Track previous status to avoid duplicate notifications
  private previousStatus: 'connected' | 'disconnected' | 'checking' = 'checking';
  
  constructor() {
    // Check API status on startup
    this.checkApiStatus();
    
    // Recheck periodically (every 30 seconds)
    timer(30000, 30000).subscribe(() => this.checkApiStatus());
  }
  
  // Method to check if API is available
  public checkApiStatus() {
    this.apiStatus.set('checking');
    
    this.http.get(`${environment.apiUrl}/nutrition/health`)
      .pipe(
        map(() => true),
        catchError(() => of(false)),
        tap(isConnected => {
          const newStatus = isConnected ? 'connected' : 'disconnected';
          
          // Only show a notification when transitioning from connected/checking to disconnected
          if (newStatus === 'disconnected' && this.previousStatus !== 'disconnected') {
            this.showDisconnectedNotification();
          }
          
          // Update status and previous status
          this.apiStatus.set(newStatus);
          this.previousStatus = newStatus;
          
          // Log status change
          console.log(`API Status: ${isConnected ? 'Connected' : 'Disconnected'} - Using ${isConnected ? 'real API' : 'mock data'}`);
        })
      )
      .subscribe();
  }
  
  // Track which data source was used for a specific request
  trackDataSource(requestName: string, source: 'api' | 'mock') {
    const current = this.dataSourceUsed();
    this.dataSourceUsed.set({...current, [requestName]: source});
    console.log(`Data source for ${requestName}: ${source}`);
  }
  
  // Show a notification when API is disconnected
  private showDisconnectedNotification() {
    this.snackBar.open('API disconnected - Using local data', 'Dismiss', {
      duration: 7000, // Show for longer (7 seconds)
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['warning-snackbar']
    });
  }
}
