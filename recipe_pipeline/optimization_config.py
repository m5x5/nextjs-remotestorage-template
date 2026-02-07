"""
Configuration for Meal Plan Optimization
==========================================
Customize your nutritional goals, constraints, and preferences here.
"""

# ==========================================
# HOUSEHOLD CONFIGURATION
# ==========================================
HOUSEHOLD_SIZE = 2              # Number of people
MEALS_PER_DAY = 2               # Meals per day (lunch + dinner)
DAYS_IN_PLAN = 7                # Week plan

# ==========================================
# WEEKLY NUTRITIONAL GOALS
# ==========================================
# Set your weekly goals here. These are totals for the entire week.
# Adjust based on your dietary requirements.

WEEKLY_GOALS = {
    # MACRONUTRIENTS
    'ENERCC_kcal': 14000,       # Total calories (2000/day × 7)
    'PROT_g': 385,              # Protein in grams (55g/day × 7)
    'FAT_g': 490,               # Fat in grams (70g/day × 7)
    'CHO_g': 1750,              # Carbs in grams (250g/day × 7)
    'FIBT_g': 210,              # Fiber in grams (30g/day × 7)

    # VITAMINS
    'VITA_ug': 4900,            # Vitamin A in µg (700µg/day × 7)
    'VITC_mg': 525,             # Vitamin C in mg (75mg/day × 7)
    'VITB12_ug': 16.8,          # Vitamin B12 in µg (2.4µg/day × 7)

    # MINERALS
    'FE_mg': 56,                # Iron in mg (8mg/day × 7)
    'CA_mg': 7000,              # Calcium in mg (1000mg/day × 7)
    'MG_mg': 2800,              # Magnesium in mg (400mg/day × 7)
}

# ==========================================
# DIETARY CONSTRAINTS & PREFERENCES
# ==========================================

# Maximum lactose per meal (mg) - adjust based on tolerance
MAX_LACTOSE_PER_MEAL = 2000

# Maximum times same recipe appears per week (for variety)
MAX_RECIPE_REPEATS = 2

# Minimum meals that must be planned (as % of available slots)
MIN_MEALS_PERCENTAGE = 0.8  # 80% of MEALS_PER_DAY × DAYS_IN_PLAN

# Optimization timeout (seconds) - increase for better solutions
OPTIMIZATION_TIMEOUT = 60

# ==========================================
# DIETARY RESTRICTIONS (FUTURE ENHANCEMENT)
# ==========================================
# These can be used to exclude certain recipes

EXCLUDE_KEYWORDS = [
    # Examples:
    # 'butter',      # Low lactose preference
    # 'cream',       # Avoid cream
    # 'cheese',      # Avoid cheese
]

INCLUDE_ONLY_KEYWORDS = [
    # Leave empty to use all recipes
    # Examples:
    # 'vegetarian',  # Only vegetarian
    # 'quick',       # Only quick recipes
]

# ==========================================
# LACTOSE CONTENT ESTIMATES
# ==========================================
# Updated lactose content for common dairy ingredients (mg per 100g)

INGREDIENT_LACTOSE_MAP = {
    # Cheese varieties (aged = lower lactose)
    'käse': 700,
    'cheese': 700,
    'cheddar': 700,
    'feta': 400,
    'mozzarella': 200,
    'ricotta': 300,
    'parmesan': 100,           # Aged, low lactose
    'emmentaler': 150,         # Aged, low lactose
    'gruyere': 50,             # Aged, very low

    # Dairy products
    'frischkäse': 800,         # Fresh cheese, high lactose
    'quark': 200,
    'butter': 150,             # Low lactose
    'cream': 300,
    'sahne': 300,
    'joghurt': 400,
    'yogurt': 400,
    'milk': 500,
    'milch': 500,
}

# ==========================================
# OPTIMIZATION PARAMETERS
# ==========================================

# Solver type: 'CBC' (free, good), 'GLOP', 'SCIP'
SOLVER_TYPE = 'CBC'

# Allow flexible bounds on nutritional goals (%)
# e.g., 0.9 = allow 10% below/above goal
NUTRITION_TOLERANCE = 0.1  # ±10%

# Weight for different optimization objectives
# (Currently: maximize recipe rating)
OBJECTIVE_WEIGHTS = {
    'rating': 1.0,      # Primary objective: maximize recipe ratings
    'lactose': 0.001,   # Tiebreaker: minimize lactose when ratings are similar
    'variety': 0.0,     # Secondary (not yet implemented)
    'cost': 0.0,        # If cost data available
}

# ==========================================
# EXAMPLE CONFIGURATIONS (Uncomment to use)
# ==========================================

# LOW CARB / KETO GOALS
# WEEKLY_GOALS = {
#     'ENERCC_kcal': 12000,
#     'PROT_g': 490,          # Higher protein
#     'FAT_g': 700,           # Higher fat
#     'CHO_g': 350,           # Lower carbs
#     'FIBT_g': 210,
#     'VITA_ug': 4900,
#     'VITC_mg': 525,
#     'VITB12_ug': 16.8,
#     'FE_mg': 56,
#     'CA_mg': 7000,
#     'MG_mg': 2800,
# }

# HIGH PROTEIN / FITNESS GOALS
# WEEKLY_GOALS = {
#     'ENERCC_kcal': 17500,
#     'PROT_g': 700,          # Much higher protein
#     'FAT_g': 560,
#     'CHO_g': 1750,
#     'FIBT_g': 245,
#     'VITA_ug': 4900,
#     'VITC_mg': 630,
#     'VITB12_ug': 16.8,
#     'FE_mg': 56,
#     'CA_mg': 7000,
#     'MG_mg': 3500,
# }

# LOW LACTOSE / VEGAN GOALS
# WEEKLY_GOALS = {
#     'ENERCC_kcal': 14000,
#     'PROT_g': 385,
#     'FAT_g': 490,
#     'CHO_g': 1750,
#     'FIBT_g': 245,          # Higher fiber
#     'VITA_ug': 5600,        # Vegan sources needed
#     'VITC_mg': 630,         # Higher for absorption
#     'VITB12_ug': 33.6,      # Supplemented
#     'FE_mg': 70,            # Higher for plant sources
#     'CA_mg': 8400,          # Need plant sources
#     'MG_mg': 3500,
# }
# MAX_LACTOSE_PER_MEAL = 200  # Very strict
# EXCLUDE_KEYWORDS = ['butter', 'cream', 'cheese', 'milk']
