import { Injectable, inject, signal, EventEmitter, Injector, runInInjectionContext } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs'; // Removed throwError, catchError, map, tap
import {
  Auth,
  authState,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser, // Renamed to avoid conflict with local User interface
  UserCredential
} from '@angular/fire/auth';

// Updated User interface for Firebase
export interface User {
  uid: string;
  email: string | null;
  displayName?: string | null;
  // Add other fields if they will be used, e.g., photoURL
}

// AuthResponse is no longer needed with Firebase

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);
  private injector = inject(Injector);
  // Removed http, baseUrl, tokenKey, userKey

  // State signals
  isAuthenticated = signal<boolean>(false);
  currentUser = signal<User | null>(null);
  private authReady = signal<boolean>(false);

  userChanged = new EventEmitter<User | null>();

  constructor() {
    console.log('AuthService: Initializing...');
    
    // Use runInInjectionContext to ensure proper injection context
    runInInjectionContext(this.injector, () => {
      authState(this.auth).subscribe((firebaseUser: FirebaseUser | null) => {
        console.log('AuthService: Auth state changed:', firebaseUser ? 'User logged in' : 'User logged out');
        
        if (firebaseUser) {
          const user: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
          };
          this.currentUser.set(user);
          this.isAuthenticated.set(true);
          this.userChanged.emit(user);
          console.log('AuthService: User authenticated:', user.email);
        } else {
          this.currentUser.set(null);
          this.isAuthenticated.set(false);
          this.userChanged.emit(null);
          console.log('AuthService: User not authenticated');
        }
        
        // Mark auth as ready after first update
        if (!this.authReady()) {
          this.authReady.set(true);
          console.log('AuthService: Auth state ready');
        }
      });
    });
  }

  async login(email: string, password: string): Promise<UserCredential> {
    try {
      console.log('AuthService: Attempting login for:', email);
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      console.log('AuthService: Login successful');
      return userCredential;
    } catch (error: any) {
      console.error('AuthService: Login failed:', error);
      throw new Error(this.mapFirebaseAuthError(error));
    }
  }

  async register(userData: { email: string, password: string, displayName?: string }): Promise<UserCredential> {
    try {
      console.log('AuthService: Attempting registration for:', userData.email);
      const userCredential = await createUserWithEmailAndPassword(this.auth, userData.email, userData.password);
      if (userData.displayName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName: userData.displayName });
        const currentUser = this.currentUser();
        if (currentUser) {
          this.currentUser.set({ ...currentUser, displayName: userData.displayName });
        }
      }
      console.log('AuthService: Registration successful');
      return userCredential;
    } catch (error: any) {
      console.error('AuthService: Registration failed:', error);
      throw new Error(this.mapFirebaseAuthError(error));
    }
  }

  async logout(): Promise<void> {
    try {
      console.log('AuthService: Attempting logout');
      await signOut(this.auth);
      console.log('AuthService: Logout successful');
    } catch (error: any) {
      console.error('AuthService: Logout failed:', error);
      throw new Error(this.mapFirebaseAuthError(error));
    }
  }

  // Simplified method to wait for auth to be ready
  waitForAuthReady(): Promise<boolean> {
    if (this.authReady()) {
      console.log('AuthService: Auth already ready, returning current state:', this.isAuthenticated());
      return Promise.resolve(this.isAuthenticated());
    }
    
    console.log('AuthService: Waiting for auth to be ready...');
    return new Promise((resolve) => {
      const subscription = authState(this.auth).subscribe((user) => {
        console.log('AuthService: Auth ready, user:', user ? 'authenticated' : 'not authenticated');
        subscription.unsubscribe();
        resolve(!!user);
      });
    });
  }

  // Method to wait for the next auth state change (use after login/register)
  waitForNextAuthUpdate(): Promise<boolean> {
    console.log('AuthService: Waiting for next auth state update...');
    return new Promise((resolve) => {
      const subscription = authState(this.auth).subscribe((user) => {
        console.log('AuthService: Next auth update received, user:', user ? 'authenticated' : 'not authenticated');
        subscription.unsubscribe();
        resolve(!!user);
      });
    });
  }

  // Check if auth is ready
  get isAuthReady(): boolean {
    return this.authReady();
  }

  // Get current real-time auth state (for guards)
  getCurrentAuthState(): Promise<boolean> {
    console.log('AuthService: Getting current real-time auth state...');
    return new Promise((resolve) => {
      // Get the current auth state directly from Firebase
      const currentUser = this.auth.currentUser;
      const isAuth = !!currentUser;
      console.log('AuthService: Current Firebase user:', currentUser ? 'authenticated' : 'not authenticated');
      resolve(isAuth);
    });
  }

  private mapFirebaseAuthError(error: any): string {
    if (!error.code) {
      return 'An unexpected error occurred.';
    }
    switch (error.code) {
      case 'auth/invalid-email':
        return 'Invalid email address format.';
      case 'auth/user-disabled':
        return 'This user account has been disabled.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Invalid email or password.';
      case 'auth/email-already-in-use':
        return 'This email address is already in use.';
      case 'auth/weak-password':
        return 'The password is too weak. Please choose a stronger password.';
      default:
        return 'An authentication error occurred. Please try again.';
    }
  }

  // getToken(): string | null { - REMOVED
  // }

  // private hasValidToken(): boolean { - REMOVED
  // }

  // private getUserFromStorage(): User | null { - REMOVED
  // }

  // private handleAuthResponse(response: AuthResponse): void { - REMOVED
  // }
  
  // GETPROFILE METHOD
  getProfile(): Observable<User | null> {
    // This returns the current user from the signal.
    // If additional profile data is needed from Firestore, a separate service will handle that.
    return of(this.currentUser());
  }

  // VERIFYAUTH METHOD REMOVED (handled by authState)

  // ASSOCIATEUSERDATA METHOD REMOVED
}