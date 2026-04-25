import { useTenantData } from '../../context/TenantDataContext';

export function useCurrentWeeklyMeals() {
  const { currentPlan, nextPlan, weeklyMealsLoading } = useTenantData();
  return { currentPlan, nextPlan, loading: weeklyMealsLoading };
}
