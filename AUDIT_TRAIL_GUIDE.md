# Recipe Audit Trail & Ingredient Matching Guide

## Overview

To verify accuracy and understand exactly what went into your nutrition calculations, the recipe extraction system now captures **detailed ingredient-level audit trails**. This lets you see:

- Which ingredients were successfully matched to the BLS database
- Which ingredients couldn't be found (and were skipped)
- The exact weight assumptions used for each ingredient
- Which nutrients came from which ingredients

## New Data Columns in `recipe_database.csv`

### Quick Reference Columns

Added to every recipe in the database:

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `ingredients_matched` | Integer | Number of ingredients found in BLS | `8` |
| `ingredients_skipped` | Integer | Number of ingredients NOT found | `2` |
| `match_rate_%` | Float | Percentage of ingredients found | `80.0` |
| `ingredient_audit_trail` | JSON | Detailed per-ingredient audit data | (see below) |

**Quick Lookup**: Use `match_rate_%` column to quickly identify recipes with uncertain ingredient data.

### Detailed Audit Trail (`ingredient_audit_trail` JSON)

Each recipe stores a complete audit trail as JSON. It contains an array of ingredient objects:

```json
[
  {
    "original": "2 Äpfel",
    "parsed_name": "apfel",
    "quantity": 2.0,
    "quantity_str": "2",
    "matched": true,
    "bls_name": "Apfel roh",
    "weight_g": 360.0,
    "nutrient_contribution": {
      "ENERCC Energie (Kilokalorien) [kcal/100g]": 194.4,
      "CHO Kohlenhydrate, verfügbar [g/100g]": 87.48
    }
  },
  {
    "original": "1 Prise Himalaya-Salz",
    "parsed_name": "Himalaya-Salz",
    "quantity": 1.0,
    "quantity_str": "1",
    "matched": false,
    "bls_name": null,
    "weight_g": null,
    "nutrient_contribution": {}
  }
]
```

### Audit Trail Field Definitions

- **`original`** - Exact text from the recipe's ingredient list
- **`parsed_name`** - How the ingredient was parsed (after unit removal)
- **`quantity`** - Numeric quantity extracted
- **`quantity_str`** - Original quantity string (with units)
- **`matched`** - Boolean: true if found in BLS database
- **`bls_name`** - The BLS food name it matched to (or null if no match)
- **`weight_g`** - Weight assumption used for calculation (in grams)
- **`nutrient_contribution`** - Calculated nutrient values for this ingredient

## Using the Audit Inspector Tool

After running `recipe_schema_extraction.py`, use the interactive inspector:

```bash
python recipe_audit_inspector.py
```

### Features

**Overview Statistics**
- Overall ingredient matching rate across all 876 recipes
- Distribution of match quality (perfect/excellent/good/fair/poor)
- Quick metrics: total ingredients, matched, skipped

**Interactive Recipe Inspection**
```
Command: recipe 5
```
Shows complete details for recipe #5:
- All ingredients with match status
- BLS matches for successful ingredients
- Weight assumptions
- Nutrient contributions

**Find Low-Accuracy Recipes**
```
Command: 2
```
Lists all recipes with <70% ingredient match rate (sorted by accuracy).

**View All Recipes**
```
Command: 3
```
Summary table of all 876 recipes with match rates.

## Understanding Match Rates

### Perfect (100%)
All ingredients found in BLS database. Nutrition values are highly reliable.

### Excellent (90-99%)
Most ingredients found. One or two items skipped (usually exotic/brand-specific items).

### Good (70-89%)
Most ingredients found. Maybe 1-3 items missing. Nutrition reasonably accurate.

### Fair (50-69%)
Significant missing data. Use results cautiously.

### Poor (<50%)
More than half ingredients couldn't be matched. Results are estimates only.

## Why Ingredients Don't Match

Common reasons for `matched: false`:

1. **Brand/variant specificity** - "Himalaya-Salz" vs "Speisesalz" in database
2. **Spelling variations** - "joghurt" vs "yogurt"
3. **Very rare ingredients** - Specialty items not in BLS database
4. **Ambiguous parsing** - Can't extract ingredient name cleanly
5. **Typos in source** - Original recipe data has typos

## Quality Assurance Workflow

### Step 1: Check Overall Accuracy
```bash
python recipe_audit_inspector.py
# Look at statistics - is overall match rate >80%?
```

### Step 2: Identify Problem Recipes
```bash
Command: 2
# Find recipes with <70% match rate
```

### Step 3: Inspect Details
```bash
Command: recipe 42
# See exactly what matched and what didn't
```

### Step 4: Make Manual Adjustments (if needed)
If you find systematic mismatches, update the manual mapping in `recipe_schema_extraction.py`:

```python
manual_map = {
    'himalaya-salz': 'Speisesalz',  # Add new mapping
    # ... other mappings
}
```

Then re-run the extraction:
```bash
python recipe_schema_extraction.py
```

## Data Accuracy Notes

### When using author-provided nutrition
Even if ingredient matching is imperfect, **author-provided nutrition data from schema.org is preferred** and used in calculations. This is the nutrition value the recipe creator specified.

See `recipe_weekly_analyzer.py` for how nutrition data sources are prioritized:
1. Author-provided per-serving values (schema.org)
2. Fallback: Calculated from BLS database

### Improving Accuracy

The system stores **full schema.org JSON** for every recipe, so:
- ✅ Can improve parsing logic without re-scraping
- ✅ Can manually adjust weight assumptions
- ✅ Can review original recipe creator's data

## Integration with Meal Planning

When `optimization_meal_planner.py` selects recipes, it uses nutrition data that comes from this audit trail:

1. Recipe is selected
2. Nutrients are retrieved (author data preferred, BLS fallback)
3. Scaled by household size and meal count
4. Added to weekly totals

The `match_rate_%` serves as a **confidence indicator**: recipes with 100% match rate have highest confidence in their calculated nutrition values.

## Accessing Raw Audit Data in Code

To programmatically access ingredient audit trails:

```python
import pandas as pd
import json

df = pd.read_csv('recipe_database.csv')

# Get audit trail for recipe 5
recipe = df.iloc[5]
audit_trail = json.loads(recipe['ingredient_audit_trail'])

# Check first ingredient
first_ingredient = audit_trail[0]
print(f"Original: {first_ingredient['original']}")
print(f"Matched: {first_ingredient['matched']}")
print(f"BLS Name: {first_ingredient['bls_name']}")
print(f"Weight: {first_ingredient['weight_g']}")
```

## Troubleshooting

**Q: Why does my recipe show 0% match rate?**
A: Ingredient parsing failed, or all ingredient names were ambiguous. Check the `original` field in the audit trail to see the raw ingredient text.

**Q: Can I edit the audit trail?**
A: The audit trail is generated fresh each time you run `recipe_schema_extraction.py`. To change results, update the manual mappings and re-run.

**Q: What if an ingredient genuinely isn't in BLS?**
A: That's OK! The system has two fallbacks:
1. Uses author-provided nutrition (if available)
2. Estimates based on similar foods

**Q: How do I know if nutrition calculations are trustworthy?**
A: Check these in order:
1. Use `match_rate_%` to see ingredient data quality
2. Check if author nutrition exists (in `recipe_database.csv` column `author_ENERCC_kcal`)
3. Compare author vs calculated values (should be similar)

---

**Last Updated**: 2026-01-28
**Version**: 1.0 - Initial audit trail implementation
