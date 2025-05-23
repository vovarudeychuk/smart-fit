# Responsive Navigation System

## Overview
The navigation system now adapts to different screen sizes:
- **Desktop (≥ 769px)**: Left sidebar navigation (Ubuntu-style)
- **Mobile (≤ 768px)**: Bottom navigation bar

## Features

### Desktop Sidebar Navigation
- **Position**: Fixed left sidebar (260px width)
- **Design**: Purple gradient background with white text
- **Layout**: Vertical menu with app branding at top
- **Sections**:
  - Header: App icon + "SmartFit" title
  - Navigation items: Dashboard, Journal, Add Food, Profile, Mock Data
  - Footer: Logout button
- **Interactions**:
  - Hover effects with slide animation
  - Active state with right border highlight
  - Special styling for "Add Food" button

### Mobile Bottom Navigation
- **Position**: Fixed bottom bar (64px height)
- **Design**: White background with rounded top corners
- **Layout**: Horizontal icons with labels
- **Items**: Dashboard, Journal, Add Food (circular), More menu
- **Interactions**:
  - Hover effects
  - Active state with bottom indicator
  - "More" menu contains Profile, Mock Data, and Logout

## Breakpoints
- **Mobile**: `max-width: 768px`
- **Desktop**: `min-width: 769px`

## Technical Implementation

### CSS Structure
```scss
.app-container {
  display: flex; // Row layout on desktop
  
  @media (max-width: 768px) {
    flex-direction: column; // Column layout on mobile
  }
}

.sidebar-nav {
  @media (max-width: 768px) {
    display: none; // Hidden on mobile
  }
}

.bottom-nav {
  @media (min-width: 769px) {
    display: none; // Hidden on desktop
  }
}
```

### Content Layout
- **Desktop**: Main content takes remaining space next to sidebar
- **Mobile**: Main content fills screen with bottom padding for navigation

## Testing
1. **Desktop**: Resize browser to ≥ 769px width to see sidebar
2. **Mobile**: Resize browser to ≤ 768px width to see bottom navigation
3. **Responsive**: Resize window to see navigation switch between modes

## Browser Support
- Modern browsers with CSS Grid and Flexbox support
- Media queries for responsive behavior
- Backdrop filter for loading overlay (falls back gracefully) 