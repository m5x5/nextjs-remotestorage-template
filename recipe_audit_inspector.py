"""
Recipe Ingredient Audit Trail Inspector
========================================

Quick tool to inspect ingredient matching accuracy and audit trails.
Shows which ingredients were found in BLS database and which were skipped.
"""

import pandas as pd
import json
import sys
from tabulate import tabulate

# ==========================================
# 1. LOAD RECIPE DATABASE
# ==========================================
print("Loading recipe database...")
try:
    recipes_df = pd.read_csv('recipe_database.csv')
except FileNotFoundError:
    print("Error: recipe_database.csv not found.")
    print("Run recipe_schema_extraction.py first.")
    sys.exit(1)

print(f"Loaded: {len(recipes_df)} recipes\n")

# ==========================================
# 2. OVERVIEW STATISTICS
# ==========================================
print("=" * 70)
print("INGREDIENT MATCHING OVERVIEW")
print("=" * 70)

# Summary stats
total_recipes = len(recipes_df)
avg_match_rate = recipes_df['match_rate_%'].mean()
median_match_rate = recipes_df['match_rate_%'].median()
min_match_rate = recipes_df['match_rate_%'].min()
max_match_rate = recipes_df['match_rate_%'].max()

total_ingredients = recipes_df['ingredient_count'].sum()
total_matched = recipes_df['ingredients_matched'].sum()
total_skipped = recipes_df['ingredients_skipped'].sum()
overall_match_rate = (total_matched / total_ingredients * 100) if total_ingredients > 0 else 0

print(f"\nOverall Statistics:")
print(f"  Total recipes: {total_recipes}")
print(f"  Total ingredients: {total_ingredients:,}")
print(f"  Total matched: {total_matched:,} ({overall_match_rate:.1f}%)")
print(f"  Total skipped: {total_skipped:,} ({100-overall_match_rate:.1f}%)")

print(f"\nMatch Rate Distribution:")
print(f"  Average: {avg_match_rate:.1f}%")
print(f"  Median:  {median_match_rate:.1f}%")
print(f"  Min:     {min_match_rate:.1f}%")
print(f"  Max:     {max_match_rate:.1f}%")

# ==========================================
# 3. RECIPE QUALITY TIERS
# ==========================================
print(f"\n\nRecipes by Match Quality:")
perfect = len(recipes_df[recipes_df['match_rate_%'] == 100.0])
excellent = len(recipes_df[(recipes_df['match_rate_%'] >= 90) & (recipes_df['match_rate_%'] < 100)])
good = len(recipes_df[(recipes_df['match_rate_%'] >= 70) & (recipes_df['match_rate_%'] < 90)])
fair = len(recipes_df[(recipes_df['match_rate_%'] >= 50) & (recipes_df['match_rate_%'] < 70)])
poor = len(recipes_df[recipes_df['match_rate_%'] < 50])

print(f"  ✓✓ Perfect (100%):      {perfect:3d} recipes ({perfect/total_recipes*100:.1f}%)")
print(f"  ✓  Excellent (90-99%):  {excellent:3d} recipes ({excellent/total_recipes*100:.1f}%)")
print(f"  ◐ Good (70-89%):       {good:3d} recipes ({good/total_recipes*100:.1f}%)")
print(f"  ◑ Fair (50-69%):       {fair:3d} recipes ({fair/total_recipes*100:.1f}%)")
print(f"  ✗ Poor (<50%):         {poor:3d} recipes ({poor/total_recipes*100:.1f}%)")

# ==========================================
# 4. INTERACTIVE INSPECTION
# ==========================================
while True:
    print("\n" + "=" * 70)
    print("INSPECTION OPTIONS:")
    print("=" * 70)
    print("  1. View recipe by index (e.g., 'recipe 5')")
    print("  2. View low-accuracy recipes (match_rate < 70%)")
    print("  3. Show all recipes with summary")
    print("  4. Exit")
    print()

    user_input = input("Enter command: ").strip().lower()

    if user_input == "exit" or user_input == "4":
        break

    elif user_input.startswith("recipe "):
        try:
            idx = int(user_input.split()[1])
            if idx < 0 or idx >= len(recipes_df):
                print(f"Error: Recipe index must be 0-{len(recipes_df)-1}")
                continue

            recipe = recipes_df.iloc[idx]
            print(f"\n{'='*70}")
            print(f"RECIPE #{idx}: {recipe['recipe_name']}")
            print(f"{'='*70}")
            print(f"URL: {recipe['recipe_url']}")
            print(f"Yield: {recipe['recipe_yield']}")
            print(f"\nIngredient Matching:")
            print(f"  Total ingredients: {recipe['ingredient_count']}")
            print(f"  Matched to BLS:    {recipe['ingredients_matched']}")
            print(f"  Skipped:           {recipe['ingredients_skipped']}")
            print(f"  Match Rate:        {recipe['match_rate_%']:.1f}%")

            # Parse and display audit trail
            try:
                audit_trail = json.loads(recipe['ingredient_audit_trail'])
                print(f"\nIngredient Details:")
                print("-" * 70)

                for i, ingredient in enumerate(audit_trail, 1):
                    status = "✓" if ingredient['matched'] else "✗"
                    print(f"\n{i}. {status} {ingredient['original']}")
                    print(f"   Parsed: {ingredient['parsed_name']}")
                    if ingredient['matched']:
                        print(f"   Matched to: {ingredient['bls_name']}")
                        print(f"   Weight: {ingredient['weight_g']:.1f}g")
                        if ingredient['nutrient_contribution']:
                            top_nutrients = list(ingredient['nutrient_contribution'].items())[:3]
                            print(f"   Top nutrients: {', '.join([f'{k}={v}' for k,v in top_nutrients])}")
                    else:
                        print(f"   Status: NOT FOUND in BLS database")
            except json.JSONDecodeError:
                print("  Could not parse audit trail")

        except (ValueError, IndexError):
            print("Error: Use 'recipe <number>' where number is between 0 and", len(recipes_df)-1)

    elif user_input == "2":
        low_accuracy = recipes_df[recipes_df['match_rate_%'] < 70].sort_values('match_rate_%')
        if len(low_accuracy) > 0:
            print(f"\nRecipes with <70% ingredient match rate:")
            print("-" * 70)
            table_data = []
            for idx, (i, row) in enumerate(low_accuracy.iterrows(), 1):
                table_data.append([
                    i,
                    row['recipe_name'][:40],
                    row['ingredient_count'],
                    row['ingredients_matched'],
                    row['ingredients_skipped'],
                    f"{row['match_rate_%']:.1f}%"
                ])
            headers = ["#", "Recipe Name", "Total", "Matched", "Skipped", "Rate"]
            print(tabulate(table_data, headers=headers, tablefmt="grid"))
        else:
            print("Great! No recipes with <70% match rate.")

    elif user_input == "3":
        print(f"\nAll recipes with ingredient matching summary:")
        print("-" * 70)
        table_data = []
        for i, row in recipes_df.iterrows():
            table_data.append([
                i,
                row['recipe_name'][:35],
                row['ingredient_count'],
                row['ingredients_matched'],
                row['ingredients_skipped'],
                f"{row['match_rate_%']:.1f}%"
            ])
        headers = ["#", "Recipe Name", "Total", "Matched", "Skipped", "Rate"]
        print(tabulate(table_data, headers=headers, tablefmt="grid"))

    else:
        print("Unknown command. Try again.")

print("\nDone!")
