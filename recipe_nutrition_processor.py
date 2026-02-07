"""
Process stored schema.org nutrition data.
This script re-processes the saved JSON data to extract nutrition values correctly.
Can be run anytime without scraping!
"""

import pandas as pd
import json
import re

df = pd.read_csv('recipe_database.csv')

print("Processing schema.org nutrition data...")
print("="*70)

def get_servings_from_yield(yield_str):
    """
    Extract number of servings from yield string.
    Returns the first number found.
    """
    if not yield_str:
        return 1
    match = re.search(r'(\d+)', str(yield_str))
    return int(match.group(1)) if match else 1

# Process each recipe
for idx, row in df.iterrows():
    if idx < 3:  # Show first 3 for inspection
        print(f"\nRecipe {idx+1}: {row['recipe_name']}")
        print(f"  Yield: {row['recipe_yield']}")

        try:
            schema_data = json.loads(row['schema_org_json'])
            nutrition = schema_data.get('nutrition', {})

            if nutrition:
                print(f"  Schema.org nutrition (per serving):")
                for key, val in nutrition.items():
                    if key != '@type':
                        print(f"    {key}: {val}")

                # Get serving count
                servings = get_servings_from_yield(row['recipe_yield'])
                print(f"  Servings in recipe: {servings}")

                # Calculate totals
                if 'calories' in nutrition:
                    cal_match = re.search(r'([\d.]+)', str(nutrition['calories']))
                    if cal_match:
                        per_serving = float(cal_match.group(1))
                        total = per_serving * servings
                        per_meal_for_2 = total / 2
                        print(f"  Calories: {per_serving} kcal/serving × {servings} servings = {total} kcal total → {per_meal_for_2} kcal per meal for 2 people")
        except (json.JSONDecodeError, KeyError) as e:
            print(f"  Error processing: {e}")

print("\n" + "="*70)
print("Schema.org data successfully stored and processable!")
print("Next: Update optimization to use per-serving values correctly")
