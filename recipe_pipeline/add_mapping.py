#!/usr/bin/env python3
"""
Add or Update Ingredient Mappings
==================================

Command-line tool to add/update mappings in ingredient_mappings.csv

Usage:
  python add_mapping.py "ingredient_name" "BLS_Entry_Name" "Category"
  python add_mapping.py --list
  python add_mapping.py --help

Examples:
  python add_mapping.py "chorizo" "Chorizo roh" "Proteins & Meat"
  python add_mapping.py "tortellini" "Eierteigwaren Tortellini (Fleischfüllung) getrocknet" "Grains & Flour"
  python add_mapping.py --list
  python add_mapping.py --validate "chorizo"

For more details, run:
  python validate_mapping.py "ingredient_name"
"""

import sys
import pandas as pd
import os
from pathlib import Path
from recipe_config import DATA_DIR

MAPPINGS_FILE = os.path.join(DATA_DIR, 'ingredient_mappings.csv')

def ensure_csv_exists():
    """Ensure mappings CSV file exists."""
    if not os.path.exists(MAPPINGS_FILE):
        print(f"Error: {MAPPINGS_FILE} not found")
        sys.exit(1)

def load_mappings():
    """Load mappings from CSV."""
    ensure_csv_exists()
    return pd.read_csv(MAPPINGS_FILE)

def save_mappings(df):
    """Save mappings to CSV."""
    df.to_csv(MAPPINGS_FILE, index=False)
    print(f"✓ Saved to {MAPPINGS_FILE}")

def add_mapping(ingredient_name, bls_entry, category, notes=""):
    """Add or update a mapping."""
    ensure_csv_exists()
    df = load_mappings()

    ingredient_lower = ingredient_name.lower().strip()

    # Check if already exists
    existing = df[df['ingredient_name'] == ingredient_lower]

    if len(existing) > 0:
        # Update existing
        df.loc[df['ingredient_name'] == ingredient_lower, 'bls_entry_name'] = bls_entry
        df.loc[df['ingredient_name'] == ingredient_lower, 'category'] = category
        if notes:
            df.loc[df['ingredient_name'] == ingredient_lower, 'notes'] = notes
        print(f"✓ Updated mapping: '{ingredient_lower}' → '{bls_entry}'")
    else:
        # Add new
        new_row = {
            'ingredient_name': ingredient_lower,
            'bls_entry_name': bls_entry,
            'category': category,
            'notes': notes
        }
        df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
        print(f"✓ Added new mapping: '{ingredient_lower}' → '{bls_entry}'")

    # Sort by ingredient name for consistency
    df = df.sort_values('ingredient_name').reset_index(drop=True)
    save_mappings(df)

def list_mappings(category=None):
    """List all mappings, optionally filtered by category."""
    df = load_mappings()

    if category:
        df = df[df['category'].str.contains(category, case=False, na=False)]
        print(f"\nMappings in category '{category}':")
    else:
        print(f"\nAll ingredient mappings ({len(df)} total):")

    print("-" * 100)
    print(f"{'Ingredient':<25} {'BLS Entry':<55} {'Category':<20}")
    print("-" * 100)

    for _, row in df.iterrows():
        ingredient = row['ingredient_name'][:23]
        bls_entry = row['bls_entry_name'][:53]
        category = row['category'][:18]
        print(f"{ingredient:<25} {bls_entry:<55} {category:<20}")

    print("-" * 100)
    print(f"Total: {len(df)} mappings")

def show_categories():
    """Show all unique categories."""
    df = load_mappings()
    categories = sorted(df['category'].unique())
    print("\nAvailable categories:")
    for i, cat in enumerate(categories, 1):
        count = len(df[df['category'] == cat])
        print(f"  {i}. {cat} ({count} mappings)")

def validate_before_add(ingredient_name, bls_entry):
    """Check if mapping would be valid before adding."""
    try:
        import pandas as pd
        from recipe_config import BLS_DATABASE
        bls_df = pd.read_csv(BLS_DATABASE, low_memory=False)

        match = bls_df[bls_df['Lebensmittelbezeichnung'] == bls_entry]
        if len(match) == 0:
            print(f"\n⚠️  WARNING: BLS entry not found: '{bls_entry}'")
            similar = bls_df[bls_df['Lebensmittelbezeichnung'].str.contains(bls_entry[:10], case=False, na=False)]
            if len(similar) > 0:
                print(f"   Similar entries:")
                for idx, row in similar.head(3).iterrows():
                    print(f"     • {row['Lebensmittelbezeichnung']}")
            return False

        print(f"✓ BLS entry found: '{bls_entry}'")
        return True
    except FileNotFoundError:
        print("Note: BLS database not available for validation")
        return True

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    command = sys.argv[1]

    if command == '--help' or command == '-h':
        print(__doc__)

    elif command == '--list':
        category = sys.argv[2] if len(sys.argv) > 2 else None
        list_mappings(category)

    elif command == '--categories':
        show_categories()

    elif command == '--validate':
        if len(sys.argv) < 3:
            print("Usage: python add_mapping.py --validate 'ingredient_name'")
            sys.exit(1)
        ingredient = sys.argv[2]
        print(f"To validate mapping, run:")
        print(f"  python validate_mapping.py \"{ingredient}\"")

    else:
        # Add mode: ingredient_name BLS_entry category [notes]
        if len(sys.argv) < 4:
            print("Usage: python add_mapping.py 'ingredient_name' 'BLS_Entry' 'Category' [notes]")
            print("\nExample:")
            print("  python add_mapping.py \"chorizo\" \"Chorizo roh\" \"Proteins & Meat\"")
            print("  python add_mapping.py \"tortellini\" \"Eierteigwaren Tortellini (Fleischfüllung) getrocknet\" \"Grains & Flour\"")
            print("\nFor category suggestions:")
            print("  python add_mapping.py --categories")
            sys.exit(1)

        ingredient = sys.argv[1]
        bls_entry = sys.argv[2]
        category = sys.argv[3]
        notes = sys.argv[4] if len(sys.argv) > 4 else ""

        print(f"\nAdding/updating mapping:")
        print(f"  Ingredient: '{ingredient}'")
        print(f"  BLS Entry:  '{bls_entry}'")
        print(f"  Category:   '{category}'")

        # Validate BLS entry exists
        if not validate_before_add(ingredient, bls_entry):
            print("\n❌ Mapping not added - BLS entry not found")
            print("   Run: python validate_mapping.py \"ingredient_name\"")
            print("   for suggestions")
            sys.exit(1)

        add_mapping(ingredient, bls_entry, category, notes)

        print("\nNext steps:")
        print("  1. Run: python recipe_add_audit_trails.py")
        print("  2. Check: Match rate should increase")

if __name__ == '__main__':
    main()
