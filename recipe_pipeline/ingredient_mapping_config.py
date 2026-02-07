"""
Ingredient Manual Mapping Configuration
========================================

SINGLE SOURCE OF TRUTH for all ingredient mappings.
Mappings are loaded from ingredient_mappings.csv

To add a new mapping:
1. Run: python add_mapping.py "ingredient_name" "BLS_Entry_Name" "Category"
2. Run: python validate_mapping.py "ingredient_name" (to verify it works)
3. Run: python recipe_add_audit_trails.py (to recalculate with new mapping)
4. The report will show improved match rates

Example:
  python add_mapping.py "chorizo" "Chorizo roh" "Proteins & Meat"

For more help:
  python add_mapping.py --help
  python add_mapping.py --list
  python add_mapping.py --categories
"""

import pandas as pd
import os

# Data folder (CSVs live here)
_ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(_ROOT, 'data')

# ==============================================================
# FALLBACK: Hardcoded mappings (used if CSV not available)
# ==============================================================
FALLBACK_MANUAL_INGREDIENT_MAP = {
    # Vegetables & Produce
    'aubergine': 'Aubergine roh',
    'avocado': 'Avocado roh',
    'blumenkohl': 'Blumenkohl',
    'brokkoli': 'Brokkoli roh',
    'champignon': 'Champignons roh',
    'cherry-tomate': 'Tomate roh',
    'ei': 'Hühnervollei frisch',
    'eigelb': 'Hühnereigelb frisch',
    'eier': 'Hühnervollei frisch',
    'ingwer': 'Ingwer roh',
    'karfiol': 'Blumenkohl',
    'karotte': 'Karotte roh',
    'möhre': 'Karotte roh',
    'paprika': 'Paprika roh',
    'petersilie': 'Petersilienblatt roh',
    'rote paprika': 'Paprika roh',
    'porree': 'Porree roh',
    'rucola': 'Rucola roh',
    'schalotte': 'Speisezwiebel roh',
    'spinat': 'Spinat gefroren',
    'tomate': 'Tomate roh',
    'tomatenkonserve': 'Tomatenkonserve',
    'zwiebel': 'Speisezwiebel roh',
    'zucchini': 'Zucchini roh',
    'zucchetti': 'Zucchini roh',
    'basilikum': 'Basilikum getrocknet',
    'schnittlauch': 'Schnittlauch gefroren',

    # Grains, Flour, Pasta
    'mehl': 'Weizenmehl',
    'pasta': 'Teigwaren Hartweizen ohne Ei trocken',
    'paniermehl': 'Weizenmehl',
    'speisestärke': 'Maisstärke',
    'spätzle': 'Teigwaren Hartweizen ohne Ei trocken',

    # Liquids & Beverages
    'wasser': 'Trinkwasser',
    'milch': 'Vollmilch frisch, 3,5 % Fett, pasteurisiert',
    'weißwein': 'Weißwein',
    'kirschwasser': 'Kirschwasser',
    'zitronensaft': 'Zitrone',
    'limettensaft': 'Limette',

    # Seasonings & Condiments
    'balsamico': 'Balsamicoessig',
    'brühe': 'Gemüsebrühe',
    'cayenne': 'Paprikapulver (edelsüß)',
    'chili': 'Paprika scharf (Chili) roh',
    'garam masala': 'Currypulver',
    'honig': 'Honig',
    'oregano': 'Oregano getrocknet',
    'pfeffer': 'Pfeffer schwarz',
    'salz': 'Speisesalz',
    'sojasauce': 'Sojasauce',
    'tamari': 'Sojasauce',
    'thymian': 'Thymian getrocknet',
    'tomatenmark': 'Tomatenmark',
    'zucker': 'Zucker',
    'ketchup': 'Tomatenketchup',
    'senf': 'Speisesenf gelb',
    'lorbeerblatt': 'Lorbeerblatt getrocknet',
    'muskat': 'Muskatnuss',

    # Fats & Oils
    'butter': 'Süßrahmbutter',
    'olivenöl': 'Olivenöl',
    'öl': 'Rapsöl',
    'sahne': 'Sahne 30 % Fett',
    'saure sahne': 'Sauerrahm mindestens 10 % Fett',
    'crème fraîche': 'Sauerrahm mindestens 10 % Fett',
    'schlagobers': 'Sahne 30 % Fett',

    # Proteins & Meat
    'hähnchen': 'Hähnchenschenkel gekocht',
    'huhn': 'Hähnchenschenkel gekocht',
    'hackfleisch': 'Hackfleisch gemischt',
    'fisch': 'Seelachs roh',
    'speck': 'Schweinespeck durchwachsen',
    'pute': 'Putenbrust roh',

    # Dairy & Cheese
    'feta': 'Feta Käse',
    'frischkäse': 'Frischkäse',
    'gruyère': 'Emmentaler Käse',
    'emmentaler': 'Emmentaler Käse',
    'gouda': 'Emmentaler Käse',
    'joghurt': 'Joghurt mindestens 3,5 % Fett',
    'käse': 'Emmentaler Käse',
    'mozzarella': 'Mozzarella',
    'parmesan': 'Parmesan mind. 30 % Fett i. Tr.',
    'quark': 'Quark 20% Fett',
    'raclettekäse': 'Emmentaler Käse',
    'ricotta': 'Ricotta',
    'kräuterschmelzkäse': 'Emmentaler Käse',

    # Legumes & Nuts
    'bohne': 'Kidneybohne reif',
    'kidneybohne': 'Kidneybohne reif',
    'kichererbse': 'Kichererbsen gekocht (mit Fett und Salz)',
    'linse': 'Linsen reif',
    'mandel': 'Mandel süß (Speisemandel)',

    # Specialty Items
    'blätterteig': 'Weizenmehl',
    'kokosmilch': 'Kokosmilch/Kokosnussmilch',
    'koriander': 'Koriander Blatt roh',
    'limette': 'Limette roh',
    'quinoa': 'Quinoa weiß, roh',
    'tahin': 'Tahin (Sesammus)',
    'tikka': 'Curry-Gewürzketchup',
    'tortilla': 'Weizentortilla',
    'knoblauchzehe': 'Knoblauch roh',
    'knoblauchzehen': 'Knoblauch roh',
    'kartoffel': 'Kartoffel roh',
    'kartoffeln': 'Kartoffel roh',
    'apfel': 'Apfel roh',
    'äpfel': 'Apfel roh',
    'rosine': 'Rosine',
    'rosinen': 'Rosine',
    'erbse': 'Erbsen, grün, gefroren',
    'erbsen': 'Erbsen, grün, gefroren',
    'nudel': 'Teigwaren Hartweizen ohne Ei trocken',
    'nudeln': 'Teigwaren Hartweizen ohne Ei trocken',
    'hörnchennudel': 'Teigwaren Hartweizen ohne Ei trocken',
    'zimt': 'Zimtpulver',
    'vanille': 'Vanilleschoten',
    'knoblauch': 'Knoblauch roh',
}


# ==============================================================
# LOAD MAPPINGS FROM CSV (with fallback)
# ==============================================================

def load_mappings_from_csv():
    """Load ingredient mappings from CSV file.
    Falls back to hardcoded mappings if CSV not available."""
    csv_file = os.path.join(DATA_DIR, 'ingredient_mappings.csv')

    if not os.path.exists(csv_file):
        return None

    try:
        df = pd.read_csv(csv_file)
        # Convert to dictionary: ingredient_name -> bls_entry_name
        mapping_dict = dict(zip(df['ingredient_name'], df['bls_entry_name']))
        return mapping_dict
    except Exception:
        return None


_csv_mappings = load_mappings_from_csv()
MANUAL_INGREDIENT_MAP = _csv_mappings if _csv_mappings is not None else FALLBACK_MANUAL_INGREDIENT_MAP


def get_manual_map():
    """Get the manual ingredient map. Can be overridden for testing."""
    return MANUAL_INGREDIENT_MAP


if __name__ == '__main__':
    source = "CSV" if load_mappings_from_csv() is not None else "FALLBACK (CSV not found)"
    print(f"Manual Ingredient Map Configuration")
    print(f"Source: {source}")
    print(f"Total mappings: {len(MANUAL_INGREDIENT_MAP)}")
    print("\nSample mappings:")
    for i, (ing, bls) in enumerate(list(MANUAL_INGREDIENT_MAP.items())[:10]):
        print(f"  '{ing}' → '{bls}'")
