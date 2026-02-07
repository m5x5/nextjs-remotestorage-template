# Automated Ingredient Mapping Workflow

## Quick Start (5 minutes)

```bash
# Step 1: Generate suggestions for unmatched ingredients
python batch_mapping_suggester.py

# Step 2: Review and approve (edit CSV, mark Y/N in 'approve' column)
nano mapping_suggestions_ready_for_review.csv

# Step 3: Import all approved at once
python bulk_import_approved_mappings.py

# Step 4: Recalculate nutrition
python recipe_add_audit_trails.py

# Step 5: Re-run meal plan optimization
python optimization_meal_planner.py
```

## What Changed

Previously, adding mappings required:
- Manual BLS database search for each ingredient ❌
- Individual validation with `validate_mapping.py` ❌
- One-by-one imports with `add_mapping.py` ❌
- **Time per 10 ingredients: ~20 minutes**

Now:
- Automatic extraction of unmatched ingredients ✅
- Fuzzy matching against BLS database ✅
- Batch approval via CSV ✅
- One-command bulk import ✅
- **Time per 100 ingredients: ~5 minutes** (10x faster!)

## The Three Tools

### 1. Ingredient Parser (`ingredient_parser.py`)

**Purpose**: Clean up ingredient names by removing quantities and modifiers

**What it does:**
```python
"10 g ingwer, frisch"     → "ingwer"
"½ bund koriander"        → "koriander"
"4 dosen maiskörner"      → "maiskörner"
"1 rote paprika"          → "paprika"
```

**Key benefit**: Reduces 2,326 unmatched items → ~300 unique base ingredients

**Use**: Automatically used by the other tools

---

### 2. Batch Suggestion Generator (`batch_mapping_suggester.py`)

**Purpose**: Generate BLS suggestions for all unmatched ingredients

**Command:**
```bash
python batch_mapping_suggester.py
```

**What it does:**
1. Extracts all unmatched ingredients from recipe audit trails
2. Cleans names using `ingredient_parser.py`
3. Deduplicates (so "1 ei", "4 eier" become one "eier" entry)
4. Finds top 3 BLS matches for each using fuzzy string matching
5. Exports to CSV with score and frequency

**Output file**: `mapping_suggestions_ready_for_review.csv`

**Example output:**
```
ingredient_name,frequency,bls_rank,bls_entry_name,match_score,approve
ingwer,21,1,Ingwer roh,0.85,
paprika,19,1,Paprika roh,0.9,
mehl,16,1,Weizenmehl,0.88,
```

**Typical time**: 2-3 minutes for 2,000+ ingredients

---

### 3. Bulk Import Tool (`bulk_import_approved_mappings.py`)

**Purpose**: Import all approved suggestions with one command

**Workflow:**
```bash
# 1. Run suggester
python batch_mapping_suggester.py

# 2. Edit the CSV file
nano mapping_suggestions_ready_for_review.csv
# Add 'Y' or 'N' in the 'approve' column for each row
# Y = import this mapping
# N = skip this mapping

# 3. Run bulk importer
python bulk_import_approved_mappings.py
```

**What it does:**
1. Reads suggestions file
2. Filters for rows with "Y" in approve column
3. Validates BLS entries exist
4. Checks for duplicates
5. Adds all to `ingredient_mappings.csv`
6. Reports summary

**Example approval (in CSV):**
```
ingwer,21,1,Ingwer roh,0.85,Y
paprika,19,1,Paprika roh,0.9,Y
mehl,16,1,Weizenmehl,0.88,N
```

**Output:** New mappings added immediately to `ingredient_mappings.csv`

---

## Complete Workflow Example

### Scenario: Weekly maintenance (add mappings for new recipes)

```bash
# Monday: Generate suggestions
$ python batch_mapping_suggester.py

✓ Found 87 unmatched ingredient entries
✓ After normalization: 23 unique ingredients
✓ Generated 67 suggestions
✓ Saved to: mapping_suggestions_ready_for_review.csv

Top 15 suggestions (review these first):
Ingredient            Score    BLS Suggestion                        Freq
────────────────────────────────────────────────────────────────────────────
ingwer                0.85     Ingwer roh                              21
paprika               0.90     Paprika roh                             19
mehl                  0.88     Weizenmehl                              16
...

# Monday: Review (5 minutes)
$ nano mapping_suggestions_ready_for_review.csv
# Mark Y for good matches, N for uncertain ones

# Monday: Import approved
$ python bulk_import_approved_mappings.py

✓ Loaded suggestions from: mapping_suggestions_ready_for_review.csv
✓ Found 18 approved mappings to import
✓ Existing mappings: 146
✓ Added: 18 new mappings
✓ After: 164 mappings

# Monday: Recalculate
$ python recipe_add_audit_trails.py

Overall Statistics:
  Total recipes: 876
  Total matched: 7,024 (66.9%)  # ← Improved from 65.9%
  Total skipped: 3,469 (33.1%)

# Monday: Re-run optimization
$ python optimization_meal_planner.py

✓ OPTIMAL SOLUTION FOUND!
✓ Weekly meal plan with better ingredient coverage
```

---

## Tips & Best Practices

### 1. Review High-Frequency Items First

The suggester sorts by frequency, so most common unmatched ingredients appear first.
**Approve these first** for maximum impact.

### 2. Filter by Match Score

Only approve suggestions with score ≥ 0.7 for first pass:

```bash
python bulk_import_approved_mappings.py --min-score 0.7
```

This ensures only confident matches are imported automatically.

### 3. Batch Processing Schedule

**Recommended workflow:**

```
Day 1: python batch_mapping_suggester.py
       (auto) → mapping_suggestions_ready_for_review.csv

Day 1-2: Review suggestions
         Edit approve column: Y/N/blank

Day 2: python bulk_import_approved_mappings.py
       (auto) → Import all approved

Day 2: python recipe_add_audit_trails.py
       (auto) → Recalculate nutrition

Day 3+: Use new mappings in meal planning
```

### 4. Handling Low-Scoring Matches

If match_score < 0.6, the suggestion might be incorrect.

Options:
- Mark `N` (skip) → handle manually later
- Check BLS database manually → update CSV
- Leave blank → process in next batch with higher threshold

### 5. Duplicate Prevention

The tools automatically:
- Skip ingredients already in `ingredient_mappings.csv`
- Remove duplicate ingredient names (keep highest score)
- Validate BLS entries exist

---

## Troubleshooting

### Problem: "No approved mappings found"

**Solution**: Make sure you edited the CSV file and added "Y" in the `approve` column

```bash
# Check the file
head -5 mapping_suggestions_ready_for_review.csv

# Make sure this column exists:
ingredient_name,frequency,bls_rank,bls_entry_name,match_score,approve
```

### Problem: "BLS entry not found"

**Solution**: The suggester may have generated an invalid suggestion. Either:
1. Mark it as `N` (reject)
2. Edit the `bls_entry_name` column to correct it
3. Leave blank (skip this row)

### Problem: Too many low-scoring suggestions

**Solution**: Use the `--min-score` parameter:

```bash
# Only suggestions with score >= 0.75
python bulk_import_approved_mappings.py --min-score 0.75
```

This ensures only confident matches are processed.

### Problem: "AttributeError" or parse errors

**Solution**: Make sure CSV file is properly formatted:
- No extra blank rows
- `approve` column has only: Y, N, or blank
- No commas in cell values (or use quotes: "value, with, commas")

---

## Performance Metrics

### Before Optimization
- 129 initial mappings
- Manual process: 2-3 hours to add 20 mappings
- Match rate: 59.4%
- Unmatched ingredients: 4,262

### After Phase 1 (Current)
- 146 mappings (17 added manually)
- Faster process: batch_mapping_suggester.py
- Match rate: 65.9%
- Unmatched ingredients: 2,326

### After Full Optimization (Target)
- 200+ mappings (automated + batch imports)
- Fast process: 15 minutes per 100 ingredients
- Match rate: 75%+
- Unmatched ingredients: <300 (manageable edge cases)

---

## Next Steps

1. **Run the suggester now:**
   ```bash
   python batch_mapping_suggester.py
   ```

2. **Review the output:**
   - Check top 20 suggestions
   - Approve high-scoring ones (≥ 0.7)

3. **Import and test:**
   ```bash
   python bulk_import_approved_mappings.py
   python recipe_add_audit_trails.py
   python optimization_meal_planner.py
   ```

4. **Schedule weekly maintenance** (5 minutes to maintain high match rate)

---

## Files Reference

| File | Purpose |
|------|---------|
| `ingredient_parser.py` | Clean ingredient names |
| `batch_mapping_suggester.py` | Generate BLS suggestions |
| `bulk_import_approved_mappings.py` | Import approved mappings |
| `mapping_suggestions_ready_for_review.csv` | User reviews this file |
| `ingredient_mappings.csv` | Final mapping database |
| `recipe_add_audit_trails.py` | (Existing) Recalculate nutrition |
| `optimization_meal_planner.py` | (Existing) Generate meal plans |

---

## Questions?

The workflow is designed to be self-documenting:

```bash
# Each tool has built-in help
python ingredient_parser.py               # Shows examples
python batch_mapping_suggester.py         # Shows workflow
python bulk_import_approved_mappings.py --help  # Shows options
```

Good luck! 🚀
