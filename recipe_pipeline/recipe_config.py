"""
Konfigurationsdatei für die Rezept-Analyse-Pipeline.
Bearbeite diese Datei, um Ziele und Einstellungen anzupassen.
"""

import os

# ==========================================
# DATEI-PFADE (data/ Ordner)
# ==========================================
_ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(_ROOT, 'data')

# ==========================================
# WÖCHENTLICHE DIÄT-ZIELE
# ==========================================
# Definiere deine täglichen Ziele - diese werden mit 7 multipliziert für wöchentlich
DAILY_GOALS = {
    'calories': 2000,          # kcal pro Tag
    'protein': 55,             # g pro Tag
    'fat': 70,                 # g pro Tag
    'carbs': 250,              # g pro Tag
    'fiber': 30,               # g pro Tag
    'vitamin_a': 700,          # µg pro Tag
    'vitamin_c': 75,           # mg pro Tag
    'vitamin_b12': 2.4,        # µg pro Tag
    'iron': 8,                 # mg pro Tag
    'calcium': 1000,           # mg pro Tag
    'magnesium': 400,          # mg pro Tag
}

# ==========================================
# NETZWERK-EINSTELLUNGEN
# ==========================================
# Wartezeit zwischen Cookidoo-Requests (Sekunden)
# Erhöhe dies wenn du Blocking-Fehler erhältst
RATE_LIMIT_DELAY = 0.5

# Request-Timeout in Sekunden
REQUEST_TIMEOUT = 10

# ==========================================
# DATEIEN (alle unter data/)
# ==========================================
CSV_INPUT = os.path.join(DATA_DIR, 'Lebensmittel - Cookidoo Export - Rezepte.csv')
BLS_DATABASE = os.path.join(DATA_DIR, 'BLS_4_0_Daten_2025_DE.csv')
RECIPE_DATABASE_OUTPUT = os.path.join(DATA_DIR, 'recipe_database.csv')
RECIPE_FINAL_OUTPUT = os.path.join(DATA_DIR, 'recipe_final.csv')

# ==========================================
# ZUTATEN-MAPPING (Anpassbar)
# ==========================================
# Mapping von einfachen Namen zu BLS-Lebensmittel
# Format: 'suchbegriff': 'BLS_Lebensmittelbezeichnung'
INGREDIENT_MAP = {
    'aubergine': 'Aubergine roh',
    'avocado': 'Avocado roh',
    'balsamico': 'Balsamicoessig',
    'butter': 'Süßrahmbutter',
    'cayenne': 'Paprikapulver (edelsüß)',
    'chili': 'Paprika scharf (Chili) roh',
    'ei': 'Hühnervollei frisch',
    'eigelb': 'Hühnereigelb frisch',
    'eier': 'Hühnervollei frisch',
    'garam masala': 'Currypulver',
    'tomate': 'Tomatenkonserve',
    'brühe': 'Gemüsebrühe',
    'petersilie': 'Petersilie Blatt roh',
    'joghurt': 'Joghurt mindestens 3,5 % Fett',
    'honig': 'Honig',
    'hähnchen': 'Hähnchenschenkel gekocht',
    'huhn': 'Hähnchenschenkel gekocht',
    'ingwer': 'Ingwer roh',
    'karfiol': 'Blumenkohl',
    'karotte': 'Karotte roh',
    'möhre': 'Karotte roh',
    'kichererbse': 'Kichererbsen gekocht (mit Fett und Salz)',
    'bohne': 'Kidneybohne reif',
    'kidneybohne': 'Kidneybohne reif',
    'knoblauch': 'Knoblauch roh',
    'kokosmilch': 'Kokosmilch/Kokosnussmilch',
    'koriander': 'Koriander Blatt roh',
    'limette': 'Limette roh',
    'linse': 'Linsen reif',
    'mandel': 'Mandel süß (Speisemandel)',
    'mais': 'Zuckermais Konserve',
    'öl': 'Rapsöl',
    'olivenöl': 'Olivenöl',
    'oregano': 'Oregano getrocknet',
    'paprika': 'Paprika roh',
    'parmesan': 'Parmesan mind. 30 % Fett i. Tr.',
    'pasta': 'Teigwaren Hartweizen ohne Ei trocken',
    'linguine': 'Teigwaren Hartweizen ohne Ei trocken',
    'quinoa': 'Quinoa weiß, roh',
    'rucola': 'Rucola roh',
    'salz': 'Speisesalz',
    'sahne': 'Sahne 30 % Fett',
    'saure sahne': 'Sauerrahm mindestens 10 % Fett',
    'speck': 'Schweinespeck durchwachsen',
    'tahin': 'Tahin (Sesammus)',
    'tikka': 'Curry-Gewürzketchup',
    'tomatenmark': 'Tomatenmark',
    'tortilla': 'Weizentortilla',
    'zucchini': 'Zucchini roh',
    'zucchetti': 'Zucchini roh',
    'zwiebel': 'Speisezwiebel roh',
    'hackfleisch': 'Hackfleisch gemischt',
    'feta': 'Feta Käse',
    'käse': 'Emmentaler Käse',
    'mozzarella': 'Mozzarella',
    'ricotta': 'Ricotta',
    'spinat': 'Spinat gefroren',
    'brokkoli': 'Brokkoli roh',
    'fisch': 'Seelachs roh',
    'lachs': 'Lachs roh',
    'thunfisch': 'Thunfisch in Salzwasser, konserviert',
    'garnele': 'Garnelen roh',
    'krevette': 'Garnelen roh',
    'muschel': 'Miesmuschel roh',
    'champignon': 'Champignon (Züchtung) roh',
    'pilz': 'Pilz allgemein',
    'gurke': 'Gurke frisch',
    'karotte': 'Karotte roh',
    'möhre': 'Karotte roh',
    'lauch': 'Porree (Lauch) roh',
    'porree': 'Porree (Lauch) roh',
    'rote bete': 'Rote Beete roh',
    'senf': 'Senf',
    'wasser': 'Wasser',
}

# ==========================================
# GEWICHT-DEFAULTS
# ==========================================
# Wenn keine Mengenangabe vorhanden ist, werden diese Defaults verwendet
WEIGHT_DEFAULTS = {
    'petersilie': 10.0,
    'koriander': 10.0,
    'knoblauch': 4.0,
    'ingwer': 5.0,
    'default': 1.0,
}

# Gewichtsmultiplikatoren für Größenangaben
WEIGHT_MULTIPLIERS = {
    'ei': 55,              # 1 Ei ≈ 55g
    'eier': 55,
    'zwiebel': 100,        # 1 Zwiebel ≈ 100g
    'avocado': 180,        # 1 Avocado ≈ 180g
    'limette': 50,         # 1 Limette ≈ 50g
    'tomate': 400,         # 1 Tomate (aus Dose) ≈ 400g
    'bohne': 400,          # 1 Dosenpackung Bohnen ≈ 400g
    'linse': 400,          # 1 Portion Linsen ≈ 400g
    'eigelb': 18,          # 1 Eigelb ≈ 18g
    'tortilla': 40,        # 1 Tortilla ≈ 40g
}

# ==========================================
# ANALYSE-AUSGABE
# ==========================================
# Top N Rezepte in der Analyse anzeigen
TOP_RECIPES_COUNT = 10

# Dezimalstellen für Ausgabe
DECIMAL_PLACES = 2

# ==========================================
# DEBUG-MODUS
# ==========================================
# Setze auf True für verbose Ausgabe
DEBUG = False

# ==========================================
# FILTER-EINSTELLUNGEN (optional)
# ==========================================
# Wenn gesetzt, werden nur Rezepte verarbeitet, die diese Bedingung erfüllen
MIN_RATING = None           # z.B. 4.0 (nur Rezepte mit Rating >= 4.0)
MAX_INGREDIENTS = None      # z.B. 15 (nur Rezepte mit <= 15 Zutaten)

# ==========================================
# FORTGESCHRITTEN: NÄHRSTOFF-MAPPING
# ==========================================
# Mapping von BLS-Spalten zu Analysekategorien
# Format: 'BLS_Spalte': ('goal_key', 'short_name')
# Die 'goal_key' muss in DAILY_GOALS vorhanden sein
NUTRIENT_MAPPING = {
    'ENERCC Energie (Kilokalorien) [kcal/100g]': ('calories', 'ENERCC_kcal'),
    'PROT625 Protein (Nx6,25) [g/100g]': ('protein', 'PROT_g'),
    'FAT Fett [g/100g]': ('fat', 'FAT_g'),
    'CHO Kohlenhydrate, verfügbar [g/100g]': ('carbs', 'CHO_g'),
    'FIBT Ballaststoffe, gesamt [g/100g]': ('fiber', 'FIBT_g'),
    'VITA Vitamin A, Retinol-Äquivalent (RE) [µg/100g]': ('vitamin_a', 'VITA_ug'),
    'VITC Vitamin C [mg/100g]': ('vitamin_c', 'VITC_mg'),
    'VITB12 Vitamin B12 (Cobalamine) [µg/100g]': ('vitamin_b12', 'VITB12_ug'),
    'FE Eisen [mg/100g]': ('iron', 'FE_mg'),
    'CA Calcium [mg/100g]': ('calcium', 'CA_mg'),
    'MG Magnesium [mg/100g]': ('magnesium', 'MG_mg'),
}

# ==========================================
# BEISPIEL-ANPASSUNGEN
# ==========================================
# Um die Ziele zu ändern, kommentiere oben DAILY_GOALS aus und benutze eine der folgenden:

# Beispiel 1: Low Carb Diät
# DAILY_GOALS = {
#     'calories': 1800,
#     'protein': 120,
#     'fat': 90,
#     'carbs': 50,
#     'fiber': 30,
#     'vitamin_a': 700,
#     'vitamin_c': 75,
#     'vitamin_b12': 2.4,
#     'iron': 8,
#     'calcium': 1000,
#     'magnesium': 400,
# }

# Beispiel 2: High Protein / Fitness
# DAILY_GOALS = {
#     'calories': 2500,
#     'protein': 150,
#     'fat': 80,
#     'carbs': 300,
#     'fiber': 35,
#     'vitamin_a': 700,
#     'vitamin_c': 90,
#     'vitamin_b12': 2.4,
#     'iron': 10,
#     'calcium': 1000,
#     'magnesium': 420,
# }

# Beispiel 3: Vegan/Vegetarisch (erhöhte Eisenaufnahme)
# DAILY_GOALS = {
#     'calories': 2000,
#     'protein': 65,          # +10g vegan-freundlich
#     'fat': 70,
#     'carbs': 250,
#     'fiber': 35,            # +5g für vegane Quellen
#     'vitamin_a': 700,
#     'vitamin_c': 100,       # +25mg für Eisenresorption
#     'vitamin_b12': 5,       # +2.6 da vegane Quellen schwächer sind
#     'iron': 18,             # 18mg Vegan-Richtlinie (vs. 8mg Standard)
#     'calcium': 1200,        # +200mg für pflanzliche Quellen
#     'magnesium': 400,
# }
