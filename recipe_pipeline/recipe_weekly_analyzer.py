import pandas as pd
import json
import os
from recipe_config import DATA_DIR, RECIPE_DATABASE_OUTPUT, RECIPE_FINAL_OUTPUT

# ==========================================
# 1. KONFIGURATION - WÖCHENTLICHE ZIELE
# ==========================================
# Tägliche Ziele (werden mit 7 multipliziert für wöchentlich)
DAILY_GOALS = {
    'calories': 2000,          # kcal
    'protein': 55,             # g
    'fat': 70,                 # g
    'carbs': 250,              # g
    'fiber': 30,               # g
    'vitamin_a': 700,          # µg
    'vitamin_c': 75,           # mg
    'vitamin_b12': 2.4,        # µg
    'iron': 8,                 # mg
    'calcium': 1000,           # mg
    'magnesium': 400,          # mg
}

# Umrechnung: täglich zu wöchentlich
WEEKLY_GOALS = {key: value * 7 for key, value in DAILY_GOALS.items()}

# Mapping von BLS-Spalten zu täglichen Zielen
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
# 2. DATEN LADEN
# ==========================================
print("Lade Rezeptdatenbank...")
try:
    recipes_df = pd.read_csv(RECIPE_DATABASE_OUTPUT)
except FileNotFoundError:
    print("Fehler: 'recipe_database.csv' nicht gefunden.")
    print("Bitte führe zuerst 'recipe_schema_extraction.py' aus.")
    exit()

print(f"Geladen: {len(recipes_df)} Rezepte")

# ==========================================
# 3. NÄHRSTOFFSPALTEN IDENTIFIZIEREN
# ==========================================
available_nutrients = []
for bls_col, (goal_key, short_name) in NUTRIENT_MAPPING.items():
    if bls_col in recipes_df.columns:
        available_nutrients.append((bls_col, goal_key, short_name))

print(f"Verfügbare Nährstoffe: {len(available_nutrients)}")

# ==========================================
# 4. WÖCHENTLICHE ANALYSE PRO REZEPT
# ==========================================
print("\nAnalysiere wöchentliche Abdeckung pro Rezept...")

new_columns = {}

for recipe_idx, recipe_row in recipes_df.iterrows():
    recipe_id = f"recipe_{recipe_idx}"
    weekly_coverage = {}
    daily_equivalent = {}

    # Berechne tägliches Äquivalent pro Nährstoff
    for bls_col, goal_key, short_name in available_nutrients:
        recipe_value = recipe_row[bls_col]  # Dies ist der Gesamtwert für das Rezept
        daily_goal = DAILY_GOALS[goal_key]
        weekly_goal = WEEKLY_GOALS[goal_key]

        # Prozentuale Abdeckung des wöchentlichen Ziels (falls Rezept einmal pro Woche gegessen wird)
        coverage_weekly = (recipe_value / weekly_goal * 100) if weekly_goal > 0 else 0

        # Tägliches Äquivalent (wie viel % des Tagesziels entspricht dieses Rezept)
        coverage_daily = (recipe_value / daily_goal * 100) if daily_goal > 0 else 0

        weekly_coverage[short_name] = round(coverage_weekly, 2)
        daily_equivalent[short_name] = round(coverage_daily, 2)

    new_columns[recipe_idx] = {
        'weekly_coverage': weekly_coverage,
        'daily_equivalent': daily_equivalent
    }

# ==========================================
# 5. ZUSÄTZLICHE SPALTEN HINZUFÜGEN
# ==========================================
print("Füge berechnete Spalten hinzu...")

# Preserve recipe_yield if it exists
if 'recipe_yield' not in recipes_df.columns:
    recipes_df['recipe_yield'] = 'Unknown'

# Preserve author nutrition columns if they exist
author_nutrient_cols = [col for col in recipes_df.columns if col.startswith('author_')]
if author_nutrient_cols:
    print(f"\n✓ Found {len(author_nutrient_cols)} author-provided nutrient columns: {author_nutrient_cols}")

# Kurze Nährstoffwerte hinzufügen
for bls_col, goal_key, short_name in available_nutrients:
    recipes_df[f'recipe_{short_name}'] = recipes_df[bls_col]

# Wöchentliche Abdeckung hinzufügen
for short_name in [col[2] for col in available_nutrients]:
    recipes_df[f'weekly_coverage_{short_name}_%'] = [
        new_columns[idx]['weekly_coverage'].get(short_name, 0)
        for idx in range(len(recipes_df))
    ]

# Tägliches Äquivalent hinzufügen
for short_name in [col[2] for col in available_nutrients]:
    recipes_df[f'daily_equiv_{short_name}_%'] = [
        new_columns[idx]['daily_equivalent'].get(short_name, 0)
        for idx in range(len(recipes_df))
    ]

# ==========================================
# 6. ZUSAMMENFASSENDE STATISTIKEN
# ==========================================
print("\nBerechne zusammenfassende Statistiken...")

# Gesamtabdeckung pro Rezept (Durchschnitt über alle Nährstoffe)
coverage_columns = [col for col in recipes_df.columns if col.startswith('weekly_coverage_')]
recipes_df['avg_weekly_coverage_%'] = recipes_df[coverage_columns].mean(axis=1).round(2)

daily_equiv_columns = [col for col in recipes_df.columns if col.startswith('daily_equiv_')]
recipes_df['avg_daily_equiv_%'] = recipes_df[daily_equiv_columns].mean(axis=1).round(2)

# Makronährstoffe Zusammenfassung
macros_coverage = [col for col in recipes_df.columns if any(
    m in col for m in ['ENERCC_kcal', 'PROT_g', 'FAT_g', 'CHO_g']
) and 'weekly_coverage' in col]

if macros_coverage:
    recipes_df['macros_avg_coverage_%'] = recipes_df[macros_coverage].mean(axis=1).round(2)

# ==========================================
# 7. ANALYSE UND AUSGABE
# ==========================================
print("\n" + "="*70)
print(f"{'WÖCHENTLICHE NÄHRSTOFFZIELE':^70}")
print("="*70)
print(f"\n{'Nährstoff':<30} {'Tägliches Ziel':<20} {'Wöchentliches Ziel':<20}")
print("-"*70)

for goal_key, daily_val in DAILY_GOALS.items():
    weekly_val = daily_val * 7
    print(f"{goal_key:<30} {daily_val:>15.1f} {weekly_val:>18.1f}")

print("\n" + "="*70)
print(f"{'TOP 10 REZEPTE NACH NÄHRSTOFFABDECKUNG':^70}")
print("="*70)

top_recipes = recipes_df.nlargest(10, 'avg_weekly_coverage_%')[
    ['recipe_name', 'ingredient_count', 'avg_weekly_coverage_%', 'avg_daily_equiv_%']
]

print(f"\n{'Rezept':<40} {'Zutaten':<10} {'Wo.Abdeckung':<15} {'Tg.Äquiv.':<10}")
print("-"*70)

for idx, row in top_recipes.iterrows():
    recipe_name = row['recipe_name'][:37] + '..' if len(row['recipe_name']) > 39 else row['recipe_name']
    print(f"{recipe_name:<40} {row['ingredient_count']:<10.0f} {row['avg_weekly_coverage_%']:>13.1f}% {row['avg_daily_equiv_%']:>8.1f}%")

# ==========================================
# 8. DETAILLIERTE ANALYSE BEISPIELREZEPT
# ==========================================
if len(recipes_df) > 0:
    best_recipe = recipes_df.iloc[recipes_df['avg_weekly_coverage_%'].idxmax()]
    print("\n" + "="*70)
    print(f"{'DETAILLIERTE ANALYSE: TOP REZEPT':^70}")
    print("="*70)
    print(f"\nRezept: {best_recipe['recipe_name']}")
    print(f"Rating: {best_recipe['rating']}, Zeit: {best_recipe['time']}")
    print(f"Zutaten: {best_recipe['ingredient_count']:.0f}")
    print(f"\nNährstoffabdeckung (wöchentlich, wenn 1x pro Woche gegessen):")
    print("-"*70)

    for short_name in [col[2] for col in available_nutrients]:
        col_name = f'weekly_coverage_{short_name}_%'
        if col_name in recipes_df.columns:
            coverage = best_recipe[col_name]
            print(f"{short_name:<25}: {coverage:>8.1f}% der wöchentlichen Ziel")

# ==========================================
# 9. SPEICHERN DER FINALEN CSV
# ==========================================
print("\n" + "="*70)
print("Speichere finale Datei...")

output_file = RECIPE_FINAL_OUTPUT
recipes_df.to_csv(output_file, index=False, encoding='utf-8-sig')

print(f"✓ Finale CSV gespeichert: {output_file}")
print(f"  Rezepte: {len(recipes_df)}")
print(f"  Spalten: {len(recipes_df.columns)}")

# ==========================================
# 10. ZUSAMMENFASSUNG STATISTIKEN
# ==========================================
print("\n" + "="*70)
print(f"{'ZUSAMMENFASSUNG':^70}")
print("="*70)

stats = {
    'Total Rezepte': len(recipes_df),
    'Ø Zutaten pro Rezept': recipes_df['ingredient_count'].mean(),
    'Ø wöchentliche Nährstoffabdeckung': recipes_df['avg_weekly_coverage_%'].mean(),
    'Max wöchentliche Abdeckung': recipes_df['avg_weekly_coverage_%'].max(),
    'Min wöchentliche Abdeckung': recipes_df['avg_weekly_coverage_%'].min(),
}

for key, value in stats.items():
    print(f"{key:<40}: {value:>15.2f}")

print("\n" + "="*70)
print(f"Prozess abgeschlossen!")
print(f"Verfügbar: {output_file}")
print("="*70)
