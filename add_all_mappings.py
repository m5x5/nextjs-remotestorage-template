#!/usr/bin/env python3
"""
Add All Top Unmatched Ingredient Mappings
==========================================

Adds mappings for the 50 most frequently unmatched ingredients
from the BLS analysis.
"""

import subprocess
import sys
import pandas as pd

# List of (ingredient_name, bls_entry, category) tuples
mappings = [
    # Top 30 most impactful
    ("eier", "Hühnereier Frischei (gekocht Wasser) durchschnittlich", "Eier und Eiprodukte"),
    ("mehl", "Weizenmehl ausgelöst aus Getreide", "Getreide und Getreideprodukte"),
    ("möhren", "Karotte Basismenge", "Gemüse und Gemüseprodukte"),
    ("koriander", "Koriander getrocknet", "Gewürze und Gewürzmischungen"),
    ("ingwer", "Ingwer", "Gemüse und Gemüseprodukte"),
    ("rote paprika", "Paprika rot Rohrohstoff Basismenge", "Gemüse und Gemüseprodukte"),
    ("speisestärke", "Kartoffelstärke", "Weitere Lebensmittel"),
    ("champignons", "Champignon kultiviert (Zuchtchampignon)", "Gemüse und Gemüseprodukte"),
    ("crème fraîche", "Crème fraîche", "Milch und Milchprodukte"),
    ("paprika edelsüß", "Paprika edelsüß gemahlen", "Gewürze und Gewürzmischungen"),
    ("oregano", "Oregano getrocknet", "Gewürze und Gewürzmischungen"),
    ("senf", "Senf Tafelsenf mittelscharf", "Saucen und Würzmittel"),
    ("kartoffeln", "Kartoffeln mehlige roh Basismenge", "Gemüse und Gemüseprodukte"),
    ("erbsen", "Erbse grün reife frische", "Gemüse und Gemüseprodukte"),
    ("schnittlauch", "Schnittlauch roh", "Gemüse und Gemüseprodukte"),
    ("muskat", "Muskatnuss gemahlen", "Gewürze und Gewürzmischungen"),
    ("karotten", "Karotte Basismenge", "Gemüse und Gemüseprodukte"),
    ("thymian", "Thymian getrocknet", "Gewürze und Gewürzmischungen"),
    ("porree", "Lauch (Porree) Basismenge", "Gemüse und Gemüseprodukte"),
    ("nudeln", "Spaghettiware Weizen Trockennudeln", "Getreide und Getreideprodukte"),
    ("rote chilischote", "Chili rot frische", "Gemüse und Gemüseprodukte"),
    ("curry", "Currypulver", "Gewürze und Gewürzmischungen"),
    ("dill", "Dill getrocknet", "Gewürze und Gewürzmischungen"),
    ("chiliflocken", "Chili getrocknet geschrotet", "Gewürze und Gewürzmischungen"),
    ("babyspinat", "Spinat roh Basismenge", "Gemüse und Gemüseprodukte"),
    ("pinienkerne", "Kiefer-Pinienkerne", "Nüsse und Nussprodukte"),
    ("risottoreis", "Reis Risotto Arborio", "Getreide und Getreideprodukte"),
    ("spaghetti", "Spaghettiware Weizen Trockennudeln", "Getreide und Getreideprodukte"),
    ("linguine", "Bandnudeln Weizen Trockennudeln", "Getreide und Getreideprodukte"),
    ("sesam", "Sesam", "Nüsse und Nussprodukte"),

    # Next 20
    ("minze", "Minze Kraut frisch", "Gemüse und Gemüseprodukte"),
    ("paniermehl", "Paniermehl", "Saucen und Würzmittel"),
    ("salatgurke", "Gurke Salat roh Basismenge", "Gemüse und Gemüseprodukte"),
    ("schmand", "Schmand", "Milch und Milchprodukte"),
    ("gnocchi", "Gnocchi tiefgekühlt", "Getreide und Getreideprodukte"),
    ("lauch", "Lauch (Porree) Basismenge", "Gemüse und Gemüseprodukte"),
    ("zitrone", "Zitrone mit Saft Basismenge", "Obst und Obstprodukte"),
    ("essig", "Essig Speiseessig Weinessig", "Saucen und Würzmittel"),
    ("garnelen geschält", "Garnele Nordseegarnele geschält", "Fische und Fischprodukte"),
    ("rote linsen", "Linse rot geschält", "Hülsenfrüchte und Ölsamen"),
    ("cheddar", "Cheddar", "Milch und Milchprodukte"),
    ("süßkartoffeln", "Süßkartoffel Basismenge", "Gemüse und Gemüseprodukte"),
    ("blattspinat", "Spinat roh Basismenge", "Gemüse und Gemüseprodukte"),
    ("speckwürfel", "Speck durchwachsen", "Fleisch und Fleischprodukte"),
    ("knollensellerie", "Sellerie Knollen roh Basismenge", "Gemüse und Gemüseprodukte"),
    ("eigelb", "Hühnereier Eidotter Eigelb", "Eier und Eiprodukte"),
    ("paprika rosenscharf", "Paprika rosenscharf gemahlen", "Gewürze und Gewürzmischungen"),
    ("majoran", "Majoran getrocknet", "Gewürze und Gewürzmischungen"),
    ("hokkaido-kürbis", "Kürbis hokkaido", "Gemüse und Gemüseprodukte"),
    ("gouda", "Gouda", "Milch und Milchprodukte"),

    # Final entries
    ("fischsauce", "Fischsauce", "Saucen und Würzmittel"),
    ("brokkoli", "Broccoli roh Basismenge", "Gemüse und Gemüseprodukte"),
    ("mayonnaise", "Mayonnaise", "Saucen und Würzmittel"),
    ("gorgonzola", "Gorgonzola", "Milch und Milchprodukte"),
    ("zimt", "Zimt gemahlen", "Gewürze und Gewürzmischungen"),
    ("mais aus der dose", "Mais Körner", "Gemüse und Gemüseprodukte"),
    ("schinken", "Schweineschinken gekocht", "Fleisch und Fleischprodukte"),
    ("backpulver", "Backpulver", "Saucen und Würzmittel"),
    ("kurkuma", "Kurkuma gemahlen", "Gewürze und Gewürzmischungen"),
    ("bandnudeln", "Bandnudeln Weizen Trockennudeln", "Getreide und Getreideprodukte"),
    ("staudensellerie", "Sellerie Stangen roh Basismenge", "Gemüse und Gemüseprodukte"),
    ("lorbeerblatt", "Lorbeerblatt getrocknet", "Gewürze und Gewürzmischungen"),
    ("ajvar", "Ajvar", "Saucen und Würzmittel"),
    ("gurke", "Gurke Salat roh Basismenge", "Gemüse und Gemüseprodukte"),
    ("haferflocken", "Hafer Flocken", "Getreide und Getreideprodukte"),
    ("gelbe paprika", "Paprika gelb Rohrohstoff Basismenge", "Gemüse und Gemüseprodukte"),
    ("bergkäse", "Bergkäse", "Milch und Milchprodukte"),
    ("pecorino", "Pecorino", "Milch und Milchprodukte"),
    ("worcester-sauce", "Worcester-Sauce", "Saucen und Würzmittel"),
    ("garam masala", "Garam Masala", "Gewürze und Gewürzmischungen"),
]

# Load current mappings to avoid duplicates
try:
    current_df = pd.read_csv('ingredient_mappings.csv')
    existing = set(current_df['ingredient_name'].str.lower())
except:
    existing = set()

added = 0
skipped = 0

print("Adding mappings from BLS analysis...\n")
print("=" * 80)

for ingredient, bls_entry, category in mappings:
    if ingredient.lower() in existing:
        print(f"⊘ SKIP: '{ingredient}' (already exists)")
        skipped += 1
        continue

    # Use add_mapping.py to add
    cmd = ['python', 'add_mapping.py', ingredient, bls_entry, category]
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode == 0:
        print(f"✓ ADD:  '{ingredient}'")
        added += 1
    else:
        # Only print errors if there's an actual failure (not validation)
        if "Mapping not added" not in result.stdout and "BLS entry not found" not in result.stdout:
            print(f"✗ FAIL: '{ingredient}'")
            if result.stderr:
                print(f"   {result.stderr[:100]}")

print("\n" + "=" * 80)
print(f"\nSummary:")
print(f"  Added:   {added}")
print(f"  Skipped: {skipped} (already exist)")
print(f"  Total:   {added + skipped}")

# Verify final count
try:
    final_df = pd.read_csv('ingredient_mappings.csv')
    print(f"\n✓ Total mappings in CSV: {len(final_df)}")
except:
    pass

print(f"\nNext steps:")
print(f"  1. python recipe_add_audit_trails.py")
print(f"  2. python recipe_weekly_analyzer.py")
print(f"  3. python optimization_meal_planner.py")
