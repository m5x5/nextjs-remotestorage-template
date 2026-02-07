# Recipe pipeline

Scripts and data for building the recipe database and generating optimal meal plans.

## Layout

- **`data/`** – All CSVs and data files (inputs and outputs).
- **Scripts** – Run from this folder (`recipe_pipeline/`).

## Data files (in `data/`)

| File | Purpose |
|------|---------|
| `Lebensmittel - Cookidoo Export - Rezepte.csv` | Cookidoo export (input) |
| `BLS_4_0_Daten_2025_DE.csv` | BLS nutrient database (input) |
| `ingredient_mappings.csv` | Ingredient → BLS mappings |
| `recipe_database.csv` | Built recipe DB (output of extraction) |
| `recipe_final.csv` | Final analysis with nutrients (output of analyzer) |
| `optimization_meal_plan.csv` | Optimal weekly meal plan (output of optimizer) |
| `excluded_recipes.txt` | Optional: recipe names to exclude from optimization (one per line) |

## Quick run

From the project root:

```bash
cd recipe_pipeline
python recipe_process_all.py          # Build DB + analyze → data/recipe_final.csv
```

Or from anywhere (with `recipe_pipeline` as cwd):

```bash
python recipe_process_all.py
```

## Config

- **`recipe_config.py`** – Daily goals, file paths, nutrient mapping, ingredient defaults.
- **`optimization_config.py`** – Household size, weekly goals, lactose limits, solver settings.

All paths point to `data/`; no need to edit paths when adding new CSVs—put them in `data/`.
