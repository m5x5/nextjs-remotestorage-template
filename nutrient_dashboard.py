import pandas as pd
import re

# ==========================================
# 1. KONFIGURATION & DATEN LADEN
# ==========================================
FILE_NAME = 'BLS_4_0_Daten_2025_DE.csv'

# Lade die Datenbank (behebt Dtype-Warnungen)
try:
    df = pd.read_csv(FILE_NAME, low_memory=False)
except FileNotFoundError:
    print(f"Fehler: Die Datei '{FILE_NAME}' wurde nicht gefunden.")
    exit()

# Nährstoffspalten identifizieren und numerisch säubern
all_nutrient_cols = [col for col in df.columns if '[' in col]
for col in all_nutrient_cols:
    df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

# ==========================================
# 2. DEINE ZUTATENLISTE
# ==========================================
raw_ingredients = [
    "200 Auberginen", "2 Avocados", "15 Balsamico, dunkel", "50 Butter", 
    "0.25 Cayenne-Pfeffer", "0.75 Chiliflocken, getrocknet", "0.25 Chilipulver", 
    "Chilis, frisch", "2 Eigelbe", "10 Garam Masala", "1 geschälte Tomaten", 
    "1 Gewürzpaste für Gemüsebrühe, selbst gemacht", "0.5 glatte Petersilie", 
    "80 griechisches Joghurt", "15 Honig", "500 Hühneroberkeulen, ohne Haut, ausgelöst", 
    "Ingwer, frisch", "700 Karfiol", "70 Karotten", "1 Kichererbsen", 
    "265 Kichererbsen, aus der Dose", "1 Kidneybohnen", "1 Knoblauchzehe", 
    "90 Kokosmilch", "2 Koriander", "0.5 Koriander, gemahlen", "1 Limette", 
    "1 Linsen", "100 Mais aus der Dose", "50 Mandeln", "20 Mandeln, gemahlen", 
    "200 Möhren", "70 Naturjoghurt", "1 Öl", "20 Olivenöl", "30 Olivenöl, nativ", 
    "0.5 Oregano, getrocknet", "0.5 Paprika de la Vera", "200 Paprika, gemischt", 
    "70 Parmesan", "300 Pasta getrocknet, Sorte Linguine", "200 Quinoa", 
    "200 rote Paprika", "1 rote Zwiebel", "150 Rucola", "0.5 Salz", 
    "2 Saure Sahne", "100 Speckwürfel", "1 stückige Tomaten", "30 Tahin", 
    "90 Tikka-Paste", "50 Tomatenmark", "200 Wasser", "4 Weizentortillas", 
    "150 Zucchetti", "120 Zucchini", "1 Zwiebel", "70 Zwiebeln"
]

# ==========================================
# 3. MAPPING & GEWICHTS-LOGIK
# ==========================================
manual_map = {
    'aubergine': 'Aubergine roh', 'avocado': 'Avocado roh', 'balsamico': 'Balsamicoessig',
    'butter': 'Süßrahmbutter', 'cayenne': 'Paprikapulver (edelsüß)', 'chili': 'Paprika scharf (Chili) roh',
    'eigelb': 'Hühnereigelb frisch', 'garam masala': 'Currypulver', 'tomate': 'Tomatenkonserve',
    'brühe': 'Gemüsebrühe', 'petersilie': 'Petersilie Blatt roh', 'joghurt': 'Joghurt mindestens 3,5 % Fett',
    'honig': 'Honig', 'hühneroberkeule': 'Hähnchenschenkel gekocht (mit Fett und Salz)',
    'ingwer': 'Ingwer roh', 'karfiol': 'Blumenkohl', 'karotte': 'Karotte roh',
    'möhre': 'Karotte roh', 'kichererbsen': 'Kichererbsen gekocht (mit Fett und Salz)',
    'kidneybohne': 'Kidneybohne reif', 'knoblauch': 'Knoblauch roh',
    'kokosmilch': 'Kokosmilch/Kokosnussmilch', 'koriander': 'Koriander Blatt roh',
    'limette': 'Limette roh', 'linsen': 'Linsen reif', 'mais': 'Zuckermais Konserve',
    'mandel': 'Mandel süß (Speisemandel)', 'öl': 'Rapsöl', 'olivenöl': 'Olivenöl',
    'oregano': 'Oregano getrocknet', 'paprika': 'Paprika roh', 'parmesan': 'Parmesan mind. 30 % Fett i. Tr.',
    'pasta': 'Teigwaren Hartweizen ohne Ei trocken', 'linguine': 'Teigwaren Hartweizen ohne Ei trocken',
    'quinoa': 'Quinoa weiß, roh', 'rucola': 'Rucola roh', 'salz': 'Speisesalz',
    'saure sahne': 'Sauerrahm mindestens 10 % Fett', 'speck': 'Schweinespeck durchwachsen',
    'tahin': 'Tahin (Sesammus)', 'tikka': 'Curry-Gewürzketchup', 'tomatenmark': 'Tomatenmark',
    'tortilla': 'Weizentortilla', 'zucchini': 'Zucchini roh', 'zucchetti': 'Zucchini roh',
    'zwiebel': 'Speisezwiebel roh'
}

def get_weight(name, qty):
    ln = name.lower()
    if qty >= 10: return qty
    if 'avocado' in ln: return qty * 180
    if 'zwiebel' in ln: return qty * 100
    if 'tomate' in ln: return qty * 400
    if 'kichererbsen' in ln or 'bohne' in ln or 'linse' in ln: return qty * 400
    if 'limette' in ln: return qty * 50
    if 'eigelb' in ln: return qty * 18
    if 'tortilla' in ln: return qty * 40
    return qty

# ==========================================
# 4. ANALYSE-DURCHLAUF
# ==========================================
results = []
for line in raw_ingredients:
    match = re.match(r'^([\d\.]+)\s+(.*)', line)
    qty, item_name = (float(match.group(1)), match.group(2).strip()) if match else (1.0, line.strip())
    weight = get_weight(item_name, qty)
    
    # Matching
    matched_bls_key = None
    for key in sorted(manual_map.keys(), key=len, reverse=True):
        if key in item_name.lower():
            matched_bls_key = manual_map[key]
            break
            
    if matched_bls_key:
        match_df = df[df['Lebensmittelbezeichnung'].str.contains(matched_bls_key, case=False, na=False, regex=False)]
        if not match_df.empty:
            data = match_df.iloc[0]
            res = {'Input': line, 'Matched': data['Lebensmittelbezeichnung'], 'Weight': weight}
            for col in all_nutrient_cols:
                res[col] = (data[col] * weight) / 100.0
            results.append(res)

if not results:
    print("Keine Übereinstimmungen gefunden.")
    exit()

final_df = pd.DataFrame(results)

# ==========================================
# 5. DASHBOARD DARSTELLUNG
# ==========================================
def print_dashboard(res_df):
    totals = res_df.sum(numeric_only=True)
    
    # Definition der anzuzeigenden Spalten (Labels : Spaltenname)
    macros = {
        'Energie [kcal]': 'ENERCC Energie (Kilokalorien) [kcal/100g]',
        'Protein [g]': 'PROT625 Protein (Nx6,25) [g/100g]',
        'Fett [g]': 'FAT Fett [g/100g]',
        'Kohlenhydrate [g]': 'CHO Kohlenhydrate, verfügbar [g/100g]',
        'Ballaststoffe [g]': 'FIBT Ballaststoffe, gesamt [g/100g]'
    }
    
    vits = {
        'Vitamin A [µg]': 'VITA Vitamin A, Retinol-Äquivalent (RE) [µg/100g]',
        'Vitamin C [mg]': 'VITC Vitamin C [mg/100g]',
        'Vitamin B12 [µg]': 'VITB12 Vitamin B12 (Cobalamine) [µg/100g]',
        'Vitamin D [µg]': 'VITD Vitamin D [µg/100g]',
        'Folat [µg]': 'FOL Folat-Äquivalent [µg/100g]'
    }
    
    mins = {
        'Eisen [mg]': 'FE Eisen [mg/100g]',
        'Zink [mg]': 'ZN Zink [mg/100g]',
        'Magnesium [mg]': 'MG Magnesium [mg/100g]',
        'Calcium [mg]': 'CA Calcium [mg/100g]',
        'Kalium [mg]': 'K Kalium [mg/100g]'
    }

    print("\n" + "="*60)
    print(f"{'NÄHRWERT-DASHBOARD (GESAMT)':^60}")
    print("="*60)
    
    print(f"\n{'--- MAKRONÄHRSTOFFE ---':<40} {'MENGE':>15}")
    for label, col in macros.items():
        print(f"{label:<40} {totals[col]:>15.2f}")
    
    print(f"\n{'--- VITAMINE ---':<40} {'MENGE':>15}")
    for label, col in vits.items():
        print(f"{label:<40} {totals[col]:>15.2f}")

    print(f"\n{'--- MINERALSTOFFE ---':<40} {'MENGE':>15}")
    for label, col in mins.items():
        print(f"{label:<40} {totals[col]:>15.2f}")

    print("\n" + "="*60)
    print(f"{'TOP-LIEFERANTEN IN DEINER LISTE':^60}")
    print("="*60)
    for label, col in {**macros, **vits, **mins}.items():
        top = res_df.sort_values(by=col, ascending=False).iloc[0]
        # Kürze Input auf 25 Zeichen für die Tabelle
        input_name = (top['Input'][:25] + '..') if len(top['Input']) > 25 else top['Input']
        print(f"{label:<25} -> {input_name:<27} ({top[col]:>8.2f})")
    print("="*60)

# Dashboard ausgeben
print_dashboard(final_df)

# Exportieren
final_df.to_csv('vollstaendige_analyse_ergebnis.csv', index=False, encoding='utf-8-sig')
print(f"\nDie vollständige Analyse wurde in 'vollstaendige_analyse_ergebnis.csv' gespeichert.")