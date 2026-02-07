#!/bin/bash

echo "Adding corrected ingredient mappings..."
echo "========================================"

# Already added successfully
# ravioli → Eier-Frischteigwaren Ravioli (Gemüsefüllung) roh
# gemüsebouillonwürfel → Gemüsebrühe

# Now add the correct ones:

# Vollrahm - Heavy cream (use whipped cream as closest match)
python add_mapping.py "vollrahm" "Schlagsahne mind. 36 % Fett" "Fats & Oils"

# Fisch - Winterkabeljau/Skrei (Arctic pollock)
python add_mapping.py "winterkabeljau" "Köhler/Seelachs, roh" "Proteins & Meat"
python add_mapping.py "skrei" "Köhler/Seelachs, roh" "Proteins & Meat"
python add_mapping.py "kabeljau" "Dorsch/Kabeljau, roh" "Proteins & Meat"

# Maiskörner - Canned corn
python add_mapping.py "maiskörner" "Zuckermais Konserve, abgetropft" "Vegetables & Produce"

# Wienerli - German sausage (use Fleischwurst)
python add_mapping.py "wienerli" "Fleischwurst" "Proteins & Meat"

# Salami - Cured pork sausage
python add_mapping.py "salami" "Salami (Schwein)" "Proteins & Meat"

# Schinken - Cooked ham
python add_mapping.py "schinken" "Schwein Kochschinken, Kochpökelware, gekocht" "Proteins & Meat"

# Staudensellerie - Celery stalk
python add_mapping.py "staudensellerie" "Bleichsellerie roh" "Vegetables & Produce"

# Joghurt - Yogurt (Greek yogurt maps to regular yogurt with 3.5% fat)
python add_mapping.py "joghurt" "Joghurt mild, mind. 3,5 % Fett" "Dairy & Cheese"
python add_mapping.py "griechischer joghurt" "Joghurt mild, mind. 3,5 % Fett" "Dairy & Cheese"

# Note: Some ingredients (chorizo, kurkuma, paprikapulver, chiliflocken, erbsennudeln) 
# don't have exact matches in the German BLS database
# These would need to be manually searched or use approximations

echo ""
echo "========================================"
echo "Mappings added!"
