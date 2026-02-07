import pandas as pd
import re

# ==========================================
# 1. DATEN LADEN & VORBEREITEN
# ==========================================
FILE_NAME = 'BLS_4_0_Daten_2025_DE.csv'

try:
    df = pd.read_csv(FILE_NAME, low_memory=False)
except FileNotFoundError:
    print(f"Fehler: '{FILE_NAME}' nicht gefunden.")
    exit()

# Nährstoffspalten identifizieren (alle mit Einheiten in Klammern)
nutrient_cols = [col for col in df.columns if '[' in col]
for col in nutrient_cols:
    df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

# ==========================================
# 2. NEUE ZUTATENLISTE
# ==========================================
raw_ingredients = [
    "15 Balsamico, dunkel", "50 Butter", "0.25 Chilipulver", "Chilis, frisch",
    "1 Chilischote, rot, getrocknet", "25 Cognac", "150 Cornflakes", "1 Ei",
    "2 Eier", "1 frische Petersilie", "100 Frischkäse", 
    "1 Gewürzpaste für Fleischbrühe, selbst gemacht",
    "1 Gewürzpaste für Gemüsebrühe, selbst gemacht", "0.5 glatte Petersilie",
    "500 Hackfleisch, gemischt", "600 Hähnchenbrustfilets",
    "500 Hühneroberkeulen, ohne Haut, ausgelöst", "Ingwer, frisch", "700 Karfiol",
    "700 Kasseler", "30 Ketchup", "1 Kidneybohnen", "1 Knoblauchzehe",
    "3 Knoblauchzehen", "90 Kokosmilch", "2 Koriander", "0.5 Koriander, gemahlen",
    "0 Korianderblätter, frisch", "20 körniger Senf", "0.75 Kreuzkümmel, gemahlen",
    "1 Linsen", "100 Mais aus der Dose", "20 Mandeln, gemahlen", "20 Mehl",
    "100 Milch", "150 Möhren", "80 natives Olivenöl extra", "20 Öl",
    "0 Öl zum Braten", "20 Olivenöl", "0.5 Oregano, getrocknet", "2 Paniermehl",
    "0.5 Paprika de la Vera", "0.25 Paprika edelsüß", "200 Paprika, gemischt",
    "60 Paprikamark", "15 Petersilie", "0.5 Pfeffer", "1 rote Zwiebel",
    "200 Sahne", "1 Salz", "500 Sauerkraut", "2 Saure Sahne", "1 Senf",
    "30 Sesam", "350 Spaghetti", "100 Speckwürfel", "1 stückige Tomaten",
    "5 Thymian", "6 Toastbrot", "30 Tomatenmark", "250 Wasser", "1 Zucker",
    "60 Zwiebel", "200 Zwiebeln"
]

# ==========================================
# 3. MAPPING & GEWICHTS-LOGIK
# ==========================================
manual_map = {
    'balsamico': 'Balsamicoessig', 'butter': 'Süßrahmbutter', 'cognac': 'Weinbrand',
    'cornflakes': 'Cornflakes', 'ei': 'Hühnervollei frisch', 'frischkäse': 'Frischkäse Natur',
    'hackfleisch': 'Hackfleisch gemischt', 'hähnchenbrust': 'Hähnchenbrustfilet roh',
    'hühneroberkeule': 'Hähnchenschenkel gekocht', 'karfiol': 'Blumenkohl',
    'kasseler': 'Kasseler gegart', 'ketchup': 'Tomatenketchup', 'kidneybohne': 'Kidneybohne reif',
    'knoblauch': 'Knoblauch roh', 'kokosmilch': 'Kokosmilch', 'koriander': 'Koriander Blatt roh',
    'senf': 'Senf', 'linsen': 'Linsen reif', 'mais': 'Zuckermais Konserve',
    'mehl': 'Weizenmehl Type 405', 'milch': 'Kuhmilch 3,5 % Fett', 'möhre': 'Karotte roh',
    'olivenöl': 'Olivenöl', 'paniermehl': 'Paniermehl', 'paprika': 'Paprika roh',
    'paprikamark': 'Tomatenmark', 'petersilie': 'Petersilie Blatt roh', 'sahne': 'Sahne 30 % Fett',
    'sauerkraut': 'Sauerkraut Konserve', 'speck': 'Schweinespeck durchwachsen',
    'spaghetti': 'Teigwaren Hartweizen ohne Ei trocken', 'tomatenmark': 'Tomatenmark',
    'toastbrot': 'Weizentoastbrot', 'zucker': 'Zucker (Saccharose)', 'zwiebel': 'Speisezwiebel roh'
}

def get_weight(name, qty, had_qty):
    ln = name.lower()
    if not had_qty:
        if 'petersilie' in ln or 'koriander' in ln: return 10.0
        if 'knoblauch' in ln: return 4.0
        if 'ingwer' in ln: return 5.0
        return 1.0
    if qty >= 10: return qty
    if 'ei' == ln or 'eier' == ln: return qty * 55
    if 'zwiebel' in ln: return qty * 100
    if 'knoblauch' in ln: return qty * 4
    if 'tomate' in ln or 'kidneybohne' in ln or 'linsen' in ln: return qty * 400
    if 'toastbrot' in ln: return qty * 25
    return qty

# ==========================================
# 4. ANALYSE
# ==========================================
results = []
for line in raw_ingredients:
    match = re.match(r'^([\d\.]+)\s+(.*)', line)
    qty, item_name = (float(match.group(1)), match.group(2).strip()) if match else (1.0, line.strip())
    weight = get_weight(item_name, qty, match is not None)
    
    match_key = next((val for key, val in manual_map.items() if key in item_name.lower()), None)
    if match_key:
        m_df = df[df['Lebensmittelbezeichnung'].str.contains(match_key, case=False, na=False, regex=False)]
        if not m_df.empty:
            data = m_df.iloc[0]
            res = {'Input': line, 'Matched': data['Lebensmittelbezeichnung'], 'Weight': weight}
            for col in nutrient_cols: res[col] = (data[col] * weight) / 100.0
            results.append(res)

final_df = pd.DataFrame(results)

# ==========================================
# 5. DASHBOARD AUSGABE
# ==========================================
def print_dashboard(res_df):
    totals = res_df.sum(numeric_only=True)
    sections = {
        "MAKRONÄHRSTOFFE": {
            'Energie [kcal]': 'ENERCC Energie (Kilokalorien) [kcal/100g]',
            'Protein [g]': 'PROT625 Protein (Nx6,25) [g/100g]',
            'Fett [g]': 'FAT Fett [g/100g]',
            'Kohlenhydrate [g]': 'CHO Kohlenhydrate, verfügbar [g/100g]',
            'Ballaststoffe [g]': 'FIBT Ballaststoffe, gesamt [g/100g]'
        },
        "VITAMINE": {
            'Vitamin A [µg]': 'VITA Vitamin A, Retinol-Äquivalent (RE) [µg/100g]',
            'Vitamin C [mg]': 'VITC Vitamin C [mg/100g]',
            'Vitamin B12 [µg]': 'VITB12 Vitamin B12 (Cobalamine) [µg/100g]',
            'Folat [µg]': 'FOL Folat-Äquivalent [µg/100g]'
        },
        "MINERALSTOFFE": {
            'Eisen [mg]': 'FE Eisen [mg/100g]',
            'Magnesium [mg]': 'MG Magnesium [mg/100g]',
            'Calcium [mg]': 'CA Calcium [mg/100g]',
            'Kalium [mg]': 'K Kalium [mg/100g]'
        }
    }

    print("\n" + "="*65)
    print(f"{'DASHBOARD: VOLLSTÄNDIGE NÄHRWERTANALYSE':^65}")
    print("="*65)
    
    for sec, items in sections.items():
        print(f"\n--- {sec} ---")
        for label, col in items.items():
            print(f"{label:<40} {totals[col]:>20.2f}")

    print("\n" + "="*65)
    print(f"{'TOP-LIEFERANTEN PRO KATEGORIE':^65}")
    print("="*65)
    all_metrics = {**sections["MAKRONÄHRSTOFFE"], **sections["VITAMINE"], **sections["MINERALSTOFFE"]}
    for label, col in all_metrics.items():
        top = res_df.sort_values(by=col, ascending=False).iloc[0]
        input_n = (top['Input'][:25] + '..') if len(top['Input']) > 25 else top['Input']
        print(f"{label:<25} -> {input_n:<27} ({top[col]:>8.2f})")

print_dashboard(final_df)
final_df.to_csv('vollstaendige_analyse.csv', index=False, encoding='utf-8-sig')