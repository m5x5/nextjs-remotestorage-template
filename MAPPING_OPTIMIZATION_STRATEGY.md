# Ingredient Mapping Optimization Strategy

## Problem Analysis

After adding 17 mappings, we still have unmatched ingredients because:

1. **Quantity inclusion**: Ingredient names include measurements (e.g., "10 g ingwer, frisch" instead of "ingwer")
2. **Variant proliferation**: "ei", "eier", "1 ei", "4 eier" all counted as separate unmatched items
3. **Manual bottleneck**: Current workflow requires manual BLS lookup for each ingredient
4. **Scale issue**: 2,326 unmatched ingredients → impossible to handle manually

## Root Cause

The parsing in `recipe_add_audit_trails.py` extracts ingredient names with quantities included.

**Current flow:**
```
Recipe raw ingredients → Parse with quantity → Store audit trail → Report unmatched
                                                                       ↑
                                                        Quantity makes comparison fail
```

## Optimized 3-Tier Approach

### Tier 1: Smart Parsing (Prevent new unmatched)
**Goal**: Extract base ingredient name separately from quantity

```python
"10 g ingwer, frisch" → base="ingwer", quantity="10g", variant="frisch"
```

Implementation: Modify `recipe_add_audit_trails.py` to:
1. Extract number + unit using regex
2. Clean common German modifiers (frisch, getrocknet, etc.)
3. Match base name to existing mappings
4. Fall back to variant matching if needed

**Benefit**: Reduces unmatched count from 2,326 → ~300 (core ingredients only)

### Tier 2: Automated Suggestions (Fast bulk decisions)
**Goal**: Generate top 3 BLS candidates for each remaining unmatched ingredient

Process:
1. Clean ingredient names (remove quantities and modifiers)
2. Deduplicate (so "1 ei", "4 eier" → single "ei" entry)
3. Sort by frequency
4. Use fuzzy string matching to find BLS candidates
5. Generate CSV with top 3 suggestions per ingredient
6. **User reviews top 20 and marks Y/N** (5 minute task)
7. Auto-import approved mappings

**Benefit**: Covers 80% of unmatched ingredients in one decision batch

### Tier 3: Manual Fallback (Edge cases only)
**Goal**: Handle remaining 5-10% of niche ingredients

For ingredients with:
- No good fuzzy matches (score < 0.5)
- Ambiguous meaning
- Category uncertainty

**User manually reviews and decides**: Add specific mapping or use category fallback

## Implementation Roadmap

### Phase 1: Smart Ingredient Parsing (Priority: HIGH)
File: `recipe_add_audit_trails.py` (modify ingredient extraction)

```python
import re

def extract_and_clean_ingredient(ingredient_str):
    """
    Extract base ingredient name from string with quantity.

    "10 g ingwer, frisch" → ("ingwer", "10g", "frisch")
    "½ bund koriander" → ("koriander", "½ bunch", "")
    "1 rote paprika" → ("paprika", "1", "rote")
    """

    # Remove leading quantity patterns
    quantity_pattern = r'^[\d½⅓¼]*\s*(?:g|kg|ml|l|tl|el|prise|pack|bund|dose|dose|dosen)?\.?\s*'
    cleaned = re.sub(quantity_pattern, '', ingredient_str, flags=re.IGNORECASE).strip()

    # Extract color/variant prefixes
    color_patterns = {
        'rote': 'rot',
        'roten': 'rot',
        'red': 'rot',
        'weiße': 'weiß',
        'weißen': 'weiß',
        'grüne': 'grün',
        'grünen': 'grün',
    }

    # Remove common modifiers that should be variants, not base name
    variant = ''
    for pattern, mapped in color_patterns.items():
        if pattern in cleaned.lower():
            variant = mapped
            cleaned = cleaned.replace(pattern, '').strip()

    # Remove trailing modifiers
    modifier_patterns = ['frisch', 'getrocknet', 'gemahlen', 'pulver', 'roh', 'gekocht']
    for mod in modifier_patterns:
        if cleaned.lower().endswith(mod):
            variant = variant or mod
            cleaned = cleaned[:-len(mod)].strip()

    return cleaned.lower(), variant
```

### Phase 2: Batch Suggestion Tool (Priority: HIGH)
Create: `batch_mapping_suggester.py`

```bash
# One command generates ready-to-review CSV
python batch_mapping_suggester.py

# Output: mapping_suggestions_ready_for_review.csv
# User marks: approve=Y/N for each row
# Then import approved mappings in bulk
```

### Phase 3: Bulk Import Tool (Priority: MEDIUM)
Create: `bulk_import_approved_mappings.py`

```bash
# Review and approve suggestions
nano mapping_suggestions_ready_for_review.csv  # Mark Y/N in "approve" column

# Import all approved at once
python bulk_import_approved_mappings.py --file mapping_suggestions_ready_for_review.csv

# Output: X mappings added, Y/Z suggestions approved
```

## Timeline & Impact

| Phase | Effort | Impact | Notes |
|-------|--------|--------|-------|
| 1 | 30 min | -80% unmatched | Modify existing parsing |
| 2 | 20 min | Auto-suggest 80% | Fuzzy matching |
| 3 | 15 min | 1-click bulk import | Final step |
| **Total** | **65 min** | **Covers 99% of cases** | Includes testing |

## Success Metrics

- Unmatched ingredients: 2,326 → <50 (98% reduction)
- Match rate: 65.9% → 80%+
- Time to add 100 mappings: 2 hours → 15 minutes
- User effort: Manual lookup for each → One approval CSV review

## Recommended Implementation Order

1. ✅ **Start**: Implement ingredient parsing cleanup
2. ✅ **Then**: Create batch suggestion tool
3. ✅ **Finally**: Build bulk import
4. 🔄 **Ongoing**: Review unmatched ingredients weekly (5 min task)

## Maintenance Mode

Once optimized, the process becomes:

```
Daily: Recipes added
  ↓
Weekly: Extract unmatched (auto)
  ↓
Weekly: Generate suggestions (auto)
  ↓
User: Review & approve (5 minutes)
  ↓
Auto: Import approved mappings
  ↓
Repeat
```

Expected unmatched count stabilizes at 5-10 per week (manageable).

---

**Key Insight**: The problem isn't that ingredients can't be matched—it's that the current system extracts too much metadata (quantities, modifiers) into the ingredient name field, making matching fail. Fix the extraction, and most matching problems disappear.
