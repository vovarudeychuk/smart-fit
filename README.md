# SmartFit

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 19.0.1.

## Development Server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Backend API

This application is designed to work with a NestJS backend API running on `http://localhost:3000`. 

### Running with Backend API
1. Start your backend API server on port 3000
2. Run `ng serve` to start the Angular development server
3. The app will use live data from your API

### Running without Backend API (Mock Data Mode)
If you don't have the backend API running, the application will automatically detect this and fall back to using mock data. You'll see a notification indicating "Backend API not available - Using mock data".

This allows you to develop and test the frontend without needing the backend running.

## Firebase Configuration

The app uses Firebase for authentication and data storage. Make sure your Firebase configuration in `src/environments/environment.ts` is properly set up.

## Code Scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running Unit Tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running End-to-End Tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Troubleshooting

### CORS Issues
If you see CORS errors in the console, it usually means:
1. The backend API is not running on port 3000
2. The backend API doesn't have CORS properly configured

The app will automatically fall back to mock data in these cases.

### Firebase Authentication Issues
If you see "auth/configuration-not-found" errors:
1. Check that your Firebase config in `src/environments/environment.ts` is correct
2. Ensure your Firebase project has Authentication enabled
3. Verify the Firebase project ID and API keys are valid

## Further Help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
