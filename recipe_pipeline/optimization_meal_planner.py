"""
Meal Plan Optimization Script
==============================
Uses Mixed Integer Programming to create optimal weekly meal plans
based on nutritional goals, lactose constraints, and household size.

Requirements:
  pip install pandas ortools numpy
"""

import pandas as pd
import numpy as np
from ortools.linear_solver import pywraplp
import sys
import os
from typing import Dict, List, Tuple
from recipe_config import DATA_DIR

# Paths (all under data/)
PATH_RECIPE_FINAL = os.path.join(DATA_DIR, 'recipe_final.csv')
PATH_EXCLUDED_RECIPES = os.path.join(DATA_DIR, 'excluded_recipes.txt')
PATH_MEAL_PLAN = os.path.join(DATA_DIR, 'optimization_meal_plan.csv')
PATH_RECIPE_DB = os.path.join(DATA_DIR, 'recipe_database.csv')
PATH_BLS = os.path.join(DATA_DIR, 'BLS_4_0_Daten_2025_DE.csv')
PATH_REPORT = os.path.join(DATA_DIR, 'optimization_report.txt')

# ==========================================
# 1. CONFIGURATION
# ==========================================

# Household size
HOUSEHOLD_SIZE = 2

# Meals per day
MEALS_PER_DAY = 2  # lunch + dinner (adjust as needed)

# Weekly Nutritional Goals (total for the week, before scaling by household size)
WEEKLY_GOALS = {
    'ENERCC_kcal': 14000,       # Total calories for week
    'PROT_g': 385,              # Total protein (g) for week
    'FAT_g': 490,               # Total fat (g) for week
    'CHO_g': 1750,              # Total carbs (g) for week
    'FIBT_g': 210,              # Total fiber (g) for week
    'VITA_ug': 4900,            # Total Vitamin A (µg) for week
    'VITC_mg': 525,             # Total Vitamin C (mg) for week
    'VITB12_ug': 16.8,          # Total Vitamin B12 (µg) for week
    'FE_mg': 56,                # Total Iron (mg) for week
    'CA_mg': 7000,              # Total Calcium (mg) for week
    'MG_mg': 2800,              # Total Magnesium (mg) for week
}

# Lactose constraints
MAX_LACTOSE_PER_RECIPE = 1000  # Max lactose per single recipe (mg)
MAX_LACTOSE_PER_MEAL = 2000    # Adjust based on tolerance

# Optimization timeout (seconds)
OPTIMIZATION_TIMEOUT = 60

# ==========================================
# 2. LACTOSE DATABASE
# ==========================================
# Estimated lactose content (mg per 100g serving)
# Source: USDA, varies based on recipe ingredients
# This is a simplified mapping - recipes with dairy ingredients
INGREDIENT_LACTOSE_MAP = {
    'käse': 700,           # Cheese
    'feta': 400,           # Feta
    'mozzarella': 200,     # Mozzarella
    'ricotta': 300,        # Ricotta
    'parmesan': 100,       # Parmesan (aged, lower lactose)
    'butter': 150,         # Butter
    'cream': 300,          # Cream/Sahne
    'sahne': 300,
    'joghurt': 400,        # Yogurt
    'milk': 500,           # Milk
    'milch': 500,
    'cheddar': 700,        # Cheddar
    'emmentaler': 150,     # Emmentaler (aged)
    'frischkäse': 800,     # Frischkäse (fresh cheese)
    'quark': 200,          # Quark
}


# ==========================================
# 3. LOAD DATA
# ==========================================
print("Loading recipe data...")
try:
    df = pd.read_csv(PATH_RECIPE_FINAL)
except FileNotFoundError:
    print("Error: recipe_final.csv not found. Run recipe_process_all.py first.")
    sys.exit(1)

print(f"Loaded {len(df)} recipes")

# Load excluded recipes (optional)
excluded_recipes = set()
try:
    with open(PATH_EXCLUDED_RECIPES, 'r', encoding='utf-8') as f:
        for line in f:
            recipe_name = line.strip()
            if recipe_name and not recipe_name.startswith('#'):  # Skip empty lines and comments
                excluded_recipes.add(recipe_name)
    if excluded_recipes:
        print(f"\n⚠️  Excluding {len(excluded_recipes)} recipes from optimization:")
        for recipe in sorted(excluded_recipes):
            print(f"   • {recipe}")
        # Filter out excluded recipes
        df = df[~df['recipe_name'].isin(excluded_recipes)]
        print(f"\n✓ Remaining recipes: {len(df)}")
except FileNotFoundError:
    print("\nℹ️  No excluded_recipes.txt found (all recipes will be considered)")
    print("   Create this file to exclude specific recipes from optimization")

# Identify ALL nutrient columns (any column starting with 'recipe_' that has a goal defined)
# This makes it dynamic - if you add nutrients to WEEKLY_GOALS, they'll automatically appear
all_recipe_cols = [col for col in df.columns if col.startswith('recipe_')]
available_nutrients = []
available_nutrient_names = []

for col in all_recipe_cols:
    nutrient_key = col.replace('recipe_', '')
    # Only include nutrients that have goals defined or are important
    if nutrient_key in WEEKLY_GOALS:
        available_nutrients.append(col)
        available_nutrient_names.append(nutrient_key)

print(f"Including {len(available_nutrients)} nutrients in optimization")

# ==========================================
# NUTRIENT SCALING
# ==========================================
# Scale nutrients based on household consumption
# Since you make the whole recipe and 2 people eat it all:
# - Calculated values (recipe_*) are already totals → divide by HOUSEHOLD_SIZE
# - Author per-serving values (author_*_per_serving) need: multiply by servings, then divide by HOUSEHOLD_SIZE

print(f"\nApplying nutrient scaling for household:")
print(f"  Household size: {HOUSEHOLD_SIZE} people")

# Extract serving counts - but only for portion-based yields
import re
def get_serving_count_and_type(yield_str):
    """
    Returns (serving_count, is_portion_based)
    - is_portion_based=True for "12 Portionen" -> count by number
    - is_portion_based=False for "400 g" -> just use per-serving directly
    """
    if not yield_str:
        return 1, True

    yield_lower = str(yield_str).lower()
    match = re.search(r'(\d+)', yield_str)
    num = int(match.group(1)) if match else 1

    # Check if this is portion-based or weight-based
    if 'portionen' in yield_lower or 'portion' in yield_lower:
        return num, True
    elif 'g' in yield_lower:
        # Weight-based (e.g., "400 g") - don't multiply
        return 1, False
    elif 'stücke' in yield_lower or 'stück' in yield_lower:
        return num, True
    else:
        return num, True

df['_serving_count'] = 1
df['_is_portion_based'] = True
for idx in df.index:
    count, is_portion = get_serving_count_and_type(df.loc[idx, 'recipe_yield'])
    df.loc[idx, '_serving_count'] = count
    df.loc[idx, '_is_portion_based'] = is_portion

portion_based = df['_is_portion_based'].sum()
weight_based = (~df['_is_portion_based']).sum()
print(f"  Portion-based yields (e.g., Portionen): {portion_based}")
print(f"  Weight-based yields (e.g., grams): {weight_based}")

# Scale calculated nutrient columns: divide by household size
for col in available_nutrients:
    df[col] = df[col] / HOUSEHOLD_SIZE

# Scale author-provided columns correctly
author_per_serving_cols = [col for col in df.columns if col.endswith('_per_serving') and col.startswith('author_')]
author_total_cols = [col for col in df.columns if col.startswith('author_') and not col.endswith('_per_serving')]

print(f"Using {len(available_nutrients)} calculated nutrients")
if author_per_serving_cols:
    print(f"✓ Found {len(author_per_serving_cols)} author per-serving nutrients")
    # Per-serving scaling depends on yield type
    for col in author_per_serving_cols:
        # For portion-based: multiply by serving count to get total, then divide by household
        # For weight-based: per-serving value is already correct, just divide by household (person gets half)
        df[col] = df.apply(
            lambda row: (row[col] * row['_serving_count']) / HOUSEHOLD_SIZE if row['_is_portion_based'] else row[col] / HOUSEHOLD_SIZE,
            axis=1
        )
    print(f"  Portion-based: (per_serving × servings) / {HOUSEHOLD_SIZE}")
    print(f"  Weight-based: per_serving / {HOUSEHOLD_SIZE}")

if author_total_cols:
    print(f"✓ Found {len(author_total_cols)} author total nutrients")
    for col in author_total_cols:
        df[col] = df[col] / HOUSEHOLD_SIZE
    print(f"  Scaled: total / {HOUSEHOLD_SIZE}")

# Calculate lactose per person from BLS data (already in recipe columns)
print("\nCalculating lactose from BLS nutrient data...")

lactose_col = 'LACS Lactose [g/100g]'
if lactose_col in df.columns:
    # Convert from grams (recipe total) to mg per person
    df['lactose_mg_per_person'] = (df[lactose_col] * 1000) / HOUSEHOLD_SIZE
    recipes_with_lactose = (df['lactose_mg_per_person'] > 0).sum()
    print(f"✓ Lactose calculated from BLS data for {len(df)} recipes")
    print(f"  Recipes with lactose: {recipes_with_lactose}")
else:
    print("⚠️  WARNING: LACS Lactose column not found in BLS data!")
    df['lactose_mg_per_person'] = 0

# Create recipe index
recipes = df['recipe_name'].tolist()
n_recipes = len(recipes)
print(f"Using {n_recipes} recipes for optimization")

# ==========================================
# 4. CREATE OPTIMIZATION MODEL
# ==========================================
print("\n" + "="*70)
print("Creating Mixed Integer Programming Model...")
print("="*70)

solver = pywraplp.Solver.CreateSolver('CBC')
if not solver:
    print("Error: CBC solver not available. Install: pip install ortools")
    sys.exit(1)

# Decision variables: x[i] = binary (0 or 1) - recipe i is selected or not
# Select exactly 7 recipes (one per day)
x = [solver.IntVar(0, 1, f'recipe_{i}') for i in range(n_recipes)]

# ==========================================
# 5. CONSTRAINTS
# ==========================================
print("\nAdding constraints...")

# Constraint 1: Select exactly 7 recipes (one per day for the week)
solver.Add(solver.Sum(x) == 7, 'exactly_7_recipes')
print(f"  ✓ Select exactly 7 recipes (one per day)")

# Constraint 2: Max lactose per recipe
lactose_col = 'lactose_mg_per_person'
for i in range(n_recipes):
    solver.Add(x[i] * df[lactose_col].iloc[i] <= MAX_LACTOSE_PER_RECIPE * x[i], f'max_lactose_recipe_{i}')
print(f"  ✓ Max lactose per recipe: {MAX_LACTOSE_PER_RECIPE}mg")

print("  ✓ No nutritional hard constraints (maximize coverage instead)")

# ==========================================
# 6. OBJECTIVE FUNCTION
# ==========================================
print("\nSetting objective function: Maximize recipe rating...")

# Helper function to parse rating values
def parse_rating(rating_str):
    """
    Parse rating values from different formats:
    - "(1.6K)" -> 1600 (popularity/review count)
    - "-63" -> -63 (numeric rating)
    - Empty/None -> 0
    """
    if pd.isna(rating_str) or rating_str == '':
        return 0.0

    rating_str = str(rating_str).strip()

    # Handle (XK) format - convert to numeric (e.g., (1.6K) = 1600)
    if rating_str.startswith('(') and rating_str.endswith(')'):
        rating_str = rating_str[1:-1]  # Remove parentheses
        if rating_str.endswith('K'):
            try:
                return float(rating_str[:-1]) * 1000
            except ValueError:
                return 0.0

    # Handle regular numeric values
    try:
        return float(rating_str)
    except ValueError:
        return 0.0

# Helper function to get best available column (prefer author per-serving data)
def get_nutrient_column(nutrient_key):
    """Return author per-serving column if exists, otherwise calculated column"""
    # Prefer per-serving author data (these are per-serving from schema.org)
    author_per_serving_col = f'author_{nutrient_key}_per_serving'
    author_col = f'author_{nutrient_key}'
    recipe_col = f'recipe_{nutrient_key}'

    if author_per_serving_col in df.columns and df[author_per_serving_col].notna().any():
        return author_per_serving_col
    elif author_col in df.columns and df[author_col].notna().any():
        return author_col
    elif recipe_col in df.columns:
        return recipe_col
    else:
        return None

# Primary objective: Maximize nutritional coverage (sum of all nutrients relative to goals)
# This rewards recipes that contribute significantly to nutritional targets
nutrition_score = solver.Sum([
    x[i] * (sum([
        (df[col].iloc[i] / WEEKLY_GOALS.get(nutrient_key, 1)) * 1000
        for nutrient_key in available_nutrient_names
        for col in [get_nutrient_column(nutrient_key)]
        if col is not None and not pd.isna(df[col].iloc[i])
    ]))
    for i in range(n_recipes)
])

# Secondary objective: Maximize recipe rating (tiebreaker for similar nutritional profiles)
rating_col = 'rating'
if rating_col in df.columns:
    # Parse ratings using custom function to handle (K) format
    rating_data = df[rating_col].apply(parse_rating)
    # Normalize rating score to prevent it from overwhelming nutrition score
    max_rating = rating_data.max() if not rating_data.empty else 1
    rating_score = solver.Sum([
        x[i] * (float(rating_data.iloc[i]) / max_rating) * 100  # Scale to ~100 range
        for i in range(n_recipes)
    ])
    rated_count = (rating_data > 0).sum()
    print(f"  ✓ Found rating column with {rated_count} rated recipes (parsed from various formats)")
else:
    rating_score = 0
    print("  ⚠️  WARNING: No rating column found")

# Tertiary objective: Minimize lactose (final tiebreaker)
lactose_col = 'lactose_mg_per_person'
lactose_obj = solver.Sum([
    x[i] * df[lactose_col].iloc[i]
    for i in range(n_recipes)
])

# Combined objective hierarchy:
# 1. Maximize nutritional coverage (weight: 1000)
# 2. Maximize rating (weight: 10)
# 3. Minimize lactose (weight: 0.01)
combined_objective = nutrition_score + rating_score - (lactose_obj * 0.01)

solver.Maximize(combined_objective)
print("  ✓ Objective: (1) maximize nutrition, (2) maximize rating, (3) minimize lactose")

# ==========================================
# 7. SOLVE
# ==========================================
print("\n" + "="*70)
print("Solving Optimization Problem...")
print("="*70)

status = solver.Solve()

if status == pywraplp.Solver.OPTIMAL:
    print("\n✓ OPTIMAL SOLUTION FOUND!")
elif status == pywraplp.Solver.FEASIBLE:
    print("\n⚠ FEASIBLE solution found (may not be optimal due to timeout)")
else:
    print("\n✗ No solution found")
    sys.exit(1)

# ==========================================
# 8. EXTRACT RESULTS
# ==========================================
print("\n" + "="*70)
print("MEAL PLAN RESULTS")
print("="*70)

selected_recipes = []
for i in range(n_recipes):
    is_selected = int(x[i].solution_value())
    if is_selected > 0:
        lactose_col = 'lactose_mg_per_person'
        selected_recipes.append({
            'recipe': recipes[i],
            'recipe_url': df['recipe_url'].iloc[i] if 'recipe_url' in df.columns else '',
            'rating': rating_data.iloc[i] if 'rating' in df.columns else 0,
            'lactose_per_serving': df[lactose_col].iloc[i],
            'calories': df['recipe_ENERCC_kcal'].iloc[i],
            'protein': df['recipe_PROT_g'].iloc[i],
            'fat': df['recipe_FAT_g'].iloc[i],
            'carbs': df['recipe_CHO_g'].iloc[i],
            'fiber': df['recipe_FIBT_g'].iloc[i],
            'vitamin_a': df['recipe_VITA_ug'].iloc[i],
            'vitamin_c': df['recipe_VITC_mg'].iloc[i],
            'vitamin_b12': df['recipe_VITB12_ug'].iloc[i],
            'iron': df['recipe_FE_mg'].iloc[i],
            'calcium': df['recipe_CA_mg'].iloc[i],
            'magnesium': df['recipe_MG_mg'].iloc[i],
        })

print(f"\nSelected 7 recipes for the week:")
print(f"{'Day':<8} {'Recipe':<45} {'Rating':<10} {'Lactose (mg)':<12}")
print("-" * 85)

days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
for day_idx, recipe_data in enumerate(selected_recipes):
    recipe_name = recipe_data['recipe'][:42]
    day = days[day_idx] if day_idx < 7 else f"Day {day_idx+1}"
    rating = float(recipe_data.get('rating', 0)) if recipe_data.get('rating') is not None else 0.0
    print(f"{day:<8} {recipe_name:<45} {rating:>8.1f} {recipe_data['lactose_per_serving']:>10.0f}")
    if recipe_data.get('recipe_url'):
        print(f"         → {recipe_data['recipe_url']}")

# ==========================================
# 9. NUTRITIONAL SUMMARY
# ==========================================
print("\n" + "="*70)
print("NUTRITIONAL SUMMARY")
print("="*70)

nutrition_summary = {}
for nutrient_key in available_nutrient_names:
    # Use author column if available, otherwise use calculated
    col = get_nutrient_column(nutrient_key)
    if col is None:
        continue

    total = sum([
        int(x[i].solution_value()) * df[col].iloc[i]
        for i in range(n_recipes)
        if not pd.isna(df[col].iloc[i])
    ])
    goal = WEEKLY_GOALS.get(nutrient_key, 0)
    coverage = (total / goal * 100) if goal > 0 else 0
    data_source = "Author" if col.startswith('author_') else "Calculated"
    nutrition_summary[nutrient_key] = {
        'total': total,
        'goal': goal,
        'coverage': coverage,
        'source': data_source
    }

print(f"\n{'Nutrient':<30} {'Total':<15} {'Goal':<15} {'Coverage':<12}")
print("-" * 72)
for nutrient_key, data in nutrition_summary.items():
    print(f"{nutrient_key:<30} {data['total']:>13.1f} {data['goal']:>13.1f} {data['coverage']:>10.1f}%")

# ==========================================
# 10. LACTOSE SUMMARY
# ==========================================
print("\n" + "="*70)
print("LACTOSE ANALYSIS")
print("="*70)

total_lactose = sum([recipe_data['lactose_per_serving'] for recipe_data in selected_recipes])
avg_lactose_per_day = total_lactose / 7
total_rating = sum([float(recipe_data.get('rating', 0)) if recipe_data.get('rating') is not None else 0.0 for recipe_data in selected_recipes])
avg_rating = total_rating / len(selected_recipes) if selected_recipes else 0

print(f"\nTotal Lactose (week): {total_lactose:.1f} mg")
print(f"Average per day: {avg_lactose_per_day:.1f} mg")
print(f"\nTotal Rating (week): {total_rating:.1f}")
print(f"Average rating: {avg_rating:.2f}")

# ==========================================
# 11. MEAL DISTRIBUTION
# ==========================================
print("\n" + "="*70)
print("WEEKLY MEAL PLAN (One recipe per day)")
print("="*70)
print(f"\nNote: Each recipe is prepared once for {HOUSEHOLD_SIZE} people\n")

days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
for day_idx, recipe_data in enumerate(selected_recipes[:7]):
    print(f"{days[day_idx]:>10}: {recipe_data['recipe']}")

# ==========================================
# 12. SAVE RESULTS
# ==========================================
print("\n" + "="*70)
print("SAVING RESULTS")
print("="*70)

# Create results dataframe
results_df = pd.DataFrame(selected_recipes)
results_df.to_csv(PATH_MEAL_PLAN, index=False)
print("✓ Saved: optimization_meal_plan.csv")

# Define days for report
days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

# Load recipe database to get ingredient audit trails
import json
recipe_db = pd.read_csv(PATH_RECIPE_DB)

# Load BLS database for lactose breakdown
bls_df = pd.read_csv(PATH_BLS, low_memory=False)
lactose_cols = [col for col in bls_df.columns if 'LACS' in col or 'Lactose' in col.lower()]
if lactose_cols:
    lacs_col = lactose_cols[0]
    bls_df[lacs_col] = pd.to_numeric(bls_df[lacs_col], errors='coerce').fillna(0)
else:
    lacs_col = None

# Extract unmatched ingredients for selected recipes
unmatched_by_recipe = {}
for recipe_data in selected_recipes[:7]:
    recipe_name = recipe_data['recipe']
    recipe_row = recipe_db[recipe_db['recipe_name'] == recipe_name]

    if len(recipe_row) > 0:
        try:
            audit_trail = json.loads(recipe_row.iloc[0]['ingredient_audit_trail'])
            unmatched = [ing for ing in audit_trail if not ing['matched']]
            if unmatched:
                unmatched_by_recipe[recipe_name] = unmatched
        except (json.JSONDecodeError, TypeError):
            pass

# Create detailed report
with open(PATH_REPORT, 'w', encoding='utf-8') as f:
    f.write("MEAL PLAN OPTIMIZATION REPORT\n")
    f.write("="*70 + "\n\n")
    f.write(f"Household Size: {HOUSEHOLD_SIZE}\n")
    f.write(f"Meals per Day: {MEALS_PER_DAY}\n")
    f.write(f"Total Recipes Selected: {len(selected_recipes)}\n")
    f.write(f"Total Rating (week): {total_rating:.1f}\n")
    f.write(f"Average Rating: {avg_rating:.2f}\n")
    f.write(f"Total Lactose (week): {total_lactose:.1f} mg\n")
    f.write(f"Average Lactose per Day: {avg_lactose_per_day:.1f} mg\n\n")

    f.write("WEEKLY MEAL PLAN (One recipe per day):\n")
    f.write("-"*70 + "\n")
    for day_idx, recipe_data in enumerate(selected_recipes[:7]):
        day = days[day_idx] if day_idx < 7 else f"Day {day_idx+1}"
        f.write(f"  {day}: {recipe_data['recipe']}\n")
        if recipe_data.get('recipe_url'):
            f.write(f"    URL: {recipe_data['recipe_url']}\n")
        f.write(f"    Rating: {recipe_data.get('rating', 0):.1f}\n")
        f.write(f"    Lactose: {recipe_data['lactose_per_serving']:.0f}mg\n")

        # Show all nutrients
        f.write(f"    Nutrients (per meal for {HOUSEHOLD_SIZE} people):\n")
        f.write(f"      Calories: {recipe_data['calories']:.0f} kcal\n")
        f.write(f"      Protein: {recipe_data['protein']:.1f}g\n")
        f.write(f"      Fat: {recipe_data['fat']:.1f}g\n")
        f.write(f"      Carbs: {recipe_data['carbs']:.1f}g\n")
        f.write(f"      Fiber: {recipe_data['fiber']:.1f}g\n")
        f.write(f"      Vitamin A: {recipe_data['vitamin_a']:.0f}µg\n")
        f.write(f"      Vitamin C: {recipe_data['vitamin_c']:.0f}mg\n")
        f.write(f"      Vitamin B12: {recipe_data['vitamin_b12']:.2f}µg\n")
        f.write(f"      Iron: {recipe_data['iron']:.1f}mg\n")
        f.write(f"      Calcium: {recipe_data['calcium']:.0f}mg\n")
        f.write(f"      Magnesium: {recipe_data['magnesium']:.0f}mg\n")

        # Add lactose breakdown per ingredient
        if lacs_col:
            recipe_row = recipe_db[recipe_db['recipe_name'] == recipe_data['recipe']]
            if len(recipe_row) > 0:
                try:
                    audit_trail = json.loads(recipe_row.iloc[0]['ingredient_audit_trail'])
                    matched_ingredients = [ing for ing in audit_trail if ing.get('matched')]

                    # Calculate lactose per ingredient
                    lactose_contributors = []
                    no_lactose_ingredients = []

                    for ing in matched_ingredients:
                        bls_name = ing.get('bls_name')
                        weight_g = ing.get('weight_g', 0)

                        bls_match = bls_df[bls_df['Lebensmittelbezeichnung'] == bls_name]
                        if not bls_match.empty:
                            lactose_g_per_100g = bls_match.iloc[0][lacs_col]
                            lactose_mg = (lactose_g_per_100g * 1000 * weight_g) / 100 if weight_g > 0 else 0

                            if lactose_mg > 1:  # >1mg threshold
                                lactose_contributors.append({
                                    'original': ing.get('original'),
                                    'lactose_mg': lactose_mg
                                })
                            else:
                                no_lactose_ingredients.append(ing.get('original'))

                    # Show lactose contributors
                    if lactose_contributors:
                        lactose_contributors.sort(key=lambda x: x['lactose_mg'], reverse=True)
                        f.write(f"    Lactose contributors:\n")
                        for contrib in lactose_contributors:
                            f.write(f"      • {contrib['original']}: {contrib['lactose_mg']:.1f}mg\n")

                    # Show lactose-free ingredients
                    if no_lactose_ingredients:
                        f.write(f"    Lactose-free ingredients: {len(no_lactose_ingredients)}\n")

                except (json.JSONDecodeError, TypeError):
                    pass

        # Add unmatched ingredients if any
        if recipe_data['recipe'] in unmatched_by_recipe:
            unmatched = unmatched_by_recipe[recipe_data['recipe']]
            f.write(f"    Unmatched ingredients ({len(unmatched)}):\n")
            for ing in unmatched[:5]:  # Show first 5
                f.write(f"      • {ing['original']}\n")
            if len(unmatched) > 5:
                f.write(f"      ... and {len(unmatched) - 5} more\n")
        f.write("\n")

    f.write("\n" + "="*70 + "\n")
    f.write("NUTRITIONAL SUMMARY:\n")
    f.write("-"*70 + "\n")
    for nutrient, data in nutrition_summary.items():
        f.write(f"{nutrient}: {data['total']:.1f}/{data['goal']:.1f} ({data['coverage']:.1f}%)\n")

print("✓ Saved: optimization_report.txt")

# ==========================================
# 13. SUMMARY
# ==========================================
print("\n" + "="*70)
print("OPTIMIZATION COMPLETE!")
print("="*70)
print(f"\n📊 Results Summary:")
print(f"   • Recipes selected: 7 (one per day)")
print(f"   • Total rating (week): {total_rating:.1f}")
print(f"   • Average rating: {avg_rating:.2f}")
print(f"   • Total lactose (week): {total_lactose:.1f} mg")
print(f"   • Avg lactose per day: {avg_lactose_per_day:.1f} mg")
print(f"   • Nutritional coverage: {np.mean([d['coverage'] for d in nutrition_summary.values()]):.1f}%")
print(f"\n📁 Output files:")
print(f"   • data/optimization_meal_plan.csv")
print(f"   • data/optimization_report.txt")
print("="*70)
