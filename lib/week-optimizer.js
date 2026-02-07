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
 * Recipes that exceed any per-meal limit or fall below any per-meal minimum are excluded before solving.
 * @param {Array<{ id: string, nutrients: Array }>} recipes - All recipes
 * @param {number} numToSelect - Number of recipes to select (e.g. 7)
 * @param {Object} weeklyGoals - Optional override of weekly goals
 * @param {Record<string, number>} [perMealLimits] - Optional max per meal, e.g. { calories: 800, fat: 50 }
 * @param {Record<string, number>} [perMealMinimums] - Optional min per meal, e.g. { calories: 500 }
 * @returns {{ selectedIds: string[], feasible: boolean, result?: number, excludedByLimits?: number, excludedByMinimums?: number }}
 */
export function optimizeWeekRecipes(recipes, numToSelect = 7, weeklyGoals = null, perMealLimits = null, perMealMinimums = null) {
  const goals = weeklyGoals || WEEKLY_GOALS
  const hasLimits = perMealLimits && typeof perMealLimits === 'object' && Object.keys(perMealLimits).length > 0
  const hasMinimums = perMealMinimums && typeof perMealMinimums === 'object' && Object.keys(perMealMinimums).length > 0
  let candidateRecipes = recipes
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

  if (!candidateRecipes.length || numToSelect <= 0) {
    return { selectedIds: [], feasible: false, excludedByLimits, excludedByMinimums }
  }
  if (candidateRecipes.length <= numToSelect) {
    return { selectedIds: candidateRecipes.map((r) => r.id), feasible: true, excludedByLimits, excludedByMinimums }
  }

  const variables = {}
  const constraints = { count: { equal: numToSelect } }
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
    return { selectedIds: [], feasible: false, excludedByLimits, excludedByMinimums }
  }

  const selectedIds = []
  candidateRecipes.forEach((r, i) => {
    if (result[`x${i}`] === 1) selectedIds.push(r.id)
  })

  return { selectedIds, feasible: true, result: result.result, excludedByLimits, excludedByMinimums }
}
