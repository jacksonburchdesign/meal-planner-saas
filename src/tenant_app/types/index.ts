export type RecipeCategory = 'entrées' | 'sides' | 'sauces' | 'snacks' | 'desserts' | 'smoothies' | 'dips';

export interface Recipe {
  id?: string;
  title: string;
  category: RecipeCategory;
  isHealthy: boolean;
  cookTime?: string;
  ingredients: Ingredient[];
  instructions: string[];
  imageUrl?: string;
  source?: 'manual' | 'camera' | 'url' | 'pinterest';
  sourceUrl?: string;
  tags?: string[];
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
  familyId: string;
  startDate: number;
  endDate: number;
  meals: PlannedMeal[];
  createdAt: number;
  shoppingList?: {
    checkedKeys: string[];
    clearedKeys: string[];
    customItems: Array<{ key: string; name: string; amountDisplay: string; recipeCount: number; category: string }>;
  };
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

export interface AppNotification {
  id?: string;
  familyId: string;
  title: string;
  message: string;
  type: 'connection_request' | 'recipe_shared' | 'system';
  read: boolean;
  createdAt: number;
  actionData?: Record<string, string>;
}

export interface FamilyConnection {
  id?: string;
  fromFamilyId: string;
  fromFamilyName: string;
  toFamilyId: string;
  toFamilyName: string;
  status: 'pending' | 'active';
  createdAt: number;
}
