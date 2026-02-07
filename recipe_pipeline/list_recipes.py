#!/usr/bin/env python3
"""
List All Available Recipes
===========================

Shows all recipe names in the database for easy reference when excluding recipes.

Usage:
  python list_recipes.py                    # List all recipes
  python list_recipes.py --sort-lactose     # Sort by lactose content
  python list_recipes.py --search "pasta"   # Search for recipes
"""

import pandas as pd
import sys
import argparse
import os
from recipe_config import DATA_DIR, RECIPE_DATABASE_OUTPUT, RECIPE_FINAL_OUTPUT

def main():
    parser = argparse.ArgumentParser(description='List available recipes')
    parser.add_argument('--sort-lactose', action='store_true', help='Sort by lactose content (high to low)')
    parser.add_argument('--search', type=str, help='Search for recipes containing this term')
    parser.add_argument('--low-lactose', type=float, help='Show only recipes with lactose below this value (mg)')
    args = parser.parse_args()

    # Try both possible files (in data/)
    try:
        df = pd.read_csv(RECIPE_FINAL_OUTPUT)
    except FileNotFoundError:
        try:
            df = pd.read_csv(RECIPE_DATABASE_OUTPUT)
        except FileNotFoundError:
            print("Error: No recipe database found (recipe_final.csv or recipe_database.csv in data/)")
            sys.exit(1)

    print(f"Found {len(df)} recipes in database\n")

    # Filter by search term
    if args.search:
        df = df[df['recipe_name'].str.contains(args.search, case=False, na=False)]
        print(f"Filtered to {len(df)} recipes matching '{args.search}'\n")

    # Check if lactose column exists
    lactose_col = None
    if 'LACS Lactose [g/100g]' in df.columns:
        lactose_col = 'LACS Lactose [g/100g]'
        # Convert to mg (recipe total)
        df['lactose_mg_total'] = df[lactose_col] * 1000

    # Filter by lactose if requested
    if args.low_lactose is not None and lactose_col:
        df = df[df['lactose_mg_total'] <= args.low_lactose]
        print(f"Filtered to {len(df)} recipes with ≤{args.low_lactose}mg lactose\n")

    # Sort
    if args.sort_lactose and lactose_col:
        df = df.sort_values('lactose_mg_total', ascending=False)
        print("Recipes sorted by lactose content (high to low):\n")
        print("=" * 90)
        print(f"{'Recipe Name':<60} {'Lactose (mg)':<15} {'Match %':<10}")
        print("-" * 90)

        for idx, row in df.iterrows():
            recipe_name = row['recipe_name'][:58]
            lactose = row['lactose_mg_total']
            match_rate = row.get('match_rate_%', 0)
            print(f"{recipe_name:<60} {lactose:>12.0f}mg {match_rate:>8.1f}%")
    else:
        print("Available recipes:")
        print("=" * 80)

        for idx, row in df.iterrows():
            recipe_name = row['recipe_name']
            match_rate = row.get('match_rate_%', 0)

            if lactose_col and 'lactose_mg_total' in df.columns:
                lactose = row['lactose_mg_total']
                print(f"  • {recipe_name:<60} ({lactose:>6.0f}mg lactose, {match_rate:.0f}% matched)")
            else:
                print(f"  • {recipe_name:<60} ({match_rate:.0f}% matched)")

    print("\n" + "=" * 80)
    print(f"Total: {len(df)} recipes")

    if lactose_col:
        avg_lactose = df['lactose_mg_total'].mean()
        max_lactose = df['lactose_mg_total'].max()
        zero_lactose = (df['lactose_mg_total'] == 0).sum()
        print(f"Lactose stats: avg={avg_lactose:.0f}mg, max={max_lactose:.0f}mg, zero-lactose={zero_lactose} recipes")

    print("\nTo exclude recipes from optimization:")
    print("  1. Copy recipe names to excluded_recipes.txt (one per line)")
    print("  2. Run from recipe_pipeline/: python optimization_meal_planner.py")

if __name__ == '__main__':
    main()
