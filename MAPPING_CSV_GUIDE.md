# CSV-Based Ingredient Mapping Guide

## Overview

Ingredient mappings are now managed through a simple CSV file instead of Python code. This makes it:
- ✅ Easy to view all mappings at a glance
- ✅ Easy to add/edit/delete without touching Python code
- ✅ Easy to track changes in version control
- ✅ Easy to batch import/export
- ✅ Less error-prone (no Python syntax issues)

## The CSV File

**File:** `ingredient_mappings.csv`

**Format:**
```
ingredient_name,bls_entry_name,category,notes
tortellini,Eierteigwaren Tortellini (Fleischfüllung) getrocknet,Grains & Flour,
chorizo,Chorizo,Proteins & Meat,High protein content
```

**Columns:**
- `ingredient_name` - The parsed ingredient name (lowercase)
- `bls_entry_name` - The exact BLS database entry name
- `category` - Category for organization (e.g., "Proteins & Meat")
- `notes` - Optional notes (e.g., "substitute for...", "frozen variant")

## Quick Start: Add a New Mapping

### Option 1: Using the Command (Easiest)

```bash
python add_mapping.py "ingredient_name" "BLS_Entry_Name" "Category"
```

**Example:**
```bash
python add_mapping.py "tortellini" "Eierteigwaren Tortellini (Fleischfüllung) getrocknet" "Grains & Flour"
```

**What happens:**
1. ✅ Validates BLS entry exists
2. ✅ Adds to ingredient_mappings.csv
3. ✅ Sorts alphabetically for consistency
4. ✅ Shows you the next step

### Option 2: Manual CSV Edit

Edit `ingredient_mappings.csv` directly in:
- Excel / Google Sheets
- Any text editor
- Your IDE

Just make sure:
- BLS entry names with commas are quoted: `"Vollmilch frisch, 3,5 % Fett, pasteurisiert"`
- One entry per line
- Save as CSV (UTF-8 encoding)

### Option 3: Batch Edit

Use `add_mapping.py --list` to see all current mappings, then:

```bash
# Open in spreadsheet
open ingredient_mappings.csv
# Make changes
# Save
# Done - changes are automatic
```

## Commands Reference

### List All Mappings

```bash
python add_mapping.py --list
```

**Output:**
```
All ingredient mappings (111 total):
--------
Ingredient           BLS Entry                              Category
--------
apfel                Apfel roh                              Specialty Items
aubergine            Aubergine roh                          Vegetables & Produce
...
```

### List by Category

```bash
python add_mapping.py --list "Proteins"
```

**Output:**
```
Mappings in category 'Proteins':
--------
Ingredient           BLS Entry                              Category
--------
fisch                Seelachs roh                           Proteins & Meat
hähnchen             Hähnchenschenkel gekocht               Proteins & Meat
...
```

### Show All Categories

```bash
python add_mapping.py --categories
```

**Output:**
```
Available categories:
  1. Dairy & Cheese (14 mappings)
  2. Fats & Oils (7 mappings)
  3. Grains & Flour (5 mappings)
  ... more
```

### Validate a Mapping

```bash
python validate_mapping.py "ingredient_name"
```

**Before adding** to make sure BLS entry exists:
```bash
python validate_mapping.py "tortellini"
```

Output:
```
✅ BLS entry EXISTS in database
   Nutrients (per 100g):
     • Energy (kcal): 369
     • Protein: 13.51
     • Fat: 7.01
✅ MAPPING IS VALID - ready to use!
```

### Recalculate After Changes

After adding/editing mappings:

```bash
# Recalculate with new mappings
python recipe_add_audit_trails.py

# Update weekly analysis
python recipe_weekly_analyzer.py

# Generate new meal plan
python optimization_meal_planner.py

# Check results
cat optimization_report.txt | grep -i "match"
```

## Complete Workflow

### Example: Add "Tortellini"

**Step 1: Find Unmatched**
```bash
python recipe_unmatched_analysis.py
# Check unmatched_ingredients.csv - find "tortellini" (28 recipes)
```

**Step 2: Find BLS Entry**
```bash
python validate_mapping.py "tortellini"
# Shows: ❌ NOT in ingredient_mapping_config.py
# Suggests: "Eierteigwaren Tortellini (Fleischfüllung) getrocknet"
```

**Step 3: Add Mapping**
```bash
python add_mapping.py "tortellini" "Eierteigwaren Tortellini (Fleischfüllung) getrocknet" "Grains & Flour"
# Output: ✓ Added new mapping

# Verify
python validate_mapping.py "tortellini"
# Output: ✅ FOUND and valid
```

**Step 4: Recalculate**
```bash
python recipe_add_audit_trails.py
# Console shows: Ingredient matching: X.X% (was Y.Y%)
```

**Step 5: Done**
- Tortellini is now matched in all recipes
- Nutrition calculations automatically updated
- Weekly meal plan reflects accurate data

## FAQ

**Q: Does the CSV get read automatically?**
A: Yes. `ingredient_mapping_config.py` loads from CSV at startup. Any changes are immediate.

**Q: Can I edit it in Excel/Sheets?**
A: Yes, but make sure to save as CSV and use UTF-8 encoding.

**Q: What if I have a comma in the BLS name?**
A: The CSV handles it - just enclose in quotes: `"Vollmilch frisch, 3,5 % Fett, pasteurisiert"`

**Q: How do I know if my mapping is correct?**
A: Run: `python validate_mapping.py "ingredient_name"` - it verifies BLS entry exists and shows nutrients.

**Q: Can I undo a change?**
A: Yes - use git: `git checkout ingredient_mappings.csv` or manually edit the CSV.

**Q: Do I need to restart anything?**
A: No. Changes are read fresh each time a script runs.

**Q: Can I bulk import mappings?**
A: Yes. Edit the CSV directly with all your new mappings, save, then:
```bash
python recipe_add_audit_trails.py
```

**Q: What if BLS entry name has quotes or special chars?**
A: The CSV parser handles it. If issues arise, use the command instead:
```bash
python add_mapping.py "ingredient" "entry with \"quotes\"" "category"
```

## File Organization

```
ingredient_mappings.csv
├─ Vegetables & Produce (27 mappings)
├─ Grains & Flour (5 mappings)
├─ Liquids & Beverages (6 mappings)
├─ Seasonings & Condiments (18 mappings)
├─ Fats & Oils (7 mappings)
├─ Proteins & Meat (6 mappings)
├─ Dairy & Cheese (14 mappings)
└─ Specialty Items (23 mappings)
```

**Tip:** Categories organize the CSV - use consistent naming!

## Current State

- **Total mappings:** 111
- **Format:** CSV (easy to edit)
- **Source:** `ingredient_mappings.csv`
- **Fallback:** Python hardcoded (if CSV missing)
- **Status:** Ready to add more

## Impact Tracking

After adding mappings, check:

```bash
# Before and after comparison
git diff ingredient_mappings.csv

# Check impact
python recipe_add_audit_trails.py | grep "Ingredient matching"
# Should show improvement
```

## Troubleshooting

### "Error tokenizing data"
- CSV has comma in unquoted field
- Fix: Ensure BLS entries with commas are quoted

### "BLS entry not found"
```bash
python validate_mapping.py "ingredient"
```
- Shows correct BLS entry name
- Make sure spelling matches exactly

### Mapping added but still showing as unmatched
```bash
# Ensure you recalculated
python recipe_add_audit_trails.py
```

### CSV formatting issues
```bash
# View current CSV in clean format
python add_mapping.py --list
```
- Shows all mappings correctly
- If parsing fails, use this to rebuild

## Next Steps

1. **Find high-impact unmapped ingredients:**
   ```bash
   python recipe_unmatched_analysis.py
   ```

2. **Add top 5 mappings:**
   ```bash
   python add_mapping.py "ingredient1" "BLS Entry 1" "Category"
   python add_mapping.py "ingredient2" "BLS Entry 2" "Category"
   # ... repeat
   ```

3. **Recalculate and measure:**
   ```bash
   python recipe_add_audit_trails.py
   ```

4. **Track progress:**
   - From 59.5% to higher match rate
   - Every 5-10 mappings should improve it by ~1-2%

---

**Key Advantage:** CSV makes mapping transparent and shareable. You can:
- ✅ View all mappings in Excel
- ✅ Sort/filter by category
- ✅ Share with team members
- ✅ Track changes with git
- ✅ Bulk add/edit/delete
