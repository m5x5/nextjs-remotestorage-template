# Ingredient Mapping Strategy

## Overview

The system currently achieves **59.4% ingredient match rate** against the BLS database. This guide explains how to improve it by mapping unmatched ingredients.

## Current State

- **Total recipes**: 876
- **Total ingredients**: 10,493
- **Matched**: 6,231 (59.4%)
- **Unmatched**: 4,262 (40.6%)
- **Unique unmatched names**: 1,204

## Mapping Strategy Workflow

### Step 1: Generate Mapping Suggestions

Run the ingredient mapping strategy tool:

```bash
python ingredient_mapping_strategy.py
```

This tool:
1. **Extracts** all unmatched ingredients from audit trails
2. **Searches** BLS database for potential matches
3. **Ranks** by frequency (most common first)
4. **Exports** suggestions to `mapping_suggestions.csv`

### Step 2: Review Suggestions

The CSV contains the top candidates for each unmatched ingredient:

```
unmatched_ingredient  | frequency | example           | bls_candidate_1           | bls_candidate_2 | bls_candidate_3
eier                  | 86        | 2 Eier            | Eierteigwaren roh        | Eierteigwaren.. | Eierteigwaren..
mehl                  | 78        | 10 g Mehl         | Gerste Mehl              | Mais Mehl       | Hafer Mehl
möhren                | 72        | 120 g Möhren      | Möhren-Nuss-Kuchen (...)  | Karotten, gedü..| Karotten, gek..
```

**Important**: Not all suggestions are perfect! You need to manually review and select the best match:
- ✅ `eier` → Choose `Hühnervollei frisch` (not the suggested pasta)
- ✅ `mehl` → Choose `Weizenmehl` (not individual grain types)
- ✅ `möhren` → Choose `Karotte roh` (not finished dishes)

### Step 3: Interactive Search

Use the tool's interactive mode to refine matches:

```bash
python ingredient_mapping_strategy.py
```

Then select option 1-3:

**Option 1**: View all BLS candidates
```
Enter ingredient name: eier
Found 285 BLS matches for 'eier':
  1. Hühnervollei frisch
  2. Eierteigwaren roh
  3. Eierteigwaren Tortellini (Fleischfüllung) getrocknet
  ...
```

**Option 2**: Search BLS for a term
```
Enter search term: vollei
Found 15 BLS foods containing 'vollei':
  1. Hühnervollei frisch
  2. ...
```

**Option 3**: Show recipes with unmatched ingredient
```
Enter unmatched ingredient name: eier
Recipes with 'eier' (unmatched):
  • Frikadellen: 1 Ei
  • Hähnchen-Patties: 2 Eier
  • ...
```

### Step 4: Update Manual Map

Once you've identified the best matches, add them to the `manual_map` in:

1. **`recipe_schema_extraction.py`** (line ~45)
2. **`recipe_add_audit_trails.py`** (line ~45)

Example:

```python
manual_map = {
    # ... existing mappings ...

    # New mappings from unmatched ingredients:
    'eier': 'Hühnervollei frisch',
    'mehl': 'Weizenmehl',
    'möhren': 'Karotte roh',
    'ei': 'Hühnervollei frisch',
    'paprika edelsüß': 'Paprikapulver (edelsüß)',
    'speisestärke': 'Maisstärke',
    'crème fraîche': 'Sauerrahm mindestens 10 % Fett',
    # ... etc
}
```

### Step 5: Recalculate Audit Trails

Re-run the audit trail calculation with the updated mappings:

```bash
python recipe_calculate_lactose.py
```

This regenerates the audit trails with the new mappings, and shows the improvement:

```
Overall Statistics:
  Total recipes: 876
  Recipes with lactose: 431
  Average lactose per recipe: 1526.7 mg
```

### Step 6: Verify Impact

Check the new match rate:

```bash
python recipe_add_audit_trails.py
```

Look for:
```
Overall Statistics:
  Total matched: XXXX (Y%)  # Should be higher than 59.4%
  Total skipped: XXXX (Z%)  # Should be lower than 40.6%
```

### Step 7: Re-Optimize

Once mappings are improved, re-run the full pipeline:

```bash
python recipe_calculate_lactose.py
python recipe_weekly_analyzer.py
python optimization_meal_planner.py
```

The optimization will use more accurate data.

## High-Priority Ingredients to Map

Top 15 most frequently unmatched (in order of impact):

1. **eier** (86 occurrences) → Hühnervollei frisch
2. **mehl** (78) → Weizenmehl
3. **möhren** (72) → Karotte roh
4. **koriander** (68) → Koriander Blatt roh
5. **ingwer** (60) → Ingwer roh
6. **rote paprika** (57) → Paprika roh
7. **speisestärke** (53) → Maisstärke
8. **champignons** (53) → Champignons roh
9. **crème fraîche** (51) → Sauerrahm mindestens 10 % Fett
10. **paprika edelsüß** (44) → Paprikapulver (edelsüß)
11. **ei** (44) → Hühnervollei frisch
12. **oregano** (43) → Oregano getrocknet
13. **senf** (39) → Speisesenf gelb
14. **kartoffeln** (39) → Kartoffel roh
15. **erbsen** (38) → Erbsen, grün, gefroren

Mapping just these 15 would likely improve match rate by **10-15%**.

## Quality Assurance Checklist

Before committing mapping changes:

- [ ] Reviewed CSV suggestions manually
- [ ] Used interactive search to verify BLS matches
- [ ] Checked that mapped ingredients make sense (e.g., "mehl" → "Weizenmehl", not "Gerste Mehl")
- [ ] Verified no duplicates added to manual_map
- [ ] Re-ran `recipe_calculate_lactose.py` and verified match rate improved
- [ ] Checked that optimization still finds valid solutions
- [ ] Spot-checked a few recipes to ensure nutrition values are reasonable

## Tips & Best Practices

1. **Start with most frequent**: Map the top 20 ingredients first (covers ~40% of unmatched)
2. **Group similar items**: e.g., all variants of paprika should use the same base ("Paprika roh")
3. **Prefer raw/basic forms**: Use "Weizenmehl" not "Weizenmehl Vollkorn", "Karotte roh" not specific recipes
4. **Avoid specialty/cooked foods**: BLS entries for finished dishes add noise
5. **Test incrementally**: Add 5-10 mappings, recalculate, verify before adding more
6. **Document why**: Add comments for non-obvious mappings

## Expected Outcome

With good mappings:
- **Match rate**: 59.4% → 75-85% (target)
- **Nutrition accuracy**: Much higher confidence in calculations
- **Lactose data**: More precise (calculated from actual ingredient data)
- **Report transparency**: Fewer unmatched ingredients shown

## Troubleshooting

**Q: I added a mapping but it didn't take effect**
A: Make sure you updated BOTH:
   - `recipe_schema_extraction.py`
   - `recipe_add_audit_trails.py`

**Q: The BLS suggestion doesn't make sense**
A: The auto-suggestions aren't perfect. Use the interactive search (option 1) to manually browse all BLS matches and pick the best one.

**Q: Nutrition values changed significantly after re-mapping**
A: That's expected! The new mappings are likely more accurate. Check a few recipes manually to verify the change is reasonable.

**Q: How do I handle ingredients with no good BLS match?**
A: Some ingredients genuinely aren't in BLS (e.g., brand names, specialty items). Leave them unmapped - they'll show in the report's "Unmatched ingredients" section for transparency.

## Next Steps

1. Run: `python ingredient_mapping_strategy.py` (option 4 to export)
2. Open: `mapping_suggestions.csv`
3. Identify top 20 ingredients to map
4. Use interactive search to find best matches
5. Update `manual_map` in both scripts
6. Re-run: `python recipe_calculate_lactose.py`
7. Verify improvement in match rate
8. Commit changes
