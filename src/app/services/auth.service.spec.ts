import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Auth, User as FirebaseAuthUser } from '@angular/fire/auth';
import { Firestore, doc, DocumentReference } from '@angular/fire/firestore';
import { of, Subject, throwError } from 'rxjs';

import { AuthService, User } from './auth.service'; // Adjust path as necessary

// --- Mocks ---
// Mock for @angular/fire/auth
const mockFirebaseAuthUserLoggedIn: Partial<FirebaseAuthUser> = {
  uid: 'testUid123',
  email: 'test@example.com',
  // Add other relevant FirebaseAuthUser properties if needed by the service
};

const mockFirebaseAuthUserNotLoggedIn: FirebaseAuthUser | null = null;

// Subject to control onAuthStateChanged behavior
const onAuthStateChangedSubject = new Subject<FirebaseAuthUser | null>();

const mockAuth = {
  onAuthStateChanged: jasmine.createSpy('onAuthStateChanged').and.returnValue(onAuthStateChangedSubject.asObservable()),
  signInWithEmailAndPassword: jasmine.createSpy('signInWithEmailAndPassword'),
  createUserWithEmailAndPassword: jasmine.createSpy('createUserWithEmailAndPassword'),
  signOut: jasmine.createSpy('signOut').and.resolveTo(undefined),
};

// Mock for @angular/fire/firestore
const mockUserProfile: User = {
  uid: 'testUid123',
  email: 'test@example.com',
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User',
  // createdAt: ... // If you add Timestamp, mock it appropriately e.g. Timestamp.now() or a fixed date
};

const docDataSubject = new Subject<User | undefined>();
const mockFirestore = {
  doc: jasmine.createSpy('doc').and.returnValue({ path: 'users/testUid123' } as unknown as DocumentReference), // Ensure it returns something doc-like
  // docData: jasmine.createSpy('docData').and.returnValue(of(mockUserProfile)), // Simple case
  docData: jasmine.createSpy('docData').and.returnValue(docDataSubject.asObservable()),
  setDoc: jasmine.createSpy('setDoc').and.resolveTo(undefined),
  // serverTimestamp: jasmine.createSpy('serverTimestamp').and.returnValue(new Date()) // For createdAt
};

// Mock for Router
const mockRouter = {
  navigate: jasmine.createSpy('navigate'),
};

describe('AuthService', () => {
  let service: AuthService;
  let auth: Auth;
  let firestore: Firestore;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Auth, useValue: mockAuth },
        { provide: Firestore, useValue: mockFirestore },
        { provide: Router, useValue: mockRouter },
      ],
    });
    service = TestBed.inject(AuthService);
    auth = TestBed.inject(Auth);
    firestore = TestBed.inject(Firestore);
    router = TestBed.inject(Router);

    // Reset spies for each test
    mockAuth.onAuthStateChanged.calls.reset();
    mockAuth.signInWithEmailAndPassword.calls.reset();
    mockAuth.createUserWithEmailAndPassword.calls.reset();
    mockAuth.signOut.calls.reset();
    mockFirestore.doc.calls.reset();
    mockFirestore.docData.calls.reset();
    mockFirestore.setDoc.calls.reset();
    mockRouter.navigate.calls.reset();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Initial State', () => {
    it('currentUser should be null initially', () => {
      expect(service.currentUser()).toBeNull();
    });

    it('isAuthenticated should be false initially', () => {
      expect(service.isAuthenticated()).toBeFalse();
    });
  });
  
  describe('onAuthStateChanged', () => {
    it('should set isAuthenticated and currentUser when a user logs in and profile exists', fakeAsync(() => {
      // Simulate onAuthStateChanged emitting a user
      onAuthStateChangedSubject.next(mockFirebaseAuthUserLoggedIn as FirebaseAuthUser);
      tick(); // Allow microtasks to complete (e.g., async operations in onAuthStateChanged)

      // Simulate Firestore returning a profile
      docDataSubject.next(mockUserProfile);
      tick();

      expect(service.isAuthenticated()).toBeTrue();
      expect(service.currentUser()).toEqual(mockUserProfile);
      expect(firestore.doc).toHaveBeenCalledWith(jasmine.any(Object), `users/${mockFirebaseAuthUserLoggedIn.uid}`);
      expect(firestore.docData).toHaveBeenCalled();
    }));

    it('should set isAuthenticated and basic currentUser when user logs in but profile does NOT exist', fakeAsync(() => {
      onAuthStateChangedSubject.next(mockFirebaseAuthUserLoggedIn as FirebaseAuthUser);
      tick();

      docDataSubject.next(undefined); // Simulate no profile in Firestore
      tick();

      expect(service.isAuthenticated()).toBeTrue();
      expect(service.currentUser()?.uid).toEqual(mockFirebaseAuthUserLoggedIn.uid);
      expect(service.currentUser()?.email).toEqual(mockFirebaseAuthUserLoggedIn.email);
      expect(service.currentUser()?.username).toBeUndefined(); // Or whatever default is set
      expect(firestore.doc).toHaveBeenCalledWith(jasmine.any(Object), `users/${mockFirebaseAuthUserLoggedIn.uid}`);
      expect(firestore.docData).toHaveBeenCalled();
    }));

    it('should clear isAuthenticated and currentUser when a user logs out', fakeAsync(() => {
      // First, simulate a login
      onAuthStateChangedSubject.next(mockFirebaseAuthUserLoggedIn as FirebaseAuthUser);
      tick();
      docDataSubject.next(mockUserProfile);
      tick();
      expect(service.isAuthenticated()).toBeTrue(); // Pre-condition

      // Simulate onAuthStateChanged emitting null (logout)
      onAuthStateChangedSubject.next(null);
      tick();

      expect(service.isAuthenticated()).toBeFalse();
      expect(service.currentUser()).toBeNull();
    }));
  });

  describe('login()', () => {
    it('should call signInWithEmailAndPassword and return success on successful login', async () => {
      const mockUserCredential = { user: mockFirebaseAuthUserLoggedIn } as any;
      mockAuth.signInWithEmailAndPassword.and.resolveTo(mockUserCredential);
      
      const response = await service.login('test@example.com', 'password');
      
      expect(mockAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(jasmine.any(Object), 'test@example.com', 'password');
      expect(response.success).toBeTrue();
      expect(response.firebaseUserCredential).toBe(mockUserCredential);
      // Note: currentUser and isAuthenticated state is set by onAuthStateChanged,
      // which needs to be triggered separately in tests if detailed state checking is needed here.
    });

    it('should return failure on failed login', async () => {
      const error = { message: 'Login failed' };
      mockAuth.signInWithEmailAndPassword.and.rejectWith(error);
      
      const response = await service.login('test@example.com', 'wrongpassword');
      
      expect(response.success).toBeFalse();
      expect(response.message).toBe(error.message);
    });
  });

  describe('register()', () => {
    const registrationData = { 
      email: 'new@example.com', 
      password: 'newpassword123', 
      username: 'newbie',
      firstName: 'New',
      lastName: 'User'
    };
    const mockFirebaseRegisteredUser = { uid: 'newUserUid', email: registrationData.email } as FirebaseAuthUser;

    it('should call createUserWithEmailAndPassword and setDoc on successful registration', async () => {
      mockAuth.createUserWithEmailAndPassword.and.resolveTo({ user: mockFirebaseRegisteredUser } as any);
      mockFirestore.setDoc.and.resolveTo(undefined); // mock serverTimestamp if used in real code

      const response = await service.register(registrationData);

      expect(mockAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith(jasmine.any(Object), registrationData.email, registrationData.password);
      expect(mockFirestore.doc).toHaveBeenCalledWith(jasmine.any(Object), `users/${mockFirebaseRegisteredUser.uid}`);
      expect(mockFirestore.setDoc).toHaveBeenCalledWith(
        jasmine.any(Object), // The DocumentReference
        jasmine.objectContaining({ // Check for the important parts of the profile
          email: registrationData.email,
          username: registrationData.username,
          firstName: registrationData.firstName,
          lastName: registrationData.lastName,
          // createdAt: jasmine.any(Date) // If serverTimestamp is mocked to return a Date
        })
      );
      expect(response.success).toBeTrue();
      expect(response.user?.uid).toBe(mockFirebaseRegisteredUser.uid);
    });

    it('should return failure on failed registration', async () => {
      const error = { message: 'Registration failed' };
      mockAuth.createUserWithEmailAndPassword.and.rejectWith(error);
      
      const response = await service.register(registrationData);
      
      expect(response.success).toBeFalse();
      expect(response.message).toBe(error.message);
    });
  });

  describe('logout()', () => {
    it('should call signOut and router.navigate', async () => {
      // Simulate a logged-in state first for onAuthStateChanged to handle logout
      onAuthStateChangedSubject.next(mockFirebaseAuthUserLoggedIn as FirebaseAuthUser);
      tick(); // Let onAuthStateChanged process the login

      await service.logout();
      
      expect(mockAuth.signOut).toHaveBeenCalled();
      // onAuthStateChanged will emit null, which should trigger router.navigate via the service's subscription
      // To test navigation properly, you might need to ensure the onAuthStateChanged flow completes for logout
      onAuthStateChangedSubject.next(null); // Manually trigger the logout emission
      tick(); // Allow onAuthStateChanged to process logout
      
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('getProfile()', () => {
    it('should fetch and update currentUser if user is authenticated and profile exists', fakeAsync(() => {
        // Setup: Ensure user is "logged in" via onAuthStateChanged for getProfile to proceed
        mockAuth.currentUser = mockFirebaseAuthUserLoggedIn as FirebaseAuthUser; // Mock current Firebase user state for getProfile
        onAuthStateChangedSubject.next(mockFirebaseAuthUserLoggedIn as FirebaseAuthUser);
        tick();
        
        const updatedProfileData = { ...mockUserProfile, firstName: "UpdatedName" };
        // Make docData emit the updated profile when getProfile calls it
        mockFirestore.docData.and.returnValue(of(updatedProfileData)); 
        
        service.getProfile().subscribe(profile => {
            expect(profile).toEqual(updatedProfileData);
        });
        tick(); // Complete observable

        expect(firestore.doc).toHaveBeenCalledWith(jasmine.any(Object), `users/${mockFirebaseAuthUserLoggedIn.uid}`);
        expect(service.currentUser()).toEqual(updatedProfileData);
    }));

    it('should return null if user is not authenticated', fakeAsync(() => {
        mockAuth.currentUser = null; // Ensure no Firebase user
        
        service.getProfile().subscribe(profile => {
            expect(profile).toBeNull();
        });
        tick();
        expect(firestore.docData).not.toHaveBeenCalled();
    }));

    it('should return null and log warning if profile does not exist in Firestore', fakeAsync(() => {
        mockAuth.currentUser = mockFirebaseAuthUserLoggedIn as FirebaseAuthUser;
        onAuthStateChangedSubject.next(mockFirebaseAuthUserLoggedIn as FirebaseAuthUser); // Simulate login
        tick();

        mockFirestore.docData.and.returnValue(of(undefined)); // Simulate profile not found
        spyOn(console, 'warn');

        service.getProfile().subscribe(profile => {
            expect(profile).toBeNull();
        });
        tick();
        
        expect(console.warn).toHaveBeenCalledWith(jasmine.stringMatching(/User profile not found in Firestore during getProfile call/));
    }));
  });
});
