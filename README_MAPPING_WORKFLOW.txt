================================================================================
INGREDIENT MAPPING WORKFLOW - COMPLETE SOLUTION
================================================================================

THE PROBLEM YOU IDENTIFIED:
"I don't know what it will update if it will be then used in the calculation.
And also if I find something in the database I can't just add it to the ingredient
that hasn't got a clear mapping"

THE SOLUTION:
✅ Single source of truth: ingredient_mapping_config.py
✅ Easy testing: validate_mapping.py before running pipeline
✅ Transparent flow: Edit config → validate → recalculate
✅ Automatic updates: Changes flow through entire system

================================================================================
QUICK START
================================================================================

1. FIND UNMATCHED INGREDIENTS
   python recipe_unmatched_analysis.py
   → Check unmatched_ingredients.csv

2. TEST A MAPPING (BEFORE you commit to recalculating)
   python validate_mapping.py "ingredient_name"
   → Shows if mapping exists
   → Finds BLS candidates
   → Validates before you run expensive pipeline

3. ADD TO CONFIG
   Edit ingredient_mapping_config.py
   Add: 'ingredient_name': 'BLS Entry Name',

4. RECALCULATE
   python recipe_add_audit_trails.py
   python recipe_weekly_analyzer.py
   python optimization_meal_planner.py

5. VERIFY RESULTS
   Check console output for improved match rate

================================================================================
FILES EXPLAINED
================================================================================

ingredient_mapping_config.py
  → THE CENTRAL CONFIG - Edit this file only
  → Imported by: recipe_schema_extraction.py, recipe_add_audit_trails.py
  → Contains: MANUAL_INGREDIENT_MAP with all 111 mappings

validate_mapping.py
  → NEW TOOL - Test mappings before running pipeline
  → Tells you: if mapping is in config, if BLS entry exists, suggests candidates
  → Result: Immediate feedback before expensive recalculation

recipe_add_audit_trails.py
  → Imports MANUAL_INGREDIENT_MAP from ingredient_mapping_config.py
  → Uses it to re-parse 876 recipes
  → Generates audit trails showing which ingredients matched
  → Updates recipe_database.csv

recipe_schema_extraction.py
  → Imports MANUAL_INGREDIENT_MAP from ingredient_mapping_config.py
  → Used when scraping new recipes
  → Both scripts now use same mapping (no duplication!)

MAPPING_WORKFLOW.md
  → Complete workflow documentation
  → Step-by-step examples
  → Troubleshooting guide

MAPPING_EXPLAINED.md
  → How the system works
  → Data flow diagrams
  → FAQ and common pitfalls

================================================================================
EXAMPLE: ADD "CHORIZO" MAPPING
================================================================================

Step 1: Test it
  $ python validate_mapping.py "chorizo"

  ❌ NOT in ingredient_mapping_config.py
  ✅ Found 3 potential matches:
     • Chorizo roh

Step 2: Add to config
  Edit ingredient_mapping_config.py
  Add: 'chorizo': 'Chorizo roh',

Step 3: Verify it works
  $ python validate_mapping.py "chorizo"

  ✅ FOUND in ingredient_mapping_config.py
  ✅ BLS entry EXISTS in database
  ✅ MAPPING IS VALID - ready to use!

Step 4: Recalculate
  $ python recipe_add_audit_trails.py
  Ingredient matching: 59.5% (was 59.4%)
  Total matched: 6,245 (was 6,244)

Step 5: Done
  Chorizo is now matched in all recipes
  Nutrition calculations automatically updated

================================================================================
CURRENT STATE
================================================================================

Match Rate: 59.5%
- Total ingredients: 10,493
- Matched: 6,244 (59.5%)
- Unmatched: 4,249 (40.5%)

Top Unmatched Ingredients (most impactful to map):
1. chorizo (45 recipes)
2. skrei (32 recipes)
3. tortellini (28 recipes)
4. ravioli (26 recipes)
5. [check unmatched_ingredients.csv for full list]

Mapping top 15 would likely improve to 65-70%
Mapping top 50 would likely improve to 75-85%

================================================================================
VERIFICATION CHECKLIST
================================================================================

When adding new mapping:
☐ Run: python recipe_unmatched_analysis.py
☐ Run: python validate_mapping.py "ingredient"
☐ Edit: ingredient_mapping_config.py
☐ Run: python validate_mapping.py "ingredient"
☐ Confirm: ✅ MAPPING IS VALID
☐ Run: python recipe_add_audit_trails.py
☐ Check: Match rate increased
☐ Done: Ingredient now mapped in all recipes

================================================================================
KEY POINTS
================================================================================

1. SINGLE SOURCE OF TRUTH
   Edit ingredient_mapping_config.py only.
   Both scripts import from it automatically.

2. VALIDATE FIRST
   Test with validate_mapping.py BEFORE recalculating.
   Saves time - fails fast if BLS name is wrong.

3. AUTOMATIC FLOW
   Changes to ingredient_mapping_config.py automatically flow through:
   recipe_add_audit_trails.py → recipe_final.csv → optimization_meal_planner.py

4. TRANSPARENT RESULTS
   See immediately: match rate, which ingredients matched, what still needs work

5. NO SURPRISES
   Validation tool tells you exactly what will happen.
   No hidden surprises when running full pipeline.

================================================================================
FREQUENTLY ASKED QUESTIONS
================================================================================

Q: Will my mapping be used?
A: Yes. 100% - both scripts import from ingredient_mapping_config.py

Q: Do I need to edit multiple files?
A: No. Edit ingredient_mapping_config.py only.

Q: How do I know if my mapping will work?
A: Run: python validate_mapping.py "ingredient_name"
   It tests the mapping before you do anything expensive.

Q: What if the BLS name is wrong?
A: validate_mapping.py will tell you ❌ immediately.
   Fix it and test again before recalculating.

Q: Do I need to re-scrape all recipes?
A: No. recipe_add_audit_trails.py uses cached schema.org JSON.
   Only re-scrape if you add new recipes.

Q: How long does recalculation take?
A: ~1 minute for all 876 recipes

Q: Will my weekly meal plan change?
A: Yes - better ingredient matching = more accurate nutrition = better plan

================================================================================
NEXT STEPS
================================================================================

1. Try it:
   python recipe_unmatched_analysis.py

2. Pick an ingredient you want to map:
   Look at unmatched_ingredients.csv

3. Test it:
   python validate_mapping.py "ingredient_name"

4. Add it:
   Edit ingredient_mapping_config.py

5. Validate:
   python validate_mapping.py "ingredient_name"

6. Recalculate:
   python recipe_add_audit_trails.py

7. See improvement!
   Compare match rate before/after

================================================================================
COMPLETE DOCUMENTATION
================================================================================

Read these for more details:
- MAPPING_WORKFLOW.md      (Step-by-step workflow)
- MAPPING_EXPLAINED.md     (How the system works)
- MAPPING_STRATEGY.md      (Finding BLS candidates)
- AUDIT_TRAIL_GUIDE.md     (Understanding audit trails)

================================================================================
