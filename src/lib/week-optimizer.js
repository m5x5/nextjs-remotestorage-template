/**
 * Linear programming optimizer for selecting optimal recipes for the week.
 * Maximizes nutritional coverage (sum of nutrients relative to weekly goals)
 * subject to selecting exactly N recipes.
 */

import solver from 'javascript-lp-solver'
import { getRecipeValueForGoal, WEEKLY_GOALS, WEEKLY_GOAL_KEYS, recipeSatisfiesPerMealLimits, recipeSatisfiesPerMealMinimums } from './weekly-goals'

/**
 * Compute nutrition score for one recipe (sum of value/goal for each nutrient with a goal).
 * @param {Object} recipe - { id, nutrients }
 * @param {Object} weeklyGoals - { calories: 14000, protein: 385, ... }
 * @returns {number}
 */
function recipeScore(recipe, weeklyGoals) {
  const goals = weeklyGoals || WEEKLY_GOALS
  let score = 0
  const nutrients = recipe.nutrients || []
  for (const key of WEEKLY_GOAL_KEYS) {
    const goal = goals[key]
    if (!goal || goal <= 0) continue
    const value = getRecipeValueForGoal(nutrients, key, recipe)
    score += value / goal
  }
  return score
}

/**
 * Select optimal recipes for the week using mixed-integer linear programming.
 * - Recipes with excluded: true are not considered.
 * - Recipes with pinned: true are always included; the optimizer fills the remaining slots.
 * - Recipes that exceed any per-meal limit or fall below any per-meal minimum are excluded before solving.
 * @param {Array<{ id: string, nutrients: Array, excluded?: boolean, pinned?: boolean }>} recipes - All recipes (excluded ones are filtered out by caller or here)
 * @param {number} numToSelect - Number of recipes to select (e.g. 7)
 * @param {Object} weeklyGoals - Optional override of weekly goals
 * @param {Record<string, number>} [perMealLimits] - Optional max per meal, e.g. { calories: 800, fat: 50 }
 * @param {Record<string, number>} [perMealMinimums] - Optional min per meal, e.g. { calories: 500 }
 * @returns {{ selectedIds: string[], feasible: boolean, result?: number, excludedByLimits?: number, excludedByMinimums?: number, pinnedCount?: number }}
 */
export function optimizeWeekRecipes(recipes, numToSelect = 7, weeklyGoals = null, perMealLimits = null, perMealMinimums = null) {
  const goals = weeklyGoals || WEEKLY_GOALS
  const hasLimits = perMealLimits && typeof perMealLimits === 'object' && Object.keys(perMealLimits).length > 0
  const hasMinimums = perMealMinimums && typeof perMealMinimums === 'object' && Object.keys(perMealMinimums).length > 0

  // Exclude recipes marked as excluded from optimization
  let candidateRecipes = (recipes || []).filter((r) => !r.excluded)

  // Split into pinned (fixed) and rest (optimizer chooses from these)
  const pinnedRecipes = candidateRecipes.filter((r) => r.pinned)
  const pinnedIds = pinnedRecipes.map((r) => r.id)
  candidateRecipes = candidateRecipes.filter((r) => !r.pinned)

  let excludedByLimits = 0
  let excludedByMinimums = 0
  if (hasLimits) {
    const before = candidateRecipes.length
    candidateRecipes = candidateRecipes.filter((r) => recipeSatisfiesPerMealLimits(r, perMealLimits))
    excludedByLimits = before - candidateRecipes.length
  }
  if (hasMinimums) {
    const before = candidateRecipes.length
    candidateRecipes = candidateRecipes.filter((r) => recipeSatisfiesPerMealMinimums(r, perMealMinimums))
    excludedByMinimums = before - candidateRecipes.length
  }

  const numSlotsToOptimize = Math.max(0, numToSelect - pinnedIds.length)

  if (numToSelect <= 0) {
    return { selectedIds: [], feasible: false, excludedByLimits, excludedByMinimums, pinnedCount: pinnedIds.length }
  }
  if (numSlotsToOptimize === 0) {
    return { selectedIds: pinnedIds.slice(0, numToSelect), feasible: true, excludedByLimits, excludedByMinimums, pinnedCount: pinnedIds.length }
  }
  if (!candidateRecipes.length) {
    return { selectedIds: pinnedIds.slice(0, numToSelect), feasible: pinnedIds.length >= numToSelect, excludedByLimits, excludedByMinimums, pinnedCount: pinnedIds.length }
  }
  if (candidateRecipes.length <= numSlotsToOptimize) {
    const optimizedIds = candidateRecipes.map((r) => r.id)
    const selectedIds = [...pinnedIds, ...optimizedIds].slice(0, numToSelect)
    return { selectedIds, feasible: true, excludedByLimits, excludedByMinimums, pinnedCount: pinnedIds.length }
  }

  const variables = {}
  const constraints = { count: { equal: numSlotsToOptimize } }
  const ints = {}

  candidateRecipes.forEach((recipe, i) => {
    const varName = `x${i}`
    const score = recipeScore(recipe, goals)
    variables[varName] = { count: 1, score }
    constraints[`${varName}_max`] = { max: 1 }
    variables[varName][`${varName}_max`] = 1
    ints[varName] = 1
  })

  const model = {
    optimize: 'score',
    opType: 'max',
    constraints,
    variables,
    ints,
  }

  const result = solver.Solve(model)
  if (!result.feasible) {
    return { selectedIds: [], feasible: false, excludedByLimits, excludedByMinimums, pinnedCount: pinnedIds.length }
  }

  const optimizedIds = []
  candidateRecipes.forEach((r, i) => {
    if (result[`x${i}`] === 1) optimizedIds.push(r.id)
  })
  const selectedIds = [...pinnedIds, ...optimizedIds].slice(0, numToSelect)

  return { selectedIds, feasible: true, result: result.result, excludedByLimits, excludedByMinimums, pinnedCount: pinnedIds.length }
}
