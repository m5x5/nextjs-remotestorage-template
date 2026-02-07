import pandas as pd
import re

def convert_xlsx_to_csv(input_file, output_file):
    try:
        # Lade die Excel-Datei
        # Hinweis: engine='openpyxl' wird für .xlsx benötigt
        df = pd.read_excel(input_file, engine='openpyxl')
        
        # Speichere als CSV
        # utf-8-sig sorgt dafür, dass Umlaute in Excel korrekt angezeigt werden
        df.to_csv(output_file, index=False, encoding='utf-8-sig', sep=',')
        
        print(f"Erfolgreich konvertiert: {input_file} -> {output_file}")
    except Exception as e:
        print(f"Fehler bei der Konvertierung: {e}")

# Beispielaufruf:
convert_xlsx_to_csv('BLS_4_0_Daten_2025_DE.xlsx', 'BLS_4_0_Daten_2025_DE.csv')
# 1. Datei laden
# Ersetze den Dateinamen, falls er lokal anders heißt
FILE_NAME = 'BLS_4_0_Daten_2025_DE.csv'
df = pd.read_csv(FILE_NAME, low_memory=False)

# 2. Relevante Nährstoffspalten definieren (Mapping)
nutrient_map = {
    'Kalorien [kcal]': 'ENERCC Energie (Kilokalorien) [kcal/100g]',
    'Protein [g]': 'PROT625 Protein (Nx6,25) [g/100g]',
    'Fett [g]': 'FAT Fett [g/100g]',
    'Kohlenhydrate [g]': 'CHO Kohlenhydrate, verfügbar [g/100g]',
    'Ballaststoffe [g]': 'FIBT Ballaststoffe, gesamt [g/100g]',
    'Vitamin C [mg]': 'VITC Vitamin C [mg/100g]',
    'Vitamin A [µg]': 'VITA Vitamin A, Retinol-Äquivalent (RE) [µg/100g]',
    'Eisen [mg]': 'FE Eisen [mg/100g]',
    'Magnesium [mg]': 'MG Magnesium [mg/100g]',
    'Calcium [mg]': 'CA Calcium [mg/100g]'
}

# Daten bereinigen (Strings in Zahlen umwandeln)
for col in nutrient_map.values():
    df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

# 3. Deine Zutatenliste
raw_ingredients = [
    "200 Auberginen", "2 Avocados", "15 Balsamico, dunkel", "50 Butter", 
    "0.25 Cayenne-Pfeffer", "0.75 Chiliflocken, getrocknet", "2 Eigelbe", 
    "700 Karfiol", "70 Karotten", "500 Hühneroberkeulen, ohne Haut, ausgelöst",
    "150 Rucola", "30 Tahin", "4 Weizentortillas", "120 Zucchini"
    # ... hier kannst du beliebig erweitern
]

# 4. Hilfsfunktionen für Mapping und Gewichte
manual_map = {
    'aubergine': 'Aubergine roh', 'avocado': 'Avocado roh', 'karfiol': 'Blumenkohl roh',
    'karotte': 'Karotte roh', 'rucola': 'Rucola roh', 'zucchini': 'Zucchini roh',
    'tahin': 'Tahin (Sesammus)', 'butter': 'Butter', 'tortilla': 'Weizentortilla',
    'hühneroberkeule': 'Hähnchenschenkel ohne Haut gegart'
}

def get_weight(name, qty):
    ln = name.lower()
    if qty >= 10: return qty # Vermutlich bereits Gramm
    if 'avocado' in ln: return qty * 180
    if 'zwiebel' in ln: return qty * 100
    if 'tortilla' in ln: return qty * 40
    return qty

# 5. Berechnung
results = []
for line in raw_ingredients:
    match = re.match(r'^([\d\.]+)\s+(.*)', line)
    qty, item_name = (float(match.group(1)), match.group(2).strip()) if match else (1.0, line.strip())
    
    weight = get_weight(item_name, qty)
    
    # Bestmögliches Match finden
    matched_bls = None
    for key, val in manual_map.items():
        if key in item_name.lower():
            matched_bls = val
            break
            
    if matched_bls:
        matched_df = df[df['Lebensmittelbezeichnung'].str.contains(matched_bls, case=False, na=False)]
        if not matched_df.empty:
            data = matched_df.iloc[0]
            res = {'Zutat': line, 'Gewicht [g]': weight}
            for label, col in nutrient_map.items():
                res[label] = (data[col] * weight) / 100.0
            results.append(res)
        else:
            print(f"Warnung: Kein Match gefunden für '{item_name}' (gesucht: '{matched_bls}')")

res_df = pd.DataFrame(results)

# 6. Ausgabe der Ergebnisse
print("--- GESAMT-NÄHRWERTE ---")
print(res_df.sum(numeric_only=True).round(2))

print("\n--- TOP-LIEFERANTEN (HÖCHSTE ANTEILE) ---")
for nut in ['Kalorien [kcal]', 'Protein [g]', 'Vitamin C [mg]', 'Eisen [mg]']:
    top = res_df.sort_values(by=nut, ascending=False).iloc[0]
    print(f"{nut}: {top['Zutat']} ({top[nut]:.2f})")

# Als neue Datei speichern
res_df.to_csv('meine_naehrwerte.csv', index=False, encoding='utf-8-sig')
print("\nDetaillierte Liste wurde als 'meine_naehrwerte.csv' gespeichert.")