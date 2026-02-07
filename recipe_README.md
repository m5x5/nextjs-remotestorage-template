# 🍳 Rezept-Analyse Pipeline

Automatische Extraktion und Analyse von Nährstoffen aus Cookidoo-Rezepten gegen deine persönlichen Diät-Ziele.

## 📋 Was macht diese Pipeline?

1. **Extrahiert** Rezeptdaten von Cookidoo-Links (Schema.org JSON-LD)
2. **Parsed** Zutaten und Mengen automatisch
3. **Matched** Zutaten mit der deutschen BLS-Nährstoffdatenbank
4. **Berechnet** Gesamtnährstoffe pro Rezept
5. **Vergleicht** gegen deine wöchentlichen Diät-Ziele
6. **Generiert** eine finale CSV mit allen Analysen

## 🚀 Schnellstart

### 1. Vorbereitung
```bash
# Installiere Abhängigkeiten
pip install pandas requests beautifulsoup4 openpyxl

# Stelle sicher, dass diese Dateien vorhanden sind:
# - Lebensmittel - Cookidoo Export - Rezepte.csv
# - BLS_4_0_Daten_2025_DE.csv
```

### 2. Ausführung
```bash
# Alles auf einmal ausführen
python recipe_process_all.py

# ODER einzelne Schritte:
python recipe_schema_extraction.py    # Extraktion (2-5 Minuten)
python recipe_weekly_analyzer.py      # Analyse (< 1 Sekunde)
```

### 3. Ergebnisse
- `recipe_database.csv` - Extrahierte Rezepte mit Nährstoffen
- `recipe_final.csv` - Finale Analyse mit wöchentlicher Abdeckung

## 📁 Dateien

### Hauptskripte (mit `recipe_` Präfix)

| Datei | Zweck | Input | Output |
|-------|-------|-------|--------|
| `recipe_schema_extraction.py` | Extrahiert Rezeptdaten von URLs | CSV mit Links | `recipe_database.csv` |
| `recipe_weekly_analyzer.py` | Analysiert vs. Diät-Ziele | `recipe_database.csv` | `recipe_final.csv` |
| `recipe_process_all.py` | Orchestriert beide Schritte | Beide CSVs | Beide Output-CSVs |
| `recipe_config.py` | Konfiguration & Ziele (BEARBEITEN!) | Python dict | - |

### Dokumentation

| Datei | Inhalt |
|-------|--------|
| `recipe_README.md` | Diese Datei |
| `recipe_GUIDE.md` | Detailliertes Benutzerhandbuch |

## ⚙️ Konfiguration

### Deine Ziele anpassen

Bearbeite `recipe_config.py`:

```python
DAILY_GOALS = {
    'calories': 2000,      # Dein tägliches Kalorienziel
    'protein': 55,         # Dein tägliches Proteinziel
    'fat': 70,
    'carbs': 250,
    # ... weitere Nährstoffe
}
```

Diese werden automatisch × 7 für wöchentlich berechnet.

### Zutaten erweitern

Auch in `recipe_config.py`:

```python
INGREDIENT_MAP = {
    'deine_zutat': 'BLS_Lebensmittelname',
    # z.B. 'spargel': 'Spargel roh'
}
```

## 📊 Ausgabe verstehen

### `recipe_final.csv` Spalten

**Original-Daten:**
- `recipe_name` - Rezeptname
- `recipe_url` - Link zum Original
- `rating` - Bewertung
- `time` - Zubereitungszeit
- `ingredient_count` - Zutaten

**Nährstoffwerte (pro Rezept):**
- `recipe_ENERCC_kcal` - Kalorien
- `recipe_PROT_g` - Protein (g)
- `recipe_FAT_g` - Fett (g)
- `recipe_CHO_g` - Kohlenhydrate (g)
- ... weitere Nährstoffe

**Wöchentliche Abdeckung (%):**
- `weekly_coverage_ENERCC_kcal_%` - % der Wochenziel-Kalorien
- `weekly_coverage_PROT_g_%` - % der Wochenziel-Protein
- ... weitere Nährstoffe

**Tägliche Äquivalente (%):**
- `daily_equiv_ENERCC_kcal_%` - % des Tagesziels
- `daily_equiv_PROT_g_%` - % des Tagesziels
- ... weitere Nährstoffe

**Zusammenfassung:**
- `avg_weekly_coverage_%` - Durchschnittliche wöchentliche Abdeckung
- `avg_daily_equiv_%` - Durchschnittliches tägliches Äquivalent
- `macros_avg_coverage_%` - Abdeckung der Makronährstoffe

## 💡 Anwendungsbeispiele

### Beispiel 1: Wochenplan erstellen
```
1. Öffne recipe_final.csv in Excel
2. Sortiere nach avg_weekly_coverage_% (absteigend)
3. Wähle 7 Rezepte aus und kombiniere sie
4. Sieh dir an, wo noch Nährstoffe fehlen
```

### Beispiel 2: Protein-fokussiert essen
```
1. Filter: weekly_coverage_PROT_g_% >= 20
2. Diese Rezepte liefern mindestens 20% deines Wochenziel-Proteins
3. Kombiniere mehrere für volle Abdeckung
```

### Beispiel 3: Schnelle Rezepte
```
1. Filter: time = "15 Min" oder "20 Min"
2. Sortiere nach avg_weekly_coverage_%
3. Beste schnelle Rezepte oben
```

## 🔧 Troubleshooting

| Problem | Lösung |
|---------|--------|
| "CSV nicht gefunden" | Stelle sicher, dass Dateien im gleichen Verzeichnis sind |
| "Keine Recipe-Daten" | Normal - nicht alle Rezepte haben Schema.org Daten (~70-80% haben es) |
| "Netzwerkfehler" | Erhöhe `REQUEST_TIMEOUT` und `RATE_LIMIT_DELAY` in `recipe_config.py` |
| "Blockiert von Cookidoo" | Erhöhe `RATE_LIMIT_DELAY` auf 1.0 oder 2.0 |
| "Zutaten nicht erkannt" | Erweitere `INGREDIENT_MAP` in `recipe_config.py` |

## 📈 Statistiken Verstehen

### Wöchentliche Abdeckung
- **100%** = Dieses Rezept alleine erfüllt das Wochenziel
- **50%** = Mit 2 solchen Rezepten erreichst du das Ziel
- **10%** = Mit 10 solchen Rezepten erreichst du das Ziel

### Tägliches Äquivalent
- **100%** = Dieses Rezept = ein kompletter Tag bei diesem Nährstoff
- **50%** = 2 Rezepte = ein kompletter Tag
- **20%** = 5 Rezepte = ein kompletter Tag

### Beispiel
Rezept hat `weekly_coverage_PROT_g_% = 30`:
- Wenn du dieses Rezept 1× pro Woche isst, deckst du 30% deines Wochenproteinziels
- Du brauchst ca. 3-4 verschiedene solche Rezepte für volle Proteinabdeckung

## 🎯 Häufige Fragen

**F: Warum haben manche Rezepte "0" bei Nährstoffen?**
A: Zutaten konnten nicht gemappt werden. Füge sie in `recipe_config.py` unter `INGREDIENT_MAP` hinzu.

**F: Wie lange dauert die Extraktion?**
A: 2-5 Minuten je nach Netzwerk und Rezeptanzahl.

**F: Kann ich die Ziele ändern?**
A: Ja! Bearbeite `DAILY_GOALS` in `recipe_config.py` und führe `recipe_weekly_analyzer.py` erneut aus.

**F: Funktioniert es mit anderen Rezeptseiten?**
A: Nur mit Cookidoo (wegen der speziellen CSV-Struktur), aber der Code kann leicht adaptiert werden.

**F: Wie genau sind die Nährstoffe?**
A: Sie basieren auf der BLS-Datenbank und dem Zutaten-Mapping. Genauigkeit hängt ab von:
- Korrektheit der Zutaten-Mengenangaben im Original-Rezept
- Qualität des Zutaten-Mapping
- Verfügbarkeit im BLS (99% haben alle Nährstoffe)

## 🔄 Workflow

```
Cookidoo CSV
    ↓
[recipe_schema_extraction.py]
    ↓
recipe_database.csv
    ↓
[recipe_weekly_analyzer.py]
    ↓
recipe_final.csv
    ↓
(Excel/Analyse)
```

## 📦 Abhängigkeiten

```bash
pip install pandas==1.5.3
pip install requests==2.31.0
pip install beautifulsoup4==4.12.2
pip install openpyxl==3.10.0
```

## 💻 System-Anforderungen

- Python 3.7+
- Internet-Verbindung (für Cookidoo-Zugriff)
- ~100MB Festplatte (für CSVs)
- 512MB RAM (minimal)

## 🚀 Performance-Tipps

1. **First-Run Caching**: Nach dem ersten Lauf werden gleiche URLs schneller verarbeitet
2. **Parallel Processing**: Könnte implementiert werden, aber würde Blockierung von Cookidoo riskieren
3. **Database Reuse**: `recipe_database.csv` kann wiederverwendet werden für `recipe_weekly_analyzer.py`

## 🔐 Datenschutz

- **Lokale Verarbeitung**: Alle Daten bleiben auf deinem Computer
- **Netzwerk**: Nur Requests zu Cookidoo.de (öffentliche Seiten)
- **Keine Tracking**: Diese Scripts tracken dich nicht

## 📝 Lizenz

Diese Scripts sind für den privaten Gebrauch bestimmt.
- Cookidoo ist ein Produkt der Thermomix-Community
- BLS-Daten sind vom Bundesministerium für Ernährung und Landwirtschaft

## 🤝 Support

Bei Fragen oder Problemen:
1. Lese `recipe_GUIDE.md` für detaillierte Dokumentation
2. Überprüfe `recipe_config.py` für Konfigurationsmöglichkeiten
3. Erhöhe `DEBUG = True` in `recipe_config.py` für mehr Ausgabe

---

**Viel Spaß beim Analysieren deiner Rezepte! 🍽️**
