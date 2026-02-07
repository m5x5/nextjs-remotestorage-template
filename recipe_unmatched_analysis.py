"""
Analyze Unmatched Ingredients and Weight Issues
================================================

Identifies:
1. All ingredients that didn't match to BLS
2. Weight assumptions that seem unusual (very high/low)
3. Patterns in unmatched ingredients
"""

import pandas as pd
import json
import sys
from collections import Counter

# ==========================================
# 1. LOAD DATABASE
# ==========================================
print("Loading recipe database...")
try:
    recipes_df = pd.read_csv('recipe_database.csv')
except FileNotFoundError:
    print("Error: recipe_database.csv not found.")
    sys.exit(1)

print(f"Loaded: {len(recipes_df)} recipes\n")

# ==========================================
# 2. EXTRACT UNMATCHED INGREDIENTS
# ==========================================
print("Analyzing unmatched ingredients...")
unmatched_ingredients = []
weight_anomalies = []

for idx, row in recipes_df.iterrows():
    try:
        audit_trail = json.loads(row['ingredient_audit_trail'])
    except (json.JSONDecodeError, TypeError):
        continue

    for ingredient in audit_trail:
        # Collect unmatched
        if not ingredient['matched']:
            unmatched_ingredients.append({
                'original': ingredient['original'],
                'parsed_name': ingredient['parsed_name'],
                'recipe_name': row['recipe_name'],
                'recipe_idx': idx
            })

        # Collect weight anomalies (matched but unusual weight)
        if ingredient['matched'] and ingredient['weight_g'] is not None:
            weight = ingredient['weight_g']
            # Flag if weight seems unusual (very small or very large)
            if weight > 2000 or (weight < 0.1 and weight > 0):
                weight_anomalies.append({
                    'original': ingredient['original'],
                    'parsed_name': ingredient['parsed_name'],
                    'bls_name': ingredient['bls_name'],
                    'weight_g': weight,
                    'quantity': ingredient['quantity'],
                    'quantity_str': ingredient['quantity_str'],
                    'recipe_name': row['recipe_name'],
                    'recipe_idx': idx
                })

print(f"Found {len(unmatched_ingredients)} unmatched ingredients")
print(f"Found {len(weight_anomalies)} weight anomalies\n")

# ==========================================
# 3. PATTERN ANALYSIS - UNMATCHED
# ==========================================
print("=" * 80)
print("UNMATCHED INGREDIENTS ANALYSIS")
print("=" * 80)

# Find most common unmatched ingredient names
unmatched_parsed = [ing['parsed_name'].lower() for ing in unmatched_ingredients]
parsed_counts = Counter(unmatched_parsed)

print(f"\nMost frequently unmatched ingredient names (top 20):")
print("-" * 80)
for ingredient, count in parsed_counts.most_common(20):
    print(f"  {count:3d}x  {ingredient}")

# Show some examples
print(f"\nSample unmatched ingredients (first 50):")
print("-" * 80)
for i, ing in enumerate(unmatched_ingredients[:50], 1):
    print(f"{i:3d}. {ing['original']}")
    print(f"     Parsed as: {ing['parsed_name']}")
    print(f"     In recipe: {ing['recipe_name'][:50]}")

# ==========================================
# 4. EXPORT UNMATCHED TO CSV
# ==========================================
unmatched_df = pd.DataFrame(unmatched_ingredients)
unmatched_df.to_csv('unmatched_ingredients.csv', index=False, encoding='utf-8-sig')
print(f"\n✓ Exported {len(unmatched_df)} unmatched ingredients to: unmatched_ingredients.csv")

# ==========================================
# 5. WEIGHT ANOMALIES
# ==========================================
if weight_anomalies:
    print("\n" + "=" * 80)
    print("WEIGHT ANOMALIES (Unusual Weight Assumptions)")
    print("=" * 80)
    print(f"\nFound {len(weight_anomalies)} weight anomalies (>2000g or <0.1g):")
    print("-" * 80)

    for i, anom in enumerate(weight_anomalies[:30], 1):
        print(f"\n{i}. {anom['original']}")
        print(f"   Quantity: {anom['quantity_str']} (parsed: {anom['quantity']})")
        print(f"   Weight assumption: {anom['weight_g']:.2f}g")
        print(f"   Matched to: {anom['bls_name']}")
        print(f"   Recipe: {anom['recipe_name'][:50]}")

    # Export weight anomalies
    weight_anom_df = pd.DataFrame(weight_anomalies)
    weight_anom_df.to_csv('weight_anomalies.csv', index=False, encoding='utf-8-sig')
    print(f"\n✓ Exported {len(weight_anom_df)} weight anomalies to: weight_anomalies.csv")
else:
    print("\nNo weight anomalies found (all weights seem reasonable)")

# ==========================================
# 6. STATISTICS
# ==========================================
print("\n" + "=" * 80)
print("STATISTICS")
print("=" * 80)

print(f"\nUnmatched Ingredient Statistics:")
print(f"  Total unmatched: {len(unmatched_ingredients)}")
print(f"  Unique ingredient names: {len(set(ing['parsed_name'].lower() for ing in unmatched_ingredients))}")
print(f"  Average unmatched per recipe: {len(unmatched_ingredients)/len(recipes_df):.1f}")

# Recipes with most unmatched
recipes_with_unmatched = {}
for ing in unmatched_ingredients:
    idx = ing['recipe_idx']
    recipes_with_unmatched[idx] = recipes_with_unmatched.get(idx, 0) + 1

if recipes_with_unmatched:
    worst_recipes = sorted(recipes_with_unmatched.items(), key=lambda x: x[1], reverse=True)[:10]
    print(f"\nTop 10 recipes with most unmatched ingredients:")
    for idx, count in worst_recipes:
        recipe_name = recipes_df.iloc[idx]['recipe_name']
        total_ing = recipes_df.iloc[idx]['ingredient_count']
        print(f"  {count:2d} unmatched (out of {total_ing}): {recipe_name[:50]}")

print("\n" + "=" * 80)
print("FILES CREATED:")
print("  - unmatched_ingredients.csv (all unmatched ingredients)")
if weight_anomalies:
    print("  - weight_anomalies.csv (unusual weight assumptions)")
print("=" * 80)
