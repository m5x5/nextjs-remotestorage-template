#!/usr/bin/env python3
"""
Bulk Import Approved Mappings
=============================

Reads approved suggestions from CSV and imports them all at once.

Usage:
  python bulk_import_approved_mappings.py [--file FILE] [--min-score SCORE]

Examples:
  python bulk_import_approved_mappings.py
  python bulk_import_approved_mappings.py --file mapping_suggestions_ready_for_review.csv
  python bulk_import_approved_mappings.py --min-score 0.7  # Only import high-confidence
"""

import pandas as pd
import sys
import argparse

def validate_bls_entry(bls_name):
    """Validate that a BLS entry exists in the database."""
    try:
        bls_df = pd.read_csv('BLS_4_0_Daten_2025_DE.csv', low_memory=False, nrows=None)
        match = bls_df[bls_df['Lebensmittelbezeichnung'] == bls_name]
        return len(match) > 0
    except Exception as e:
        print(f"  Warning: Could not validate BLS entry: {e}")
        return False


def import_approved_mappings(suggestions_file='mapping_suggestions_ready_for_review.csv', min_score=0.0):
    """Import approved suggestions into ingredient_mappings.csv."""

    print("=" * 80)
    print("BULK IMPORT APPROVED MAPPINGS")
    print("=" * 80)

    # Load suggestions
    try:
        suggestions_df = pd.read_csv(suggestions_file)
        print(f"\n✓ Loaded suggestions from: {suggestions_file}")
    except FileNotFoundError:
        print(f"\n✗ File not found: {suggestions_file}")
        print(f"  Expected file from batch_mapping_suggester.py")
        sys.exit(1)

    # Filter approved AND unique (top candidate per ingredient)
    approved = suggestions_df[
        (suggestions_df['approve'].astype(str).str.upper() == 'Y') &
        (suggestions_df['bls_rank'] == 1) &
        (suggestions_df['match_score'] >= min_score)
    ].copy()

    approved = approved.drop_duplicates(subset=['ingredient_name'], keep='first')

    print(f"✓ Found {len(approved)} approved mappings to import")

    if len(approved) == 0:
        print("\n  No approved mappings found (check 'approve' column has 'Y' values)")
        sys.exit(0)

    # Load existing mappings
    mappings_df = pd.read_csv('ingredient_mappings.csv')
    existing_count = len(mappings_df)

    print(f"✓ Existing mappings: {existing_count}")

    # Prepare new mappings
    new_mappings = []
    skipped = 0
    validated = 0

    print("\nValidating BLS entries...")
    for idx, row in approved.iterrows():
        ingredient = row['ingredient_name'].strip().lower()
        bls_entry = row['bls_entry_name'].strip()

        # Skip if already mapped
        if ingredient in mappings_df['ingredient_name'].values:
            print(f"  ⊘ Already mapped: {ingredient}")
            skipped += 1
            continue

        # Validate BLS entry
        if validate_bls_entry(bls_entry):
            new_mappings.append({
                'ingredient_name': ingredient,
                'bls_entry_name': bls_entry,
                'category': 'Auto-imported',
                'notes': f"Score: {row['match_score']}, Freq: {row['frequency']}"
            })
            validated += 1
            print(f"  ✓ {ingredient:<30} → {bls_entry[:50]}")
        else:
            print(f"  ✗ BLS entry not found: {bls_entry[:50]}")
            skipped += 1

    if len(new_mappings) == 0:
        print("\n✗ No valid mappings to add")
        sys.exit(1)

    # Add to existing mappings
    new_df = pd.DataFrame(new_mappings)
    merged_df = pd.concat([mappings_df, new_df], ignore_index=True)

    # Remove duplicates, keep first
    merged_df = merged_df.drop_duplicates(subset=['ingredient_name'], keep='first')

    # Sort alphabetically
    merged_df = merged_df.sort_values('ingredient_name').reset_index(drop=True)

    # Save
    merged_df.to_csv('ingredient_mappings.csv', index=False)

    print("\n" + "=" * 80)
    print("IMPORT SUMMARY")
    print("=" * 80)
    print(f"Before:        {existing_count} mappings")
    print(f"Added:         {validated} new mappings")
    print(f"Skipped:       {skipped} (already exist or invalid BLS)")
    print(f"After:         {len(merged_df)} mappings")
    print(f"\n✓ Saved to: ingredient_mappings.csv")

    return validated


def main():
    parser = argparse.ArgumentParser(description='Bulk import approved ingredient mappings')
    parser.add_argument(
        '--file',
        default='mapping_suggestions_ready_for_review.csv',
        help='Suggestions CSV file to import from'
    )
    parser.add_argument(
        '--min-score',
        type=float,
        default=0.0,
        help='Only import suggestions with score >= this value'
    )

    args = parser.parse_args()

    count = import_approved_mappings(args.file, args.min_score)

    print("\n" + "=" * 80)
    print("NEXT STEPS:")
    print("=" * 80)
    print(f"1. Run: python recipe_add_audit_trails.py")
    print(f"   (to recalculate nutrition with new mappings)")
    print(f"\n2. Check match rate improvement")
    print(f"\n3. If more mappings needed:")
    print(f"   python batch_mapping_suggester.py")
    print("=" * 80)


if __name__ == '__main__':
    main()
