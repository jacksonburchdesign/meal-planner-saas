export type RecipeCategory = 'entrées' | 'sides' | 'sauces' | 'snacks' | 'desserts' | 'smoothies' | 'dips';

export interface Recipe {
  id?: string;
  title: string;
  category: RecipeCategory;
  isHealthy: boolean;
  ingredients: Ingredient[];
  instructions: string[];
  imageUrl?: string;
  source?: 'manual' | 'scanned' | 'url';
  sourceUrl?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Ingredient {
  name: string;
  amount: number | string;
  unit: string;
}

export interface WeeklyMealPlan {
  id?: string;
  startDate: number;
  endDate: number;
  meals: PlannedMeal[];
}

export interface PlannedMeal {
  id: string;
  dayOfWeek: string;
  date: number;
  recipeId: string;
  sideIds: string[];
  status: 'Pending' | 'Made' | 'Skipped' | 'Made something else';
}

export interface MealHistoryLog {
  id?: string;
  date: number;
  recipeId: string | null;
  status: 'Made' | 'Skipped' | 'Made something else';
  notes?: string;
}
