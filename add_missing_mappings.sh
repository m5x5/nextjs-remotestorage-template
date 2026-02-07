#!/bin/bash

# Add all missing ingredients from the meal plan

echo "Adding missing ingredient mappings..."
echo "======================================"

# 1. Ravioli - Pasta dish
python add_mapping.py "ravioli" "Eier-Frischteigwaren Ravioli (Gemüsefüllung) roh" "Grains & Flour"

# 2. Vollrahm - Heavy cream (German term)
python add_mapping.py "vollrahm" "Sahne 30 % Fett" "Fats & Oils"

# 3. Chorizo - Spanish sausage
python add_mapping.py "chorizo" "Chorizo roh" "Proteins & Meat"

# 4. Winterkabeljau/Skrei - Arctic pollock fish
python add_mapping.py "winterkabeljau" "Seelachs roh" "Proteins & Meat"
python add_mapping.py "skrei" "Seelachs roh" "Proteins & Meat"

# 5. Erbsennudeln/Fusilli grüne Erbsen - Pea pasta
python add_mapping.py "erbsennudeln" "Teigwaren aus Hülsenfrüchten" "Grains & Flour"
python add_mapping.py "fusilli" "Teigwaren Hartweizen ohne Ei trocken" "Grains & Flour"

# 6. Maiskörner - Canned corn
python add_mapping.py "maiskörner" "Mais Konserve" "Vegetables & Produce"

# 7. Gemüsebouillonwürfel - Vegetable bouillon cubes
python add_mapping.py "gemüsebouillonwürfel" "Gemüsebrühe" "Seasonings & Condiments"

# 8. Wienerli - Sausages
python add_mapping.py "wienerli" "Wurst" "Proteins & Meat"

# 9. Salami - Cured meat
python add_mapping.py "salami" "Salami roh" "Proteins & Meat"

# 10. Schinken gekocht - Cooked ham
python add_mapping.py "schinken" "Schweineschinken gekocht" "Proteins & Meat"

# 11. Kurkuma gemahlen - Turmeric powder
python add_mapping.py "kurkuma" "Curcuma" "Seasonings & Condiments"

# 12. Paprikapulver - Paprika powder (different from fresh paprika)
python add_mapping.py "paprikapulver" "Paprikapulver (edelsüß)" "Seasonings & Condiments"

# 13. Chiliflocken - Dried chili flakes
python add_mapping.py "chiliflocken" "Paprika scharf (Chili) roh" "Seasonings & Condiments"

# 14. Staudensellerie - Celery/Celeriac
python add_mapping.py "staudensellerie" "Staudensellerie roh" "Vegetables & Produce"

# 15. Joghurt griechisch - Greek yogurt
python add_mapping.py "joghurt" "Joghurt mindestens 3,5 % Fett" "Dairy & Cheese"
python add_mapping.py "griechischer joghurt" "Joghurt mindestens 3,5 % Fett" "Dairy & Cheese"

echo ""
echo "======================================"
echo "Mappings added successfully!"
echo "Next: Run recipe_add_audit_trails.py to recalculate nutrition data"
