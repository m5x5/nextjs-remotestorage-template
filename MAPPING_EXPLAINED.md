# How Ingredient Mapping Works: Complete Explanation

## The Problem You Identified

> "I don't know what it will update if it will be then used in the calculation. And also if I find something in the database I can't just add it to the ingredient that hasn't got a clear mapping."

This is now solved. Here's exactly what happens:

## The Solution: Centralized Configuration

### 1. Single Source of Truth

**File:** `ingredient_mapping_config.py`

This is **THE ONLY PLACE** where mappings live. All scripts import from here:
- `recipe_schema_extraction.py` imports it
- `recipe_add_audit_trails.py` imports it
- `validate_mapping.py` uses it

**No duplication. No confusion.**

### 2. How It Works: Step-by-Step

```
Your edit:
  ingredient_mapping_config.py
  ↓
  (both scripts import MANUAL_INGREDIENT_MAP)
  ↓
  recipe_add_audit_trails.py
  ↓
  Uses new mapping to parse ingredients
  ↓
  recipe_database.csv updated
  ↓
  Match rate increases
  ↓
  Weekly calculations updated
```

**Every change automatically flows through the entire pipeline.**

## Complete Workflow: From Unmatched Ingredient to Result

### Step 1: Find What Needs Mapping

```bash
python recipe_unmatched_analysis.py
```

**Output:** `unmatched_ingredients.csv` with all 1,839 unmatched ingredients

Find one you want to map (e.g., "chorizo" appears 45 times)

### Step 2: Find It in BLS Database

```bash
python validate_mapping.py "chorizo"
```

**What happens:**
1. ✅ Checks if already in `ingredient_mapping_config.py`
2. ✅ Searches BLS database for matches
3. ✅ Shows nutrient data
4. ✅ Tells you exactly what to add

**Example output:**
```
❌ NOT in ingredient_mapping_config.py
   Needs to be added!

   ✅ Found 3 potential matches:
      • Chorizo
      • Chorizo, Rohwurst
      • Chorizo roh

   To add this mapping, edit ingredient_mapping_config.py:
   'chorizo': 'Chorizo roh',
```

### Step 3: Add to Central Config

Edit `ingredient_mapping_config.py`:

```python
MANUAL_INGREDIENT_MAP = {
    # ... existing mappings ...

    # NEW: Add this
    'chorizo': 'Chorizo roh',
}
```

That's it. No need to edit multiple files.

### Step 4: Verify It Works

Test before running full pipeline:

```bash
python validate_mapping.py "chorizo"
```

**Expected output:**
```
✅ FOUND in ingredient_mapping_config.py
✅ BLS entry EXISTS in database
   Nutrients (per 100g):
     • Energy (kcal): 455
     • Protein: 25.1
     • Fat: 38.2
✅ MAPPING IS VALID - ready to use!
```

**If it fails, you'll know immediately** instead of discovering it after running a long pipeline.

### Step 5: Recalculate Everything

```bash
python recipe_add_audit_trails.py
python recipe_weekly_analyzer.py
python optimization_meal_planner.py
```

**What actually happens:**
1. `recipe_add_audit_trails.py` imports your new mapping from `ingredient_mapping_config.py`
2. Re-parses all recipes with the new mapping
3. Updates `recipe_database.csv` with better match rate
4. All downstream files automatically use the new data

### Step 6: Verify Results

Check console output:
```
Ingredient matching: 60.0% (was 59.4%)
  Total matched: 3,820 (was 3,812)
```

Or check the report:
```bash
cat optimization_report.txt | grep -i "lactose\|match"
```

## Data Flow Diagram

```
You edit ingredient_mapping_config.py
         ↓
    ┌────┴────┐
    ↓         ↓
recipe_schema_extraction.py    recipe_add_audit_trails.py
(for new recipes)              (updates existing recipes)
    ↓                                  ↓
    └────────────┬────────────────────┘
                 ↓
          recipe_database.csv
          (with audit trails)
                 ↓
          recipe_weekly_analyzer.py
                 ↓
          recipe_final.csv
                 ↓
          optimization_meal_planner.py
                 ↓
         optimization_report.txt
```

**Key point:** Any change to `ingredient_mapping_config.py` flows through the entire pipeline automatically.

## Multiple Ways to Use It

### Method 1: Quick Add (What You Want)

```bash
# 1. Find ingredient
python recipe_unmatched_analysis.py

# 2. Look it up
python validate_mapping.py "ingredient_name"

# 3. Edit ingredient_mapping_config.py
#    Add: 'ingredient_name': 'BLS Entry Name',

# 4. Recalculate
python recipe_add_audit_trails.py
```

**Result:** That ingredient is now matched in all recipes. Done.

### Method 2: Batch Find & Map (For many ingredients)

```bash
# Get suggestions for all unmatched ingredients
python ingredient_mapping_strategy.py
```

**Output:** `mapping_suggestions.csv` with candidates for each

Then add them all to `ingredient_mapping_config.py` at once.

### Method 3: Full Reprocess (Clean slate)

```bash
# Start fresh with all new mappings
python recipe_schema_extraction.py  # Scrapes recipes again (slow)
python recipe_calculate_lactose.py  # Recalculates lactose
python recipe_weekly_analyzer.py    # Weekly analysis
python optimization_meal_planner.py # New meal plan
```

## File Reference: What Each Does

| File | Purpose | Imports From |
|------|---------|---|
| `ingredient_mapping_config.py` | ✅ **Central config** - Edit this | - |
| `recipe_add_audit_trails.py` | Recalculates recipes | `ingredient_mapping_config.py` |
| `recipe_schema_extraction.py` | Scrapes new recipes | `ingredient_mapping_config.py` |
| `validate_mapping.py` | Tests a mapping | `ingredient_mapping_config.py` |
| `recipe_unmatched_analysis.py` | Finds unmapped ingredients | - |
| `ingredient_mapping_strategy.py` | Suggests BLS candidates | - |

## Verification Checklist

Before considering mapping complete:

```
☐ Edit ingredient_mapping_config.py
☐ Run: python validate_mapping.py "ingredient"
☐ See ✅ MAPPING IS VALID
☐ Run: python recipe_add_audit_trails.py
☐ See match rate increased
☐ Check optimization_report.txt
☐ Unmatched count decreased
```

## Example: Complete Journey

### Start
- Match rate: 59.4%
- Top unmatched: chorizo (45), skrei (32), ravioli (26)

### Step 1 - Search
```bash
$ python validate_mapping.py "chorizo"
❌ NOT in ingredient_mapping_config.py
   ✅ Found 3 potential matches:
      • Chorizo
      • Chorizo, Rohwurst
      • Chorizo roh
```

### Step 2 - Add
Edit `ingredient_mapping_config.py`:
```python
'chorizo': 'Chorizo roh',
'skrei': 'Seelachs roh',      # Use generic fish
'ravioli': 'Teigwaren Hartweizen ohne Ei trocken',  # Use pasta
```

### Step 3 - Validate
```bash
$ python validate_mapping.py "chorizo"
✅ FOUND in ingredient_mapping_config.py
✅ BLS entry EXISTS in database
✅ MAPPING IS VALID - ready to use!
```

### Step 4 - Recalculate
```bash
$ python recipe_add_audit_trails.py
...
Ingredient matching: 60.1%
  Total matched: 3,826 (was 3,812)
```

### Result
- Match rate: 59.4% → 60.1% ✅
- 3 frequently-used ingredients now mapped
- Recipe nutritional accuracy improved

## Common Pitfalls Avoided

### ❌ Before: You'd have to...
- Edit both `recipe_schema_extraction.py` AND `recipe_add_audit_trails.py`
- Hope you didn't miss one
- Remember which BLS name was which
- Run everything without knowing if mapping was correct

### ✅ Now: You...
- Edit ONE file: `ingredient_mapping_config.py`
- Validate BEFORE running: `python validate_mapping.py`
- See exact results: match rate improves
- Know it's being used: entire pipeline depends on it

## FAQ

**Q: Will my mapping be used?**
A: 100% - Both scripts import from `ingredient_mapping_config.py`. No way it can be missed.

**Q: Do I need to edit multiple files?**
A: No. Edit `ingredient_mapping_config.py` only.

**Q: How do I know if my mapping works?**
A: Run `python validate_mapping.py "ingredient"` - it tells you immediately.

**Q: What if the BLS name is wrong?**
A: `validate_mapping.py` will tell you ❌ before you spend time recalculating everything.

**Q: Do I need to re-scrape all recipes?**
A: No. Just run `python recipe_add_audit_trails.py` - it uses cached schema.org data.

**Q: How long does recalculation take?**
A: `recipe_add_audit_trails.py` usually ~1 minute for all 876 recipes.

## Next: Try It

```bash
# Find an unmatched ingredient
python recipe_unmatched_analysis.py | head -20

# Pick one and test it
python validate_mapping.py "ingredient_name"

# Look for BLS candidates
# Edit ingredient_mapping_config.py

# Validate your edit works
python validate_mapping.py "ingredient_name"

# Recalculate
python recipe_add_audit_trails.py

# See the improvement!
cat optimization_report.txt | grep -i "match"
```

---

**Key Takeaway:** You edit `ingredient_mapping_config.py`, validate with `validate_mapping.py`, and the rest happens automatically. No confusion, no surprises.
