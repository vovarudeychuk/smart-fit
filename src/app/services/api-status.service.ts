import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, of, tap, timer } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiStatusService {
  // Signal for the current API connection status
  apiStatus = signal<'connected' | 'disconnected' | 'checking'>('checking');
  
  // Track which data sources are being used
  dataSourceUsed = signal<{[key: string]: 'api' | 'mock'}>({});
  
  constructor(private http: HttpClient) {
    // Check API status on startup
    this.checkApiStatus();
    
    // Recheck periodically (every 30 seconds)
    timer(3000, 3000).subscribe(() => this.checkApiStatus());
  }
  
  // Method to check if API is available
  checkApiStatus() {
    this.apiStatus.set('checking');
    
    this.http.get(`${environment.apiUrl}/nutrition/health`)
      .pipe(
        map(() => true),
        catchError(() => of(false)),
        tap(isConnected => {
          this.apiStatus.set(isConnected ? 'connected' : 'disconnected');
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
}
