import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatError } from '@angular/material/form-field'; // For error directives if needed

import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service'; // Adjust path as necessary
import { User } from '../../services/auth.service'; // Adjust path

// --- Mocks ---
const mockUser: User = {
  uid: '123',
  email: 'test@example.com',
  username: 'testuser',
};

const mockAuthService = {
  login: jasmine.createSpy('login').and.returnValue(Promise.resolve({ success: true, user: mockUser })),
  // No need to mock currentUser or isAuthenticated for this component's direct tests
};

const mockRouter = {
  navigate: jasmine.createSpy('navigate'),
};

const mockSnackBar = {
  open: jasmine.createSpy('open'),
};

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: AuthService;
  let router: Router;
  let snackBar: MatSnackBar;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        LoginComponent, // Import the standalone component directly
        ReactiveFormsModule,
        NoopAnimationsModule, // For Material components animations
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        // MatError is a directive, usually part of MatFormFieldModule
      ],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    snackBar = TestBed.inject(MatSnackBar);

    // Reset spies before each test
    mockAuthService.login.calls.reset();
    mockRouter.navigate.calls.reset();
    mockSnackBar.open.calls.reset();
    
    fixture.detectChanges(); // Initial data binding
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should create a login form with email and password controls', () => {
      expect(component.loginForm).toBeDefined();
      expect(component.loginForm.get('email')).toBeDefined();
      expect(component.loginForm.get('password')).toBeDefined();
    });

    it('form should be invalid when empty', () => {
      expect(component.loginForm.valid).toBeFalse();
    });

    it('email field should be invalid if not a valid email', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.setValue('test');
      expect(emailControl?.hasError('email')).toBeTrue();
    });
  });

  describe('Form Submission', () => {
    it('should call authService.login on valid form submission and navigate on success', fakeAsync(() => {
      component.loginForm.setValue({ email: 'test@example.com', password: 'password123' });
      expect(component.loginForm.valid).toBeTrue();

      mockAuthService.login.and.returnValue(Promise.resolve({ success: true, user: mockUser }));
      
      component.onSubmit();
      expect(component.isLoading()).toBeTrue();
      tick(); // Resolve the promise

      expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(component.isLoading()).toBeFalse();
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
      expect(snackBar.open).not.toHaveBeenCalled();
    }));

    it('should show snackbar message on login failure', fakeAsync(() => {
      component.loginForm.setValue({ email: 'test@example.com', password: 'wrongpassword' });
      expect(component.loginForm.valid).toBeTrue();

      const errorResponse = { success: false, message: 'Invalid credentials' };
      mockAuthService.login.and.returnValue(Promise.resolve(errorResponse)); // Simulate a "successful" call that returns a business error
      
      component.onSubmit();
      expect(component.isLoading()).toBeTrue();
      tick(); // Resolve the promise

      expect(authService.login).toHaveBeenCalledWith('test@example.com', 'wrongpassword');
      expect(component.isLoading()).toBeFalse();
      expect(snackBar.open).toHaveBeenCalledWith('Invalid credentials', 'Close', jasmine.any(Object));
      expect(router.navigate).not.toHaveBeenCalled();
    }));
    
    it('should show snackbar message on login promise rejection', fakeAsync(() => {
      component.loginForm.setValue({ email: 'test@example.com', password: 'wrongpassword' });
      expect(component.loginForm.valid).toBeTrue();

      const error = { message: 'Network error' };
      mockAuthService.login.and.returnValue(Promise.reject(error)); // Simulate a promise rejection
      
      component.onSubmit();
      expect(component.isLoading()).toBeTrue();
      tick(); // Resolve the promise

      expect(authService.login).toHaveBeenCalledWith('test@example.com', 'wrongpassword');
      expect(component.isLoading()).toBeFalse();
      expect(snackBar.open).toHaveBeenCalledWith('Network error', 'Close', jasmine.any(Object));
      expect(router.navigate).not.toHaveBeenCalled();
    }));

    it('should not call authService.login if form is invalid', () => {
      component.loginForm.setValue({ email: '', password: '' }); // Invalid form
      component.onSubmit();
      expect(authService.login).not.toHaveBeenCalled();
    });
  });

  describe('Required Fields', () => {
    it('email field should be required', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.setValue('');
      expect(emailControl?.hasError('required')).toBeTrue();
    });

    it('password field should be required', () => {
      const passwordControl = component.loginForm.get('password');
      passwordControl?.setValue('');
      expect(passwordControl?.hasError('required')).toBeTrue();
    });
  });

  describe('Navigate to Register', () => {
    it('should navigate to /register when navigateToRegister is called', () => {
      component.navigateToRegister();
      expect(router.navigate).toHaveBeenCalledWith(['/register']);
    });

    it('should navigate to /register when "Create an account" button is clicked', () => {
      // This requires querying the DOM and simulating a click
      const navigateButton = fixture.debugElement.nativeElement.querySelector('button[type="button"]');
      navigateButton.click();
      expect(router.navigate).toHaveBeenCalledWith(['/register']);
    });
  });
});
