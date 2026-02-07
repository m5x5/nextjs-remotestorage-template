#!/usr/bin/env python3
"""
Orchestrierungs-Script für die komplette Rezept-Analyse-Pipeline.
Führt nacheinander aus:
1. recipe_schema_extraction.py - Extrahiert Rezeptdaten von Cookidoo
2. recipe_weekly_analyzer.py - Analysiert gegen wöchentliche Nährstoffziele
"""

import subprocess
import sys
import os
from pathlib import Path
from recipe_config import CSV_INPUT, BLS_DATABASE, RECIPE_DATABASE_OUTPUT, RECIPE_FINAL_OUTPUT

def run_script(script_name, description):
    """Führe ein Python-Script aus und gebe den Status aus."""
    print("\n" + "="*70)
    print(f"{'SCHRITT: ' + description:<70}")
    print("="*70)

    script_path = Path(__file__).parent / script_name

    if not script_path.exists():
        print(f"✗ FEHLER: {script_name} nicht gefunden!")
        return False

    try:
        result = subprocess.run(
            [sys.executable, str(script_path)],
            cwd=Path(__file__).parent,
            capture_output=False
        )

        if result.returncode == 0:
            print(f"\n✓ {description} erfolgreich abgeschlossen!")
            return True
        else:
            print(f"\n✗ {description} fehlgeschlagen (Exit-Code: {result.returncode})")
            return False

    except Exception as e:
        print(f"✗ FEHLER beim Ausführen von {script_name}: {str(e)}")
        return False

def main():
    print("="*70)
    print(f"{'REZEPT-ANALYSE PIPELINE':^70}")
    print("="*70)
    print("\nDiese Pipeline führt folgende Schritte aus:")
    print("1. Extrahiert Rezeptdaten von Cookidoo-Links")
    print("2. Analysiert Nährstoffe basierend auf BLS-Datenbank")
    print("3. Vergleicht gegen wöchentliche Diät-Ziele")
    print("4. Generiert finales Ergebnis (recipe_final.csv)")

    # Check erforderliche Dateien (in data/)
    required_paths = [
        (CSV_INPUT, 'Cookidoo Export (data/)'),
        (BLS_DATABASE, 'BLS-Datenbank (data/)'),
    ]

    print("\n" + "="*70)
    print(f"{'VORBEDINGUNGEN PRÜFEN':^70}")
    print("="*70)

    missing_files = []
    for path, label in required_paths:
        if os.path.exists(path):
            print(f"✓ {label}")
        else:
            print(f"✗ {path} nicht gefunden!")
            missing_files.append(path)

    if missing_files:
        print(f"\n✗ FEHLER: Erforderliche Dateien fehlen in data/")
        for f in missing_files:
            print(f"  - {f}")
        print("\nBitte lege die Cookidoo- und BLS-CSVs in recipe_pipeline/data/ ab.")
        return False

    print("\n✓ Alle erforderlichen Dateien vorhanden!")

    # Führe Scripts nacheinander aus
    success = True

    # Script 1: Extraktion
    if not run_script('recipe_schema_extraction.py', 'Rezept-Extraktion (Schema.org)'):
        print("\n✗ Pipeline abgebrochen: Extraktion fehlgeschlagen")
        return False

    # Script 2: Analyse
    if not run_script('recipe_weekly_analyzer.py', 'Wöchentliche Nährstoff-Analyse'):
        print("\n✗ Pipeline abgebrochen: Analyse fehlgeschlagen")
        return False

    # Erfolgs-Zusammenfassung
    print("\n" + "="*70)
    print(f"{'PIPELINE ABGESCHLOSSEN':^70}")
    print("="*70)

    output_files = [
        (RECIPE_DATABASE_OUTPUT, 'Extrahierte Rezeptdatenbank'),
        (RECIPE_FINAL_OUTPUT, 'Finale Analyse mit Nährstoffabdeckung'),
    ]

    print("\nErzeugte Dateien (in data/):")
    for path, description in output_files:
        if os.path.exists(path):
            size_mb = os.path.getsize(path) / (1024 * 1024)
            print(f"✓ {os.path.basename(path):<25} ({description}) [{size_mb:.2f} MB]")
        else:
            print(f"✗ {os.path.basename(path):<25} (NICHT GEFUNDEN)")

    print("\n" + "="*70)
    print("Nächste Schritte:")
    print("- Öffne data/recipe_final.csv in einem Spreadsheet-Programm")
    print("- Sieh dir die wöchentliche Nährstoffabdeckung pro Rezept an")
    print("- Vergleiche mit deinen persönlichen Dietary-Goals")
    print("="*70)

    return True

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
