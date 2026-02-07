# Ingredient Mapping Workflow

## Overview

Currently achieving **59.4% ingredient match rate**. This guide shows exactly how to improve it.

## Critical: Single Source of Truth

**All ingredient mappings are now in ONE place:**
- `ingredient_mapping_config.py` - THE CENTRAL CONFIG FILE
- Imported by both `recipe_schema_extraction.py` and `recipe_add_audit_trails.py`
- Changes here automatically affect all calculations

**DO NOT edit** the manual_map dictionaries in the recipe scripts - edit `ingredient_mapping_config.py` instead.

## Complete Workflow

### Step 1: Find Unmatched Ingredients

```bash
python recipe_unmatched_analysis.py
```

Output files:
- `unmatched_ingredients.csv` - All 1,839 unique unmatched ingredients
- `weight_anomalies.csv` - Weight calculation issues

Check the CSV to find an ingredient you want to map:
```
parsed_name,frequency
knoblauchzehe,386
chorizo,45
skrei,32
...
```

### Step 2: Find the BLS Database Entry

Use the mapping strategy tool to suggest candidates:

```bash
python ingredient_mapping_strategy.py
```

Output files:
- `mapping_suggestions.csv` - Top candidates for each unmatched ingredient

Or manually search with the validation tool:

```bash
python validate_mapping.py "knoblauchzehe"
```

This will:
1. ✅ Check if already mapped (in ingredient_mapping_config.py)
2. ✅ Verify the BLS entry exists in the database
3. ✅ Show the nutrient data that will be used
4. ✅ Suggest similar BLS entries if needed

### Step 3: Add the Mapping

Edit `ingredient_mapping_config.py`:

```python
# Find the right category
'knoblauchzehe': 'Knoblauch roh',  # NEW MAPPING
```

**Key rules:**
- Use lowercase ingredient names
- Special characters are stripped automatically
- Look for exact matches in BLS database
- Group by category (Vegetables, Grains, etc.) for maintainability

### Step 4: Validate Before Running Full Pipeline

Test the mapping BEFORE re-running everything:

```bash
python validate_mapping.py "knoblauchzehe"
```

Expected output:
```
✅ FOUND in ingredient_mapping_config.py
✅ BLS entry EXISTS in database
   Nutrients (per 100g):
     • Energy (kcal): 142
     • Protein: 6.3
     • Fat: 0.5
     • Lactose: 0.0

✅ MAPPING IS VALID - ready to use!
```

### Step 5: Recalculate with New Mapping

Run the update pipeline:

```bash
# This uses the new mapping from ingredient_mapping_config.py
python recipe_add_audit_trails.py

# Update nutrition calculations
python recipe_weekly_analyzer.py

# Generate new meal plan
python optimization_meal_planner.py
```

Check for improvement:
- Before: 59.4% match rate
- After: Should increase (shows progress)

### Step 6: Verify Results

Check the report:

```bash
cat optimization_report.txt
```

Look for:
- Match rate improvement
- Unmatched ingredients count decreased
- New nutrients visible in selected recipes

## Example: Adding "Chorizo" Mapping

### Finding the ingredient
```bash
$ python recipe_unmatched_analysis.py | grep -i chorizo
chorizo,45
```

### Searching for BLS entry
```bash
$ python validate_mapping.py "chorizo"
❌ NOT in ingredient_mapping_config.py
   Searching BLS database for similar entries...
   ✅ Found 3 potential matches:
      • Chorizo
      • Chorizo, Rohwurst
      • Chorizo roh
```

### Adding to config
```python
# ingredient_mapping_config.py
'chorizo': 'Chorizo roh',
```

### Validating
```bash
$ python validate_mapping.py "chorizo"
✅ FOUND in ingredient_mapping_config.py
✅ BLS entry EXISTS in database
   Nutrients (per 100g):
     • Energy (kcal): 455
     • Protein: 25.1
     • Fat: 38.2
✅ MAPPING IS VALID - ready to use!
```

### Recalculating
```bash
python recipe_add_audit_trails.py    # Shows improved match rate
python recipe_weekly_analyzer.py
python optimization_meal_planner.py
```

## Troubleshooting

### Mapping doesn't work: "BLS entry NOT found"

**Problem:**
```
❌ BLS entry NOT found: 'Knoblauch frisch'
   Available BLS entries starting with 'Knobla':
     • Knoblauch roh
     • Knoblauch getrocknet
```

**Solution:**
- Use the exact BLS name: `'knoblauch': 'Knoblauch roh'`
- Check capitalization and spelling exactly

### Ingredient still not matching after adding mapping

**Problem:** Added mapping but ingredient still shows as unmatched

**Causes:**
1. Script was run before mapping was added (scripts cache data)
2. Ingredient name doesn't match the key exactly after cleaning
3. Need to re-run `recipe_add_audit_trails.py`

**Solution:**
```bash
# Always run this after adding a mapping
python recipe_add_audit_trails.py
```

### Can't find ingredient in BLS database

**Problem:**
```
❌ No similar entries found in BLS database
   This ingredient might not exist in the German Food Composition Database
```

**Solutions:**
1. Search for similar/substitute:
   - Specialty meats (Skrei) → use generic fish (Seelachs)
   - Ravioli → use pasta (Teigwaren)
   - Exotic herbs → use similar available herbs

2. Use parent category:
   - Unknown fish → "Seelachs roh" (generic white fish)
   - Unknown spice → closest BLS match

3. Check spelling - BLS uses German names:
   - "Zucchini" but also "Zucchetti" (Swiss German)
   - "Kartoffel" (potato)

## Impact Analysis

### Current State (59.4% match)
- 10,493 total ingredients
- 6,213 matched (59.4%)
- 4,280 unmatched (40.6%)

### Top 15 Most Impactful
Mapping these would have biggest effect:

| Rank | Ingredient | Count | Impact |
|------|-----------|-------|--------|
| 1 | chorizo | 45 | Generic to Chorizo roh |
| 2 | skrei | 32 | Generic to Seelachs roh |
| 3 | tortellini | 28 | Pasta variant |
| 4 | ravioli | 26 | Pasta variant |
| 5-15 | ... | varied | Various vegetables/meats |

**Result of mapping top 15:** Estimated 65-70% match rate

**Result of mapping top 50:** Estimated 75-85% match rate

## Files Reference

| File | Purpose |
|------|---------|
| `ingredient_mapping_config.py` | ✅ **Central config - edit this!** |
| `validate_mapping.py` | Test if a mapping works before running pipeline |
| `ingredient_mapping_strategy.py` | Find BLS candidates for unmatched ingredients |
| `recipe_add_audit_trails.py` | Imports config and recalculates everything |
| `recipe_schema_extraction.py` | Imports config (used for new recipe scraping) |
| `unmatched_ingredients.csv` | Output showing what's still unmatched |
| `mapping_suggestions.csv` | Output with BLS candidates |

## Quick Reference: Add New Mapping

```bash
# 1. Find ingredient
python recipe_unmatched_analysis.py | head -20

# 2. Test if mapping works
python validate_mapping.py "ingredient_name"

# 3. Edit if OK
# → Open ingredient_mapping_config.py
# → Add: 'ingredient_name': 'BLS Entry Name',

# 4. Recalculate
python recipe_add_audit_trails.py
python recipe_weekly_analyzer.py
python optimization_meal_planner.py

# 5. Check result
cat optimization_report.txt | grep -i "match rate\|lactose"
```

## Data Flow

```
User adds mapping to ingredient_mapping_config.py
           ↓
   recipe_add_audit_trails.py imports it
           ↓
   Ingredient parsed with new mapping
           ↓
   BLS data included in calculation
           ↓
   recipe_database.csv updated
           ↓
   recipe_final.csv updated
           ↓
   optimization_meal_planner.py uses real data
           ↓
   optimization_report.txt shows improvement
```

**Key point:** All changes flow automatically through the pipeline once you update `ingredient_mapping_config.py`.

## Validation Checklist

Before committing a new mapping, verify:

- [ ] Mapping is in `ingredient_mapping_config.py`
- [ ] `python validate_mapping.py "ingredient"` shows ✅ VALID
- [ ] BLS entry exists (not showing ❌ NOT found)
- [ ] Nutrient data looks reasonable
- [ ] `python recipe_add_audit_trails.py` completes successfully
- [ ] Match rate in console output increased
- [ ] `optimization_report.txt` shows fewer unmatched ingredients
- [ ] Test recipe using that ingredient shows correct nutrients

## Next: Build Your Mappings

1. Run: `python ingredient_mapping_strategy.py`
2. Review: `mapping_suggestions.csv`
3. For each priority ingredient:
   - Run: `python validate_mapping.py "ingredient"`
   - Add to: `ingredient_mapping_config.py`
   - Run: `python recipe_add_audit_trails.py`
4. Track progress toward 75%+ match rate
