/**
 * Weekly nutrient goals and helpers for mapping BLS/audit-trail data to app nutrients.
 *
 * All nutrient definitions now come from nutrient-registry.js.
 * This module re-exports the constants consumers need and provides the
 * build/mapping functions that bridge BLS data → app nutrient arrays.
 */

import {
  NUTRIENT_MAP,
  BLS_COLUMN_MAP,
  LEGACY_TYPE_MAP,
  getCanonicalKey,
  NUTRIENT_LABELS as _LABELS,
  NUTRIENT_UNITS as _UNITS,
  DEFAULT_DAILY_GOALS,
  DEFAULT_WEEKLY_GOALS,
  CORE_NUTRIENT_KEYS,
  ALL_NUTRIENT_KEYS,
} from './nutrient-registry.js'
import { getIngredientWeightGrams } from './recipe-schema.js'

// ─── Re-exports for backward compatibility ───────────────────────────────────

export const DAILY_GOALS = DEFAULT_DAILY_GOALS
export const WEEKLY_GOALS = DEFAULT_WEEKLY_GOALS
export const NUTRIENT_LABELS = _LABELS
export const NUTRIENT_UNITS = _UNITS

/** Ordered list of goal keys for weekly totals (core set by default) */
export const WEEKLY_GOAL_KEYS = CORE_NUTRIENT_KEYS

/** Keys that can have a per-meal limit in optimization — all known nutrients */
export const PER_MEAL_LIMIT_KEYS = ALL_NUTRIENT_KEYS

/**
 * Map app nutrient type (from recipe.nutrients[].type) to our goal key and unit.
 * Built from the registry's legacyTypes.
 */
export const NUTRIENT_TYPE_TO_GOAL = Object.fromEntries(
  Array.from(LEGACY_TYPE_MAP.entries()).map(([legacyType, entry]) => [
    legacyType,
    { key: entry.key, unit: entry.unit },
  ])
)

/**
 * Reverse map: goal key → legacy nutrient type used in recipe.nutrients[].type.
 * Only populated for nutrients that have a legacy type.
 */
const GOAL_KEY_TO_TYPES = new Map()
for (const [lt, entry] of LEGACY_TYPE_MAP) {
  if (!GOAL_KEY_TO_TYPES.has(entry.key)) GOAL_KEY_TO_TYPES.set(entry.key, [])
  GOAL_KEY_TO_TYPES.get(entry.key).push(lt)
}

/**
 * BLS column names → app nutrient type + unit.
 * Now auto-generated from the registry for ALL 138 nutrients.
 */
export const BLS_COLUMN_TO_APP_NUTRIENT = Object.fromEntries(
  Array.from(BLS_COLUMN_MAP.entries()).map(([col, entry]) => {
    // For nutrients with legacy types, use the first legacy type as `type`
    // so downstream code (which stores recipe.nutrients[].type) keeps working.
    const legacyTypes = GOAL_KEY_TO_TYPES.get(entry.key)
    const type = legacyTypes && legacyTypes.length > 0 ? legacyTypes[0] : entry.key
    return [col, { type, key: entry.key, unittype: entry.unit }]
  })
)

/** App nutrient type → BLS column names that contribute to it (for per-ingredient breakdown). */
const APP_TYPE_TO_BLS_COLUMNS = (() => {
  const map = {}
  for (const [blsCol, mapped] of Object.entries(BLS_COLUMN_TO_APP_NUTRIENT)) {
    const t = mapped.type
    if (!map[t]) map[t] = []
    map[t].push(blsCol)
  }
  return map
})()

/**
 * Return an app nutrient type suitable for getIngredientContributionsForNutrient(recipe, type).
 * Uses the first legacy type for this goal key that has BLS columns (so per-ingredient breakdown is available).
 * @param {string} goalKey - e.g. 'protein', 'calories'
 * @returns {string|null}
 */
export function getAppNutrientTypeForGoalKey(goalKey) {
  const legacyTypes = GOAL_KEY_TO_TYPES.get(goalKey)
  if (!legacyTypes?.length) return goalKey
  for (const t of legacyTypes) {
    if (APP_TYPE_TO_BLS_COLUMNS[t]?.length) return t
  }
  return null
}

// ─── Build helpers ───────────────────────────────────────────────────────────

/**
 * Build nutrients array from a CSV row (pipeline export). Uses headers to find BLS columns.
 * Now processes ALL 138 BLS columns.
 * @param {Record<string, string>} row
 * @param {string[]} headers
 * @returns {Array<{ type: string, number: number, unittype: string }>}
 */
export function buildNutrientsFromBlsRow(row, headers) {
  const nutrients = []
  for (const [blsCol, mapped] of Object.entries(BLS_COLUMN_TO_APP_NUTRIENT)) {
    if (!headers.includes(blsCol)) continue
    const raw = row[blsCol]
    if (raw === undefined || raw === null || String(raw).trim() === '') continue
    const num = Number(String(raw).replace(',', '.'))
    if (Number.isNaN(num)) continue
    const entry = BLS_COLUMN_MAP.get(blsCol)
    const value = entry?.conversionFromBls ? entry.conversionFromBls(num) : num
    nutrients.push({ type: mapped.type, number: value, unittype: mapped.unittype })
  }
  return nutrients
}

/**
 * Get audit trail with contributions scaled to current ingredient weights when the user
 * has set a weight in grams for that ingredient. So "Weight used" and nutrition totals
 * reflect the edited quantity, not the import-time pipeline weight.
 * @param {{ ingredients?: Array, ingredient_audit_trail?: Array, ingredient_nutrition_exclusions?: number[] }} recipe
 * @returns {Array<{ original?: string, parsed_name?: string, bls_name?: string, weight_g?: number, nutrient_contribution?: Record<string, number>, matched?: boolean, excludeFromNutrition?: boolean }>}
 */
export function getEffectiveAuditTrail(recipe) {
  const trail = recipe?.ingredient_audit_trail || []
  const ingredients = recipe?.ingredients || []
  const exclusions = new Set(Array.isArray(recipe?.ingredient_nutrition_exclusions) ? recipe.ingredient_nutrition_exclusions : [])
  if (!trail.length) return []
  return trail.map((entry, i) => {
    const ingredient = ingredients[i]
    const currentG = ingredient != null ? getIngredientWeightGrams(ingredient) : null
    const auditWeight = entry?.weight_g
    let result = { ...entry, excludeFromNutrition: exclusions.has(i) }
    if (
      currentG != null &&
      typeof currentG === 'number' &&
      currentG > 0 &&
      auditWeight != null &&
      typeof auditWeight === 'number' &&
      auditWeight > 0
    ) {
      const scale = currentG / auditWeight
      const contrib = entry.nutrient_contribution
      const scaledContrib =
        contrib && typeof contrib === 'object'
          ? Object.fromEntries(
              Object.entries(contrib).map(([k, v]) => [
                k,
                typeof v === 'number' ? v * scale : v,
              ])
            )
          : undefined
      result = {
        ...result,
        nutrient_contribution: scaledContrib ?? contrib,
        weight_g: currentG,
      }
    }
    return result
  })
}

/**
 * Sum nutrient_contribution across audit trail and map BLS keys to app nutrient types.
 * Now processes ALL 138 BLS columns.
 * @param {Array<{ nutrient_contribution?: Record<string, number> }>} ingredientAuditTrail
 * @returns {Array<{ type: string, number: number, unittype: string }>}
 */
export function buildNutrientsFromAuditTrail(ingredientAuditTrail) {
  if (!Array.isArray(ingredientAuditTrail)) return []
  const sums = {}
  for (const entry of ingredientAuditTrail) {
    if (entry.excludeFromNutrition) continue
    const contrib = entry?.nutrient_contribution
    if (!contrib || typeof contrib !== 'object') continue
    for (const [blsKey, value] of Object.entries(contrib)) {
      const mapped = BLS_COLUMN_TO_APP_NUTRIENT[blsKey]
      if (!mapped || typeof value !== 'number') continue
      const registryEntry = BLS_COLUMN_MAP.get(blsKey)
      const num = registryEntry?.conversionFromBls ? registryEntry.conversionFromBls(value) : value
      const key = mapped.type
      sums[key] = (sums[key] || 0) + num
    }
  }
  return Object.entries(sums).map(([type, number]) => {
    const mapped = Object.values(BLS_COLUMN_TO_APP_NUTRIENT).find((m) => m.type === type)
    return {
      type,
      number,
      unittype: mapped?.unittype || 'g',
    }
  })
}

/**
 * Per-ingredient contribution to a single nutrient (for “who contributes to this value?”).
 * Only works when recipe has ingredient_audit_trail from BLS pipeline.
 * @param {{ ingredient_audit_trail?: Array<{ original?: string, parsed_name?: string, weight_g?: number, nutrient_contribution?: Record<string, number> }> }} recipe
 * @param {string} nutrientType - app nutrient type (e.g. 'protein', 'kcal', 'carb2')
 * @returns {{ contributions: Array<{ label: string, contribution: number, weight_g?: number, percentOfTotal: number }>, total: number, unittype: string }}
 */
export function getIngredientContributionsForNutrient(recipe, nutrientType) {
  const blsCols = APP_TYPE_TO_BLS_COLUMNS[nutrientType]
  const unittype =
    blsCols?.length && BLS_COLUMN_TO_APP_NUTRIENT[blsCols[0]]
      ? BLS_COLUMN_TO_APP_NUTRIENT[blsCols[0]].unittype
      : 'g'
  if (!blsCols?.length) {
    return { contributions: [], total: 0, unittype }
  }
  const trail = getEffectiveAuditTrail(recipe)
  const contributions = []
  let total = 0
  for (let i = 0; i < trail.length; i++) {
    const entry = trail[i]
    if (entry.excludeFromNutrition) continue
    let contrib = 0
    for (const blsCol of blsCols) {
      const v = entry?.nutrient_contribution?.[blsCol]
      if (typeof v !== 'number') continue
      const registryEntry = BLS_COLUMN_MAP.get(blsCol)
      const num =
        registryEntry?.conversionFromBls ? registryEntry.conversionFromBls(v) : v
      contrib += num
    }
    if (contrib > 0) {
      const label =
        entry.original ??
        entry.parsed_name ??
        `Ingredient ${i + 1}`
      contributions.push({
        label,
        contribution: contrib,
        weight_g: entry.weight_g,
      })
      total += contrib
    }
  }
  contributions.sort((a, b) => b.contribution - a.contribution)
  const safeTotal = total > 0 ? total : 1
  contributions.forEach((c) => {
    c.percentOfTotal = (c.contribution / safeTotal) * 100
  })
  return { contributions, total, unittype }
}

/**
 * Get the nutrients array for a recipe, merging in values from ingredient_audit_trail
 * when the recipe's nutrients array is missing vitamins/minerals (so week table shows them).
 * Existing recipe.nutrients (author values) take precedence per canonical nutrient;
 * audit fills in only for canonical keys the author did not provide (e.g. no double calories/kcal).
 * Uses effective audit trail (scaled to current ingredient weights when set in grams).
 * @param {{ nutrients?: Array<{ type: string, number: number, unittype: string }>, ingredient_audit_trail?: Array, ingredients?: Array }} recipe
 * @returns {Array<{ type: string, number: number, unittype: string }>}
 */
export function getRecipeNutrientsForGoals(recipe) {
  const existing = recipe?.nutrients || []
  const effectiveTrail = getEffectiveAuditTrail(recipe)
  const fromAudit = buildNutrientsFromAuditTrail(effectiveTrail)
  const byCanonical = new Map()
  for (const n of existing) {
    if (n?.type == null || n.number == null) continue
    const c = getCanonicalKey(n.type)
    if (!byCanonical.has(c)) {
      byCanonical.set(c, { type: n.type, number: Number(n.number), unittype: n.unittype || 'g' })
    }
  }
  for (const n of fromAudit) {
    if (n?.type == null || n.number == null) continue
    const c = getCanonicalKey(n.type)
    if (!byCanonical.has(c)) {
      byCanonical.set(c, { type: n.type, number: Number(n.number), unittype: n.unittype || 'g' })
    }
  }
  return Array.from(byCanonical.values())
}

/**
 * Get numeric value for a goal key from a recipe's nutrients array.
 * Supports both canonical keys and legacy types via the registry.
 * @param {Array<{ type: string, number: number, unittype: string }>} nutrients
 * @param {string} goalKey - canonical key (e.g. 'calories', 'fiber', 'vitamin_d')
 * @param {{ ingredient_audit_trail?: Array }} [recipe]
 * @returns {number}
 */
export function getRecipeValueForGoal(nutrients, goalKey, recipe = null) {
  const effective = recipe ? getRecipeNutrientsForGoals(recipe) : (nutrients || [])

  // Try to find by canonical key first (nutrients stored with canonical type)
  let n = effective.find((x) => x.type === goalKey)
  if (n && n.number != null) return Number(n.number)

  // Fallback: try legacy types for this key
  const legacyTypes = GOAL_KEY_TO_TYPES.get(goalKey)
  if (legacyTypes) {
    for (const lt of legacyTypes) {
      n = effective.find((x) => x.type === lt)
      if (n && n.number != null) return Number(n.number)
    }
  }

  return 0
}

/**
 * Get value for a goal key from author-provided nutrients only (recipe.nutrients).
 * Returns null if the author did not provide that nutrient (so callers can skip or fall back).
 * @param {{ nutrients?: Array<{ type: string, number: number, unittype?: string }> }} recipe
 * @param {string} goalKey - canonical key (e.g. 'calories')
 * @returns {number|null}
 */
export function getRecipeAuthorValueForGoal(recipe, goalKey) {
  const nutrients = recipe?.nutrients || []
  let n = nutrients.find((x) => x.type === goalKey)
  if (n && n.number != null) return Number(n.number)
  const legacyTypes = GOAL_KEY_TO_TYPES.get(goalKey)
  if (legacyTypes) {
    for (const lt of legacyTypes) {
      n = nutrients.find((x) => x.type === lt)
      if (n && n.number != null) return Number(n.number)
    }
  }
  return null
}

/**
 * Check if a recipe satisfies all per-meal limits (max).
 * For 'calories', only the author-provided value is used; if the author didn't provide calories, the limit is not applied.
 * @param {{ id: string, nutrients?: Array, ingredient_audit_trail?: Array }} recipe
 * @param {Record<string, number>} perMealLimits
 * @returns {boolean}
 */
export function recipeSatisfiesPerMealLimits(recipe, perMealLimits) {
  if (!perMealLimits || typeof perMealLimits !== 'object') return true
  for (const [goalKey, maxValue] of Object.entries(perMealLimits)) {
    const limit = Number(maxValue)
    if (!Number.isFinite(limit) || limit <= 0) continue
    let value =
      goalKey === 'calories'
        ? getRecipeAuthorValueForGoal(recipe, goalKey)
        : getRecipeValueForGoal(recipe?.nutrients || [], goalKey, recipe)
    if (value == null) {
      if (goalKey === 'calories') continue
      value = 0
    }
    if (Number(value) > limit) return false
  }
  return true
}

/**
 * Check if a recipe satisfies all per-meal minimums (e.g. at least 500 kcal per meal).
 * For 'calories', only the author-provided value is used; if the author didn't provide calories, the minimum is not applied.
 * @param {{ id: string, nutrients?: Array, ingredient_audit_trail?: Array }} recipe
 * @param {Record<string, number>} perMealMinimums - e.g. { calories: 500 }
 * @returns {boolean}
 */
export function recipeSatisfiesPerMealMinimums(recipe, perMealMinimums) {
  if (!perMealMinimums || typeof perMealMinimums !== 'object') return true
  for (const [goalKey, minValue] of Object.entries(perMealMinimums)) {
    const min = Number(minValue)
    if (!Number.isFinite(min) || min <= 0) continue
    let value =
      goalKey === 'calories'
        ? getRecipeAuthorValueForGoal(recipe, goalKey)
        : getRecipeValueForGoal(recipe?.nutrients || [], goalKey, recipe)
    if (value == null) {
      if (goalKey === 'calories') continue
      else value = 0
    }
    if (Number(value) < min) return false
  }
  return true
}
