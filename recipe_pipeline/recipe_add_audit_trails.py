"""
Add Audit Trails to Existing Recipe Database
=============================================

Re-processes stored schema.org JSON from recipe_database.csv
to add ingredient audit trail columns without re-scraping.

This is fast - just re-calculates from already-stored data.
"""

import pandas as pd
import json
import re
import sys
import html
import os
from recipe_config import DATA_DIR, RECIPE_DATABASE_OUTPUT, RECIPE_FINAL_OUTPUT, BLS_DATABASE

PATH_INGREDIENT_MAPPINGS = os.path.join(DATA_DIR, 'ingredient_mappings.csv')

# ==========================================
# 1. LOAD EXISTING DATABASE
# ==========================================
print("Loading existing recipe database...")
# Try recipe_final.csv first (main source), fallback to recipe_database.csv
try:
    recipes_df = pd.read_csv(RECIPE_FINAL_OUTPUT)
    print("✓ Loaded from: recipe_final.csv")
except FileNotFoundError:
    try:
        recipes_df = pd.read_csv(RECIPE_DATABASE_OUTPUT)
        print("✓ Loaded from: recipe_database.csv")
    except FileNotFoundError:
        print("Error: recipe_final.csv or recipe_database.csv not found.")
        sys.exit(1)

print(f"Loaded: {len(recipes_df)} recipes")

# Load BLS database for ingredient matching
print("Loading BLS database...")
try:
    bls_df = pd.read_csv(BLS_DATABASE, low_memory=False)
except FileNotFoundError:
    print("Error: BLS_4_0_Daten_2025_DE.csv not found.")
    sys.exit(1)

# Identify nutrient columns
nutrient_cols = [col for col in bls_df.columns if '[' in col]
for col in nutrient_cols:
    bls_df[col] = pd.to_numeric(bls_df[col], errors='coerce').fillna(0)

print(f"BLS database: {len(bls_df)} foods, {len(nutrient_cols)} nutrients")

# ==========================================
# 2. SETUP MAPPING (load directly from CSV)
# ==========================================
# Load mappings directly from CSV (not cached import) to get latest changes
print("Loading ingredient mappings...")
try:
    mappings_df = pd.read_csv(PATH_INGREDIENT_MAPPINGS)
    manual_map = dict(zip(mappings_df['ingredient_name'], mappings_df['bls_entry_name']))
    print(f"✓ Loaded {len(manual_map)} ingredient mappings from CSV")
except FileNotFoundError:
    print("Warning: ingredient_mappings.csv not found, using fallback")
    from ingredient_mapping_config import MANUAL_INGREDIENT_MAP
    manual_map = MANUAL_INGREDIENT_MAP
    print(f"✓ Using fallback {len(manual_map)} ingredient mappings")

# ==========================================
# 3. HELPER FUNCTIONS
# ==========================================
def get_weight(name, qty, had_qty=True):
    """Determine weight based on ingredient type and quantity."""
    ln = name.lower()
    if not had_qty:
        if 'petersilie' in ln or 'koriander' in ln: return 10.0
        if 'knoblauch' in ln: return 4.0
        if 'ingwer' in ln: return 5.0
        return 1.0
    if qty >= 10: return qty
    if 'ei' in ln or 'eier' in ln: return qty * 55
    if 'zwiebel' in ln: return qty * 100
    if 'knoblauch' in ln: return qty * 4
    if 'tomate' in ln or 'bohne' in ln or 'linse' in ln: return qty * 400
    if 'tortilla' in ln: return qty * 40
    if 'avocado' in ln: return qty * 180
    if 'limette' in ln: return qty * 50
    if 'eigelb' in ln: return qty * 18
    return qty

def match_ingredient_to_bls(ingredient_name):
    """Find best BLS match for ingredient name."""
    for key, val in sorted(manual_map.items(), key=lambda x: len(x[0]), reverse=True):
        if key in ingredient_name.lower():
            match_df = bls_df[bls_df['Lebensmittelbezeichnung'].str.contains(val, case=False, na=False, regex=False)]
            if not match_df.empty:
                return match_df.iloc[0]
    return None

def parse_recipe_ingredients(schema_data):
    """Extract ingredients from schema.org Recipe data."""
    ingredients = []

    if 'recipeIngredient' not in schema_data:
        return ingredients

    ingredient_list = schema_data['recipeIngredient']
    if isinstance(ingredient_list, str):
        ingredient_list = [ingredient_list]

    for ingredient_str in ingredient_list:
        # Decode HTML entities (&frac14; -> ¼, &frac12; -> ½, etc.)
        ingredient_str = html.unescape(ingredient_str)

        match = re.match(r'^([\d\.\s½¼¾]+\s*(?:g|kg|ml|l|tsp|tbsp|cup|stück|prise|tl|el)?)\s*(.*)', ingredient_str, re.IGNORECASE)
        if match:
            qty_str = match.group(1).strip()
            ingredient_name = match.group(2).strip()

            # Clean up ingredient name - remove common qualifiers
            ingredient_name = re.sub(r',\s*(frisch|getrocknet|gefroren|roh|gekocht|tk|tiefgekühlt)', '', ingredient_name, flags=re.IGNORECASE)
            ingredient_name = re.sub(r'\s+(frisch|getrocknet|gefroren|roh|gekocht|tk|tiefgekühlt)$', '', ingredient_name, flags=re.IGNORECASE)
            ingredient_name = re.sub(r'^(stängel|stengel|bund|blatt|blätter)\s+', '', ingredient_name, flags=re.IGNORECASE)
            ingredient_name = re.sub(r'\s*\(.*?\)', '', ingredient_name)  # Remove parentheses
            ingredient_name = ingredient_name.strip()

            # Parse quantity - handle fractions
            qty_match = re.match(r'([\d\.½¼¾]+)', qty_str)
            if qty_match:
                qty_str_parsed = qty_match.group(1)
                # Convert fractions to decimals
                qty_str_parsed = qty_str_parsed.replace('½', '.5').replace('¼', '.25').replace('¾', '.75')
                qty = float(qty_str_parsed) if qty_str_parsed else 1.0
            else:
                qty = 1.0

            ingredients.append({
                'original': ingredient_str,
                'name': ingredient_name,
                'qty': qty,
                'qty_str': qty_str
            })
        else:
            ingredients.append({
                'original': ingredient_str,
                'name': ingredient_str,
                'qty': 1.0,
                'qty_str': '1'
            })

    return ingredients

def calculate_recipe_nutrients_with_audit(ingredients):
    """Calculate nutrients and generate audit trail."""
    recipe_nutrients = {}
    ingredient_audit_trail = []
    matched_count = 0

    for ingredient in ingredients:
        bls_data = match_ingredient_to_bls(ingredient['name'])

        audit_entry = {
            'original': ingredient['original'],
            'parsed_name': ingredient['name'],
            'quantity': ingredient['qty'],
            'quantity_str': ingredient['qty_str'],
            'matched': False,
            'bls_name': None,
            'weight_g': None,
            'nutrient_contribution': {}
        }

        if bls_data is not None:
            weight = get_weight(ingredient['name'], ingredient['qty'], True)
            audit_entry['matched'] = True
            audit_entry['bls_name'] = bls_data['Lebensmittelbezeichnung']
            audit_entry['weight_g'] = weight
            matched_count += 1

            contribution = {}
            for col in nutrient_cols:
                value = (bls_data[col] * weight) / 100.0
                recipe_nutrients[col] = recipe_nutrients.get(col, 0) + value
                if value > 0:
                    contribution[col] = round(value, 2)
            audit_entry['nutrient_contribution'] = contribution

        ingredient_audit_trail.append(audit_entry)

    return recipe_nutrients, ingredient_audit_trail, matched_count

# ==========================================
# 4. ADD AUDIT TRAILS TO EACH RECIPE
# ==========================================
print("\nProcessing audit trails from stored schema.org data...")
print("-" * 70)

new_data = {
    'ingredients_matched': [],
    'ingredients_skipped': [],
    'match_rate_%': [],
    'ingredient_audit_trail': []
}

# Initialize nutrient columns
for col in nutrient_cols:
    new_data[col] = []

for idx, row in recipes_df.iterrows():
    if (idx + 1) % 50 == 0:
        print(f"[{idx+1}/{len(recipes_df)}] Processing...")

    try:
        schema_data = json.loads(row['schema_org_json'])
    except (json.JSONDecodeError, TypeError):
        print(f"Warning: Could not parse schema.org JSON for recipe {idx}")
        new_data['ingredients_matched'].append(0)
        new_data['ingredients_skipped'].append(0)
        new_data['match_rate_%'].append(0)
        new_data['ingredient_audit_trail'].append('[]')
        # Add zeros for all nutrients
        for col in nutrient_cols:
            new_data[col].append(0)
        continue

    ingredients = parse_recipe_ingredients(schema_data)
    nutrients, audit_trail, matched_count = calculate_recipe_nutrients_with_audit(ingredients)

    total_ingredients = len(ingredients)
    skipped_count = total_ingredients - matched_count
    match_rate = (matched_count / total_ingredients * 100) if total_ingredients > 0 else 0

    new_data['ingredients_matched'].append(matched_count)
    new_data['ingredients_skipped'].append(skipped_count)
    new_data['match_rate_%'].append(round(match_rate, 1))
    new_data['ingredient_audit_trail'].append(json.dumps(audit_trail, ensure_ascii=False))

    # CRITICAL: Save calculated nutrients (including lactose!)
    for col in nutrient_cols:
        new_data[col].append(nutrients.get(col, 0))

# ==========================================
# 5. ADD NEW COLUMNS TO DATAFRAME
# ==========================================
print("\nUpdating database columns...")
print(f"  • Audit trails: ingredient_audit_trail")
print(f"  • Match statistics: ingredients_matched, ingredients_skipped, match_rate_%")
print(f"  • ALL nutrients recalculated: {len(nutrient_cols)} columns (including lactose!)")

for col in new_data:
    recipes_df[col] = new_data[col]

# ==========================================
# 6. SAVE UPDATED DATABASE
# ==========================================
print("\nSaving updated recipe database...")
recipes_df.to_csv(RECIPE_DATABASE_OUTPUT, index=False, encoding='utf-8-sig')
print("✓ Saved: recipe_database.csv")

# Keep recipe_final.csv in sync (used by optimization scripts)
recipes_df.to_csv(RECIPE_FINAL_OUTPUT, index=False, encoding='utf-8-sig')
print("✓ Saved: recipe_final.csv (synced)")

# ==========================================
# 7. DISPLAY STATISTICS
# ==========================================
print("\n" + "=" * 70)
print("AUDIT TRAIL SUMMARY")
print("=" * 70)

avg_match_rate = recipes_df['match_rate_%'].mean()
median_match_rate = recipes_df['match_rate_%'].median()
min_match_rate = recipes_df['match_rate_%'].min()
max_match_rate = recipes_df['match_rate_%'].max()

total_ingredients = recipes_df['ingredient_count'].sum()
total_matched = recipes_df['ingredients_matched'].sum()
total_skipped = recipes_df['ingredients_skipped'].sum()
overall_match_rate = (total_matched / total_ingredients * 100) if total_ingredients > 0 else 0

print(f"\nOverall Statistics:")
print(f"  Total recipes: {len(recipes_df)}")
print(f"  Total ingredients: {total_ingredients:,}")
print(f"  Total matched: {total_matched:,} ({overall_match_rate:.1f}%)")
print(f"  Total skipped: {total_skipped:,} ({100-overall_match_rate:.1f}%)")

print(f"\nMatch Rate Distribution:")
print(f"  Average: {avg_match_rate:.1f}%")
print(f"  Median:  {median_match_rate:.1f}%")
print(f"  Min:     {min_match_rate:.1f}%")
print(f"  Max:     {max_match_rate:.1f}%")

perfect = len(recipes_df[recipes_df['match_rate_%'] == 100.0])
excellent = len(recipes_df[(recipes_df['match_rate_%'] >= 90) & (recipes_df['match_rate_%'] < 100)])
good = len(recipes_df[(recipes_df['match_rate_%'] >= 70) & (recipes_df['match_rate_%'] < 90)])
fair = len(recipes_df[(recipes_df['match_rate_%'] >= 50) & (recipes_df['match_rate_%'] < 70)])
poor = len(recipes_df[recipes_df['match_rate_%'] < 50])

print(f"\nRecipes by Match Quality:")
print(f"  ✓✓ Perfect (100%):      {perfect:3d} recipes ({perfect/len(recipes_df)*100:.1f}%)")
print(f"  ✓  Excellent (90-99%):  {excellent:3d} recipes ({excellent/len(recipes_df)*100:.1f}%)")
print(f"  ◐ Good (70-89%):       {good:3d} recipes ({good/len(recipes_df)*100:.1f}%)")
print(f"  ◑ Fair (50-69%):       {fair:3d} recipes ({fair/len(recipes_df)*100:.1f}%)")
print(f"  ✗ Poor (<50%):         {poor:3d} recipes ({poor/len(recipes_df)*100:.1f}%)")

# Show lactose statistics
lactose_col = 'LACS Lactose [g/100g]'
if lactose_col in recipes_df.columns:
    recipes_df['lactose_mg'] = recipes_df[lactose_col] * 1000
    recipes_with_lactose = (recipes_df['lactose_mg'] > 0).sum()
    avg_lactose = recipes_df[recipes_df['lactose_mg'] > 0]['lactose_mg'].mean() if recipes_with_lactose > 0 else 0
    max_lactose = recipes_df['lactose_mg'].max()
    print(f"\nLactose Statistics:")
    print(f"  Recipes with lactose: {recipes_with_lactose}/{len(recipes_df)} ({recipes_with_lactose/len(recipes_df)*100:.1f}%)")
    print(f"  Average (when present): {avg_lactose:.0f} mg")
    print(f"  Maximum: {max_lactose:.0f} mg")

print("\n" + "=" * 70)
print("✓ ALL nutrients recalculated with current ingredient mappings!")
print("Next: run 'python optimization_meal_planner.py' for fresh meal plan")
print("=" * 70)
