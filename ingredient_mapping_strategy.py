"""
Ingredient Mapping Strategy Tool
=================================

Identifies unmatched ingredients and finds potential BLS database matches.
Helps build new mappings for recipe_schema_extraction.py and recipe_add_audit_trails.py

Usage:
  python ingredient_mapping_strategy.py
"""

import pandas as pd
import json
import sys
from collections import Counter

# ==========================================
# 1. LOAD DATABASES
# ==========================================
print("Loading recipe database...")
try:
    recipes_df = pd.read_csv('recipe_database.csv')
except FileNotFoundError:
    print("Error: recipe_database.csv not found.")
    sys.exit(1)

print("Loading BLS database...")
try:
    bls_df = pd.read_csv('BLS_4_0_Daten_2025_DE.csv', low_memory=False)
except FileNotFoundError:
    print("Error: BLS_4_0_Daten_2025_DE.csv not found.")
    sys.exit(1)

print(f"Loaded: {len(recipes_df)} recipes, {len(bls_df)} BLS foods\n")

# ==========================================
# 2. EXTRACT ALL UNMATCHED INGREDIENTS
# ==========================================
print("Extracting unmatched ingredients from all recipes...")

unmatched_ingredients = []
for idx, row in recipes_df.iterrows():
    try:
        audit_trail = json.loads(row['ingredient_audit_trail'])
    except (json.JSONDecodeError, TypeError):
        continue

    for ingredient in audit_trail:
        if not ingredient['matched']:
            unmatched_ingredients.append({
                'original': ingredient['original'],
                'parsed_name': ingredient['parsed_name'].lower().strip(),
                'recipe': row['recipe_name'],
            })

print(f"Found {len(unmatched_ingredients)} total unmatched ingredients")
print(f"Unique ingredient names: {len(set(ing['parsed_name'] for ing in unmatched_ingredients))}\n")

# ==========================================
# 3. FIND BLS CANDIDATES FOR EACH
# ==========================================
print("="*80)
print("UNMATCHED INGREDIENT MAPPING STRATEGY")
print("="*80)

# Get unique unmatched ingredient names
unique_unmatched = {}
for ing in unmatched_ingredients:
    key = ing['parsed_name']
    if key not in unique_unmatched:
        unique_unmatched[key] = {
            'count': 0,
            'examples': [],
        }
    unique_unmatched[key]['count'] += 1
    if len(unique_unmatched[key]['examples']) < 2:
        unique_unmatched[key]['examples'].append(ing['original'])

# Sort by frequency
sorted_unmatched = sorted(unique_unmatched.items(), key=lambda x: x[1]['count'], reverse=True)

print(f"\nTop 50 most frequently unmatched ingredients:\n")
print(f"{'Frequency':<10} {'Ingredient Name':<40} {'BLS Matches':<30}")
print("-"*80)

# For each, find potential BLS matches
mapping_suggestions = {}

for rank, (ing_name, data) in enumerate(sorted_unmatched[:50], 1):
    # Search BLS database for fuzzy matches
    bls_matches = []

    # Exact substring match
    matches_exact = bls_df[bls_df['Lebensmittelbezeichnung'].str.contains(ing_name, case=False, na=False, regex=False)]
    if len(matches_exact) > 0:
        bls_matches = matches_exact['Lebensmittelbezeichnung'].head(3).tolist()

    # If no exact match, try partial word match
    if len(bls_matches) == 0:
        words = ing_name.split()
        for word in words:
            if len(word) > 3:  # Only search for words > 3 chars
                partial_matches = bls_df[bls_df['Lebensmittelbezeichnung'].str.contains(word, case=False, na=False, regex=False)]
                if len(partial_matches) > 0:
                    bls_matches = partial_matches['Lebensmittelbezeichnung'].head(3).tolist()
                    break

    # Display result
    match_str = bls_matches[0][:28] if bls_matches else "(no matches)"
    print(f"{data['count']:<10} {ing_name:<40} {match_str:<30}")

    if bls_matches:
        mapping_suggestions[ing_name] = bls_matches

print("\n" + "="*80)
print("RECOMMENDED MAPPINGS (for manual_map in recipe_schema_extraction.py)")
print("="*80)
print("\nCopy these into the manual_map dictionary:\n")
print("    # New mappings from unmatched ingredients:")

for ing_name, bls_matches in sorted(mapping_suggestions.items()):
    best_match = bls_matches[0]
    print(f"    '{ing_name}': '{best_match}',")

# ==========================================
# 4. INTERACTIVE INSPECTOR
# ==========================================
print("\n" + "="*80)
print("INTERACTIVE MAPPING HELPER")
print("="*80)

while True:
    print("\nOptions:")
    print("  1. View all BLS candidates for an ingredient")
    print("  2. Search BLS database for a term")
    print("  3. Show recipes with specific unmatched ingredient")
    print("  4. Export mapping suggestions to CSV")
    print("  5. Exit")

    choice = input("\nSelect option (1-5): ").strip()

    if choice == "1":
        ing_name = input("Enter ingredient name: ").strip().lower()
        matches = bls_df[bls_df['Lebensmittelbezeichnung'].str.contains(ing_name, case=False, na=False, regex=False)]
        if len(matches) > 0:
            print(f"\nFound {len(matches)} BLS matches for '{ing_name}':")
            for i, (idx, row) in enumerate(matches.head(10).iterrows(), 1):
                print(f"  {i}. {row['Lebensmittelbezeichnung']}")
        else:
            print(f"No BLS matches found for '{ing_name}'")

    elif choice == "2":
        search_term = input("Enter search term: ").strip()
        matches = bls_df[bls_df['Lebensmittelbezeichnung'].str.contains(search_term, case=False, na=False, regex=False)]
        if len(matches) > 0:
            print(f"\nFound {len(matches)} BLS foods containing '{search_term}':")
            for i, (idx, row) in enumerate(matches.head(10).iterrows(), 1):
                print(f"  {i}. {row['Lebensmittelbezeichnung']}")
        else:
            print(f"No matches found for '{search_term}'")

    elif choice == "3":
        ing_name = input("Enter unmatched ingredient name: ").strip().lower()
        recipes_with_ing = [ing for ing in unmatched_ingredients if ing['parsed_name'] == ing_name]
        if recipes_with_ing:
            print(f"\nRecipes with '{ing_name}' (unmatched):")
            for ing in recipes_with_ing[:10]:
                print(f"  • {ing['recipe']}: {ing['original']}")
        else:
            print(f"No recipes with '{ing_name}'")

    elif choice == "4":
        # Export suggestions to CSV
        suggestion_list = []
        for ing_name, bls_matches in mapping_suggestions.items():
            for i, match in enumerate(bls_matches, 1):
                suggestion_list.append({
                    'unmatched_ingredient': ing_name,
                    'frequency': unique_unmatched[ing_name]['count'],
                    'example': unique_unmatched[ing_name]['examples'][0],
                    f'bls_candidate_{i}': match
                })

        if suggestion_list:
            export_df = pd.DataFrame(suggestion_list)
            export_df.to_csv('mapping_suggestions.csv', index=False, encoding='utf-8-sig')
            print("✓ Exported to: mapping_suggestions.csv")
        else:
            print("No suggestions to export")

    elif choice == "5":
        break

print("\nDone!")
