#!/usr/bin/env python3
"""
Automated Ingredient Mapping Workflow
======================================

Three-step process:
1. Extract unmatched ingredients with frequency analysis
2. Auto-generate BLS suggestions with fuzzy matching
3. Bulk-import approved mappings

Usage:
  python auto_mapping_workflow.py --extract    # Find all unmatched
  python auto_mapping_workflow.py --suggest    # Generate suggestions
  python auto_mapping_workflow.py --import     # Batch import
"""

import pandas as pd
import sys
from difflib import SequenceMatcher
import re

def extract_unmatched_ingredients():
    """Extract all unmatched ingredients from recipes with frequency."""
    print("=" * 80)
    print("STEP 1: EXTRACT UNMATCHED INGREDIENTS")
    print("=" * 80)
    
    try:
        recipes = pd.read_csv('recipe_final.csv')
        mappings = pd.read_csv('ingredient_mappings.csv')
        
        # Get all mapped ingredient names (lowercase)
        mapped_names = set(mappings['ingredient_name'].str.lower().unique())
        
        # Extract unmatched from each recipe
        unmatched_list = []
        for idx, row in recipes.iterrows():
            # Try to get audit trail data
            if pd.notna(row.get('ingredient_audit_trail', None)):
                try:
                    import json
                    audit = json.loads(row['ingredient_audit_trail'])
                    for item in audit:
                        if item.get('matched') == False:
                            unmatched_list.append(item.get('original', ''))
                except:
                    pass
        
        if not unmatched_list:
            print("No unmatched ingredients found in audit trail")
            print("Trying alternate method...")
            # Fallback: scan all recipe files
            import glob
            for recipe_file in glob.glob('*.csv'):
                if 'recipe' in recipe_file.lower():
                    try:
                        df = pd.read_csv(recipe_file)
                        # Look for any columns that might contain ingredients
                        for col in df.columns:
                            if 'ingredient' in col.lower():
                                unmatched_list.extend(df[col].dropna().astype(str).tolist())
                    except:
                        pass
        
        # Deduplicate and count
        from collections import Counter
        ingredient_counts = Counter([s.lower().strip() for s in unmatched_list])
        
        # Sort by frequency
        sorted_items = sorted(ingredient_counts.items(), key=lambda x: x[1], reverse=True)
        
        print(f"\n✓ Found {len(sorted_items)} unique unmatched ingredients")
        print("\nTop 20 by frequency:")
        print("-" * 80)
        print(f"{'Ingredient':<40} {'Frequency':>10}")
        print("-" * 80)
        
        for ingredient, count in sorted_items[:20]:
            print(f"{ingredient:<40} {count:>10}")
        
        # Save to CSV for next step
        df = pd.DataFrame(sorted_items, columns=['ingredient_name', 'frequency'])
        df.to_csv('unmatched_ingredients_extracted.csv', index=False)
        print(f"\n✓ Saved to: unmatched_ingredients_extracted.csv")
        
        return sorted_items
        
    except Exception as e:
        print(f"Error: {e}")
        return []


def fuzzy_match_bls(ingredient_name, bls_df, threshold=0.6):
    """Find best BLS matches using fuzzy string matching."""
    ingredient_clean = ingredient_name.lower().strip()
    
    # Remove common modifiers
    clean_terms = [
        'frisch', 'getrocknet', 'gemahlen', 'pulver', 'powder', 'roh', 'raw',
        'gekocht', 'gebraten', 'geschmort', 'konserve', 'tiefgefroren',
        'für je', 'g ', 'kg ', 'tl ', 'el ', 'prise', 'pack'
    ]
    
    ingredient_base = ingredient_clean
    for term in clean_terms:
        ingredient_base = ingredient_base.replace(term, ' ').strip()
    
    # Get base words (split and remove small words)
    base_words = [w for w in ingredient_base.split() if len(w) > 2]
    
    best_matches = []
    
    for idx, row in bls_df.iterrows():
        bls_name = row['Lebensmittelbezeichnung'].lower()
        
        # Calculate similarity with original name
        ratio = SequenceMatcher(None, ingredient_clean, bls_name).ratio()
        
        # Also check if base words are in BLS name
        word_match = sum(1 for word in base_words if word in bls_name) / len(base_words) if base_words else 0
        
        # Combined score
        score = (ratio * 0.7) + (word_match * 0.3)
        
        if score > threshold:
            best_matches.append({
                'score': score,
                'bls_name': row['Lebensmittelbezeichnung'],
                'bls_code': row.get('Code', '')
            })
    
    # Sort by score descending
    best_matches.sort(key=lambda x: x['score'], reverse=True)
    return best_matches[:3]  # Return top 3


def generate_suggestions():
    """Generate BLS suggestions for unmatched ingredients."""
    print("\n" + "=" * 80)
    print("STEP 2: GENERATE BLS SUGGESTIONS")
    print("=" * 80)
    
    try:
        # Load unmatched ingredients
        unmatched = pd.read_csv('unmatched_ingredients_extracted.csv')
        
        # Load BLS database
        print("\nLoading BLS database...")
        bls_df = pd.read_csv('BLS_4_0_Daten_2025_DE.csv', low_memory=False)
        bls_df = bls_df[['Code', 'Lebensmittelbezeichnung']].drop_duplicates()
        print(f"✓ Loaded {len(bls_df)} BLS entries")
        
        # Load existing mappings to avoid duplicates
        existing = pd.read_csv('ingredient_mappings.csv')
        existing_ingredients = set(existing['ingredient_name'].str.lower().unique())
        
        suggestions = []
        
        print(f"\nGenerating suggestions for {len(unmatched)} ingredients...")
        for idx, row in unmatched.iterrows():
            ingredient = row['ingredient_name']
            
            # Skip if already mapped
            if ingredient.lower() in existing_ingredients:
                continue
            
            # Find matches
            matches = fuzzy_match_bls(ingredient, bls_df)
            
            if matches:
                for i, match in enumerate(matches, 1):
                    suggestions.append({
                        'ingredient_name': ingredient,
                        'frequency': row['frequency'],
                        'bls_candidate_rank': i,
                        'bls_entry_name': match['bls_name'],
                        'match_score': round(match['score'], 3)
                    })
        
        # Save suggestions
        suggestions_df = pd.DataFrame(suggestions)
        suggestions_df = suggestions_df.sort_values(['frequency', 'match_score'], 
                                                     ascending=[False, False])
        suggestions_df.to_csv('mapping_suggestions_auto.csv', index=False)
        
        print(f"\n✓ Generated {len(suggestions_df)} suggestions")
        print(f"✓ Saved to: mapping_suggestions_auto.csv")
        
        # Show top suggestions
        print("\nTop 15 suggestions (by frequency & match score):")
        print("-" * 80)
        for idx, row in suggestions_df.head(15).iterrows():
            print(f"\n  {row['ingredient_name']}")
            print(f"    → {row['bls_entry_name'][:60]}")
            print(f"       Score: {row['match_score']}, Frequency: {row['frequency']}")
        
        return suggestions_df
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return None


def bulk_import_suggestions(approval_threshold=0.75):
    """Auto-import high-confidence suggestions."""
    print("\n" + "=" * 80)
    print("STEP 3: BULK IMPORT SUGGESTIONS")
    print("=" * 80)
    
    try:
        suggestions_df = pd.read_csv('mapping_suggestions_auto.csv')
        
        # Filter high-confidence matches (score > threshold)
        high_confidence = suggestions_df[
            (suggestions_df['match_score'] >= approval_threshold) &
            (suggestions_df['bls_candidate_rank'] == 1)  # Only top candidate
        ]
        
        print(f"\nHigh-confidence suggestions (score ≥ {approval_threshold}):")
        print(f"  Total: {len(high_confidence)}")
        
        if len(high_confidence) == 0:
            print("  No high-confidence matches found")
            print(f"\n  Showing medium-confidence ({0.6}-{approval_threshold}):")
            medium = suggestions_df[
                (suggestions_df['match_score'] >= 0.6) &
                (suggestions_df['bls_candidate_rank'] == 1)
            ]
            print(f"  Count: {len(medium)}")
            print("\n  These require manual review:")
            for idx, row in medium.head(10).iterrows():
                print(f"    • {row['ingredient_name']} → {row['bls_entry_name'][:50]}")
        else:
            print("\nReady to import:")
            for idx, row in high_confidence.head(10).iterrows():
                print(f"  ✓ {row['ingredient_name']} → {row['bls_entry_name'][:50]}")
            
            # Save import list
            import_list = high_confidence[['ingredient_name', 'bls_entry_name']].drop_duplicates()
            import_list.to_csv('ready_to_import.csv', index=False)
            print(f"\n✓ Saved {len(import_list)} ready-to-import mappings")
            print(f"  File: ready_to_import.csv")
        
    except Exception as e:
        print(f"Error: {e}")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == '--extract':
        extract_unmatched_ingredients()
    elif command == '--suggest':
        generate_suggestions()
    elif command == '--import':
        bulk_import_suggestions()
    elif command == '--all':
        extract_unmatched_ingredients()
        generate_suggestions()
        bulk_import_suggestions()
    else:
        print(__doc__)


if __name__ == '__main__':
    main()
