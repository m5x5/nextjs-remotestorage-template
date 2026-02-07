"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { DEFAULT_DAILY_GOALS } from "@/lib/nutrient-registry"

/**
 * Hook to sync data with RemoteStorage
 * Provides methods for CRUD operations and automatic syncing
 *
 * @param {Object|null} remoteStorage - RemoteStorage instance from useRemoteStorage
 * @returns {Object} Data and methods for managing your data
 */
export function useData(remoteStorage) {
  // State
  const [recipes, setRecipes] = useState([])
  const [recipesList, setRecipesList] = useState([])
  const [settings, setSettings] = useState({
    theme: 'light',
    language: 'en',
    defaultServings: 2,
    filteredIngredients: [],
    weekRecipeIds: [],
    optimizeNumToSelect: 7,
    optimizeMinMatchRate: 60,
    optimizePerMealLimits: {},
    optimizePerMealMinimums: {},
    dailyRecommended: DEFAULT_DAILY_GOALS,
  })
  const [savedWeeks, setSavedWeeks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)

  // Ref to prevent reload loops during saves
  const isSavingRef = useRef(false)
  // Skip the next loadAllData from change handler (e.g. right after we saved settings in runOptimization)
  const skipNextLoadAllDataRef = useRef(false)
  // Ref to latest settings so updater-based saveSettings always merges with current state
  const settingsRef = useRef(settings)
  settingsRef.current = settings

  // Check connection status
  useEffect(() => {
    if (!remoteStorage) {
      setIsConnected(false)
      return
    }

    const updateConnectionStatus = () => {
      setIsConnected(remoteStorage.connected || false)
    }

    updateConnectionStatus()

    // Listen for connection events
    remoteStorage.on?.('connected', updateConnectionStatus)
    remoteStorage.on?.('disconnected', updateConnectionStatus)

    return () => {
      remoteStorage.off?.('connected', updateConnectionStatus)
      remoteStorage.off?.('disconnected', updateConnectionStatus)
    }
  }, [remoteStorage])

  // Load all data when connected
  const loadAllData = useCallback(async () => {
    if (!remoteStorage?.mymodule || !isConnected) {
      setIsLoading(false)
      return
    }

    console.log("[RS] loadAllData: start")
    setIsLoading(true)

    try {
      const loadedSettings = await remoteStorage.mymodule.loadSettings()
      setSettings(loadedSettings)

      const weekIds = loadedSettings.weekRecipeIds || []
      if (weekIds.length > 0) {
        const loaded = await Promise.all(weekIds.map((id) => remoteStorage.mymodule.loadRecipe(id)))
        const valid = loaded.filter(Boolean)
        setRecipes(valid)
        console.log("[RS] loadAllData: weekIds=" + weekIds.length + ", loaded=" + valid.length)
        const validIds = weekIds.filter((_, i) => loaded[i] != null)
        if (validIds.length !== weekIds.length) {
          setSettings((prev) => ({ ...prev, weekRecipeIds: validIds }))
        }
      } else {
        setRecipes([])
        console.log("[RS] loadAllData: weekIds=0, setRecipes([])")
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [remoteStorage, isConnected])

  /** Load the recipe list (id/title) only. Call when opening Manage week or when Ingredients tab needs list. */
  const loadRecipesList = useCallback(async () => {
    if (!remoteStorage?.mymodule || !isConnected) return
    try {
      const list = await remoteStorage.mymodule.getRecipesList()
      const uniqueMap = new Map()
      list.forEach((r) => {
        if (r && r.id) {
          const existing = uniqueMap.get(r.id)
          if (!existing || (r.updated_at && existing.updated_at && new Date(r.updated_at) > new Date(existing.updated_at))) {
            uniqueMap.set(r.id, r)
          }
        }
      })
      setRecipesList(Array.from(uniqueMap.values()))
    } catch (error) {
      console.error("Error loading recipes list:", error)
    }
  }, [remoteStorage, isConnected])

  /** Load full recipe data for given ids and set as current recipes (e.g. week recipes after optimization). */
  const loadRecipesByIds = useCallback(async (ids) => {
    if (!remoteStorage?.mymodule || !isConnected || !ids?.length) {
      setRecipes([])
      return
    }
    try {
      const loaded = await Promise.all(ids.map((id) => remoteStorage.mymodule.loadRecipe(id)))
      const valid = loaded.filter(Boolean)
      setRecipes(valid)
      console.log("[RS] loadRecipesByIds: requested=" + ids.length + ", loaded=" + valid.length)
      const keptIds = ids.filter((_, i) => loaded[i] != null)
      if (keptIds.length !== ids.length) {
        setSettings((prev) => ({ ...prev, weekRecipeIds: keptIds }))
      }
    } catch (error) {
      console.error("Error loading recipes by ids:", error)
    }
  }, [remoteStorage, isConnected])

  /** Load all recipes (list + full bodies). For optimizer or Ingredients tab. Returns the array. */
  const loadAllRecipesForOptimizer = useCallback(async () => {
    console.log("[Optimize] loadAllRecipesForOptimizer: entered")
    if (!remoteStorage?.mymodule || !isConnected) {
      console.log("[Optimize] loadAllRecipesForOptimizer: not connected or no module, returning []")
      return []
    }
    try {
      console.log("[Optimize] loadAllRecipesForOptimizer: calling getRecipesList()…")
      const tList = Date.now()
      const LIST_TIMEOUT_MS = 60000
      let list
      try {
        list = await Promise.race([
          remoteStorage.mymodule.getRecipesList(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`getRecipesList() timed out after ${LIST_TIMEOUT_MS / 1000}s. Check RemoteStorage connection.`)), LIST_TIMEOUT_MS)
        )
        ])
      } catch (getListErr) {
        console.error("[Optimize] getRecipesList() threw:", getListErr)
        throw getListErr
      }
      console.log(`[Optimize] loadAllRecipesForOptimizer: getRecipesList() returned ${list?.length ?? 0} entries in ${Date.now() - tList}ms`)
      const uniqueMap = new Map()
      list.forEach((r) => {
        if (r && r.id) {
          const existing = uniqueMap.get(r.id)
          if (!existing || (r.updated_at && existing.updated_at && new Date(r.updated_at) > new Date(existing.updated_at))) {
            uniqueMap.set(r.id, r)
          }
        }
      })
      const ids = Array.from(uniqueMap.values()).map((r) => r.id)
      console.log(`[Optimize] loadAllRecipesForOptimizer: loading ${ids.length} recipe bodies in parallel…`)
      const tLoad = Date.now()
      const loaded = await Promise.all(ids.map((id) => remoteStorage.mymodule.loadRecipe(id)))
      console.log(`[Optimize] loadAllRecipesForOptimizer: loaded ${loaded.filter(Boolean).length} recipes in ${Date.now() - tLoad}ms`)
      return loaded.filter(Boolean)
    } catch (error) {
      console.error("[Optimize] Error loading all recipes:", error)
      return []
    }
  }, [remoteStorage, isConnected])

  /** Load saved weeks list (history). */
  const loadSavedWeeks = useCallback(async () => {
    if (!remoteStorage?.mymodule || !isConnected) return
    try {
      const list = await remoteStorage.mymodule.getSavedWeeksList()
      setSavedWeeks(list)
    } catch (error) {
      console.error("Error loading saved weeks:", error)
    }
  }, [remoteStorage, isConnected])

  /** Save current week snapshot to history. */
  const saveSavedWeek = useCallback(async (week) => {
    if (!remoteStorage?.mymodule || !isConnected) {
      throw new Error("RemoteStorage is not connected.")
    }
    const result = await remoteStorage.mymodule.saveSavedWeek(week)
    await loadSavedWeeks()
    return result
  }, [remoteStorage, isConnected, loadSavedWeeks])

  /** Load a single saved week by id. */
  const loadSavedWeek = useCallback(async (id) => {
    if (!remoteStorage?.mymodule || !isConnected) return null
    return await remoteStorage.mymodule.loadSavedWeek(id)
  }, [remoteStorage, isConnected])

  /** Delete a saved week from history. */
  const deleteSavedWeek = useCallback(async (id) => {
    if (!remoteStorage?.mymodule || !isConnected) {
      throw new Error("RemoteStorage is not connected.")
    }
    await remoteStorage.mymodule.deleteSavedWeek(id)
    await loadSavedWeeks()
  }, [remoteStorage, isConnected, loadSavedWeeks])

  // Initial load
  useEffect(() => {
    if (!remoteStorage?.mymodule || !isConnected) {
      setIsLoading(false)
      return
    }

    loadAllData()
  }, [remoteStorage, isConnected, loadAllData])

  // Load saved weeks when connected
  useEffect(() => {
    if (!remoteStorage?.mymodule || !isConnected) return
    loadSavedWeeks()
  }, [remoteStorage, isConnected, loadSavedWeeks])

  // Debounce ref for change handler
  const changeTimeoutRef = useRef(null)

  // Listen for remote changes
  useEffect(() => {
    if (!remoteStorage || !isConnected) return

    const changeHandler = (event) => {
      if (isSavingRef.current) {
        console.log("[RS] changeHandler: skip (isSaving)")
        return
      }
      if (skipNextLoadAllDataRef.current) {
        skipNextLoadAllDataRef.current = false
        console.log("[RS] changeHandler: skip (skipNextLoadAllData)")
        return
      }

      if (changeTimeoutRef.current) {
        clearTimeout(changeTimeoutRef.current)
      }
      
      changeTimeoutRef.current = setTimeout(() => {
        if (skipNextLoadAllDataRef.current) {
          skipNextLoadAllDataRef.current = false
          changeTimeoutRef.current = null
          console.log("[RS] changeHandler: skip after 200ms (skipNextLoadAllData)")
          return
        }
        console.log("[RS] changeHandler: running loadAllData in 200ms")
        loadAllData()
        loadSavedWeeks().catch(() => {})
        changeTimeoutRef.current = null
      }, 200)
    }

    // RemoteStorage uses onChange with a path
    try {
      remoteStorage.onChange?.('/mymodule/', changeHandler)
    } catch (error) {
      console.warn("Could not attach change listener:", error)
    }

    return () => {
      // Cleanup timeout on unmount
      if (changeTimeoutRef.current) {
        clearTimeout(changeTimeoutRef.current)
      }
    }
  }, [remoteStorage, isConnected, loadAllData, loadSavedWeeks])

  // ==================== RECIPES METHODS ====================

  /**
   * Save a recipe
   * @param {Object} recipe - The recipe to save
   * @param {Object} [options] - Optional: { skipListUpdate: boolean, currentList: Array }
   *   - skipListUpdate: if true, only the recipe file is written; list.json is not updated (call refreshRecipesList after a batch).
   *   - currentList: if provided, passed to the module to avoid re-fetching the list.
   */
  const saveRecipe = useCallback(async (recipe, options) => {
    if (!remoteStorage?.mymodule || !isConnected) {
      throw new Error("RemoteStorage is not connected. Please connect to RemoteStorage.")
    }

    isSavingRef.current = true

    try {
      const result = await remoteStorage.mymodule.saveRecipe(recipe, options)

      if (options?.skipListUpdate) {
        return result
      }

      const updatedList = await remoteStorage.mymodule.getRecipesList()
      const uniqueMap = new Map()
      updatedList.forEach(r => {
        if (r && r.id) {
          const existing = uniqueMap.get(r.id)
          if (!existing ||
              (r.updated_at && existing.updated_at &&
               new Date(r.updated_at) > new Date(existing.updated_at))) {
            uniqueMap.set(r.id, r)
          } else if (!existing) {
            uniqueMap.set(r.id, r)
          }
        }
      })
      setRecipesList(Array.from(uniqueMap.values()))
    } catch (error) {
      console.error("Error saving recipe:", error)
      await loadRecipesList()
      throw error
    } finally {
      setTimeout(() => {
        isSavingRef.current = false
      }, 300)
    }
  }, [remoteStorage, isConnected, loadRecipesList])

  /**
   * Merge a batch of recipe entries into list buckets and refresh local state (call after batch import with skipListUpdate).
   * @param {Array<{id: string, title: string, updated_at: string}>} entriesToMerge
   * @param {Object} [options] - { appendOnly: boolean } Pass { appendOnly: true } for import to avoid loading all buckets (faster).
   */
  const refreshRecipesList = useCallback(async (entriesToMerge, options) => {
    if (!remoteStorage?.mymodule || !isConnected) return
    await remoteStorage.mymodule.refreshRecipesList(entriesToMerge, options)
    await loadRecipesList()
  }, [remoteStorage, isConnected, loadRecipesList])

  /**
   * Load a recipe by ID
   * @param {string} id - The recipe ID
   * @returns {Promise<Object|null>}
   */
  const loadRecipe = useCallback(async (id) => {
    if (!remoteStorage?.mymodule || !isConnected) {
      return null
    }

    try {
      return await remoteStorage.mymodule.loadRecipe(id)
    } catch (error) {
      console.error("Error loading recipe:", error)
      return null
    }
  }, [remoteStorage, isConnected])

  /**
   * Delete a recipe by ID
   * @param {string} id - The recipe ID
   */
  const deleteRecipe = useCallback(async (id) => {
    if (!remoteStorage?.mymodule || !isConnected) {
      throw new Error("RemoteStorage is not connected")
    }

    isSavingRef.current = true

    try {
      await remoteStorage.mymodule.deleteRecipe(id)

      // Reload recipes list with deduplication
      const updatedList = await remoteStorage.mymodule.getRecipesList()
      
      // Robust deduplication using Map
      const uniqueMap = new Map()
      updatedList.forEach(r => {
        if (r && r.id) {
          uniqueMap.set(r.id, r)
        }
      })
      
      const uniqueList = Array.from(uniqueMap.values())
      setRecipesList(uniqueList)
      setRecipes((prev) => prev.filter((r) => r && r.id !== id))
    } catch (error) {
      console.error("Error deleting recipe:", error)
      throw error
    } finally {
      setTimeout(() => {
        isSavingRef.current = false
      }, 300)
    }
  }, [remoteStorage, isConnected])

  // ==================== SETTINGS METHODS ====================

  /**
   * Save settings. Accepts either a full settings object or an updater (prev => next).
   * Using an updater ensures we merge with the latest state (e.g. when saving optimization filters).
   * @param {Object|((prev: Object) => Object)} newSettingsOrUpdater - Full settings or (prev) => next
   */
  const saveSettings = useCallback(async (newSettingsOrUpdater) => {
    if (!remoteStorage?.mymodule || !isConnected) {
      throw new Error("RemoteStorage is not connected")
    }

    const next =
      typeof newSettingsOrUpdater === "function"
        ? newSettingsOrUpdater(settingsRef.current)
        : newSettingsOrUpdater

    isSavingRef.current = true

    try {
      // Optimistic update
      setSettings(next)

      // Save to RemoteStorage
      await remoteStorage.mymodule.saveSettings(next)
    } catch (error) {
      console.error("Error saving settings:", error)
      // Reload to get correct state
      await loadAllData()
      throw error
    } finally {
      setTimeout(() => {
        isSavingRef.current = false
      }, 100)
    }
  }, [remoteStorage, isConnected, loadAllData])

  return {
    // State
    isLoading,
    isConnected,

    // Saved weeks (history)
    savedWeeks,
    loadSavedWeeks,
    saveSavedWeek,
    loadSavedWeek,
    deleteSavedWeek,

    // Recipes
    recipes,
    recipesList,
    saveRecipe,
    loadRecipe,
    deleteRecipe,
    refreshRecipesList,
    loadRecipesList,
    loadRecipesByIds,
    loadAllRecipesForOptimizer,
    /** Update one recipe in the current recipes list (e.g. after editing in modal). */
    updateRecipeInList: (recipe) => setRecipes((prev) => prev.map((r) => r && r.id === recipe.id ? recipe : r)),

    // Settings
    settings,
    saveSettings,

    // Utility
    reload: loadAllData,
    /** Call before saveSettings + loadRecipesByIds so the next remote-change loadAllData is skipped (avoids overwriting with stale data). */
    setSkipNextLoadAllData: () => {
      skipNextLoadAllDataRef.current = true
      console.log("[RS] setSkipNextLoadAllData: next changeHandler will skip loadAllData")
    }
  }
}

