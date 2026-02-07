#!/usr/bin/env python3
"""
Batch Mapping Suggester
=======================

Generates BLS suggestions for all unmatched ingredients in bulk.

Workflow:
  1. Extracts all unmatched ingredients
  2. Cleans them using ingredient_parser
  3. Deduplicates variants
  4. Finds top 3 BLS matches for each
  5. Exports ready-to-review CSV

Usage:
  python batch_mapping_suggester.py
"""

import pandas as pd
import sys
from difflib import SequenceMatcher
from collections import Counter
from ingredient_parser import normalize_ingredient

def extract_unmatched_from_audit_trail():
    """Extract unmatched ingredients from recipe audit trails."""
    print("=" * 80)
    print("STEP 1: EXTRACT UNMATCHED INGREDIENTS")
    print("=" * 80)

    try:
        recipes = pd.read_csv('recipe_final.csv')

        unmatched_list = []
        for idx, row in recipes.iterrows():
            # Check if audit trail exists
            if pd.notna(row.get('ingredient_audit_trail', None)):
                try:
                    import json
                    audit = json.loads(row['ingredient_audit_trail'])
                    for item in audit:
                        if item.get('matched') == False or item.get('matched') == 'False':
                            unmatched_list.append(item.get('original', ''))
                except:
                    pass

        print(f"✓ Found {len(unmatched_list)} unmatched ingredient entries")

        # Normalize and deduplicate
        print("\nCleaning and deduplicating...")
        normalized = {}
        for raw in unmatched_list:
            clean = normalize_ingredient(raw)
            if clean and len(clean) > 1:  # Skip empty/single-char
                if clean not in normalized:
                    normalized[clean] = {
                        'raw_examples': [],
                        'frequency': 0
                    }
                normalized[clean]['raw_examples'].append(raw)
                normalized[clean]['frequency'] += 1

        # Sort by frequency
        sorted_items = sorted(
            normalized.items(),
            key=lambda x: x[1]['frequency'],
            reverse=True
        )

        print(f"✓ After normalization: {len(sorted_items)} unique ingredients")

        # Show top 20
        print("\nTop 20 unmatched ingredients (after cleaning):")
        print("-" * 80)
        print(f"{'Ingredient':<30} {'Frequency':>10} {'Examples':<30}")
        print("-" * 80)

        for ingredient, data in sorted_items[:20]:
            examples = ', '.join(set(data['raw_examples'][:2]))[:30]
            print(f"{ingredient:<30} {data['frequency']:>10} {examples:<30}")

        return sorted_items

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return []


def find_bls_candidates(ingredient_name, bls_df, threshold=0.5):
    """Find best BLS matches using fuzzy matching."""
    ingredient_lower = ingredient_name.lower().strip()

    best_matches = []

    for idx, row in bls_df.iterrows():
        bls_name = row['Lebensmittelbezeichnung'].lower()

        # Simple similarity ratio
        ratio = SequenceMatcher(None, ingredient_lower, bls_name).ratio()

        # Bonus for substring match
        if ingredient_lower in bls_name:
            ratio = min(1.0, ratio + 0.2)

        if ratio > threshold:
            best_matches.append({
                'score': ratio,
                'bls_name': row['Lebensmittelbezeichnung'],
            })

    # Sort by score
    best_matches.sort(key=lambda x: x['score'], reverse=True)
    return best_matches[:3]  # Top 3


def generate_suggestions(unmatched_items, limit=None):
    """Generate BLS suggestions for unmatched ingredients."""
    print("\n" + "=" * 80)
    print("STEP 2: GENERATE BLS SUGGESTIONS")
    print("=" * 80)

    try:
        # Load BLS database
        print("\nLoading BLS database...")
        bls_df = pd.read_csv('BLS_4_0_Daten_2025_DE.csv', low_memory=False)
        print(f"✓ Loaded {len(bls_df)} BLS entries")

        # Load existing mappings to skip already-mapped
        existing = pd.read_csv('ingredient_mappings.csv')
        existing_names = set(existing['ingredient_name'].str.lower().unique())

        # Generate suggestions
        print(f"\nGenerating suggestions for top {limit or 'all'} ingredients...")

        suggestions = []
        items_to_process = unmatched_items[:limit] if limit else unmatched_items

        for i, (ingredient, data) in enumerate(items_to_process):
            if (i + 1) % 50 == 0:
                print(f"  Processed {i+1}/{len(items_to_process)}...")

            # Skip if already mapped
            if ingredient.lower() in existing_names:
                continue

            # Find matches
            matches = find_bls_candidates(ingredient, bls_df, threshold=0.4)

            if matches:
                for rank, match in enumerate(matches, 1):
                    suggestions.append({
                        'ingredient_name': ingredient,
                        'frequency': data['frequency'],
                        'raw_examples': data['raw_examples'][0],
                        'bls_rank': rank,
                        'bls_entry_name': match['bls_name'],
                        'match_score': round(match['score'], 3),
                        'approve': ''  # User will fill this in
                    })

        suggestions_df = pd.DataFrame(suggestions)
        suggestions_df = suggestions_df.sort_values(
            ['frequency', 'match_score'],
            ascending=[False, False]
        )

        # Save
        output_file = 'mapping_suggestions_ready_for_review.csv'
        suggestions_df.to_csv(output_file, index=False)

        print(f"\n✓ Generated {len(suggestions_df)} suggestions")
        print(f"✓ Saved to: {output_file}")

        # Show preview
        print("\nTop 15 suggestions (review these first):")
        print("-" * 100)
        print(f"{'Ingredient':<25} {'Score':<8} {'BLS Suggestion':<50} {'Freq':>5}")
        print("-" * 100)

        for idx, row in suggestions_df.head(15).iterrows():
            if row['bls_rank'] == 1:  # Only show top candidate
                bls_name = row['bls_entry_name'][:50]
                print(
                    f"{row['ingredient_name']:<25} "
                    f"{row['match_score']:<8} "
                    f"{bls_name:<50} "
                    f"{row['frequency']:>5}"
                )

        print("\n" + "=" * 80)
        print("NEXT STEP:")
        print("  1. Edit: mapping_suggestions_ready_for_review.csv")
        print("  2. Mark 'approve' column: Y for yes, N for no")
        print("  3. Run: python bulk_import_approved_mappings.py")
        print("=" * 80)

        return suggestions_df

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return None


def main():
    # Extract unmatched
    unmatched_items = extract_unmatched_from_audit_trail()

    if not unmatched_items:
        print("No unmatched ingredients found")
        sys.exit(0)

    # Generate suggestions (limit to top 100 for first pass)
    generate_suggestions(unmatched_items, limit=100)


if __name__ == '__main__':
    main()
