# 🧮 Technical Documentation: Meal Plan Optimization

## Problem Definition

This is a **Mixed Integer Linear Programming (MILP)** problem, formulated as follows:

### Mathematical Formulation

**Decision Variables:**
```
x_i ∈ {0, 1, 2, ..., 7}  for i ∈ {1, ..., n}
  where x_i = number of times recipe i is selected during the week
  n = total number of recipes (876 in our case)
```

**Parameters:**
```
n_j^k     = nutrient k value in recipe j
g_k       = weekly goal for nutrient k
L_j       = estimated lactose in recipe j
m         = meals per day
d         = days in week (7)
h         = household size
```

**Objective Function:**
```
Minimize: Z = Σ(x_i × L_i)  for i = 1 to n
```
Minimize total lactose content across the week.

**Constraints:**

1. **Nutritional Goals (Soft Constraints)**
   ```
   0.9 × g_k ≤ Σ(x_i × n_i^k) ≤ 1.1 × g_k    for all k

   k ∈ {calories, protein, fat, carbs, fiber, vitamins, minerals}
   Tolerance: ±10% around goal
   ```

2. **Minimum Meals**
   ```
   Σ(x_i) ≥ 0.8 × m × d = 0.8 × 14 = 11.2 meals

   Ensures at least 80% of available meal slots are filled
   ```

3. **Recipe Diversity**
   ```
   x_i ≤ 2    for all i

   No recipe selected more than twice per week
   ```

4. **Integer Constraints**
   ```
   x_i ∈ Z⁺   for all i

   Each recipe must be selected integer number of times
   ```

## Why Mixed Integer Programming?

### The Challenge
- **Discrete decisions**: Select recipes (integer times), not fractions
- **Multiple objectives**: Minimize lactose while meeting nutritional targets
- **Non-linear constraints**: Some nutrient interactions are non-linear
- **Large problem size**: 876 recipes × 7 days = 6,132 possibilities

### Why Not Other Methods?

| Method | Pros | Cons |
|--------|------|------|
| **Greedy** | Fast | No global optimality guarantee |
| **Heuristic** | Flexible | Gets stuck in local optima |
| **Genetic Algorithm** | Good for large problems | Slow, non-deterministic |
| **MIP (Chosen)** | Optimal solution guaranteed | Slower, needs specialized solver |

### MIP Advantages
✅ Mathematically optimal solution
✅ Constraint satisfaction guaranteed
✅ Proven algorithm (Branch & Bound)
✅ Handles integer variables naturally

## Solution Algorithm: Branch and Bound

The CBC solver uses **Branch and Bound** technique:

```
Step 1: RELAXATION
  ├─ Solve LP relaxation: allow x_i ∈ [0, 7] (continuous)
  ├─ Get lower bound on objective
  └─ Check if solution is integer

Step 2: BRANCHING (if not integer)
  ├─ Select fractional variable x_j = 3.5
  ├─ Create two subproblems:
  │   ├─ Subproblem A: x_j ≤ 3
  │   └─ Subproblem B: x_j ≥ 4
  └─ Recursively solve

Step 3: BOUNDING
  ├─ Track best integer solution found
  ├─ Prune branches worse than current best
  └─ Eliminate redundant searches

Step 4: TERMINATION
  ├─ When all branches explored OR
  ├─ When timeout reached
  └─ Return best integer solution found
```

## Example Walkthrough

### Small Example (5 recipes, simplified)

**Input:**
```
Recipes: A, B, C, D, E
Weekly Goal: 10,000 calories, minimize lactose

Recipe Data:
  A: 1000 cal, 500mg lactose
  B: 1500 cal, 200mg lactose  ← Low lactose
  C: 1200 cal, 100mg lactose  ← Lowest lactose
  D: 800 cal, 600mg lactose
  E: 1300 cal, 150mg lactose  ← Low-medium
```

**Optimal Solution (Example):**
```
Select:
  A: 2 times → 2000 cal, 1000mg lactose
  B: 3 times → 4500 cal, 600mg lactose
  C: 2 times → 2400 cal, 200mg lactose
  E: 1 time  → 1300 cal, 150mg lactose

Total: 10,200 cal (✓ within goal), 1950mg lactose (minimized)
```

## Implementation Details

### Data Structure

```python
# Recipe matrix
recipes_matrix[i][k] = nutrient k value in recipe i

# Decision variables
x[i] = number of times recipe i selected

# Constraints
constraint[k] = nutritional constraint for nutrient k

# Objective
objective = sum(x[i] * lactose[i] for all i)
```

### Key Code Components

**1. Variable Creation:**
```python
x = [solver.IntVar(0, 7, f'recipe_{i}') for i in range(n_recipes)]
```

**2. Constraint Addition:**
```python
for nutrient in available_nutrients:
    nutrient_expr = solver.Sum([
        x[i] * df[nutrient].iloc[i]
        for i in range(n_recipes)
    ])
    solver.Add(nutrient_expr >= lower_bound)
    solver.Add(nutrient_expr <= upper_bound)
```

**3. Objective Setting:**
```python
lactose_obj = solver.Sum([
    x[i] * df['lactose_mg'].iloc[i]
    for i in range(n_recipes)
])
solver.Minimize(lactose_obj)
```

## Performance Analysis

### Time Complexity

| Operation | Complexity |
|-----------|------------|
| LP Relaxation | O(n³) |
| Branch & Bound (worst) | O(2ⁿ) |
| CBC (heuristic) | O(n² × log n) |

For our problem: n = 876 recipes
- LP relax: ~10 seconds
- CBC solve: ~30-60 seconds (with heuristics)

### Space Complexity

| Component | Memory |
|-----------|--------|
| Recipe matrix | O(n × m) = 876 × 11 ≈ 10 KB |
| Variables | O(n) = 876 ≈ 7 KB |
| Constraint matrix | O(n × m) ≈ 10 KB |
| Solver internals | ≈ 100+ MB |
| **Total** | ≈ **200-300 MB** |

## Lactose Estimation

### Current Approach: Pattern Matching

```python
def estimate_lactose_from_recipe_name(recipe_name, ingredients_count):
    lactose_level = 0.0

    for ingredient_key, lactose_content in INGREDIENT_LACTOSE_MAP.items():
        if ingredient_key in recipe_name.lower():
            # Add proportional lactose
            lactose_level += lactose_content * 0.3

    # Normalize by ingredient count
    lactose_level = lactose_level * (ingredients_count / 15)
    return max(0, lactose_level)
```

### Limitations & Improvements

**Current Limitations:**
- Only uses recipe name (not full ingredient list)
- Pattern matching is simple
- No portion size consideration
- Estimates only

**Improvements:**
1. **Use actual ingredient data** (if available in recipe)
   ```python
   lactose = sum(ingredient_lactose * amount for each ingredient)
   ```

2. **USDA FoodData Central API**
   ```python
   usda_api = USDAfood_database()
   lactose_value = usda_api.query("cheese, cheddar")
   ```

3. **Machine Learning estimation**
   ```python
   ml_model = train_on_labeled_recipes()
   lactose_pred = ml_model.predict(recipe_features)
   ```

4. **User input override**
   ```python
   if recipe in manual_lactose_map:
       use manual_value
   else:
       use estimated_value
   ```

## Extensions & Enhancements

### 1. Multi-Objective Optimization

```python
# Current: Single objective (minimize lactose)
# Goal: Minimize lactose AND minimize cost AND maximize nutrition

from ortools.linear_solver import pywraplp

# Weighted objective
objective = (
    w_lactose * total_lactose +
    w_cost * total_cost +
    w_variety * (1 - diversity_score)
)

solver.Minimize(objective)
```

### 2. Soft Constraints (Lexicographic Optimization)

```python
# Phase 1: Minimize lactose while meeting nutrition
# Phase 2: Among best Phase 1 solutions, maximize variety
# Phase 3: Among best Phase 1-2, minimize cost

# Implement as sequence of optimizations
```

### 3. Temporal Constraints

```python
# No same recipe 2 days in a row
for day in range(6):
    for recipe in recipes:
        # If recipe selected on day d, exclude from day d+1
        solver.Add(x[recipe][day] + x[recipe][day+1] <= 1)
```

### 4. Allergen Constraints

```python
# Binary variables for allergen presence
is_allergen[i] = 1 if recipe i contains allergen else 0

# Constraint: No allergen recipes selected
solver.Add(sum(x[i] * is_allergen[i]) == 0)
```

## Solver Comparison

| Solver | Type | Speed | Accuracy | License |
|--------|------|-------|----------|---------|
| **CBC (chosen)** | Open Source | Fast | Very Good | Free |
| GLOP | Linear Only | Very Fast | Good | Free |
| SCIP | Academic | Medium | Excellent | Free (academic) |
| CPLEX | Commercial | Very Fast | Excellent | $$$ |
| Gurobi | Commercial | Very Fast | Excellent | $$$ |

**Why CBC?**
- ✅ Free and open-source
- ✅ Good balance speed/quality
- ✅ Actively maintained
- ✅ Integrated with OR-Tools
- ✅ No license cost

## Validation & Testing

### Solution Feasibility Check

```python
# After solving, verify solution:

for nutrient in goals:
    total = sum(x[i] * nutrient_value[i])
    assert 0.9 * goal[nutrient] <= total <= 1.1 * goal[nutrient]

for i in recipes:
    assert 0 <= x[i] <= 2  # diversity constraint

total_meals = sum(x)
assert total_meals >= min_meals_needed
```

### Solution Quality Metrics

```python
# Objective value
objective_value = sum(x[i] * lactose[i])

# Constraint satisfaction
constraint_satisfaction = (num_satisfied_constraints / total_constraints) * 100

# Nutritional coverage
nutrition_coverage = mean([goal_i / actual_i for all nutrients])

# Diversity score
diversity_score = unique_recipes_selected / total_recipes
```

## Known Limitations & Future Work

### Current Limitations

1. **Lactose Estimation**: Crude pattern matching on recipe name
2. **No Temporal Constraints**: Same recipe could appear on consecutive days
3. **Static Goals**: No support for varying goals by day
4. **Portion Size**: Assumes standard serving, doesn't scale well
5. **Taste Preferences**: No consideration of user preferences

### Future Enhancements

1. **Ingredient-level analysis**: Parse full ingredient lists
2. **Day-specific constraints**: Different goals for different days
3. **User preferences**: Like/dislike ratings for recipes
4. **Cost optimization**: Include price data
5. **Preparation time**: Avoid complex recipes on busy days
6. **Nutritional balance**: Ensure macro ratios are healthy
7. **Sustainability**: Prioritize local/seasonal ingredients
8. **Machine learning**: Learn user preferences from history

## References

### Optimization Theory
- [Linear Programming](https://en.wikipedia.org/wiki/Linear_programming)
- [Integer Programming](https://en.wikipedia.org/wiki/Integer_programming)
- [Branch and Bound](https://en.wikipedia.org/wiki/Branch_and_bound)

### Tools & Libraries
- [Google OR-Tools](https://developers.google.com/optimization)
- [CBC Solver Documentation](https://github.com/coin-or/Cbc)
- [PuLP Documentation](https://coin-or.github.io/pulp/)

### Nutrition Science
- [USDA FoodData Central](https://fdc.nal.usda.gov/)
- [Lactose Content in Foods](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3868816/)
- [Dietary Guidelines](https://www.dietaryguidelines.gov/)

### Application Domain
- [Meal Planning Optimization](https://www.sciencedirect.com/topics/computer-science/meal-planning)
- [Combinatorial Optimization Problems](https://en.wikipedia.org/wiki/Combinatorial_optimization)

---

**Document Version:** 1.0
**Last Updated:** 2026-01-28
**Status:** Complete ✓
