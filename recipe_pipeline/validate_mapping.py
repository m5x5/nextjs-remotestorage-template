"""
Validate Ingredient Mapping
============================

Test if a mapping will work BEFORE running the full pipeline.

Usage:
  python validate_mapping.py "unmatched_ingredient"
  python validate_mapping.py "knoblauchzehe"

This shows:
1. ✅ If the mapping exists in ingredient_mapping_config.py
2. ✅ If the BLS entry actually exists
3. ✅ The nutrient data that will be used
4. ✅ Sample of how the ingredient will be parsed
"""

import sys
import pandas as pd
import re
from ingredient_mapping_config import MANUAL_INGREDIENT_MAP
from recipe_config import BLS_DATABASE

# Load BLS database
print("Loading BLS database...")
try:
    bls_df = pd.read_csv(BLS_DATABASE, low_memory=False)
    print(f"✓ Loaded {len(bls_df)} BLS entries\n")
except FileNotFoundError:
    print("❌ Error: BLS_4_0_Daten_2025_DE.csv not found")
    sys.exit(1)

if len(sys.argv) < 2:
    print("Usage: python validate_mapping.py 'ingredient_name'")
    print("\nExample:")
    print("  python validate_mapping.py 'knoblauchzehe'")
    print("  python validate_mapping.py 'milch'")
    print("\nTo find unmatched ingredients, run:")
    print("  python recipe_unmatched_analysis.py")
    sys.exit(1)

ingredient_to_test = sys.argv[1].lower().strip()

print(f"Validating mapping for: '{ingredient_to_test}'")
print("="*80)

# Check if in manual_map
if ingredient_to_test in MANUAL_INGREDIENT_MAP:
    bls_entry = MANUAL_INGREDIENT_MAP[ingredient_to_test]
    print(f"\n✅ FOUND in ingredient_mapping_config.py")
    print(f"   Maps to: '{bls_entry}'")

    # Check if BLS entry exists
    bls_match = bls_df[bls_df['Lebensmittelbezeichnung'] == bls_entry]

    if len(bls_match) > 0:
        print(f"✅ BLS entry EXISTS in database")
        row = bls_match.iloc[0]

        # Show key nutrients that will be used
        print(f"\n   Nutrients (per 100g):")
        nutrients = {
            'Energy (kcal)': 'ENERCC Energie (Kilokalorien) [kcal/100g]',
            'Protein': 'PROT625 Protein (Nx6,25) [g/100g]',
            'Fat': 'FAT Fett [g/100g]',
            'Carbs': 'CHO Kohlenhydrate, verfügbar [g/100g]',
            'Fiber': 'FIBT Rohfaser [g/100g]',
            'Lactose': 'LACS Lactose [g/100g]',
            'Iron': 'FE Eisen [mg/100g]',
            'Calcium': 'CA Calcium [mg/100g]',
            'Vitamin C': 'VITC Vitamin C [mg/100g]',
        }

        for nutrient_name, col in nutrients.items():
            if col in row.index:
                value = row[col]
                print(f"     • {nutrient_name}: {value}")

        print(f"\n✅ MAPPING IS VALID - ready to use!")

    else:
        print(f"❌ BLS entry NOT found: '{bls_entry}'")
        print(f"   Available BLS entries starting with '{bls_entry[:3]}':")
        similar = bls_df[bls_df['Lebensmittelbezeichnung'].str.contains(bls_entry[:5], case=False, na=False)]
        for idx, row in similar.head(5).iterrows():
            print(f"     • {row['Lebensmittelbezeichnung']}")
        print(f"\n   ❌ MAPPING IS BROKEN - fix the BLS name!")

else:
    print(f"\n❌ NOT in ingredient_mapping_config.py")
    print(f"   Need to add this mapping!")

    # Try to find similar BLS entries
    print(f"\n   Searching BLS database for similar entries...")

    # Search by keyword
    search_term = ingredient_to_test
    matches = bls_df[bls_df['Lebensmittelbezeichnung'].str.contains(search_term, case=False, na=False)]

    if len(matches) > 0:
        print(f"\n   ✅ Found {len(matches)} potential matches:")
        for idx, row in matches.head(10).iterrows():
            print(f"      • {row['Lebensmittelbezeichnung']}")

        print(f"\n   To add this mapping, edit ingredient_mapping_config.py:")
        print(f"   '{ingredient_to_test}': '{matches.iloc[0]['Lebensmittelbezeichnung']}',")
    else:
        print(f"   ❌ No similar entries found in BLS database")
        print(f"   This ingredient might not exist in the German Food Composition Database")

print("\n" + "="*80)
print("Next steps:")
print("  1. If mapping is valid: run python recipe_add_audit_trails.py")
print("  2. If mapping is broken: fix the BLS name in ingredient_mapping_config.py")
print("  3. If mapping not found: add it and test again")
print("="*80)
