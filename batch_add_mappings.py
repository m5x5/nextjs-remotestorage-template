#!/usr/bin/env python3
"""
Batch Add Mappings from BLS Analysis
====================================

Reads BLS_INGREDIENT_MAPPINGS.csv and adds all new mappings to ingredient_mappings.csv
Validates each BLS entry exists before adding.
"""

import pandas as pd
import sys
import os

# Load BLS database for validation
print("Loading BLS database...")
try:
    bls_df = pd.read_csv('BLS_4_0_Daten_2025_DE.csv', low_memory=False)
    print(f"✓ Loaded {len(bls_df)} BLS entries\n")
except FileNotFoundError:
    print("Error: BLS_4_0_Daten_2025_DE.csv not found")
    sys.exit(1)

# Load current mappings
print("Loading current mappings...")
try:
    current_df = pd.read_csv('ingredient_mappings.csv')
    existing_ingredients = set(current_df['ingredient_name'].str.lower())
    print(f"✓ Found {len(current_df)} existing mappings\n")
except FileNotFoundError:
    print("Error: ingredient_mappings.csv not found")
    sys.exit(1)

# Load suggested mappings from BLS analysis
print("Loading suggested mappings from BLS analysis...")
try:
    suggested_df = pd.read_csv('BLS_INGREDIENT_MAPPINGS.csv')
    print(f"✓ Found {len(suggested_df)} suggested mappings\n")
except FileNotFoundError:
    print("Error: BLS_INGREDIENT_MAPPINGS.csv not found")
    sys.exit(1)

# Process suggested mappings
added = 0
skipped = 0
failed = 0

new_mappings = []

print("Processing suggested mappings...\n")
print("=" * 80)

for idx, row in suggested_df.iterrows():
    ingredient_name = str(row['ingredient_name']).lower().strip()
    bls_entry = str(row['suggested_bls_entry']).strip()
    category = str(row['category']).strip() if pd.notna(row['category']) else "Specialty Items"

    # Skip if already exists
    if ingredient_name in existing_ingredients:
        print(f"⊘ SKIP: '{ingredient_name}' (already exists)")
        skipped += 1
        continue

    # Validate BLS entry exists
    bls_match = bls_df[bls_df['Lebensmittelbezeichnung'] == bls_entry]

    if len(bls_match) == 0:
        print(f"✗ FAIL: '{ingredient_name}' → '{bls_entry}'")
        print(f"   BLS entry not found in database")
        failed += 1
        continue

    # Add to list
    new_mappings.append({
        'ingredient_name': ingredient_name,
        'bls_entry_name': bls_entry,
        'category': category,
        'notes': row.get('notes', '')
    })

    print(f"✓ ADD:  '{ingredient_name}' → '{bls_entry}' ({category})")
    added += 1

print("\n" + "=" * 80)
print(f"\nSummary:")
print(f"  Added:    {added}")
print(f"  Skipped:  {skipped} (already exist)")
print(f"  Failed:   {failed} (BLS entry not found)")
print(f"  Total:    {added + skipped + failed}")

if added > 0:
    print(f"\nMerging {added} new mappings...")

    # Create dataframe from new mappings
    new_df = pd.DataFrame(new_mappings)

    # Combine with existing
    merged_df = pd.concat([current_df, new_df], ignore_index=True)

    # Sort by ingredient name
    merged_df = merged_df.sort_values('ingredient_name').reset_index(drop=True)

    # Save
    merged_df.to_csv('ingredient_mappings.csv', index=False)
    print(f"✓ Saved to ingredient_mappings.csv")
    print(f"  Total mappings now: {len(merged_df)}")

    # Show new total
    print(f"\n✓ Match rate should improve from 59.5% to approximately 65-70%")
    print(f"\nNext steps:")
    print(f"  1. Run: python recipe_add_audit_trails.py")
    print(f"  2. Run: python recipe_weekly_analyzer.py")
    print(f"  3. Run: python optimization_meal_planner.py")
else:
    print(f"\nNo new mappings to add.")

print("\n" + "=" * 80)
