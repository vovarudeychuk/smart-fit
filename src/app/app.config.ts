import { APP_INITIALIZER, ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http'; // Removed withInterceptors
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, NativeDateAdapter } from '@angular/material/core';

import { routes } from './app.routes';
// import { authInterceptor } from './interceptors/auth.interceptor'; // Removed
import { ApiStatusService } from './services/api-status.service';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { environment } from '../environments/environment';

// Function to initialize API status checking
function initializeApiStatus(apiStatusService: ApiStatusService) {
  return () => {
    // Force immediate health check on app start
    setTimeout(() => apiStatusService.checkApiStatus(), 1000);
    return Promise.resolve();
  };
}

// Default date formats
export const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'MM/DD/YYYY',
  },
  display: {
    dateInput: 'MM/DD/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(), // Removed withInterceptors([authInterceptor])
    provideAnimations(),
    importProvidersFrom(
      MatSnackBarModule,
      MatDatepickerModule,
      MatNativeDateModule
    ),
    // Datepicker providers
    { provide: DateAdapter, useClass: NativeDateAdapter },
    { provide: MAT_DATE_LOCALE, useValue: 'en-US' },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
    // Firebase providers
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    // Ensure ApiStatusService is initialized when the app starts
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApiStatus,
      deps: [ApiStatusService],
      multi: true
    }
  ]
};
