"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { useRemoteStorageContext } from "@/contexts/RemoteStorageContext"
import { isSchemaOrgRecipe, schemaToRecipe } from "@/lib/recipe-schema"
import { parseCSV } from "@/lib/csv-parse"
import {
  WEEKLY_GOAL_KEYS,
  getRecipeValueForGoal,
  buildNutrientsFromBlsRow,
} from "@/lib/weekly-goals"
import {
  NUTRIENT_LABELS,
  NUTRIENT_UNITS,
  CORE_NUTRIENT_KEYS,
  ALL_NUTRIENT_KEYS,
  DEFAULT_WEEKLY_GOALS,
} from "@/lib/nutrient-registry"
import { optimizeWeekRecipes } from "@/lib/week-optimizer"
import { INITIAL_RECIPES } from "@/lib/initial-recipes"
import {
  formatNutrientType,
  formatIngredientQuantity,
  formatBlsNutrientKey,
  getMainNutrients,
  getDailyPercentage as getDailyPercentageUtil,
  getAllNutrientPercentages as getAllNutrientPercentagesUtil,
} from "@/lib/recipe-display-utils"

export function useRecipePage() {
  const {
    isConnected,
    isLoading,
    recipes,
    recipesList,
    saveRecipe,
    loadRecipe,
    deleteRecipe,
    refreshRecipesList,
    loadRecipesList,
    loadRecipesByIds,
    loadAllRecipesForOptimizer,
    updateRecipeInList,
    settings,
    saveSettings,
    setSkipNextLoadAllData,
    remoteStorage,
    cleanupDuplicates,
  } = useRemoteStorageContext()
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  const [selectedRecipe, setSelectedRecipe] = useState(null)
  const [editingCookidooUrl, setEditingCookidooUrl] = useState(false)
  const [cookidooUrlInput, setCookidooUrlInput] = useState("")
  const [editingServings, setEditingServings] = useState(false)
  const [servingsInput, setServingsInput] = useState(2)
  const [editingYield, setEditingYield] = useState(false)
  const [yieldTypeInput, setYieldTypeInput] = useState("portions")
  const [yieldQuantityInput, setYieldQuantityInput] = useState(4)
  const [yieldUnitInput, setYieldUnitInput] = useState("g")
  const [editingIngredients, setEditingIngredients] = useState(false)
  const [ingredientsEditList, setIngredientsEditList] = useState([])
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("info")
  const [showRecipeModal, setShowRecipeModal] = useState(false)
  const [schemaOrgIngredientIndex, setSchemaOrgIngredientIndex] = useState(null)
  const [blsIngredientIndex, setBlsIngredientIndex] = useState(null)
  const [showFullBlsAudit, setShowFullBlsAudit] = useState(false)
  const [showInspectCalculation, setShowInspectCalculation] = useState(false)
  const blsAuditRef = useRef(null)
  const [isCleaningUp, setIsCleaningUp] = useState(false)
  const [editingDefaultServings, setEditingDefaultServings] = useState(false)
  const [defaultServingsInput, setDefaultServingsInput] = useState(2)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importJsonInput, setImportJsonInput] = useState("")
  const [isImporting, setIsImporting] = useState(false)
  const [isImportingCsv, setIsImportingCsv] = useState(false)
  const csvFileInputRef = useRef(null)
  const [isImportingByLinks, setIsImportingByLinks] = useState(false)
  const csvLinksFileInputRef = useRef(null)
  const [showManageWeekModal, setShowManageWeekModal] = useState(false)
  const [manageWeekSelectedIds, setManageWeekSelectedIds] = useState([])
  const [copiedIngredient, setCopiedIngredient] = useState(null)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizeNumToSelect, setOptimizeNumToSelectState] = useState(7)
  const [optimizeMinMatchRate, setOptimizeMinMatchRateState] = useState(60)
  const [optimizePerMealLimits, setOptimizePerMealLimitsState] = useState({})
  const [optimizePerMealMinimums, setOptimizePerMealMinimumsState] = useState({})
  const [ingredientsRecipes, setIngredientsRecipes] = useState([])
  const [ingredientsRecipesLoading, setIngredientsRecipesLoading] = useState(false)
  const hasInitializedRef = useRef(false)
  const hasCleanedRef = useRef(false)

  // Sync optimization filters from settings whenever they change (e.g. after load from RemoteStorage on reload)
  useEffect(() => {
    if (!isConnected) return
    const num = settings.optimizeNumToSelect
    const rate = settings.optimizeMinMatchRate
    const limits = settings.optimizePerMealLimits
    const minimums = settings.optimizePerMealMinimums
    if (num != null) setOptimizeNumToSelectState(Number(num) || 7)
    if (rate != null) setOptimizeMinMatchRateState(Number(rate) ?? 60)
    if (limits && typeof limits === "object") setOptimizePerMealLimitsState(limits)
    if (minimums && typeof minimums === "object") setOptimizePerMealMinimumsState(minimums)
  }, [
    isConnected,
    settings.optimizeNumToSelect,
    settings.optimizeMinMatchRate,
    settings.optimizePerMealLimits,
    settings.optimizePerMealMinimums,
  ])

  const setOptimizeNumToSelect = useCallback(
    (value) => {
      const next = typeof value === "function" ? value(optimizeNumToSelect) : value
      setOptimizeNumToSelectState(next)
      saveSettings?.((prev) => ({ ...prev, optimizeNumToSelect: next }))
    },
    [saveSettings, optimizeNumToSelect]
  )
  const setOptimizeMinMatchRate = useCallback(
    (value) => {
      const next = typeof value === "function" ? value(optimizeMinMatchRate) : value
      setOptimizeMinMatchRateState(next)
      saveSettings?.((prev) => ({ ...prev, optimizeMinMatchRate: next }))
    },
    [saveSettings, optimizeMinMatchRate]
  )
  const setOptimizePerMealLimits = useCallback(
    (value) => {
      const next = typeof value === "function" ? value(optimizePerMealLimits) : value
      setOptimizePerMealLimitsState(next)
      saveSettings?.((prev) => ({ ...prev, optimizePerMealLimits: next }))
    },
    [saveSettings, optimizePerMealLimits]
  )
  const setOptimizePerMealMinimums = useCallback(
    (value) => {
      const next = typeof value === "function" ? value(optimizePerMealMinimums) : value
      setOptimizePerMealMinimumsState(next)
      saveSettings?.((prev) => ({ ...prev, optimizePerMealMinimums: next }))
    },
    [saveSettings, optimizePerMealMinimums]
  )

  const weekRecipeIds = settings.weekRecipeIds || []
  const weekRecipes = useMemo(
    () => recipes.filter((r) => r && r.id && weekRecipeIds.includes(r.id)),
    [recipes, weekRecipeIds]
  )

  const weeklyTotalsByKey = useMemo(() => {
    // Compute totals for all nutrients that have goals set (custom or default)
    const goalKeys = new Set(CORE_NUTRIENT_KEYS)
    if (settings.weeklyGoals) {
      Object.keys(settings.weeklyGoals).forEach((k) => {
        if (settings.weeklyGoals[k] > 0) goalKeys.add(k)
      })
    }
    if (settings.dailyRecommended) {
      Object.keys(settings.dailyRecommended).forEach((k) => {
        if (settings.dailyRecommended[k] > 0) goalKeys.add(k)
      })
    }
    // Also compute for all keys that appear in any recipe's nutrients
    for (const r of weekRecipes) {
      for (const n of (r.nutrients || [])) {
        if (n?.type) goalKeys.add(n.type)
      }
    }
    const totals = {}
    goalKeys.forEach((key) => {
      totals[key] = weekRecipes.reduce(
        (sum, r) => sum + getRecipeValueForGoal(r.nutrients || [], key, r),
        0
      )
    })
    return totals
  }, [weekRecipes, settings.weeklyGoals, settings.dailyRecommended])

  const dailyRecommended = settings.dailyRecommended || null
  const getDailyPercentage = (nutrientType, value, unittype, servings = 2) =>
    getDailyPercentageUtil(nutrientType, value, unittype, servings, dailyRecommended)
  const getAllNutrientPercentages = (nutrients, servings = 2) =>
    getAllNutrientPercentagesUtil(nutrients, servings, dailyRecommended)

  useEffect(() => {
    if (isConnected && settings.theme && settings.theme !== theme) {
      setTheme(settings.theme)
    }
    if (isConnected && settings.defaultServings) {
      setDefaultServingsInput(settings.defaultServings)
    }
  }, [isConnected, settings.theme, settings.defaultServings, theme, setTheme])

  useEffect(() => {
    if (!isConnected || isLoading || hasCleanedRef.current) return
    if (!cleanupDuplicates || !remoteStorage?.mymodule) return
    const cleanup = async () => {
      hasCleanedRef.current = true
      try {
        const result = await cleanupDuplicates()
        if (result.removed > 0) {
          setMessage(`Cleaned up ${result.removed} duplicate recipe(s)`)
          setMessageType("success")
          setTimeout(() => setMessage(""), 3000)
        }
      } catch (error) {
        console.error("Error cleaning up duplicates:", error)
      }
    }
    cleanup()
  }, [isConnected, isLoading, cleanupDuplicates, remoteStorage])

  useEffect(() => {
    if (hasInitializedRef.current || !isConnected || isLoading || !remoteStorage?.mymodule) return
    const initializeRecipes = async () => {
      try {
        const hasAny = await remoteStorage.mymodule.hasAnyRecipes()
        if (hasAny) {
          hasInitializedRef.current = true
          return
        }
        hasInitializedRef.current = true
        for (let index = 0; index < INITIAL_RECIPES.length; index++) {
          const recipe = INITIAL_RECIPES[index]
          const recipeData = {
            id: `recipe-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
            ...recipe,
            created_at: new Date().toISOString(),
          }
          await saveRecipe(recipeData)
          await new Promise((r) => setTimeout(r, 100))
        }
      } catch (error) {
        console.error("Error initializing recipes:", error)
        hasInitializedRef.current = false
      }
    }
    initializeRecipes()
  }, [isConnected, isLoading, remoteStorage, saveRecipe])

  const loadIngredientsRecipes = useCallback(() => {
    if (!isConnected || !loadAllRecipesForOptimizer) return
    setIngredientsRecipesLoading(true)
    loadAllRecipesForOptimizer()
      .then((list) => {
        if (list) setIngredientsRecipes(list)
      })
      .finally(() => {
        setIngredientsRecipesLoading(false)
      })
  }, [isConnected, loadAllRecipesForOptimizer])

  const handleThemeChange = async (newTheme) => {
    setTheme(newTheme)
    if (isConnected) {
      try {
        await saveSettings({ ...settings, theme: newTheme })
        setMessage("Theme updated successfully!")
        setMessageType("success")
        setTimeout(() => setMessage(""), 2000)
      } catch (error) {
        setMessage("Error saving theme: " + error.message)
        setMessageType("error")
      }
    }
  }

  const handleManualCleanup = async () => {
    if (!isConnected || !cleanupDuplicates) return
    setIsCleaningUp(true)
    try {
      const result = await cleanupDuplicates()
      if (result.removed > 0) {
        setMessage(`Successfully removed ${result.removed} duplicate recipe(s). Kept ${result.kept} unique recipe(s).`)
        setMessageType("success")
      } else {
        setMessage("No duplicates found. Your data is clean!")
        setMessageType("info")
      }
      setTimeout(() => setMessage(""), 5000)
    } catch (error) {
      setMessage("Error cleaning up duplicates: " + error.message)
      setMessageType("error")
      setTimeout(() => setMessage(""), 5000)
    } finally {
      setIsCleaningUp(false)
    }
  }

  const handleSaveDefaultServings = async () => {
    const parsedServings = parseInt(defaultServingsInput, 10)
    if (isNaN(parsedServings) || parsedServings < 1) {
      setMessage("Please enter a valid number of servings (minimum 1)")
      setMessageType("error")
      setTimeout(() => setMessage(""), 3000)
      return
    }
    try {
      await saveSettings({ ...settings, defaultServings: parsedServings })
      setEditingDefaultServings(false)
      setMessage("Default servings updated successfully!")
      setMessageType("success")
      setTimeout(() => setMessage(""), 2000)
    } catch (error) {
      setMessage("Error saving default servings: " + error.message)
      setMessageType("error")
      setTimeout(() => setMessage(""), 3000)
    }
  }

  const handleImportRecipes = async () => {
    if (!importJsonInput.trim()) {
      setMessage("Please paste JSON data to import")
      setMessageType("error")
      setTimeout(() => setMessage(""), 3000)
      return
    }
    setIsImporting(true)
    try {
      const parsed = JSON.parse(importJsonInput)
      const defaultServings = settings.defaultServings || 2
      let imported = 0
      let errors = 0
      if (!Array.isArray(parsed) && isSchemaOrgRecipe(parsed)) {
        const recipe = schemaToRecipe(parsed, undefined, {})
        await saveRecipe(recipe)
        setShowImportModal(false)
        setImportJsonInput("")
        setMessage("Recipe imported with schema.org data.")
        setMessageType("success")
        setTimeout(() => setMessage(""), 5000)
        setIsImporting(false)
        return
      }
      const recipesData = Array.isArray(parsed) ? parsed : [parsed]
      const importedEntries = []
      for (const recipeData of recipesData) {
        try {
          let recipe
          if (isSchemaOrgRecipe(recipeData)) {
            recipe = schemaToRecipe(recipeData, undefined, {})
          } else {
            const recipeId = `recipe-${Date.now()}-${imported}-${Math.random().toString(36).substr(2, 9)}`
            const cookidooUrl = recipeData.link || recipeData.cookidooUrl
            let normalizedIngredients = null
            if (
              recipeData.ingredients &&
              Array.isArray(recipeData.ingredients) &&
              recipeData.ingredients.length > 0
            ) {
              normalizedIngredients = recipeData.ingredients.map((ingredient) => {
                const normalized = { ...ingredient }
                if (
                  normalized.recipeAlternativeIngredient &&
                  typeof normalized.recipeAlternativeIngredient === "object"
                ) {
                  normalized.recipeAlternativeIngredient =
                    normalized.recipeAlternativeIngredient.ingredientNotation ??
                    JSON.stringify(normalized.recipeAlternativeIngredient)
                }
                if (
                  normalized.quantity?.unitNotation &&
                  typeof normalized.quantity.unitNotation !== "string"
                ) {
                  normalized.quantity.unitNotation = String(normalized.quantity.unitNotation)
                }
                if (
                  normalized.quantity?.preparation &&
                  typeof normalized.quantity.preparation !== "string"
                ) {
                  normalized.quantity.preparation = String(normalized.quantity.preparation)
                }
                if (
                  normalized.ingredientNotation &&
                  typeof normalized.ingredientNotation !== "string"
                ) {
                  normalized.ingredientNotation = String(normalized.ingredientNotation)
                }
                return normalized
              })
            }
            recipe = {
              id: recipeId,
              title: recipeData.title,
              ...(recipeData.image && { image: recipeData.image }),
              ...(cookidooUrl && { cookidooUrl }),
              nutrients: recipeData.nutrients || [],
              ...(normalizedIngredients?.length > 0 && { ingredients: normalizedIngredients }),
              servings: recipeData.servings || defaultServings,
              created_at: new Date().toISOString(),
            }
          }
          const updated_at = await saveRecipe(recipe, { skipListUpdate: true })
          importedEntries.push({
            id: recipe.id,
            title: recipe.title,
            updated_at: updated_at || new Date().toISOString(),
          })
          imported++
          await new Promise((r) => setTimeout(r, 100))
        } catch (err) {
          console.error("Error importing recipe:", err)
          errors++
        }
      }
      if (importedEntries.length > 0 && refreshRecipesList) {
        await refreshRecipesList(importedEntries, { appendOnly: true })
      }
      setShowImportModal(false)
      setImportJsonInput("")
      if (imported > 0) {
        setMessage(
          `Successfully imported ${imported} recipe(s)${errors > 0 ? ` (${errors} failed)` : ""}!`
        )
        setMessageType("success")
      } else {
        setMessage(
          "No recipes were imported. Use schema.org Recipe JSON or an array of recipe objects."
        )
        setMessageType("error")
      }
      setTimeout(() => setMessage(""), 5000)
    } catch (error) {
      setMessage("Error parsing JSON: " + error.message)
      setMessageType("error")
      setTimeout(() => setMessage(""), 5000)
    } finally {
      setIsImporting(false)
    }
  }

  const handleImportFromCsv = async (e) => {
    const file = e?.target?.files?.[0]
    if (!file) return
    setIsImportingCsv(true)
    try {
      const text = await file.text()
      const { headers, rows } = parseCSV(text)
      const schemaCol = headers.find((h) => h?.trim() === "schema_org_json")
      const nameCol = headers.find((h) => h?.trim() === "recipe_name")
      const urlCol = headers.find((h) => h?.trim() === "recipe_url")
      const matchRateCol = headers.find((h) => (h || "").trim() === "match_rate_%")
      const matchedCol = headers.find((h) => (h || "").trim() === "ingredients_matched")
      const skippedCol = headers.find((h) => (h || "").trim() === "ingredients_skipped")
      const auditCol = headers.find((h) => (h || "").trim() === "ingredient_audit_trail")
      if (!schemaCol) {
        setMessage("CSV must have a 'schema_org_json' column (from recipe_pipeline).")
        setMessageType("error")
        setTimeout(() => setMessage(""), 5000)
        setIsImportingCsv(false)
        return
      }
      let imported = 0
      let errors = 0
      const importedEntries = []
      for (const row of rows) {
        const raw = row[schemaCol]
        if (!raw || !raw.trim()) continue
        try {
          const schema = JSON.parse(raw)
          let auditTrail = null
          if (auditCol && row[auditCol] && String(row[auditCol]).trim()) {
            try {
              auditTrail = JSON.parse(row[auditCol])
              if (!Array.isArray(auditTrail)) auditTrail = null
            } catch (_) {}
          }
          const blsNutrients = buildNutrientsFromBlsRow(row, headers)
          const recipe = schemaToRecipe(schema, undefined, {
            recipe_name: nameCol ? row[nameCol] : undefined,
            recipe_url: urlCol ? row[urlCol] : undefined,
            ingredients_matched:
              matchedCol && row[matchedCol] !== undefined && row[matchedCol] !== ""
                ? row[matchedCol]
                : undefined,
            ingredients_skipped:
              skippedCol && row[skippedCol] !== undefined && row[skippedCol] !== ""
                ? row[skippedCol]
                : undefined,
            match_rate:
              matchRateCol && row[matchRateCol] !== undefined && row[matchRateCol] !== ""
                ? row[matchRateCol]
                : undefined,
            ingredient_audit_trail: auditTrail,
            ...(blsNutrients.length > 0 && { nutrients: blsNutrients }),
          })
          const updated_at = await saveRecipe(recipe, { skipListUpdate: true })
          importedEntries.push({
            id: recipe.id,
            title: recipe.title,
            updated_at: updated_at || new Date().toISOString(),
          })
          imported++
          await new Promise((r) => setTimeout(r, 50))
        } catch (err) {
          errors++
        }
      }
      if (importedEntries.length > 0 && refreshRecipesList) {
        await refreshRecipesList(importedEntries, { appendOnly: true })
      }
      if (csvFileInputRef.current) csvFileInputRef.current.value = ""
      setMessage(
        `Imported ${imported} recipe(s) from pipeline CSV${errors > 0 ? ` (${errors} skipped)` : ""}.`
      )
      setMessageType(imported > 0 ? "success" : "error")
      setTimeout(() => setMessage(""), 5000)
    } catch (error) {
      setMessage("Error reading CSV: " + error.message)
      setMessageType("error")
      setTimeout(() => setMessage(""), 5000)
    } finally {
      setIsImportingCsv(false)
    }
  }

  const handleImportFromCsvByLinks = async (e) => {
    const file = e?.target?.files?.[0]
    if (!file) return
    setIsImportingByLinks(true)
    setMessage("Importing… fetching and scraping each link.")
    setMessageType("info")
    try {
      const text = await file.text()
      const { headers, rows } = parseCSV(text)
      const urlCol =
        headers.find((h) => h?.trim() === "link--alt href") ||
        headers.find((h) => h?.trim() === "recipe_url") ||
        headers.find((h) => h?.trim() === "url") ||
        headers.find((h) => h?.trim() === "link") ||
        headers.find((h) => rows.some((row) => (row[h] || "").trim().startsWith("http")))
      if (!urlCol) {
        setMessage(
          "CSV must have a column with recipe URLs (e.g. link--alt href, recipe_url, url, link)."
        )
        setMessageType("error")
        setTimeout(() => setMessage(""), 5000)
        setIsImportingByLinks(false)
        return
      }
      const urls = []
      const seen = new Set()
      for (const row of rows) {
        const u = (row[urlCol] || "").trim()
        if (u && u.startsWith("http") && !seen.has(u)) {
          seen.add(u)
          urls.push(u)
        }
      }
      if (urls.length === 0) {
        setMessage("No valid recipe URLs found in the CSV.")
        setMessageType("error")
        setTimeout(() => setMessage(""), 5000)
        setIsImportingByLinks(false)
        return
      }
      let imported = 0
      let errors = 0
      const importedEntries = []
      for (let i = 0; i < urls.length; i++) {
        setMessage(`Importing ${i + 1}/${urls.length}: ${urls[i].slice(0, 50)}…`)
        try {
          const res = await fetch("/api/scrape-recipe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: urls[i] }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || res.statusText)
          const schema = data.schema
          if (!schema) throw new Error("No schema")
          const recipe = schemaToRecipe(schema, undefined, { recipe_url: urls[i] })
          const updated_at = await saveRecipe(recipe, { skipListUpdate: true })
          importedEntries.push({
            id: recipe.id,
            title: recipe.title,
            updated_at: updated_at || new Date().toISOString(),
          })
          imported++
          await new Promise((r) => setTimeout(r, 300))
        } catch (err) {
          errors++
        }
      }
      if (importedEntries.length > 0 && refreshRecipesList) {
        await refreshRecipesList(importedEntries, { appendOnly: true })
      }
      if (csvLinksFileInputRef.current) csvLinksFileInputRef.current.value = ""
      setMessage(
        `Imported ${imported} recipe(s) from ${urls.length} links${errors > 0 ? ` (${errors} failed)` : ""}.`
      )
      setMessageType(imported > 0 ? "success" : "error")
      setTimeout(() => setMessage(""), 6000)
    } catch (error) {
      setMessage("Error: " + error.message)
      setMessageType("error")
      setTimeout(() => setMessage(""), 5000)
    } finally {
      setIsImportingByLinks(false)
    }
  }

  const handleSetWeekRecipes = async (ids) => {
    try {
      await saveSettings({ ...settings, weekRecipeIds: ids })
      setShowManageWeekModal(false)
      setMessage("Week updated.")
      setMessageType("success")
      setTimeout(() => setMessage(""), 2000)
    } catch (err) {
      setMessage("Failed to update week: " + err.message)
      setMessageType("error")
      setTimeout(() => setMessage(""), 3000)
    }
  }

  const openManageWeekModal = async () => {
    if (loadRecipesList) await loadRecipesList()
    setManageWeekSelectedIds([...(settings.weekRecipeIds || [])])
    setShowManageWeekModal(true)
  }

  const runOptimization = async () => {
    console.log("[Optimize] runOptimization: clicked, starting…")
    if (!loadAllRecipesForOptimizer || !loadRecipesByIds || !saveSettings) {
      console.warn("[Optimize] runOptimization: missing deps, aborting", {
        loadAllRecipesForOptimizer: !!loadAllRecipesForOptimizer,
        loadRecipesByIds: !!loadRecipesByIds,
        saveSettings: !!saveSettings,
      })
      return
    }
    const numToSelect = Math.max(1, Math.min(100, parseInt(optimizeNumToSelect, 10) || 7))
    setIsOptimizing(true)
    try {
      console.log("[Optimize] Loading all recipes from storage…")
      const tLoadStart = Date.now()
      const allRecipes = await loadAllRecipesForOptimizer()
      console.log(`[Optimize] Loaded ${allRecipes?.length ?? 0} recipes in ${Date.now() - tLoadStart}ms`)
      if (!allRecipes || allRecipes.length === 0) {
        setMessage("No recipes in storage. Import recipes in Settings first.")
        setMessageType("info")
        setTimeout(() => setMessage(""), 4000)
        return
      }
      const minMatchRate = Math.max(0, Math.min(100, parseInt(optimizeMinMatchRate, 10) || 0))
      let recipesForOptimizer =
        minMatchRate <= 0
          ? allRecipes
          : allRecipes.filter((r) => r.match_rate == null || Number(r.match_rate) >= minMatchRate)
      const filteredIngredientList = settings.filteredIngredients || []
      if (filteredIngredientList.length > 0) {
        recipesForOptimizer = recipesForOptimizer.filter((recipe) => {
          const ings = recipe.ingredients || []
          return !ings.some((ing) => {
            const n = ing.ingredientNotation ?? ing.name
            const str = typeof n === "string" ? n : ""
            return filteredIngredientList.some((f) => str.includes(f))
          })
        })
      }
      console.log(`[Optimize] After filters: ${recipesForOptimizer.length} candidates (minMatchRate=${minMatchRate}, numToSelect=${numToSelect})`)
      if (recipesForOptimizer.length < numToSelect) {
        setMessage(
          `Only ${recipesForOptimizer.length} recipe(s) have BLS match rate ≥ ${minMatchRate}%. Need at least ${numToSelect}. Lower the minimum match rate or add more recipes.`
        )
        setMessageType("warning")
        setTimeout(() => setMessage(""), 5000)
        return
      }
      const perMealLimits = Object.fromEntries(
        Object.entries(optimizePerMealLimits || {}).filter(
          ([, v]) => typeof v === 'number' && Number.isFinite(v) && v > 0
        )
      )
      const perMealMinimums = Object.fromEntries(
        Object.entries(optimizePerMealMinimums || {}).filter(
          ([, v]) => typeof v === 'number' && Number.isFinite(v) && v > 0
        )
      )
      // Weekly goals are per person; optimizer sees household total → pass household goals (×2) so it maximizes per-person coverage
      const householdSize = 2
      const baseGoals = { ...DEFAULT_WEEKLY_GOALS, ...(settings.weeklyGoals || {}) }
      const weeklyGoalsForOptimizer = Object.fromEntries(
        Object.entries(baseGoals)
          .filter(([, v]) => v != null && Number(v) > 0)
          .map(([k, v]) => [k, Number(v) * householdSize])
      )
      console.log("[Optimize] Running LP optimizer…")
      const tOptStart = Date.now()
      const { selectedIds, feasible, excludedByLimits, excludedByMinimums, pinnedCount } = optimizeWeekRecipes(
        recipesForOptimizer,
        numToSelect,
        Object.keys(weeklyGoalsForOptimizer).length > 0 ? weeklyGoalsForOptimizer : undefined,
        Object.keys(perMealLimits).length ? perMealLimits : undefined,
        Object.keys(perMealMinimums).length ? perMealMinimums : undefined
      )
      console.log(`[Optimize] Optimizer finished in ${Date.now() - tOptStart}ms: feasible=${feasible}, selected=${selectedIds?.length ?? 0}, pinned=${pinnedCount ?? 0}`)
      if (!feasible || selectedIds.length === 0) {
        const limitHint =
          excludedByLimits > 0
            ? ` ${excludedByLimits} recipe(s) were excluded by per-meal limits.`
            : ''
        const minHint =
          excludedByMinimums > 0
            ? ` ${excludedByMinimums} recipe(s) were excluded by per-meal minimums.`
            : ''
        setMessage(
          "Optimization could not find a solution. Try adding more recipes or relaxing goals." + limitHint + minHint
        )
        setMessageType("warning")
        setTimeout(() => setMessage(""), 4000)
        return
      }
      setSkipNextLoadAllData?.()
      console.log("[Optimize] Saving week and loading recipe details…")
      const tSaveStart = Date.now()
      await saveSettings({ ...settings, weekRecipeIds: selectedIds })
      await loadRecipesByIds(selectedIds)
      console.log(`[Optimize] Save + load done in ${Date.now() - tSaveStart}ms`)
      const limitNote =
        excludedByLimits > 0 ? ` (${excludedByLimits} excluded by per-meal limits)` : ''
      const minNote =
        excludedByMinimums > 0 ? ` (${excludedByMinimums} excluded by per-meal minimums)` : ''
      const pinnedNote =
        pinnedCount > 0 ? ` ${pinnedCount} pinned, ${selectedIds.length - pinnedCount} chosen by optimizer.` : ''
      setMessage(
        `Week optimized: ${selectedIds.length} recipes selected for best nutrient coverage.${pinnedNote}${limitNote}${minNote}`
      )
      setMessageType("success")
      setTimeout(() => setMessage(""), 4000)
      router.push("/")
      console.log("[Optimize] runOptimization: done")
    } catch (err) {
      console.error("[Optimize] runOptimization failed:", err)
      setMessage("Optimization failed: " + err.message)
      setMessageType("error")
      setTimeout(() => setMessage(""), 4000)
    } finally {
      setIsOptimizing(false)
      console.log("[Optimize] runOptimization: finished (success or early return)")
    }
  }

  const handleLoadRecipe = async (id) => {
    try {
      const recipe = await loadRecipe(id)
      setSelectedRecipe(recipe)
      setCookidooUrlInput(recipe?.cookidooUrl || "")
      setServingsInput(recipe?.servings ?? 2)
      setYieldTypeInput(recipe?.yieldType || "portions")
      setYieldQuantityInput(
        recipe?.yieldQuantity ?? (recipe?.yieldType === "weight" ? 500 : 4)
      )
      setYieldUnitInput(recipe?.yieldUnit || "g")
      setEditingCookidooUrl(false)
      setEditingServings(false)
      setEditingYield(false)
      setEditingIngredients(false)
      setIngredientsEditList([])
      setShowRecipeModal(true)
    } catch (error) {
      setMessage("Error loading recipe: " + error.message)
      setMessageType("error")
    }
  }

  const handleSaveCookidooUrl = async () => {
    if (!selectedRecipe) return
    try {
      const updatedRecipe = {
        ...selectedRecipe,
        cookidooUrl: cookidooUrlInput.trim() || undefined,
      }
      await saveRecipe(updatedRecipe)
      const reloadedRecipe = await loadRecipe(selectedRecipe.id)
      setSelectedRecipe(reloadedRecipe)
      updateRecipeInList?.(reloadedRecipe)
      setEditingCookidooUrl(false)
      setMessage("Cookidoo URL saved successfully!")
      setMessageType("success")
      setTimeout(() => setMessage(""), 2000)
    } catch (error) {
      setMessage("Error saving Cookidoo URL: " + error.message)
      setMessageType("error")
    }
  }

  const handleSaveServings = async () => {
    if (!selectedRecipe) return
    const parsedServings = parseInt(servingsInput, 10)
    if (isNaN(parsedServings) || parsedServings < 1) {
      setMessage("Please enter a valid number of servings (minimum 1)")
      setMessageType("error")
      setTimeout(() => setMessage(""), 3000)
      return
    }
    try {
      const updatedRecipe = { ...selectedRecipe, servings: parsedServings }
      await saveRecipe(updatedRecipe)
      const reloadedRecipe = await loadRecipe(selectedRecipe.id)
      setSelectedRecipe(reloadedRecipe)
      updateRecipeInList?.(reloadedRecipe)
      setEditingServings(false)
      setMessage("Servings updated successfully!")
      setMessageType("success")
      setTimeout(() => setMessage(""), 2000)
    } catch (error) {
      setMessage("Error saving servings: " + error.message)
      setMessageType("error")
    }
  }

  const handleSaveYield = async () => {
    if (!selectedRecipe) return
    const servings = parseInt(servingsInput, 10)
    if (isNaN(servings) || servings < 1) {
      setMessage("Number of portions must be at least 1")
      setMessageType("error")
      setTimeout(() => setMessage(""), 3000)
      return
    }
    const qty =
      yieldTypeInput === "weight" ? parseFloat(yieldQuantityInput) : servings
    if (yieldTypeInput === "weight" && (isNaN(qty) || qty <= 0)) {
      setMessage("Enter a valid total yield (e.g. 500)")
      setMessageType("error")
      setTimeout(() => setMessage(""), 3000)
      return
    }
    try {
      const updatedRecipe = {
        ...selectedRecipe,
        yieldType: yieldTypeInput,
        yieldQuantity: yieldTypeInput === "weight" ? qty : undefined,
        yieldUnit: yieldTypeInput === "weight" ? (yieldUnitInput || "g") : undefined,
        servings,
      }
      if (yieldTypeInput === "portions") {
        updatedRecipe.yieldQuantity = servings
        updatedRecipe.yieldUnit = "portion"
      }
      await saveRecipe(updatedRecipe)
      const reloadedRecipe = await loadRecipe(selectedRecipe.id)
      setSelectedRecipe(reloadedRecipe)
      updateRecipeInList?.(reloadedRecipe)
      setEditingYield(false)
      setMessage("Serving / yield updated. Values are used for per-portion calculations.")
      setMessageType("success")
      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      setMessage("Error saving yield: " + error.message)
      setMessageType("error")
    }
  }

  const startEditingIngredients = () => {
    const list = (selectedRecipe?.ingredients || []).map((ing) => {
      const name =
        typeof ing.ingredientNotation === "string"
          ? ing.ingredientNotation
          : ing.ingredientNotation
            ? String(ing.ingredientNotation)
            : ""
      const value = ing.quantity?.value
      const unit =
        ing.quantity?.unitNotation != null
          ? typeof ing.quantity.unitNotation === "string"
            ? ing.quantity.unitNotation
            : String(ing.quantity.unitNotation)
          : ""
      const qtyType = ing.quantityType === "weight" ? "weight" : "amount"
      return {
        ingredientNotation: name,
        quantity: { value: value != null ? value : "", unitNotation: unit },
        quantityType: qtyType,
        optional: !!ing.optional,
        _original: ing,
      }
    })
    setIngredientsEditList(list)
    setEditingIngredients(true)
  }

  const handleSaveIngredients = async () => {
    if (!selectedRecipe) return
    const updatedIngredients = ingredientsEditList.map((row) => {
      const value =
        typeof row.quantity?.value === "number"
          ? row.quantity.value
          : parseFloat(row.quantity?.value)
      const num = Number.isNaN(value) ? undefined : value
      const unit =
        row.quantityType === "weight"
          ? row.quantity?.unitNotation != null &&
            String(row.quantity.unitNotation).trim() !== ""
            ? String(row.quantity.unitNotation).trim()
            : "g"
          : row.quantity?.unitNotation != null &&
            String(row.quantity.unitNotation).trim() !== ""
          ? String(row.quantity.unitNotation).trim()
          : undefined
      const base = { ...(row._original || {}) }
      const quantity =
        num != null || unit != null
          ? {
              ...(base.quantity || {}),
              ...(num != null && { value: num }),
              ...(unit != null && { unitNotation: unit }),
            }
          : base.quantity || undefined
      return {
        ...base,
        ingredientNotation: row.ingredientNotation || base.ingredientNotation || "",
        ...(quantity != null && { quantity }),
        quantityType: row.quantityType || "amount",
        optional: !!row.optional,
      }
    })
    try {
      const updatedRecipe = { ...selectedRecipe, ingredients: updatedIngredients }
      await saveRecipe(updatedRecipe)
      const reloadedRecipe = await loadRecipe(selectedRecipe.id)
      setSelectedRecipe(reloadedRecipe)
      updateRecipeInList?.(reloadedRecipe)
      setEditingIngredients(false)
      setIngredientsEditList([])
      setMessage("Ingredients updated.")
      setMessageType("success")
      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      setMessage("Error saving ingredients: " + error.message)
      setMessageType("error")
    }
  }

  /** Toggle one ingredient’s exclusion from this recipe’s BLS nutrition only. Does not add to filteredIngredients or affect optimizations. */
  const handleToggleExcludeFromNutrition = async (ingredientIndex) => {
    if (!selectedRecipe) return
    const current = Array.isArray(selectedRecipe.ingredient_nutrition_exclusions)
      ? selectedRecipe.ingredient_nutrition_exclusions
      : []
    const next = current.includes(ingredientIndex)
      ? current.filter((i) => i !== ingredientIndex)
      : [...current, ingredientIndex].sort((a, b) => a - b)
    const updatedRecipe = {
      ...selectedRecipe,
      ingredient_nutrition_exclusions: next.length > 0 ? next : undefined,
    }
    try {
      await saveRecipe(updatedRecipe)
      const reloadedRecipe = await loadRecipe(selectedRecipe.id)
      setSelectedRecipe(reloadedRecipe)
      updateRecipeInList?.(reloadedRecipe)
      setMessage(next.includes(ingredientIndex) ? "Excluded from nutrition calculation." : "Included in nutrition again.")
      setMessageType("success")
      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      setMessage("Error updating exclusion: " + error.message)
      setMessageType("error")
    }
  }

  const handleDelete = async (id) => {
    const requiresConfirmation = settings.confirmDelete !== false
    if (requiresConfirmation && !confirm("Are you sure you want to delete this recipe?")) {
      return
    }
    try {
      await deleteRecipe(id)
      setMessage("Recipe deleted successfully!")
      setMessageType("success")
      setSelectedRecipe(null)
      setShowRecipeModal(false)
      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      setMessage("Error deleting recipe: " + error.message)
      setMessageType("error")
    }
  }

  /** Toggle exclude/pin for a recipe. Updates recipe and refreshes list. */
  const handleSetRecipeExcludedPin = async (recipeId, updates) => {
    if (!recipeId || !saveRecipe || !loadRecipe) return
    const { excluded, pinned } = updates || {}
    if (excluded === undefined && pinned === undefined) return
    try {
      const recipe = await loadRecipe(recipeId)
      if (!recipe) return
      const updated = {
        ...recipe,
        ...(excluded !== undefined && { excluded: !!excluded }),
        ...(pinned !== undefined && { pinned: !!pinned }),
      }
      await saveRecipe(updated)
      updateRecipeInList?.(updated)
      if (loadRecipesList) await loadRecipesList()
      if (selectedRecipe?.id === recipeId) setSelectedRecipe(updated)
      const msg =
        excluded !== undefined && pinned !== undefined
          ? "Recipe updated."
          : excluded !== undefined
            ? (excluded ? "Recipe excluded from optimization." : "Recipe included in optimization.")
            : (pinned ? "Recipe pinned to week." : "Recipe unpinned.")
      setMessage(msg)
      setMessageType("success")
      setTimeout(() => setMessage(""), 2000)
    } catch (err) {
      setMessage("Failed to update recipe: " + err.message)
      setMessageType("error")
      setTimeout(() => setMessage(""), 3000)
    }
  }

  const getAllIngredients = (includeFiltered = false, recipeList = null) => {
    const list = recipeList != null ? recipeList : recipes
    const ingredientsMap = new Map()
    list.forEach((recipe) => {
      if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
        recipe.ingredients.forEach((ingredient) => {
          if (!ingredient || typeof ingredient !== "object") return
          const ingredientName =
            typeof ingredient.ingredientNotation === "string"
              ? ingredient.ingredientNotation
              : ingredient.ingredientNotation
                ? String(ingredient.ingredientNotation)
                : null
          if (!ingredientName) return
          const key = ingredientName.toLowerCase().trim()
          if (ingredientsMap.has(key)) {
            const existing = ingredientsMap.get(key)
            if (!existing.recipes.includes(recipe.title)) {
              existing.recipes.push(recipe.title)
            }
          } else {
            ingredientsMap.set(key, {
              name: ingredientName,
              quantity: ingredient.quantity?.value,
              unit: ingredient.quantity?.unitNotation
                ? typeof ingredient.quantity.unitNotation === "string"
                  ? ingredient.quantity.unitNotation
                  : String(ingredient.quantity.unitNotation)
                : null,
              optional: ingredient.optional || false,
              recipes: [recipe.title],
              fullIngredient: ingredient,
            })
          }
        })
      }
    })
    let allIngredients = Array.from(ingredientsMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    )
    if (
      !includeFiltered &&
      settings.filteredIngredients &&
      settings.filteredIngredients.length > 0
    ) {
      allIngredients = allIngredients.filter(
        (ing) =>
          !settings.filteredIngredients.some((f) => ing.name.includes(f))
      )
    }
    return allIngredients
  }

  const copyIngredient = async (ingredient) => {
    let textToCopy = ingredient.name
    const qtyDisplay = ingredient.fullIngredient
      ? formatIngredientQuantity(ingredient.fullIngredient)
      : null
    if (qtyDisplay != null) {
      textToCopy = `${qtyDisplay} ${ingredient.name}`
    } else if (ingredient.quantity !== null) {
      textToCopy = `${ingredient.quantity}${ingredient.unit ? ` ${ingredient.unit}` : ""} ${ingredient.name}`
    }
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopiedIngredient(ingredient.name)
      setTimeout(() => setCopiedIngredient(null), 2000)
    } catch (error) {
      setMessage("Failed to copy to clipboard")
      setMessageType("error")
      setTimeout(() => setMessage(""), 3000)
    }
  }

  const copyAllIngredients = async (recipeList = null) => {
    const allIngredients = getAllIngredients(false, recipeList)
    const ingredientsText = allIngredients
      .map((ing) => {
        const qtyDisplay = ing.fullIngredient
          ? formatIngredientQuantity(ing.fullIngredient)
          : null
        if (qtyDisplay != null) return `${qtyDisplay} ${ing.name}`
        if (ing.quantity !== null)
          return `${ing.quantity}${ing.unit ? ` ${ing.unit}` : ""} ${ing.name}`
        return ing.name
      })
      .join("\n")
    try {
      await navigator.clipboard.writeText(ingredientsText)
      setMessage("All ingredients copied to clipboard!")
      setMessageType("success")
      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      setMessage("Failed to copy to clipboard")
      setMessageType("error")
      setTimeout(() => setMessage(""), 3000)
    }
  }

  const closeRecipeModal = () => {
    setShowRecipeModal(false)
    setSchemaOrgIngredientIndex(null)
    setBlsIngredientIndex(null)
    setShowFullBlsAudit(false)
    setShowInspectCalculation(false)
  }

  const handleExcludeIngredient = async (ingredientName) => {
    console.log("[useRecipePage] handleExcludeIngredient called", { ingredientName, saveSettings: typeof saveSettings })
    const name = typeof ingredientName === "string" ? ingredientName.trim() : ""
    if (!name) {
      console.log("[useRecipePage] handleExcludeIngredient: empty name, return")
      return
    }
    if (!saveSettings) {
      console.log("[useRecipePage] handleExcludeIngredient: no saveSettings")
      setMessage("Connect to RemoteStorage to exclude ingredients")
      setMessageType("warning")
      setTimeout(() => setMessage(""), 3000)
      return
    }
    const current = settings?.filteredIngredients || []
    if (current.some((f) => f === name)) {
      console.log("[useRecipePage] handleExcludeIngredient: already excluded")
      setMessage("Ingredient already excluded")
      setMessageType("info")
      setTimeout(() => setMessage(""), 2000)
      return
    }
    console.log("[useRecipePage] handleExcludeIngredient: saving", name)
    setMessage(`Excluding "${name}"…`)
    setMessageType("info")
    try {
      await saveSettings((prev) => ({
        ...prev,
        filteredIngredients: [...(prev.filteredIngredients || []), name],
      }))
      console.log("[useRecipePage] handleExcludeIngredient: saveSettings done")
      setMessage(`"${name}" excluded from ingredients and future optimizations`)
      setMessageType("success")
      setTimeout(() => setMessage(""), 3000)
    } catch (err) {
      console.log("[useRecipePage] handleExcludeIngredient: saveSettings failed", err)
      setMessage("Failed to exclude ingredient: " + err.message)
      setMessageType("error")
      setTimeout(() => setMessage(""), 3000)
    }
  }

  return {
    // Connection & data
    isConnected,
    isLoading,
    recipes,
    recipesList,
    weekRecipes,
    weeklyTotalsByKey,
    settings,
    // Message
    message,
    messageType,
    setMessage,
    setMessageType,
    // Recipe modal & selection
    selectedRecipe,
    showRecipeModal,
    setShowRecipeModal,
    closeRecipeModal,
    handleLoadRecipe,
    handleDelete,
    handleSetRecipeExcludedPin,
    // Recipe edit state (modal)
    editingCookidooUrl,
    setEditingCookidooUrl,
    cookidooUrlInput,
    setCookidooUrlInput,
    handleSaveCookidooUrl,
    editingServings,
    servingsInput,
    setServingsInput,
    handleSaveServings,
    editingYield,
    setEditingYield,
    yieldTypeInput,
    setYieldTypeInput,
    yieldQuantityInput,
    setYieldQuantityInput,
    yieldUnitInput,
    setYieldUnitInput,
    handleSaveYield,
    editingIngredients,
    ingredientsEditList,
    setIngredientsEditList,
    startEditingIngredients,
    handleSaveIngredients,
    handleToggleExcludeFromNutrition,
    schemaOrgIngredientIndex,
    setSchemaOrgIngredientIndex,
    blsIngredientIndex,
    setBlsIngredientIndex,
    showFullBlsAudit,
    setShowFullBlsAudit,
    showInspectCalculation,
    setShowInspectCalculation,
    blsAuditRef,
    // Import modal
    showImportModal,
    setShowImportModal,
    importJsonInput,
    setImportJsonInput,
    isImporting,
    handleImportRecipes,
    // Manage week modal
    showManageWeekModal,
    setShowManageWeekModal,
    manageWeekSelectedIds,
    setManageWeekSelectedIds,
    openManageWeekModal,
    handleSetWeekRecipes,
    // Optimize
    isOptimizing,
    optimizeNumToSelect,
    setOptimizeNumToSelect,
    optimizeMinMatchRate,
    setOptimizeMinMatchRate,
    optimizePerMealLimits,
    setOptimizePerMealLimits,
    optimizePerMealMinimums,
    setOptimizePerMealMinimums,
    runOptimization,
    // Ingredients tab
    ingredientsRecipes,
    ingredientsRecipesLoading,
    loadIngredientsRecipes,
    getAllIngredients,
    copiedIngredient,
    copyIngredient,
    copyAllIngredients,
    handleExcludeIngredient,
    // Settings
    theme,
    handleThemeChange,
    editingDefaultServings,
    setEditingDefaultServings,
    defaultServingsInput,
    setDefaultServingsInput,
    handleSaveDefaultServings,
    handleManualCleanup,
    isCleaningUp,
    csvFileInputRef,
    handleImportFromCsv,
    isImportingCsv,
    csvLinksFileInputRef,
    handleImportFromCsvByLinks,
    isImportingByLinks,
    saveSettings,
    // Utils (from lib or wrapped)
    formatNutrientType,
    formatIngredientQuantity,
    formatBlsNutrientKey,
    getMainNutrients,
    getDailyPercentage,
    getAllNutrientPercentages,
    // Weekly goals for HomeTab
    WEEKLY_GOAL_KEYS,
    NUTRIENT_LABELS,
    NUTRIENT_UNITS,
  }
}
