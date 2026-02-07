"""
Debug BLS Lookups
=================

Check what's actually in the BLS database for common ingredients
"""

import pandas as pd

bls_df = pd.read_csv('BLS_4_0_Daten_2025_DE.csv', low_memory=False)

# Check for these common items
search_terms = [
    'petersilie', 'milch', 'ei', 'mehl', 'möhre', 'koriander', 'basilikum',
    'ingwer', 'paprika', 'speisestärke', 'champignon', 'crème fraîche',
    'zimt', 'schnittlauch', 'muskat'
]

print("BLS Database Search Results")
print("=" * 80)

for term in search_terms:
    matches = bls_df[bls_df['Lebensmittelbezeichnung'].str.contains(term, case=False, na=False, regex=False)]
    print(f"\n{term.upper()} ({len(matches)} matches):")
    if len(matches) > 0:
        for idx, row in matches.iterrows():
            print(f"  - {row['Lebensmittelbezeichnung']}")
    else:
        print(f"  ❌ NO MATCHES")
