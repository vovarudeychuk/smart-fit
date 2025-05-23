# 🔥 Firebase Mock Data Guide

This guide helps you populate your Firebase with realistic test data for the SmartFit fitness application.

## 🚀 Quick Start

### Method 1: Using the UI (Recommended)
1. **Log in** to your Firebase account in the app
2. Navigate to **More → Mock Data** in the bottom navigation
3. Click **"Populate Mock Data"** 
4. Wait for the success message ✅

### Method 2: Using Browser Console
1. **Log in** to your Firebase account in the app
2. Open browser **Developer Tools** (F12)
3. Go to the **Console** tab
4. Type: `firebaseHelpers.populateMockData()`
5. Press Enter and wait for completion

## 📊 What Gets Created

### 🍎 Food Database (33 Items)
- **Proteins**: Chicken, salmon, eggs, Greek yogurt, tuna, beef, cottage cheese, protein powder
- **Carbohydrates**: Rice, quinoa, sweet potato, oats, bread, banana, apple, pasta
- **Healthy Fats**: Avocado, almonds, olive oil, walnuts, peanut butter, chia seeds
- **Vegetables**: Broccoli, spinach, carrots, bell peppers, cucumber, tomatoes
- **Dairy**: Milk, cheddar cheese, mozzarella
- **Snacks**: Protein bars, energy bars, mixed nuts

### 🎯 Nutrition Goals
- **Calories**: 2,200 per day
- **Protein**: 140g per day
- **Carbohydrates**: 275g per day
- **Fat**: 73g per day

### 📈 Daily Food Logs (7 Days)
- **Past Week**: Realistic daily nutrition entries with breakfast, lunch, dinner, and snacks
- **Varied Meals**: Different food combinations each day
- **Calculated Totals**: Automatic macro and calorie totals for each day

## 🛠️ Console Helper Commands

After logging in, you can use these commands in the browser console:

```javascript
// Get help
firebaseHelpers.help()

// Data Management
firebaseHelpers.populateMockData()  // Create all mock data
firebaseHelpers.clearUserData()     // Clear user's nutrition data

// Data Inspection
firebaseHelpers.listFoods()         // List all foods in database
firebaseHelpers.getUserGoals()      // Show user's nutrition goals
firebaseHelpers.checkAuth()         // Check authentication status
```

## 🏗️ Firebase Data Structure

The mock data creates the following Firestore structure:

```
/foods (collection)
  /{foodId} (document)
    - name: string
    - calories: number
    - protein: number
    - carbs: number
    - fat: number
    - servingSize: string

/users (collection)
  /{userId} (document)
    /nutritionGoals (subcollection)
      /userGoals (document)
        - calorieGoal: number
        - proteinGoal: number
        - carbsGoal: number
        - fatGoal: number
    
    /dailyEntries (subcollection)
      /{YYYY-MM-DD} (document)
        - date: Date
        - foodItems: FoodItem[]
        - totalCalories: number
        - totalProtein: number
        - totalCarbs: number
        - totalFat: number
```

## 🔧 Development Tips

### Testing Different Scenarios
1. **Fresh Start**: Clear user data, then populate mock data
2. **Incremental Testing**: Add individual foods using the food search
3. **Goal Testing**: Modify nutrition goals to test progress tracking

### Realistic Data
- All nutrition values are based on real food data
- Serving sizes are practical (e.g., "100g", "1 medium", "30g scoop")
- Daily entries show realistic meal patterns
- Macro distributions follow common fitness goals

### Debugging
- Use `firebaseHelpers.checkAuth()` to verify you're logged in
- Use `firebaseHelpers.listFoods()` to see what's in the database
- Check the browser console for any error messages

## ⚠️ Important Notes

1. **Authentication Required**: You must be logged in with Firebase Auth to use mock data
2. **Data Persistence**: Mock data is stored in your Firebase project permanently
3. **User-Specific**: Daily entries and goals are tied to your user account
4. **Additive**: Running populateMockData() multiple times will add duplicate foods

## 🧹 Cleaning Up

To remove test data:
- **UI**: Use the "Clear User Data" button in the Mock Data Manager
- **Console**: Run `firebaseHelpers.clearUserData()`
- **Manual**: Delete documents directly in Firebase Console

## 🚀 Next Steps

After populating mock data:
1. **Dashboard**: Check your daily nutrition overview
2. **Journal**: View your food logs for the past week
3. **Profile**: Review and adjust your nutrition goals
4. **Add Food**: Test the food search with the populated database

Happy testing! 🎉 