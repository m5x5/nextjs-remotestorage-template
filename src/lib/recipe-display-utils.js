/**
 * Pure helpers for formatting and computing recipe/nutrient display values.
 * All nutrient definitions come from the central registry.
 */

import {
  NUTRIENT_MAP,
  LEGACY_TYPE_MAP,
  BLS_COLUMN_MAP,
  DEFAULT_DAILY_GOALS,
} from './nutrient-registry.js'

/**
 * Resolve a legacy nutrient type (e.g. 'carb2', 'dietaryFibre') to a canonical key.
 * Returns the key itself if it's already canonical, or null if unknown.
 */
function resolveKey(type) {
  if (NUTRIENT_MAP.has(type)) return type
  const entry = LEGACY_TYPE_MAP.get(type)
  return entry ? entry.key : null
}

export function formatNutrientType(type) {
  const entry = LEGACY_TYPE_MAP.get(type)
  if (entry) return entry.label
  const direct = NUTRIENT_MAP.get(type)
  if (direct) return direct.label
  return type
}

export function formatIngredientQuantity(ingredient) {
  const value = ingredient?.quantity?.value
  if (value == null) return null
  const unit = ingredient?.quantity?.unitNotation
    ? typeof ingredient.quantity.unitNotation === "string"
      ? ingredient.quantity.unitNotation
      : String(ingredient.quantity.unitNotation)
    : ""
  const qtyType = ingredient?.quantityType || "amount"
  if (qtyType === "weight") {
    return `${value} ${unit || "g"}`
  }
  return unit ? `${value} ${unit}` : String(value)
}

export function formatBlsNutrientKey(key) {
  if (!key || typeof key !== "string") return key
  // Try registry lookup first
  const entry = BLS_COLUMN_MAP.get(key)
  if (entry) {
    return `${entry.label} (${entry.unit})`
  }
  // Fallback: truncate long keys
  return key.length > 50 ? key.slice(0, 47) + "\u2026" : key
}

/** Energy can be stored as 'kcal' (schema) or 'calories' (canonical); treat as one. */
const MAIN_NUTRIENT_TYPES = ["kcal", "calories", "protein", "fat", "carb2"]

export function getMainNutrients(nutrients) {
  return (nutrients || []).filter((n) => MAIN_NUTRIENT_TYPES.includes(n.type))
}

export function mapNutrientType(type) {
  const key = resolveKey(type)
  // Only return a key if there's a daily goal for it
  return key && DEFAULT_DAILY_GOALS[key] != null ? key : null
}

/**
 * @param {string} nutrientType
 * @param {number} value
 * @param {string} unittype
 * @param {number} servings
 * @param {Record<string,number>} [dailyRecommended]
 */
export function getDailyPercentage(nutrientType, value, unittype, servings = 2, dailyRecommended = null) {
  const mappedKey = mapNutrientType(nutrientType)
  if (!mappedKey) return null

  const mergedDaily = dailyRecommended ? { ...DEFAULT_DAILY_GOALS, ...dailyRecommended } : DEFAULT_DAILY_GOALS
  const recommended = mergedDaily[mappedKey]
  if (!recommended || !value) return null

  // Look up the canonical unit for this nutrient to decide on conversion
  const entry = NUTRIENT_MAP.get(mappedKey)
  const canonicalUnit = entry?.unit || 'g'

  let adjustedValue = value
  // Convert mg → g only if the canonical unit is 'g' (i.e. not for nutrients natively in mg)
  if (unittype === "mg" && canonicalUnit === "g") {
    adjustedValue = value / 1000
  }

  const perServingValue = adjustedValue / servings
  return Math.round((perServingValue / recommended) * 100)
}

/**
 * @param {Array<{type:string,number:number,unittype?:string}>} nutrients
 * @param {number} servings
 * @param {Record<string,number>} [dailyRecommended]
 */
export function getAllNutrientPercentages(nutrients, servings = 2, dailyRecommended = null) {
  const percentages = {}
  ;(nutrients || []).forEach((nutrient) => {
    const pct = getDailyPercentage(
      nutrient.type,
      nutrient.number,
      nutrient.unittype,
      servings,
      dailyRecommended
    )
    if (pct !== null) percentages[nutrient.type] = pct
  })
  return percentages
}
