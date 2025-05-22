import { Injectable, inject, signal, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, throwError, from } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { Auth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, UserCredential } from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc, serverTimestamp, Timestamp } from '@angular/fire/firestore'; // Added Timestamp
import { environment } from '../../environments/environment'; // Keep if firebaseConfig is used directly, otherwise remove

export interface User {
  uid: string; // Firebase UID
  email: string | null; // Firebase email can be null
  username?: string; // From Firestore
  firstName?: string; // From Firestore
  lastName?: string; // From Firestore
  createdAt?: Timestamp; // Added for member since date
  // Add any other fields from your Firestore 'users' collection
}

// This might be replaced or adapted depending on how methods like login/register return values.
// For now, we'll keep a similar structure but it might evolve.
export interface AuthResponse {
  user: User | null; // Can be null if auth fails or logs out
  success: boolean;
  message?: string;
  firebaseUserCredential?: UserCredential; // Optional: for more direct access to Firebase result
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth);
  private firestore: Firestore = inject(Firestore);
  private router = inject(Router);
  // private baseUrl = environment.apiUrl; // No longer needed if all auth is via Firebase

  // State signals, initialized to reflect that auth state is not yet known
  isAuthenticated = signal<boolean>(false); // Will be updated by onAuthStateChanged
  currentUser = signal<User | null>(null); // Will be updated by onAuthStateChanged

  userChanged = new EventEmitter<User | null>();

  constructor() {
    onAuthStateChanged(this.auth, async (firebaseUser) => {
      if (firebaseUser) {
        this.isAuthenticated.set(true);
        const userDocRef = doc(this.firestore, `users/${firebaseUser.uid}`);
        try {
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            // Explicitly cast to include createdAt for type safety
            const firestoreProfile = userDocSnap.data() as Omit<User, 'uid' | 'email'> & { createdAt?: Timestamp };
            this.currentUser.set({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              username: firestoreProfile.username,
              firstName: firestoreProfile.firstName,
              lastName: firestoreProfile.lastName,
              createdAt: firestoreProfile.createdAt // Ensure createdAt is mapped
            });
          } else {
            // Handle case where user exists in Auth but not Firestore (e.g., incomplete registration)
            this.currentUser.set({ // Set with basic Firebase data, createdAt will be undefined
              uid: firebaseUser.uid,
              email: firebaseUser.email,
            });
            console.warn(`User profile not found in Firestore for UID: ${firebaseUser.uid}. A new profile may need to be created.`);
          }
        } catch (error) {
          console.error("Error fetching user profile from Firestore:", error);
          this.currentUser.set({ // Set with basic Firebase data on error
            uid: firebaseUser.uid,
            email: firebaseUser.email,
          });
        }
        this.userChanged.emit(this.currentUser());
      } else {
        this.isAuthenticated.set(false);
        this.currentUser.set(null);
        this.userChanged.emit(null);
      }
    });
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      // onAuthStateChanged will handle setting isAuthenticated and currentUser
      // We can return a custom response if needed, or just the UserCredential
      return {
        user: this.currentUser(), // currentUser should be updated by onAuthStateChanged by now
        success: true,
        firebaseUserCredential: userCredential
      };
    } catch (error: any) {
      console.error('Login failed:', error);
      return {
        user: null,
        success: false,
        message: error.message || 'Login failed. Please try again.'
      };
    }
  }

  async register(userData: { email: string, password: string, username: string, firstName?: string, lastName?: string }): Promise<AuthResponse> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, userData.email, userData.password);
      const firebaseUser = userCredential.user;

      // Create user profile in Firestore
      const userDocRef = doc(this.firestore, `users/${firebaseUser.uid}`);
      const profileData: Omit<User, 'uid' | 'email'> & { createdAt: any } = {
        username: userData.username,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        createdAt: serverTimestamp()
      };
      // Ensure email is stored in Firestore as well, as it's part of the User interface
      const fullProfileData = { email: firebaseUser.email, ...profileData };

      await setDoc(userDocRef, fullProfileData);
      
      // onAuthStateChanged will handle setting isAuthenticated and currentUser
      // The currentUser signal will be updated with combined data shortly by onAuthStateChanged
      // We return a success response, the caller can rely on onAuthStateChanged for state updates.
      return {
        user: { // Provide a preliminary user object based on registration data
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          username: userData.username,
          firstName: userData.firstName,
          lastName: userData.lastName
        },
        success: true,
        firebaseUserCredential: userCredential
      };
    } catch (error: any) {
      console.error('Registration failed:', error);
      return {
        user: null,
        success: false,
        message: error.message || 'Registration failed. Please try again.'
      };
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      // onAuthStateChanged will handle setting isAuthenticated to false and currentUser to null
      this.router.navigate(['/login']); // Navigate after sign-out
    } catch (error) {
      console.error('Logout failed:', error);
      // Optionally handle logout errors (e.g., display a message)
    }
  }
  
  getProfile(): Observable<User | null> {
    // This method can be used to explicitly refresh profile data if needed.
    // onAuthStateChanged already fetches profile, so this might be redundant
    // unless specific use cases require it.
    const currentFirebaseUser = this.auth.currentUser;
    if (currentFirebaseUser) {
      const userDocRef = doc(this.firestore, `users/${currentFirebaseUser.uid}`);
      return from(getDoc(userDocRef)).pipe(
        map(docSnap => {
          if (docSnap.exists()) {
            // Explicitly cast to include createdAt for type safety
            const firestoreProfile = docSnap.data() as Omit<User, 'uid' | 'email'> & { createdAt?: Timestamp };
            const updatedUser: User = {
              uid: currentFirebaseUser.uid,
              email: currentFirebaseUser.email,
              username: firestoreProfile.username,
              firstName: firestoreProfile.firstName,
              lastName: firestoreProfile.lastName,
              createdAt: firestoreProfile.createdAt // Ensure createdAt is mapped
            };
            // Update the signal if it's different, though onAuthStateChanged should handle this primarily
            if (JSON.stringify(this.currentUser()) !== JSON.stringify(updatedUser)) {
              this.currentUser.set(updatedUser);
            }
            return updatedUser;
          } else {
            // This case should ideally be handled during registration or by onAuthStateChanged logic
            console.warn("User profile not found in Firestore during getProfile call for UID:", currentFirebaseUser.uid);
            return null;
          }
        }),
        catchError(error => {
          console.error("Error fetching profile from getProfile:", error);
          return throwError(() => error); // Propagate error
        })
      );
    }
    return of(null); // No Firebase user, so no profile to get.
  }

  // Removed old methods:
  // getToken, hasValidToken, getUserFromStorage, handleAuthResponse,
  // verifyAuth (onAuthStateChanged handles this),
  // associateUserData (no longer relevant with Firebase direct integration).
  // HttpClient (http) was removed as auth is handled by Firebase SDK.
  // baseUrl is also removed.
}