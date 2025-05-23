import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, of, tap, timer, timeout } from 'rxjs';
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
  
  // Track if we've shown the initial disconnected notification
  private hasShownInitialDisconnectedNotification = false;
  
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
        timeout(5000), // 5 second timeout
        map(() => true),
        catchError((error) => {
          console.log('API health check failed:', error.message);
          return of(false);
        }),
        tap(isConnected => {
          const newStatus = isConnected ? 'connected' : 'disconnected';
          
          // Show notification based on status transitions
          if (newStatus === 'disconnected') {
            if (this.previousStatus === 'connected') {
              // API went from connected to disconnected
              this.showDisconnectedNotification('API connection lost - Using mock data');
            } else if (this.previousStatus === 'checking' && !this.hasShownInitialDisconnectedNotification) {
              // Initial check failed
              this.showDisconnectedNotification('Backend API not available - Using mock data', true);
              this.hasShownInitialDisconnectedNotification = true;
            }
          } else if (newStatus === 'connected' && this.previousStatus === 'disconnected') {
            // API reconnected
            this.showConnectedNotification();
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
  private showDisconnectedNotification(message: string, isInitial: boolean = false) {
    this.snackBar.open(message, 'Dismiss', {
      duration: isInitial ? 10000 : 7000, // Show longer for initial disconnection
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['warning-snackbar']
    });
  }
  
  // Show a notification when API reconnects
  private showConnectedNotification() {
    this.snackBar.open('API connection restored - Using live data', 'Dismiss', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['success-snackbar']
    });
  }
}
