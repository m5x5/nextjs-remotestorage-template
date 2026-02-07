import pandas as pd
import requests
import json
import re
import time
from urllib.parse import urljoin
from bs4 import BeautifulSoup
import html
from ingredient_mapping_config import MANUAL_INGREDIENT_MAP
from recipe_config import CSV_INPUT, BLS_DATABASE, RECIPE_DATABASE_OUTPUT as OUTPUT_DATABASE, REQUEST_TIMEOUT, RATE_LIMIT_DELAY

# ==========================================
# 2. LADEN DER NOTWENDIGEN DATEN
# ==========================================
print("Lade Eingabedaten...")
try:
    recipes_df = pd.read_csv(CSV_INPUT)
except FileNotFoundError:
    print(f"Fehler: '{CSV_INPUT}' nicht gefunden.")
    exit()

try:
    bls_df = pd.read_csv(BLS_DATABASE, low_memory=False)
except FileNotFoundError:
    print(f"Fehler: '{BLS_DATABASE}' nicht gefunden.")
    exit()

# Nährstoffspalten identifizieren
nutrient_cols = [col for col in bls_df.columns if '[' in col]
for col in nutrient_cols:
    bls_df[col] = pd.to_numeric(bls_df[col], errors='coerce').fillna(0)

print(f"Geladen: {len(recipes_df)} Rezepte, {len(bls_df)} BLS-Lebensmittel")

# ==========================================
# 3. MAPPING & GEWICHTS-LOGIK
# ==========================================
# NOTE: Manual ingredient mappings are centralized in ingredient_mapping_config.py
# To add new mappings, edit that file and the changes will apply here automatically
manual_map = MANUAL_INGREDIENT_MAP

# ==========================================
# AUTHOR NUTRITION EXTRACTION
# ==========================================
def extract_author_nutrition(schema_data, serving_count):
    """
    Extract nutrition information provided by recipe author from schema.org.
    These values are per-serving in schema.org, so multiply by serving_count to get total recipe.

    Note: The raw schema.org JSON is now stored separately, so this is just a
    preliminary extraction. Can be re-processed later if parsing logic improves.
    """
    nutrition = {}
    nutrition_info = schema_data.get('nutrition', {})

    if not nutrition_info:
        return nutrition

    # For now, store raw nutrition data as-is
    # The serving count parsing can be improved later once we review the data
    # Extract the first number from serving_count as a simple heuristic
    servings = 1
    if isinstance(serving_count, str):
        match_num = re.search(r'(\d+)', str(serving_count))
        servings = int(match_num.group(1)) if match_num else 1

    # Extract basic nutrition values
    if 'calories' in nutrition_info:
        cal_str = str(nutrition_info['calories'])
        match = re.search(r'([\d.]+)', cal_str)
        if match:
            # Store both raw per-serving and multiplied value
            nutrition['author_ENERCC_kcal_per_serving'] = float(match.group(1))
            nutrition['author_ENERCC_kcal'] = float(match.group(1)) * servings

    if 'proteinContent' in nutrition_info:
        prot_str = str(nutrition_info['proteinContent'])
        match = re.search(r'([\d.]+)', prot_str)
        if match:
            nutrition['author_PROT_g_per_serving'] = float(match.group(1))
            nutrition['author_PROT_g'] = float(match.group(1)) * servings

    if 'fatContent' in nutrition_info:
        fat_str = str(nutrition_info['fatContent'])
        match = re.search(r'([\d.]+)', fat_str)
        if match:
            nutrition['author_FAT_g_per_serving'] = float(match.group(1))
            nutrition['author_FAT_g'] = float(match.group(1)) * servings

    if 'carbohydrateContent' in nutrition_info:
        carb_str = str(nutrition_info['carbohydrateContent'])
        match = re.search(r'([\d.]+)', carb_str)
        if match:
            nutrition['author_CHO_g_per_serving'] = float(match.group(1))
            nutrition['author_CHO_g'] = float(match.group(1)) * servings

    if 'fiberContent' in nutrition_info:
        fiber_str = str(nutrition_info['fiberContent'])
        match = re.search(r'([\d.]+)', fiber_str)
        if match:
            nutrition['author_FIBT_g_per_serving'] = float(match.group(1))
            nutrition['author_FIBT_g'] = float(match.group(1)) * servings

    return nutrition

def get_weight(name, qty, had_qty=True):
    """Bestimme das Gewicht basierend auf Zutatentyp und Menge."""
    ln = name.lower()
    if not had_qty:
        if 'petersilie' in ln or 'koriander' in ln: return 10.0
        if 'knoblauch' in ln: return 4.0
        if 'ingwer' in ln: return 5.0
        return 1.0
    if qty >= 10: return qty
    if 'ei' in ln or 'eier' in ln: return qty * 55
    if 'zwiebel' in ln: return qty * 100
    if 'knoblauch' in ln: return qty * 4
    if 'tomate' in ln or 'bohne' in ln or 'linse' in ln: return qty * 400
    if 'tortilla' in ln: return qty * 40
    if 'avocado' in ln: return qty * 180
    if 'limette' in ln: return qty * 50
    if 'eigelb' in ln: return qty * 18
    return qty

def match_ingredient_to_bls(ingredient_name):
    """Finde das beste Match im BLS für einen Zutatenname."""
    for key, val in sorted(manual_map.items(), key=lambda x: len(x[0]), reverse=True):
        if key in ingredient_name.lower():
            match_df = bls_df[bls_df['Lebensmittelbezeichnung'].str.contains(val, case=False, na=False, regex=False)]
            if not match_df.empty:
                return match_df.iloc[0]
    return None

# ==========================================
# 4. SCHEMA.ORG EXTRAKTION
# ==========================================
def extract_schema_org_recipe(url):
    """Extrahiere Recipe schema.org Daten aus einer URL."""
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        response = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, 'html.parser')

        # Finde JSON-LD schema.org Recipe Daten
        for script in soup.find_all('script', type='application/ld+json'):
            try:
                data = json.loads(script.string)
                if isinstance(data, dict) and (data.get('@type') == 'Recipe' or
                                               data.get('@type') == ['Recipe']):
                    return data
                if isinstance(data, list):
                    for item in data:
                        if item.get('@type') == 'Recipe':
                            return item
            except json.JSONDecodeError:
                continue

        return None
    except Exception as e:
        print(f"  Fehler beim Abrufen von {url}: {str(e)}")
        return None

def parse_recipe_ingredients(recipe_data):
    """Extrahiere Zutaten aus schema.org Recipe Daten."""
    ingredients = []

    if 'recipeIngredient' not in recipe_data:
        return ingredients

    ingredient_list = recipe_data['recipeIngredient']
    if isinstance(ingredient_list, str):
        ingredient_list = [ingredient_list]

    for ingredient_str in ingredient_list:
        # Decode HTML entities (&frac14; -> ¼, &frac12; -> ½, etc.)
        ingredient_str = html.unescape(ingredient_str)

        # Versuche Menge und Zutat zu trennen
        match = re.match(r'^([\d\.\s½¼¾]+\s*(?:g|kg|ml|l|tsp|tbsp|cup|stück|prise|tl|el)?)\s*(.*)', ingredient_str, re.IGNORECASE)
        if match:
            qty_str = match.group(1).strip()
            ingredient_name = match.group(2).strip()

            # Clean up ingredient name - remove common qualifiers
            ingredient_name = re.sub(r',\s*(frisch|getrocknet|gefroren|roh|gekocht|tk|tiefgekühlt)', '', ingredient_name, flags=re.IGNORECASE)
            ingredient_name = re.sub(r'\s+(frisch|getrocknet|gefroren|roh|gekocht|tk|tiefgekühlt)$', '', ingredient_name, flags=re.IGNORECASE)
            ingredient_name = re.sub(r'^(stängel|stengel|bund|blatt|blätter)\s+', '', ingredient_name, flags=re.IGNORECASE)
            ingredient_name = re.sub(r'\s*\(.*?\)', '', ingredient_name)  # Remove parentheses
            ingredient_name = ingredient_name.strip()

            # Parse Menge (vereinfacht) - handle fractions
            qty_match = re.match(r'([\d\.½¼¾]+)', qty_str)
            if qty_match:
                qty_str_parsed = qty_match.group(1)
                # Convert fractions to decimals
                qty_str_parsed = qty_str_parsed.replace('½', '.5').replace('¼', '.25').replace('¾', '.75')
                qty = float(qty_str_parsed) if qty_str_parsed else 1.0
            else:
                qty = 1.0

            ingredients.append({
                'original': ingredient_str,
                'name': ingredient_name,
                'qty': qty,
                'qty_str': qty_str
            })
        else:
            ingredients.append({
                'original': ingredient_str,
                'name': ingredient_str,
                'qty': 1.0,
                'qty_str': '1'
            })

    return ingredients

def calculate_recipe_nutrients(ingredients):
    """
    Berechne Gesamtnährstoffe für ein Rezept aus seinen Zutaten.
    Gibt auch ein Audit-Trail der Zutat-Matches zurück.
    """
    recipe_nutrients = {}
    ingredient_audit_trail = []
    matched_count = 0

    for ingredient in ingredients:
        bls_data = match_ingredient_to_bls(ingredient['name'])

        audit_entry = {
            'original': ingredient['original'],
            'parsed_name': ingredient['name'],
            'quantity': ingredient['qty'],
            'quantity_str': ingredient['qty_str'],
            'matched': False,
            'bls_name': None,
            'weight_g': None,
            'nutrient_contribution': {}
        }

        if bls_data is not None:
            weight = get_weight(ingredient['name'], ingredient['qty'], True)
            audit_entry['matched'] = True
            audit_entry['bls_name'] = bls_data['Lebensmittelbezeichnung']
            audit_entry['weight_g'] = weight
            matched_count += 1

            # Track nutrient contributions per ingredient
            contribution = {}
            for col in nutrient_cols:
                value = (bls_data[col] * weight) / 100.0
                recipe_nutrients[col] = recipe_nutrients.get(col, 0) + value
                if value > 0:
                    contribution[col] = round(value, 2)
            audit_entry['nutrient_contribution'] = contribution

        ingredient_audit_trail.append(audit_entry)

    return recipe_nutrients, ingredient_audit_trail, matched_count

# ==========================================
# 5. VERARBEITUNG ALLER REZEPTE
# ==========================================
print("\nExtrahiere Rezeptdaten...")
recipe_results = []

for idx, row in recipes_df.iterrows():
    url = row['link--alt href']
    recipe_name = row['core-tile__description-text']

    print(f"[{idx+1}/{len(recipes_df)}] {recipe_name[:50]}...", end="", flush=True)

    schema_data = extract_schema_org_recipe(url)

    if schema_data:
        ingredients = parse_recipe_ingredients(schema_data)
        nutrients, ingredient_audit_trail, matched_count = calculate_recipe_nutrients(ingredients)

        # Extract serving size from schema.org
        serving_size_str = schema_data.get('recipeYield', 'Unknown')

        # Extract author-provided nutrition from schema.org
        author_nutrition = extract_author_nutrition(schema_data, serving_size_str)

        # Calculate match rate
        total_ingredients = len(ingredients)
        skipped_count = total_ingredients - matched_count
        match_rate = (matched_count / total_ingredients * 100) if total_ingredients > 0 else 0

        result = {
            'recipe_name': recipe_name,
            'recipe_url': url,
            'rating': row['core-rating__label'],
            'time': row['core-tile__description-subline'],
            'ingredient_count': total_ingredients,
            'ingredients_matched': matched_count,
            'ingredients_skipped': skipped_count,
            'match_rate_%': round(match_rate, 1),
            'recipe_yield': serving_size_str,
            'ingredient_audit_trail': json.dumps(ingredient_audit_trail, ensure_ascii=False),  # Detailed audit trail
            'schema_org_json': json.dumps(schema_data, ensure_ascii=False),  # Store entire schema.org object
        }

        # Füge berechnete Nährstoffwerte hinzu (from BLS/ingredients)
        for col in nutrient_cols:
            result[col] = nutrients.get(col, 0)

        # Füge Autor-Nährstoffwerte hinzu (from schema.org)
        result.update(author_nutrition)

        recipe_results.append(result)
        print(f" ✓ ({matched_count}/{total_ingredients} matched)")
    else:
        print(" ✗ (Keine Recipe-Daten gefunden)")

    time.sleep(RATE_LIMIT_DELAY)

# ==========================================
# 6. SPEICHERN DER REZEPTDATENBANK
# ==========================================
if recipe_results:
    result_df = pd.DataFrame(recipe_results)
    result_df.to_csv(OUTPUT_DATABASE, index=False, encoding='utf-8-sig')
    print(f"\nRezeptdatenbank gespeichert: {OUTPUT_DATABASE}")
    print(f"Erfolgreich verarbeitete Rezepte: {len(recipe_results)}/{len(recipes_df)}")
    print("\nVorschau (erste 3 Rezepte):")
    preview_cols = ['recipe_name', 'ingredient_count', 'ingredients_matched', 'ingredients_skipped', 'match_rate_%']
    print(result_df[preview_cols].head(3))
    print(f"\nDurchschnittliche Match-Rate: {result_df['match_rate_%'].mean():.1f}%")
    print(f"Median Match-Rate: {result_df['match_rate_%'].median():.1f}%")
    print(f"Min/Max Match-Rate: {result_df['match_rate_%'].min():.1f}% / {result_df['match_rate_%'].max():.1f}%")
else:
    print("\nKeine Rezepte konnten verarbeitet werden.")
