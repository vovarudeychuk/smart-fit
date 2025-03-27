import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>, 
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();
  
  // Only add auth header for API requests, not for third-party services
  if (req.url.includes(environment.apiUrl) || req.url.includes('localhost')) {
    if (token) {
      const authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return next(authReq).pipe(
        catchError((error) => {
          if (error instanceof HttpErrorResponse) {
            if (error.status === 401) {
              // Token has expired or is invalid
              console.log('Auth token expired, logging out');
              authService.logout();
              router.navigate(['/login']);
            }
          }
          return throwError(() => error);
        })
      );
    }
  }
  
  // For requests without token or to external domains
  return next(req);
}; 