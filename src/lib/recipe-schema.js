/**
 * Normalize schema.org Recipe JSON to app recipe shape and optionally keep schema.
 * Used when importing from pipeline or pasting schema.org JSON.
 */

/**
 * Check if an object looks like a schema.org Recipe
 * @param {unknown} obj
 * @returns {boolean}
 */
export function isSchemaOrgRecipe(obj) {
  if (!obj || typeof obj !== 'object') return false
  const o = obj
  return (
    (o['@type'] === 'Recipe' || o['@context']?.includes?.('schema.org')) &&
    (typeof o.name === 'string' || typeof o.recipeIngredient !== 'undefined')
  )
}

/**
 * Parse recipeYield (e.g. "4 Portionen", "500 g", "2") into yield type, quantity, unit, and servings.
 * @param {string} yieldStr
 * @returns {{ yieldType: 'portions'|'weight', yieldQuantity: number, yieldUnit: string, servings: number }}
 */
function parseYield(yieldStr) {
  const defaultPortions = { yieldType: 'portions', yieldQuantity: 2, yieldUnit: 'portion', servings: 2 }
  if (yieldStr == null) return defaultPortions
  const s = String(yieldStr).trim().toLowerCase()
  const numMatch = s.match(/(\d+(?:[.,]\d+)?)\s*(\w+)?/)
  const num = numMatch ? parseFloat(numMatch[1].replace(',', '.')) : NaN
  const unit = (numMatch && numMatch[2]) ? numMatch[2].trim() : ''

  // Weight-based: "500 g", "1 kg", "500g"
  if (/\b(g|gramm|gramme|kg|kilogram)\b/.test(s) || unit === 'g' || unit === 'kg') {
    const qty = !Number.isNaN(num) ? num : 500
    const isKg = /\bkg\b/.test(s) || unit === 'kg'
    return {
      yieldType: 'weight',
      yieldQuantity: isKg ? qty * 1000 : qty,
      yieldUnit: 'g',
      servings: 4, // default portions to divide into; user can edit
    }
  }

  // Portion-based: "4 Portionen", "2 servings", or plain "4"
  const count = !Number.isNaN(num) ? Math.max(1, Math.round(num)) : 2
  return {
    yieldType: 'portions',
    yieldQuantity: count,
    yieldUnit: 'portion',
    servings: count,
  }
}

/**
 * Map schema.org nutrition to our nutrients array
 * @param {Record<string, unknown>} nutrition
 * @param {number} servings
 * @returns {Array<{ type: string, number: number, unittype: string }>}
 */
function mapSchemaNutrition(nutrition, servings) {
  if (!nutrition || typeof nutrition !== 'object') return []
  const result = []
  const mapping = [
    ['calories', 'kcal', 'kcal'],
    ['proteinContent', 'protein', 'g'],
    ['fatContent', 'fat', 'g'],
    ['carbohydrateContent', 'carb2', 'g'],
    ['fiberContent', 'dietaryFibre', 'g'],
    ['sodiumContent', 'sodium', 'mg'],
    ['saturatedFatContent', 'saturatedFat', 'g'],
  ]
  for (const [schemaKey, type, unit] of mapping) {
    let value = nutrition[schemaKey]
    if (value == null) continue
    if (typeof value === 'string') {
      value = parseFloat(value.replace(/[^\d.-]/g, ''))
    }
    if (Number.isNaN(value)) continue
    result.push({ type, number: value * (servings || 1), unittype: unit })
  }
  return result
}

/**
 * Merge two nutrient arrays: author (schema) values take precedence per type;
 * calculated (e.g. BLS) fills in only for types the author did not provide.
 * @param {Array<{ type: string, number: number, unittype?: string }>} authorNutrients
 * @param {Array<{ type: string, number: number, unittype?: string }>} calculatedNutrients
 * @returns {Array<{ type: string, number: number, unittype: string }>}
 */
export function mergeNutrientsPreferAuthor(authorNutrients, calculatedNutrients) {
  const byType = new Map()
  const add = (list) => {
    if (!Array.isArray(list)) return
    for (const n of list) {
      if (n?.type == null || n.number == null) continue
      const type = String(n.type)
      if (byType.has(type)) continue
      byType.set(type, {
        type,
        number: Number(n.number),
        unittype: n.unittype || 'g',
      })
    }
  }
  add(authorNutrients)
  add(calculatedNutrients)
  return Array.from(byType.values())
}

/**
 * Convert schema.org recipeIngredient (strings or objects) to our ingredients shape
 * @param {unknown} recipeIngredient
 * @returns {Array<{ ingredientNotation: string, quantity?: { value?: number, unitNotation?: string }, optional?: boolean }>}
 */
function mapSchemaIngredients(recipeIngredient) {
  if (!Array.isArray(recipeIngredient)) return []
  return recipeIngredient.map((ing) => {
    if (typeof ing === 'string') {
      return { ingredientNotation: ing }
    }
    if (ing && typeof ing === 'object') {
      const name = ing.name ?? ing.ingredientNotation ?? ing.text ?? ''
      const value = ing.quantity?.value ?? ing.amount?.value
      const unit = ing.quantity?.unit ?? ing.amount?.unit ?? ing.unitNotation
      return {
        ingredientNotation: String(name),
        ...(value != null && { quantity: { value: Number(value), unitNotation: unit || '' } }),
        ...(ing.optional != null && { optional: Boolean(ing.optional) }),
      }
    }
    return { ingredientNotation: String(ing) }
  })
}

/**
 * Normalize a schema.org Recipe object to our recipe shape
 * @param {Record<string, unknown>} schemaObj - schema.org Recipe JSON
 * @param {string} [id] - optional id (otherwise generated)
 * @param {object} [extra] - extra fields (e.g. from pipeline: recipe_name, BLS nutrients)
 * @returns {{ id: string, title: string, image?: string, cookidooUrl?: string, servings: number, nutrients: Array, ingredients: Array, schema: object, created_at: string }}
 */
export function schemaToRecipe(schemaObj, id, extra = {}) {
  const name = schemaObj.name ?? schemaObj.title ?? extra.recipe_name ?? 'Untitled Recipe'
  const yieldParsed = parseYield(schemaObj.recipeYield ?? extra.recipe_yield)
  const nutrition = schemaObj.nutrition ?? {}
  const nutrients = mapSchemaNutrition(nutrition, yieldParsed.servings)
  const ingredients = mapSchemaIngredients(schemaObj.recipeIngredient ?? [])
  const image = schemaObj.image ?? (Array.isArray(schemaObj.image) ? schemaObj.image[0] : undefined)
  const url = schemaObj.url ?? schemaObj.mainEntityOfPage?.['@id'] ?? extra.recipe_url

  const recipeId =
    id ||
    extra.id ||
    `recipe-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`

  const recipe = {
    id: recipeId,
    title: typeof name === 'string' ? name : String(name),
    ...(image && { image: typeof image === 'string' ? image : image?.url }),
    ...(url && { cookidooUrl: typeof url === 'string' ? url : undefined }),
    servings: yieldParsed.servings,
    yieldType: yieldParsed.yieldType,
    yieldQuantity: yieldParsed.yieldQuantity,
    yieldUnit: yieldParsed.yieldUnit,
    nutrients: mergeNutrientsPreferAuthor(nutrients, extra.nutrients || []),
    ingredients,
    schema: schemaObj,
    created_at: new Date().toISOString(),
  }
  // Optional BLS/pipeline audit (from recipe_final.csv)
  if (extra.ingredients_matched != null) recipe.ingredients_matched = Number(extra.ingredients_matched)
  if (extra.ingredients_skipped != null) recipe.ingredients_skipped = Number(extra.ingredients_skipped)
  if (extra.match_rate != null) recipe.match_rate = Number(extra.match_rate)
  if (extra.ingredient_audit_trail != null && Array.isArray(extra.ingredient_audit_trail)) {
    recipe.ingredient_audit_trail = extra.ingredient_audit_trail
  }
  return recipe
}

/**
 * Effective number of portions for per-serving calculations (always divide total nutrients by this).
 * @param {{ servings?: number }} recipe
 * @returns {number}
 */
export function getEffectiveServings(recipe) {
  return recipe?.servings != null && recipe.servings >= 1 ? recipe.servings : 2
}

/**
 * Human-readable label for per-serving display (e.g. "Per serving (1 of 4)" or "Per portion (~125 g)").
 * @param {{ servings?: number, yieldType?: string, yieldQuantity?: number, yieldUnit?: string }} recipe
 * @returns {string}
 */
export function getPerServingLabel(recipe) {
  const servings = getEffectiveServings(recipe)
  if (recipe?.yieldType === 'weight' && recipe?.yieldQuantity != null && recipe.yieldQuantity > 0 && servings >= 1) {
    const perPortion = Math.round(recipe.yieldQuantity / servings)
    const u = recipe.yieldUnit || 'g'
    return `Per portion (~${perPortion} ${u})`
  }
  return `Per serving (1 of ${servings})`
}

/**
 * Get ingredient quantity in grams when stored as weight (for scaling BLS audit).
 * @param {{ quantityType?: string, quantity?: { value?: number, unitNotation?: string } }} ingredient
 * @returns {number|null} grams, or null if not a weight or unit not g/kg
 */
export function getIngredientWeightGrams(ingredient) {
  if (!ingredient || ingredient.quantityType !== 'weight') return null
  const value = ingredient?.quantity?.value
  if (value == null || typeof value !== 'number' || !Number.isFinite(value)) return null
  const unit = (ingredient?.quantity?.unitNotation ?? 'g').toString().trim().toLowerCase()
  if (unit === 'g') return value
  if (unit === 'kg') return value * 1000
  return null
}
