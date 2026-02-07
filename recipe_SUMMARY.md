# 🎯 Rezept-Analyse Pipeline - Zusammenfassung

## ✅ Was wurde erstellt

Eine vollständige Python-Pipeline zur automatischen Analyse von Nährstoffen aus deiner Cookidoo-Rezeptliste, verglichen mit deinen persönlichen wöchentlichen Diät-Zielen.

## 📦 Erstellte Dateien

### Haupt-Scripts (mit `recipe_` Präfix)

#### 1. **recipe_schema_extraction.py** (Extraktion)
- **Zweck:** Extrahiert Rezeptdaten von Cookidoo-Links
- **Input:** `Lebensmittel - Cookidoo Export - Rezepte.csv`
- **Output:** `recipe_database.csv`
- **Laufzeit:** 2-5 Minuten
- **Was es tut:**
  - Ruft jeden Cookidoo-Link auf
  - Extrahiert JSON-LD Schema.org Recipe-Daten
  - Parst Zutaten und Mengen
  - Matched Zutaten mit BLS-Nährstoffdatenbank
  - Berechnet Gesamtnährstoffe pro Rezept

#### 2. **recipe_weekly_analyzer.py** (Analyse)
- **Zweck:** Analysiert Nährstoffe gegen wöchentliche Diät-Ziele
- **Input:** `recipe_database.csv`
- **Output:** `recipe_final.csv`
- **Laufzeit:** < 1 Sekunde
- **Was es tut:**
  - Lädt wöchentliche Diät-Ziele aus `recipe_config.py`
  - Berechnet prozentuale Abdeckung pro Nährstoff
  - Erstellt tägliche Äquivalente
  - Generiert Zusammenfassungs-Statistiken
  - Speichert finale CSV mit allen Daten

#### 3. **recipe_process_all.py** (Orchestrierung)
- **Zweck:** Führt beide Scripts nacheinander aus
- **Input:** Beide erforderliche Input-Dateien
- **Output:** Beide Output-CSVs + Statistiken
- **Features:**
  - Prüft erforderliche Dateien
  - Zeigt Fortschritt
  - Fasst Ergebnisse zusammen
  - Fehlerbehandlung

#### 4. **recipe_config.py** (Konfiguration)
- **Zweck:** Zentrale Konfigurationsdatei
- **Bearbeitbar:** ✅ JA
- **Enthält:**
  - `DAILY_GOALS` - Deine persönlichen Diät-Ziele (HIER BEARBEITEN!)
  - `INGREDIENT_MAP` - Zutatenmapping (erweiterbar)
  - `RATE_LIMIT_DELAY` - Netzwerk-Einstellungen
  - `WEIGHT_DEFAULTS` - Gewichtsdefaults
  - Beispiele für verschiedene Diät-Typen (Low Carb, High Protein, Vegan)

### Dokumentation (mit `recipe_` Präfix)

#### 5. **recipe_README.md**
- Schnellstart-Guide
- Übersichts-Erklärung
- Anwendungsbeispiele
- Troubleshooting
- FAQ

#### 6. **recipe_GUIDE.md**
- Detailliertes Benutzerhandbuch
- Vollständige API-Dokumentation
- Fehlerbehandlung
- Technische Details
- Erweiterungsmöglichkeiten

#### 7. **recipe_SUMMARY.md** (Diese Datei)
- Überblick über alle Dateien
- Schritt-für-Schritt Anleitung
- Datenfluss-Erklärung

## 🚀 Schritt-für-Schritt Anleitung

### Schritt 1: Installation
```bash
# Installiere Python-Abhängigkeiten
pip install pandas requests beautifulsoup4 openpyxl
```

### Schritt 2: Konfiguration (WICHTIG!)
```bash
# Bearbeite recipe_config.py mit deinem Editor
# Passe DAILY_GOALS an deine Ziele an!
nano recipe_config.py
# oder in deinem Editor öffnen
```

Beispiel-Anpassung:
```python
DAILY_GOALS = {
    'calories': 2000,      # ← Ändere dein Kalorienziel hier
    'protein': 55,         # ← Dein Proteinziel
    'fat': 70,             # ← Dein Fettziel
    # ... weitere Nährstoffe
}
```

### Schritt 3: Ausführung
```bash
# Option A: Alles auf einmal (empfohlen)
python recipe_process_all.py

# Option B: Einzeln (falls du debuggen möchtest)
python recipe_schema_extraction.py     # Extraktion
python recipe_weekly_analyzer.py       # Analyse
```

### Schritt 4: Ergebnisse verwenden
```bash
# Ergebnis-Dateien
recipe_database.csv     # Zwischenergebnis (Rezepte + Nährstoffe)
recipe_final.csv        # FINALE DATEI (mit wöchentlicher Abdeckung)

# Öffne recipe_final.csv in Excel oder Google Sheets
```

## 📊 Datenfluss

```
START
  ↓
┌─────────────────────────────────────────────┐
│ Input-Dateien vorhanden?                    │
│ - Lebensmittel - Cookidoo Export...         │
│ - BLS_4_0_Daten_2025_DE.csv                 │
└─────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────┐
│ recipe_schema_extraction.py                 │
│ • Ruft Cookidoo-Links auf                   │
│ • Extrahiert Schema.org Rezeptdaten         │
│ • Matched Zutaten → BLS                     │
│ • Berechnet Nährstoffe pro Rezept           │
└─────────────────────────────────────────────┘
  ↓
  → recipe_database.csv
  ↓
┌─────────────────────────────────────────────┐
│ recipe_weekly_analyzer.py                   │
│ • Lädt recipe_config.py Ziele               │
│ • Berechnet wöchentliche Abdeckung          │
│ • Erstellt Tages-Äquivalente                │
│ • Generiert Statistiken                     │
└─────────────────────────────────────────────┘
  ↓
  → recipe_final.csv
  ↓
┌─────────────────────────────────────────────┐
│ ERGEBNIS                                    │
│ Öffne recipe_final.csv in Excel/Sheets      │
│ Analysiere deine Rezepte gegen Ziele        │
└─────────────────────────────────────────────┘
  ↓
ENDE
```

## 🎯 Was du mit den Ergebnissen machen kannst

### Beispiel 1: Wochenplan erstellen
```
1. Öffne recipe_final.csv
2. Sortiere nach avg_weekly_coverage_% (absteigend)
3. Nimm die Top-Rezepte
4. Kombiniere sie zu einem ausgewogenen Wochenplan
```

### Beispiel 2: Nährstofflücken finden
```
1. Filtere nach: weekly_coverage_VITC_mg_% < 50
2. Diese Rezepte liefern weniger als 50% Vitamin C
3. Kombiniere mit hochdosierter Vitamin-C-Quelle
```

### Beispiel 3: Schnelle & gesunde Rezepte
```
1. Filtere: time = "15 Min" oder "20 Min"
2. Sortiere nach: avg_weekly_coverage_%
3. Top 5-10 Rezepte = schnell & nährstoffreich
```

### Beispiel 4: Protein-fokussierte Diät
```
1. Ändere in recipe_config.py: 'protein': 120 (statt 55)
2. Führe recipe_weekly_analyzer.py erneut aus
3. Sortiere nach weekly_coverage_PROT_g_%
4. Top Rezepte sind jetzt proteinreich
```

## 📈 Output-Spalten verstehen

### Aus `recipe_final.csv`

| Spalte | Bedeutung | Beispiel |
|--------|-----------|----------|
| `recipe_name` | Rezeptname | "Pasta Carbonara" |
| `weekly_coverage_ENERCC_kcal_%` | % der Wochenziel-Kalorien | 45.2 |
| `daily_equiv_ENERCC_kcal_%` | % des Tagesziels | 6.5 |
| `avg_weekly_coverage_%` | Ø Abdeckung aller Nährstoffe | 52.3 |

### Interpretation

**weekly_coverage = 50%**
- Wenn du dieses Rezept 1× pro Woche isst
- Deckst du 50% des Nährstoff-Wochenziels
- Du brauchst ~2 solche Rezepte

**daily_equiv = 100%**
- Dieses Rezept = 1 ganzer Tag bei diesem Nährstoff
- Du brauchst keine weiteren Quellen diesen Tag

## 🔧 Anpassungen nach dem ersten Lauf

### Ziele ändern
```python
# In recipe_config.py
DAILY_GOALS = {
    'calories': 2500,      # ← Geändert!
    'protein': 120,        # ← Geändert!
    # ... rest
}

# Dann erneut ausführen:
python recipe_weekly_analyzer.py
```

### Zutaten erweitern
```python
# In recipe_config.py
INGREDIENT_MAP = {
    # ... existierende
    'spargel': 'Spargel roh',    # ← Neu hinzugefügt
}

# Dann erneut ausführen:
python recipe_schema_extraction.py
```

### Netzwerk-Probleme beheben
```python
# In recipe_config.py
RATE_LIMIT_DELAY = 2.0      # Erhöhe von 0.5 auf 2.0
REQUEST_TIMEOUT = 20        # Erhöhe von 10 auf 20
```

## ⚡ Performance

| Operation | Dauer | Abhängig von |
|-----------|-------|--------------|
| Schema-Extraktion | 2-5 Min | Anzahl Rezepte, Netzwerk |
| Wöchentliche Analyse | < 1 Sek | CPU-Power |
| Gesamt (erster Lauf) | 2-5 Min | Hauptsächlich Netzwerk |

## 📚 Dokumentation Navigation

```
recipe_README.md    ← START HIER für Überblick
    ↓
recipe_GUIDE.md     ← Detaillierte Dokumentation
    ↓
recipe_config.py    ← Konfiguration bearbeiten
    ↓
recipe_SUMMARY.md   ← Diese Datei (Überblick)
```

## 🆘 Häufige Probleme

| Problem | Lösung |
|---------|--------|
| `FileNotFoundError` | Stelle sicher, dass Input-CSVs im gleichen Verzeichnis sind |
| "Keine Recipe-Daten" | Normal! (~20-30% der Rezepte haben keine Schema.org Daten) |
| "Netzwerkfehler" | Erhöhe `REQUEST_TIMEOUT` in `recipe_config.py` |
| "Blockiert von Cookidoo" | Erhöhe `RATE_LIMIT_DELAY` auf 1.0 oder 2.0 |
| Zutaten nicht erkannt | Füge sie in `INGREDIENT_MAP` in `recipe_config.py` hinzu |

## 📋 Checklist zum Start

- [ ] Python 3.7+ installiert
- [ ] Abhängigkeiten installiert: `pip install pandas requests beautifulsoup4 openpyxl`
- [ ] `Lebensmittel - Cookidoo Export - Rezepte.csv` vorhanden
- [ ] `BLS_4_0_Daten_2025_DE.csv` vorhanden
- [ ] `recipe_config.py` mit deinen Zielen angepasst
- [ ] `recipe_process_all.py` ausgeführt
- [ ] `recipe_final.csv` in Excel/Sheets geöffnet
- [ ] Deine Rezepte analysiert! 🎉

## 🎓 Lernpfad

1. **Anfänger:** Führe `recipe_process_all.py` aus, öffne `recipe_final.csv` in Excel
2. **Fortgeschrittener:** Passe `recipe_config.py` an deine Ziele an, führe erneut aus
3. **Profi:** Erweitere `INGREDIENT_MAP`, passe Gewichtslogik an, modifiziere Scripts

## 📞 Weitere Hilfe

- **Allgemeine Fragen?** → Lese `recipe_README.md`
- **Technische Fragen?** → Lese `recipe_GUIDE.md`
- **Konfiguration?** → Bearbeite `recipe_config.py`
- **Python-Fehler?** → Überprüfe Input-Dateien und Abhängigkeiten

## 🎉 Erfolgs-Geschichten

Nach dem ersten Lauf kannst du:
- ✅ Wochenpläne basierend auf Nährstoffen erstellen
- ✅ Rezepte nach Diät-Typ filtern (Protein, Kalorien, etc.)
- ✅ Nährstofflücken erkennen
- ✅ Deine Ziele gegen Rezepte tracken
- ✅ Neue Rezepte bewerten basierend auf Nährstoffen

---

**Viel Erfolg bei der Analyse deiner Rezepte! 🍽️📊**

Nächster Schritt: Führe `python recipe_process_all.py` aus!
