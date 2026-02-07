#!/usr/bin/env python3
"""
Smart Ingredient Parser
=======================

Extracts base ingredient names by removing quantities and modifiers.

Examples:
  "10 g ingwer, frisch" → "ingwer"
  "½ bund koriander" → "koriander"
  "1 rote paprika" → "paprika"  (with variant "rot")
  "30 g mehl" → "mehl"
  "2 prisen muskat" → "muskat"
"""

import re
from typing import Tuple

# Common quantity units (German)
QUANTITY_UNITS = [
    'g', 'kg', 'mg',           # weight
    'ml', 'l', 'dl', 'cl',     # volume
    'tl', 'el', 'esslöffel',   # spoons
    'teelöffel', 'essl', 'teel',
    'prise', 'prisen',         # pinch
    'pack', 'packs',           # package
    'dose', 'dosen',           # can
    'bund', 'bündel',          # bundle
    'blatt', 'blätter',        # leaves
    'strand', 'strang',        # strand
    'stück', 'stücke',         # piece
    'scheibe', 'scheiben',     # slice
    'tropfen',                 # drop
    'halter', 'zweig', 'zweige', # branch
]

# Modifiers that indicate preparation/form (not part of base name)
PREPARATION_MODIFIERS = [
    'frisch', 'fresh',
    'getrocknet', 'dried', 'trocken',
    'gemahlen', 'ground', 'powder',
    'roh', 'raw', 'ungekocht',
    'gekocht', 'cooked', 'gegart',
    'gebraten', 'fried', 'braten',
    'geschmort', 'braised',
    'tiefgefroren', 'gefrorenen', 'frozen',
    'konserve', 'canned', 'eingemacht',
    'mariniert', 'marinated',
    'geraucher', 'rauchert', 'smoked',
    'ohne haut', 'ohne kern',
]

# Color/type prefixes that should be variants
COLOR_MAPPING = {
    'rote': 'rot', 'roten': 'rot', 'red': 'rot',
    'weiße': 'weiß', 'weißen': 'weiß', 'white': 'weiß',
    'grüne': 'grün', 'grünen': 'grün', 'green': 'grün',
    'gelbe': 'gelb', 'gelben': 'gelb', 'yellow': 'gelb',
    'schwarze': 'schwarz', 'schwarzen': 'schwarz', 'black': 'schwarz',
    'braune': 'braun', 'braunen': 'braun', 'brown': 'braun',
    'dunkle': 'dunkel', 'dunklen': 'dunkel',
    'helle': 'hell', 'hellen': 'hell',
}


def parse_ingredient(ingredient_str: str) -> Tuple[str, str, str]:
    """
    Parse ingredient string into base name, quantity, and variant.

    Args:
        ingredient_str: Raw ingredient string (e.g., "10 g ingwer, frisch")

    Returns:
        Tuple of (base_name, quantity, variant)
        Example: ("ingwer", "10g", "frisch")
    """
    if not ingredient_str or not isinstance(ingredient_str, str):
        return "", "", ""

    original = ingredient_str.strip()
    quantity = ""
    variant = ""

    # Step 1: Extract leading quantity (numbers + units)
    # First try: number + unit (e.g., "10 g", "½ bund")
    quantity_pattern = r'^([\d½⅓¼\s]+(?:' + '|'.join(sorted(QUANTITY_UNITS, key=len, reverse=True)) + r')?\s*(?:,|\.)?\s*)'
    match = re.match(quantity_pattern, original, re.IGNORECASE)
    if match:
        quantity = match.group(1).strip()
        cleaned = original[match.end():].strip()
    else:
        # Try just a number (e.g., "2 eier")
        number_match = re.match(r'^([\d½⅓¼]+)\s+', original)
        if number_match:
            quantity = number_match.group(1).strip()
            cleaned = original[number_match.end():].strip()
        else:
            cleaned = original

    # Step 2: Capture color prefixes as variants
    for color_term, color_variant in COLOR_MAPPING.items():
        if cleaned.lower().startswith(color_term + ' '):
            variant = color_variant
            cleaned = cleaned[len(color_term):].strip()
            break

    # Step 3: Remove trailing modifiers from end
    for modifier in sorted(PREPARATION_MODIFIERS, key=len, reverse=True):
        # Only match as whole word at end or after comma
        pattern = rf'(\s+|,\s*){modifier}(\s|,|$)'
        if re.search(pattern, cleaned, re.IGNORECASE):
            if not variant:
                variant = modifier
            cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE).strip()

    # Step 4: Clean up "ge-" prefix from past participles (e.g., "getrocknetes" → "trocknetes")
    if cleaned.lower().startswith('ge') and len(cleaned) > 3:
        # Check if it looks like a past participle
        potential = cleaned[2:]
        if potential.lower() in PREPARATION_MODIFIERS:
            variant = variant or potential.lower()
            cleaned = potential

    # Step 5: Final cleanup
    base_name = cleaned.lower().strip()
    base_name = re.sub(r'\s+', ' ', base_name)  # Normalize whitespace
    base_name = base_name.rstrip('.,')  # Remove trailing punctuation

    return base_name, quantity, variant


def normalize_ingredient(ingredient_str: str) -> str:
    """
    Normalize ingredient to base name only (for mapping lookups).

    This is the key function for improving matching.
    """
    base_name, _, _ = parse_ingredient(ingredient_str)
    return base_name


if __name__ == '__main__':
    # Test cases
    test_cases = [
        "10 g ingwer, frisch",
        "½ bund koriander",
        "1 rote paprika",
        "30 g mehl",
        "2 prisen muskat",
        "400 g fusilli aus grünen erbsen, getrocknet",
        "½ tl paprika edelsüß",
        "100 g möhren",
        "20 g speisestärke",
        "1 eier",
        "4 eier",
        "200 g crème fraîche",
        "1 getrocknetes lorbeerblatt",
        "½ bund schnittlauch",
        "4 brötchen",
        "2 dosen maiskörner",
        "150 g gouda",
        "Pizzagewürz",
        "ingwer, frisch",
        "paprika edelsüß",
    ]

    print("INGREDIENT PARSING TEST")
    print("=" * 80)
    print(f"{'Input':<45} {'Base Name':<25}")
    print("-" * 80)

    for test in test_cases:
        base_name, qty, variant = parse_ingredient(test)
        normalized = normalize_ingredient(test)
        print(f"{test:<45} {normalized:<25}")

    print("\n" + "=" * 80)
    print("\nWith variants:")
    print("-" * 80)
    print(f"{'Input':<40} {'Base':<20} {'Qty':<10} {'Variant':<15}")
    print("-" * 80)

    for test in test_cases:
        base_name, qty, variant = parse_ingredient(test)
        print(f"{test:<40} {base_name:<20} {qty:<10} {variant:<15}")
