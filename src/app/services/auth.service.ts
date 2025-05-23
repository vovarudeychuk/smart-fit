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

  // State signals, initialized by authState subscription
  isAuthenticated = signal<boolean>(false);
  currentUser = signal<User | null>(null);

  userChanged = new EventEmitter<User | null>();

  constructor() {
    // Use runInInjectionContext to ensure proper injection context
    runInInjectionContext(this.injector, () => {
      authState(this.auth).subscribe((firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          const user: User = { // Map Firebase user to local User interface
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
          };
          this.currentUser.set(user);
          this.isAuthenticated.set(true);
          this.userChanged.emit(user);
        } else {
          this.currentUser.set(null);
          this.isAuthenticated.set(false);
          this.userChanged.emit(null);
        }
      });
    });
  }

  async login(email: string, password: string): Promise<UserCredential> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      // authState will handle updating signals
      return userCredential;
    } catch (error: any) {
      console.error('Login failed:', error);
      // Map Firebase errors to user-friendly messages or rethrow
      throw new Error(this.mapFirebaseAuthError(error));
    }
  }

  async register(userData: { email: string, password: string, displayName?: string }): Promise<UserCredential> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, userData.email, userData.password);
      if (userData.displayName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName: userData.displayName });
        // Update the local signal if needed, though authState should eventually reflect this
        const currentUser = this.currentUser();
        if (currentUser) {
          this.currentUser.set({ ...currentUser, displayName: userData.displayName });
        }
      }
      // authState will handle updating signals for new user creation
      return userCredential;
    } catch (error: any) {
      console.error('Registration failed:', error);
      throw new Error(this.mapFirebaseAuthError(error));
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      // authState will set currentUser to null and isAuthenticated to false
      this.router.navigate(['/login']);
    } catch (error: any) {
      console.error('Logout failed:', error);
      throw new Error(this.mapFirebaseAuthError(error));
    }
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