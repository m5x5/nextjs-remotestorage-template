# 🎯 Meal Plan Optimization Guide

## Overview

This script uses **Mixed Integer Programming (MIP)** to automatically generate optimal weekly meal plans for your household. It selects recipes from your database that:

- ✅ Meet your nutritional goals for the week
- ✅ Minimize lactose intake per meal
- ✅ Provide variety (no recipe more than 2x per week)
- ✅ Account for household size (2+ people)

## Problem Formulation

### Decision Variables
```
x[i] = number of times recipe i is selected during the week (0-7)
```

### Constraints
1. **Nutritional Goals**: Each nutrient must be within ±10% of weekly target
2. **Minimum Meals**: At least 80% of planned meals are scheduled
3. **Diversity**: No recipe appears more than 2x per week
4. **Household Size**: Scales portions appropriately

### Objective Function
```
Minimize: Total lactose content across the week
```

## Installation

### Step 1: Install Dependencies
```bash
pip install ortools pandas numpy
```

**What these do:**
- `ortools` - Google's operations research library (MIP solver)
- `pandas` - Data manipulation
- `numpy` - Numerical computations

### Step 2: Verify Installation
```bash
python -c "from ortools.linear_solver import pywraplp; print('✓ OR-Tools installed')"
```

## Usage

### Quick Start
```bash
python optimization_meal_planner.py
```

### Customizing Your Goals

Edit `optimization_config.py`:

```python
HOUSEHOLD_SIZE = 2          # Change your household size
MEALS_PER_DAY = 2           # Change meals per day

# Adjust weekly goals
WEEKLY_GOALS = {
    'ENERCC_kcal': 14000,   # Total calories for week
    'PROT_g': 385,          # Total protein for week
    # ... other nutrients
}

MAX_LACTOSE_PER_MEAL = 2000  # Adjust lactose tolerance
```

## Configuration Examples

### Example 1: Low Lactose Focus
```python
# In optimization_config.py, uncomment the "LOW LACTOSE" section
MAX_LACTOSE_PER_MEAL = 200   # Very strict
EXCLUDE_KEYWORDS = ['butter', 'cream', 'cheese', 'milk']
```

### Example 2: High Protein / Fitness
```python
HOUSEHOLD_SIZE = 1
MEALS_PER_DAY = 3  # 3 meals per day

WEEKLY_GOALS = {
    'ENERCC_kcal': 17500,
    'PROT_g': 700,      # Much higher
    'FAT_g': 560,
    'CHO_g': 1750,
    # ...
}
```

### Example 3: Low Lactose Vegan
```python
# Uncomment "LOW LACTOSE / VEGAN GOALS" section
MAX_LACTOSE_PER_MEAL = 200
EXCLUDE_KEYWORDS = ['butter', 'cream', 'cheese', 'milk', 'egg', 'yogurt']
```

## Output Files

### `optimization_meal_plan.csv`
Selected recipes with:
- Recipe name
- Times selected (1-7)
- Lactose per serving (mg)
- Total lactose for that recipe
- Calories, protein

### `optimization_report.txt`
Detailed report with:
- Configuration (household size, meals/day)
- Selected recipes list
- Nutritional summary
- Lactose analysis

## Understanding the Results

### Sample Output
```
======================================================================
                         MEAL PLAN RESULTS
======================================================================

Selected 8 recipes:
Recipe                          Times    Lactose (mg)
----------------------------------------------------------
Bohnen Carbonara                  2        450.2
Thai Curry Chicken               2        280.1
Spinat-Käse-Spätzle             1        520.4
Gemüse Curry mit Couscous       2        120.0
...
```

### Nutritional Summary Interpretation
```
Nutrient             Total      Goal      Coverage
------------------------------------------------------
ENERCC_kcal         13,850    14,000      98.9%    ← Good
PROT_g                390       385      101.3%    ← Good
FAT_g                 485       490       99.0%    ← Good
```

**Coverage > 100%** means you exceeded the goal slightly (often acceptable).

### Lactose Analysis
```
Total Lactose (week): 2,340 mg
Average per meal: 167 mg      ← Low per meal!
Max per meal target: 2000 mg
Lactose status: ✓ Within limits
```

## Troubleshooting

### Problem: "No solution found"
**Causes:**
- Goals are too strict
- Lactose limit is too low
- Recipe database too small

**Solutions:**
```python
# Make goals more flexible
NUTRITION_TOLERANCE = 0.15  # ±15% instead of ±10%

# Relax lactose constraint
MAX_LACTOSE_PER_MEAL = 3000

# Check recipe count
# Need at least 50+ recipes for good diversity
```

### Problem: "Same recipes every day"
**Cause:** Not enough diverse recipes in database

**Solution:**
```python
# Reduce repeat frequency
MAX_RECIPE_REPEATS = 1  # Each recipe max 1x per week

# Or increase meals per day
MEALS_PER_DAY = 3  # Requires more recipe diversity
```

### Problem: "Can't meet calcium/iron goals"
**Cause:** Recipes lack specific nutrients

**Solutions:**
1. Add more nutrient-rich recipes (leafy greens for iron/calcium)
2. Adjust weekly goals to be more realistic
3. Supplement with specific foods

## Advanced Usage

### Running with Different Solvers
```python
# In optimization_meal_planner.py, change:
SOLVER_TYPE = 'SCIP'  # Different solver
```

### Increasing Solution Quality
```python
# Increase timeout for better solution
OPTIMIZATION_TIMEOUT = 300  # 5 minutes instead of 1 minute
```

### Custom Lactose Data
Instead of estimating from recipe names, you can:

1. **Add lactose column to recipe_final.csv**
   ```python
   df['lactose_mg_per_serving'] = [your_values]
   ```

2. **Use USDA database lookup**
   - Implement function to query USDA FoodData Central API
   - Match ingredients to USDA items

## Understanding the Algorithm

### Algorithm: Branch and Bound with LP Relaxation

The solver uses **Branch and Bound** technique:

1. **Relaxation**: Solve as continuous problem (x ∈ [0,1])
2. **Branching**: Force variables to integers
3. **Bounding**: Prune non-optimal branches
4. **Exploration**: Find best integer solution

This guarantees an optimal solution (if timeout allows).

### Why MIP?

Traditional methods won't work because:
- ❌ Greedy algorithms: Don't meet all constraints
- ❌ Heuristics: May miss better solutions
- ✅ MIP: Guarantees global optimality

## Extending the Script

### Add Cost Optimization
```python
# Add cost to recipes
df['cost_per_serving'] = [...]

# Modify objective
objective = minimize_lactose + 0.5 * minimize_cost
```

### Add Allergen Constraints
```python
# Exclude allergens
EXCLUDE_KEYWORDS = ['shellfish', 'peanut', 'tree nut']
```

### Add Sustainability Goals
```python
# Prioritize local/seasonal
df['is_seasonal'] = [...]

# Add to objective function
objective += seasonal_bonus
```

## Performance Tips

| Task | Time | Memory |
|------|------|--------|
| 876 recipes, 7 days | ~30-60s | ~200MB |
| 500 recipes, 14 days | ~2-5min | ~300MB |
| 1000 recipes, 7 days | ~1-2min | ~400MB |

**To speed up:**
- Reduce recipe database (filter by cuisine, rating)
- Lower `OPTIMIZATION_TIMEOUT`
- Use GLOP solver (faster, less accurate)

## FAQ

**Q: Can I plan for longer than a week?**
A: Yes, set `DAYS_IN_PLAN = 14` for 2 weeks, adjust `WEEKLY_GOALS` accordingly.

**Q: Can I exclude recipes?**
A: Yes, use `EXCLUDE_KEYWORDS` in config or pre-filter `recipe_final.csv`.

**Q: Can I add recipes manually?**
A: Yes, add rows to `recipe_final.csv` before running the optimizer.

**Q: How do I account for portion sizes?**
A: Set `HOUSEHOLD_SIZE` - recipe values are automatically scaled.

**Q: Why different results each run?**
A: With timeout, solver may find different optimal solutions (same quality, different recipes).

## References

- [Google OR-Tools Documentation](https://developers.google.com/optimization/install)
- [Mixed Integer Programming](https://en.wikipedia.org/wiki/Integer_programming)
- [Branch and Bound Algorithm](https://en.wikipedia.org/wiki/Branch_and_bound)
- [Lactose Content](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3868816/)

## Support

**For issues:**
1. Check if `recipe_final.csv` exists
2. Verify OR-Tools is installed: `pip install --upgrade ortools`
3. Check solver output messages
4. Try increasing `OPTIMIZATION_TIMEOUT`
5. Check `optimization_config.py` for conflicting constraints

## Tips for Best Results

1. **Start with default settings** - they work for most cases
2. **Gradually adjust goals** - don't make all constraints too strict
3. **Review selected recipes** - ensure they fit your taste preferences
4. **Add more recipes** - more recipes = better optimization
5. **Use realistic goals** - align with your actual dietary needs
6. **Update lactose data** - replace estimates with actual values

---

**Next Steps:**
1. Customize `optimization_config.py` with your goals
2. Run `python optimization_meal_planner.py`
3. Review output in `optimization_meal_plan.csv`
4. Adjust if needed and re-run

Happy meal planning! 🍽️📊
