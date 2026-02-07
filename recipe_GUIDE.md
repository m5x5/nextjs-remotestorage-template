# Rezept-Analyse Pipeline - Benutzerhandbuch

## Übersicht

Diese Pipeline verarbeitet eine Cookidoo-Rezeptliste (CSV) und analysiert die Nährstoffwerte basierend auf:
1. **Schema.org Recipe-Daten** - Extrahiert von Cookidoo-Rezeptseiten
2. **BLS-Nährstoffdatenbank** - Deutsche Nährstofftabelle (BLS_4_0_Daten_2025_DE.csv)
3. **Wöchentliche Diät-Ziele** - Voreingestellte tägliche/wöchentliche Nährstoffziele

## Dateien

### Hauptskripte

#### 1. `recipe_schema_extraction.py`
**Funktion:** Extrahiert Rezeptdaten von Cookidoo-Links

**Prozess:**
- Lädt die Rezeptliste aus `Lebensmittel - Cookidoo Export - Rezepte.csv`
- Ruft jede Rezept-URL auf
- Extrahiert JSON-LD Schema.org Recipe-Daten
- Parst Zutaten und Mengen
- Matched Zutaten mit der BLS-Nährstoffdatenbank
- Berechnet Gesamtnährstoffe pro Rezept
- Speichert Ergebnis in `recipe_database.csv`

**Ausgabe:**
- `recipe_database.csv` - Datenbankdatei mit:
  - Rezeptname
  - URL
  - Rating
  - Zubereitungszeit
  - Anzahl Zutaten
  - Nährstoffwerte (11 Nährstoffe)

**Laufzeit:** 2-5 Minuten (abhängig von Netzwerkgeschwindigkeit und Anzahl Rezepte)

#### 2. `recipe_weekly_analyzer.py`
**Funktion:** Analysiert Nährstoffe gegen wöchentliche Diät-Ziele

**Prozess:**
- Lädt `recipe_database.csv`
- Definiert wöchentliche Nährstoffziele (auf Basis täglicher Ziele)
- Berechnet für jedes Rezept:
  - Prozentuale Abdeckung des wöchentlichen Ziels
  - Tägliches Äquivalent (% des Tagesziels)
  - Durchschnittliche Abdeckung über alle Nährstoffe
- Speichert erweiterte Analyse in `recipe_final.csv`
- Gibt Statistiken und Top-Rezepte aus

**Ausgabe:**
- `recipe_final.csv` - Finale Analysedatei mit:
  - Alle Originaldaten + Spalten von `recipe_schema_extraction.py`
  - Nährstoffwerte pro Rezept (kurznamen wie `ENERCC_kcal`, `PROT_g`, etc.)
  - Wöchentliche Abdeckung % pro Nährstoff
  - Tägliches Äquivalent % pro Nährstoff
  - Durchschnittliche Abdeckung über alle Nährstoffe

**Laufzeit:** < 1 Sekunde

#### 3. `recipe_process_all.py`
**Funktion:** Orchestriert beide Skripte nacheinander

**Verwendung:**
```bash
python recipe_process_all.py
```

**Features:**
- Prüft erforderliche Dateien
- Führt beide Skripte nacheinander aus
- Zeigt Fortschritt und Fehler an
- Fasst Ergebnisse zusammen

## Verwendung

### Schnellstart

```bash
# Alles auf einmal ausführen
python recipe_process_all.py
```

### Einzelne Schritte

```bash
# Nur Extraktion
python recipe_schema_extraction.py

# Nur Analyse (nach erfolgreicher Extraktion)
python recipe_weekly_analyzer.py
```

## Erforderliche Dateien

1. **`Lebensmittel - Cookidoo Export - Rezepte.csv`**
   - Von Cookidoo exportierte Rezeptliste
   - Spalten:
     - `link--alt href` - URL zum Rezept
     - `core-tile__description-text` - Rezeptname
     - `core-rating__label` - Bewertungen/Kommentare
     - `core-tile__description-subline` - Zubereitungszeit

2. **`BLS_4_0_Daten_2025_DE.csv`**
   - Bundeslebensmittelschlüssel (Deutsche Nährstoffdatenbank)
   - Enthält Nährstoffwerte für ~20.000 Lebensmittel

## Ausgabedateien

### `recipe_database.csv`
Zwischenergebnis nach Extraktion.

**Spalten:**
- `recipe_name` - Name des Rezepts
- `recipe_url` - Link zum Original-Rezept
- `rating` - Bewertung/Kommentaranzahl
- `time` - Zubereitungszeit
- `ingredient_count` - Anzahl erkannte Zutaten
- `ENERCC Energie (Kilokalorien) [kcal/100g]` - Kaloriengehalt
- `PROT625 Protein (Nx6,25) [g/100g]` - Proteingehalt
- `FAT Fett [g/100g]` - Fettgehalt
- `CHO Kohlenhydrate, verfügbar [g/100g]` - Kohlenhydrate
- `FIBT Ballaststoffe, gesamt [g/100g]` - Ballaststoffe
- `VITA Vitamin A [µg/100g]` - Vitamin A
- `VITC Vitamin C [mg/100g]` - Vitamin C
- `VITB12 Vitamin B12 [µg/100g]` - Vitamin B12
- `FE Eisen [mg/100g]` - Eisen
- `CA Calcium [mg/100g]` - Calcium
- `MG Magnesium [mg/100g]` - Magnesium

### `recipe_final.csv`
Finale Ausgabedatei mit vollständiger Analyse. Enthält zusätzlich:

**Kurznamen-Spalten:**
- `recipe_ENERCC_kcal` - Kaloriengehalt (kurz)
- `recipe_PROT_g` - Protein in Gramm
- `recipe_FAT_g` - Fett in Gramm
- etc.

**Wöchentliche Abdeckung (%):**
- `weekly_coverage_ENERCC_kcal_%` - % der wöchentlichen Kalorienziel
- `weekly_coverage_PROT_g_%` - % der wöchentlichen Proteinziel
- etc.

**Tägliches Äquivalent (%):**
- `daily_equiv_ENERCC_kcal_%` - % des täglichen Kalorienziels
- `daily_equiv_PROT_g_%` - % des täglichen Proteinziels
- etc.

**Zusammenfassende Spalten:**
- `avg_weekly_coverage_%` - Ø wöchentliche Abdeckung aller Nährstoffe
- `avg_daily_equiv_%` - Ø tägliches Äquivalent aller Nährstoffe
- `macros_avg_coverage_%` - Ø Abdeckung der Makronährstoffe (Kalorien, Protein, Fett, Kohlenhydrate)

## Wöchentliche Diät-Ziele (anpassbar)

Standard-Tägliche Ziele (mit 7 multipliziert für wöchentlich):
- **Kalorien:** 2.000 kcal/Tag = 14.000 kcal/Woche
- **Protein:** 55 g/Tag = 385 g/Woche
- **Fett:** 70 g/Tag = 490 g/Woche
- **Kohlenhydrate:** 250 g/Tag = 1.750 g/Woche
- **Ballaststoffe:** 30 g/Tag = 210 g/Woche
- **Vitamin A:** 700 µg/Tag = 4.900 µg/Woche
- **Vitamin C:** 75 mg/Tag = 525 mg/Woche
- **Vitamin B12:** 2,4 µg/Tag = 16,8 µg/Woche
- **Eisen:** 8 mg/Tag = 56 mg/Woche
- **Calcium:** 1.000 mg/Tag = 7.000 mg/Woche
- **Magnesium:** 400 mg/Tag = 2.800 mg/Woche

### Ziele anpassen

Bearbeite die `DAILY_GOALS` Variable in `recipe_weekly_analyzer.py`:

```python
DAILY_GOALS = {
    'calories': 2000,          # Dein tägliches Kalorienziel
    'protein': 55,             # Dein tägliches Proteinziel
    # ... etc.
}
```

## Zutatenmapping

Die Skripte mappen Zutaten automatisch auf BLS-Lebensmittel.

**Unterstützte Zutaten:**
- Aubergine, Avocado, Balsamico, Butter, Chilipulver, Ei(er)
- Knoblauch, Kokosmilch, Koriander, Limette, Linsen, Mais
- Mandel, Öl, Olivenöl, Oregano, Paprika, Parmesan, Pasta
- Petersilie, Sahne, Salz, Speck, Tomatenmark, Tortilla, Zwiebel
- Hackfleisch, Feta, Käse, Mozzarella, Ricotta, Spinat, Brokkoli
- Fisch, und viele mehr...

### Zutatenmapping erweitern

Bearbeite die `manual_map` Variable in `recipe_schema_extraction.py`:

```python
manual_map = {
    'deine_zutat': 'BLS_Lebensmittelname',
    # ... etc.
}
```

## Tipps & Tricks

### 1. Performance verbessern
- Die Extraktion ist am langsamsten (Netzwerk-IO)
- Für Testing: Ändere `recipes_df = recipes_df.head(5)` in `recipe_schema_extraction.py`

### 2. Fehlende Schema.org Daten
- Nicht alle Rezepte haben strukturierte Daten (Schema.org)
- Das Skript überspringt diese und zeigt `✗ (Keine Recipe-Daten gefunden)`
- Übersprungene Rezepte werden in `recipe_database.csv` nicht aufgenommen

### 3. Zutaten debuggen
- Wenn Zutaten nicht erkannt werden, aktiviere Debug-Ausgabe
- Erhöhe die Rate-Limit-Verzögerung (`RATE_LIMIT_DELAY`) bei Problemen mit Cookidoo

### 4. Gewichte anpassen
- Wenn Mengen nicht korrekt erkannt werden, bearbeite die `get_weight()` Funktion
- Beispiel: Eine Zwiebel ohne Gewichtsangabe = 100g

## Fehlerbehandlung

### "recipe_database.csv nicht gefunden"
**Lösung:** Führe zuerst `recipe_schema_extraction.py` aus

### "BLS_4_0_Daten_2025_DE.csv nicht gefunden"
**Lösung:** Stelle sicher, dass die BLS-Datei im gleichen Verzeichnis liegt

### "Keine Recipe-Daten gefunden"
**Lösung:** Das Rezept hat keine Schema.org Recipe-Struktur. Dies ist normal.
- Etwa 70-80% der Cookidoo-Rezepte haben diese Daten

### Netzwerkfehler
**Lösung:**
- Überprüfe deine Internetverbindung
- Erhöhe `REQUEST_TIMEOUT` in `recipe_schema_extraction.py`
- Erhöhe `RATE_LIMIT_DELAY` um Blockierung zu vermeiden

## Anwendungsbeispiele

### Beispiel 1: Wöchentliche Mahlzeitsplanung
```
Mit recipe_final.csv kannst du:
1. Nach Rezepten mit höchster Protein-Abdeckung filtern
2. Eine Wochenplan erstellen, der deine Ziele erfüllt
3. Nährstofflücken mit zusätzlichen Zutaten füllen
```

### Beispiel 2: Diät-Tracking
```
Lade recipe_final.csv in deine Tracking-App:
- Filtere nach weekly_coverage_%
- Kombiniere Rezepte für optimale Nährstoffabdeckung
```

### Beispiel 3: Personalisierer Diätplan
```
1. Passe DAILY_GOALS an deine persönlichen Ziele an
2. Führe recipe_weekly_analyzer.py erneut aus
3. Sieh dir an, welche Rezepte am besten passen
```

## Technische Details

### Unterstützte Nährstoffe
- Energie (kcal)
- Makronährstoffe: Protein, Fett, Kohlenhydrate, Ballaststoffe
- Vitamine: A, C, B12, D (wenn verfügbar), Folat (wenn verfügbar)
- Mineralstoffe: Eisen, Zink, Magnesium, Calcium, Kalium

### Gewichtsberechnung
- **Mit Mengenangabe (z.B. "100 Butter"):** Mengenangabe wird als Gramm interpretiert
- **Ohne Mengenangabe (z.B. "Knoblauch"):** Standardgewichte werden angewendet
  - 1 Knoblauchzehe = 4g
  - 1 Petersilie = 10g
  - etc.

### Nährstoff-Skaling
```
Nährstoffwert = (BLS-Wert-pro-100g * Gewicht) / 100
```

## Support & Erweiterung

### Für Entwickler
- Die Skripte sind modular aufgebaut
- `recipe_schema_extraction.py` liefert `recipe_database.csv` für weitere Analysen
- `NUTRIENT_MAPPING` in `recipe_weekly_analyzer.py` ist anpassbar

### Abhängigkeiten
- `pandas` - Datenverarbeitung
- `requests` - Netzwerk-Requests
- `BeautifulSoup4` - HTML-Parsing
- `openpyxl` - Excel-Unterstützung

Installation:
```bash
pip install pandas requests beautifulsoup4 openpyxl
```

## Lizenz & Haftung

Diese Skripte nutzen:
- Cookidoo (Thermomix Community) - Rezeptdaten
- BLS (Bundesministerium für Ernährung und Landwirtschaft) - Nährstoffdatenbank

Für den privaten Gebrauch bestimmt.
