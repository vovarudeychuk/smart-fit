import { APP_INITIALIZER, ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { ApiStatusService } from './services/api-status.service';

// Function to initialize API status checking
function initializeApiStatus(apiStatusService: ApiStatusService) {
  return () => {
    // Force immediate health check on app start
    setTimeout(() => apiStatusService.checkApiStatus(), 1000);
    return Promise.resolve();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
    importProvidersFrom(MatSnackBarModule),
    // Ensure ApiStatusService is initialized when the app starts
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApiStatus,
      deps: [ApiStatusService],
      multi: true
    }
  ]
};
