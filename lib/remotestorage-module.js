/**
 * Custom RemoteStorage module template
 *
 * Customize this module for your app:
 * 1. Change the module name
 * 2. Define your data types using declareType()
 * 3. Implement your CRUD methods in the exports object
 */

/** Recipe list is stored in buckets to reduce load. Increase if the server still struggles (e.g. 50, 100). */
const RECIPE_LIST_BUCKET_SIZE = 25

export const MyModule = {
  name: 'mymodule',

  builder: function (privateClient, publicClient) {
    const BUCKET_SIZE = RECIPE_LIST_BUCKET_SIZE

    // Paths: flat under recipes/ to avoid 404s on nested paths (recipes/list-bucket-0.json, list-meta.json)
    const LIST_META_PATH = 'recipes/list-meta.json'
    const listBucketPath = (i) => `recipes/list-bucket-${i}.json`

    /**
     * Read recipe list from buckets (or migrate from legacy list.json).
     * @returns {Promise<Array>} Raw array from storage; caller may dedupe/sort.
     */
    async function readRecipesListBuckets() {
      // 1) Read meta first. If we have buckets, use them and never request list.json (avoids 404 when list is in buckets).
      let metaFile = null
      try {
        metaFile = await privateClient.getFile(LIST_META_PATH)
      } catch (e) {
        if (isNotFoundError(e)) {
          try {
            metaFile = await privateClient.getFile('recipes/meta.json')
          } catch (_) { /* ignore */ }
        } else {
          throw e
        }
      }

      const meta = metaFile?.data ? (typeof metaFile.data === 'string' ? JSON.parse(metaFile.data) : metaFile.data) : null
      const bucketCount = meta?.bucketCount ?? 0

      if (bucketCount > 0) {
        const list = []
        const readBucket = async (path) => {
          try {
            const file = await privateClient.getFile(path)
            if (file?.data) {
              const arr = typeof file.data === 'string' ? JSON.parse(file.data) : file.data
              return Array.isArray(arr) ? arr : []
            }
          } catch (_) { /* 404 or parse */ }
          return []
        }
        for (let i = 0; i < bucketCount; i++) {
          let chunk = await readBucket(listBucketPath(i))
          if (chunk.length === 0 && i === 0) {
            chunk = await readBucket(`recipes/buckets/${i}.json`)
            if (chunk.length > 0) {
              list.push(...chunk)
              for (let j = 1; j < bucketCount; j++) {
                const c = await readBucket(`recipes/buckets/${j}.json`)
                if (c.length > 0) list.push(...c)
              }
              if (list.length > 0) await writeRecipesListBuckets(list)
              return list
            }
          }
          if (chunk.length > 0) list.push(...chunk)
        }
        if (list.length === 0 && bucketCount > 0) {
          const oldList = []
          for (let i = 0; i < bucketCount; i++) {
            const c = await readBucket(`recipes/buckets/${i}.json`)
            if (c.length > 0) oldList.push(...c)
          }
          if (oldList.length > 0) {
            await writeRecipesListBuckets(oldList)
            return oldList
          }
        }
        return list
      }

      // 2) No buckets: try legacy list.json (migrate once). Only then do we request list.json, so 404 only when truly empty.
      try {
        const file = await privateClient.getFile('recipes/list.json')
        if (file?.data) {
          const parsed = typeof file.data === 'string' ? JSON.parse(file.data) : file.data
          if (Array.isArray(parsed) && parsed.length > 0) {
            const uniqueMap = new Map()
            parsed.forEach(recipe => {
              if (recipe && recipe.id) {
                const existing = uniqueMap.get(recipe.id)
                if (!existing || (recipe.updated_at && existing.updated_at && new Date(recipe.updated_at) > new Date(existing.updated_at))) {
                  uniqueMap.set(recipe.id, recipe)
                }
              }
            })
            const unique = Array.from(uniqueMap.values())
            unique.sort((a, b) => {
              const dateA = a.updated_at ? new Date(a.updated_at) : new Date(0)
              const dateB = b.updated_at ? new Date(b.updated_at) : new Date(0)
              return dateB - dateA
            })
            await writeRecipesListBuckets(unique)
            try { await privateClient.remove('recipes/list.json') } catch (_) { /* ignore */ }
            return unique
          }
        }
      } catch (e) {
        // 404 or any error: no legacy list
      }
      return []
    }

    /**
     * Write full recipe list into buckets of BUCKET_SIZE (flat paths under recipes/).
     * @param {Array} fullList
     */
    async function writeRecipesListBuckets(fullList) {
      const list = Array.isArray(fullList) ? fullList : []
      const chunks = []
      for (let i = 0; i < list.length; i += BUCKET_SIZE) {
        chunks.push(list.slice(i, i + BUCKET_SIZE))
      }
      if (chunks.length === 0) chunks.push([])

      for (let i = 0; i < chunks.length; i++) {
        await privateClient.storeFile('application/json', listBucketPath(i), JSON.stringify(chunks[i]))
      }
      await privateClient.storeFile('application/json', LIST_META_PATH, JSON.stringify({ bucketCount: chunks.length }))
    }

    /** Lightweight check: any recipes exist? Reads only meta (and legacy list), never all buckets. */
    async function checkHasAnyRecipes() {
      try {
        let metaFile = null
        try {
          metaFile = await privateClient.getFile(LIST_META_PATH)
        } catch (e) {
          if (isNotFoundError(e)) {
            try {
              metaFile = await privateClient.getFile('recipes/meta.json')
            } catch (_) { /* ignore */ }
          } else {
            throw e
          }
        }
        const meta = metaFile?.data ? (typeof metaFile.data === 'string' ? JSON.parse(metaFile.data) : metaFile.data) : null
        if (meta?.bucketCount > 0) return true
      } catch (_) { /* ignore */ }
      try {
        const file = await privateClient.getFile('recipes/list.json')
        if (file?.data) {
          const parsed = typeof file.data === 'string' ? JSON.parse(file.data) : file.data
          if (Array.isArray(parsed) && parsed.length > 0) return true
        }
      } catch (_) { /* 404 or parse */ }
      return false
    }

    // ==================== TYPE DECLARATIONS ====================
    
    /**
     * Declare your data types here
     * This helps RemoteStorage cache and sync data efficiently
     */
    privateClient.declareType('recipe', {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        image: { type: 'string' },
        cookidooUrl: { type: 'string' },
        servings: { type: 'number' },
        /** 'portions' = yield is number of portions (e.g. 4); 'weight' = yield is total weight (e.g. 500 g) */
        yieldType: { type: 'string' },
        /** When yieldType 'portions': number of portions. When 'weight': total amount in yieldUnit */
        yieldQuantity: { type: 'number' },
        /** e.g. 'g', 'kg', 'portion' */
        yieldUnit: { type: 'string' },
        nutrients: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              number: { type: 'number' },
              unittype: { type: 'string' }
            }
          }
        },
        ingredients: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              icon: { type: 'string' },
              localId: { type: 'string' },
              optional: { type: 'boolean' },
              /** 'amount' = count (e.g. 2 eggs); 'weight' = grams etc. */
              quantityType: { type: 'string' },
              quantity: {
                type: 'object',
                properties: {
                  value: { type: 'number' },
                  unit_ref: { type: 'string' },
                  preparation: { type: 'string' },
                  unitNotation: { type: 'string' }
                }
              },
              ingredient_ref: { type: 'string' },
              ingredientNotation: { type: 'string' },
              recipeAlternativeIngredient: { type: 'string' }
            }
          }
        },
        /** Full schema.org Recipe JSON – stored as-is for pipeline/editing */
        schema: { type: 'object' },
        /** BLS pipeline: number of ingredients matched to BLS database */
        ingredients_matched: { type: 'number' },
        /** BLS pipeline: number of ingredients not found in BLS */
        ingredients_skipped: { type: 'number' },
        /** BLS pipeline: match rate 0–100 */
        match_rate: { type: 'number' },
        /** BLS pipeline: per-ingredient audit (original, bls_name, weight_g, nutrient_contribution) */
        ingredient_audit_trail: { type: 'array' },
        /** Indices of ingredients to exclude from BLS nutrition (e.g. wrong mapping like "Salted Peanuts" → salt) */
        ingredient_nutrition_exclusions: { type: 'array' },
        created_at: { type: 'string' },
        updated_at: { type: 'string' }
      },
      required: ['id', 'title', 'created_at']
    })

    privateClient.declareType('settings', {
      type: 'object',
      properties: {
        theme: { type: 'string' },
        language: { type: 'string' },
        defaultServings: { type: 'number' },
        confirmDelete: { type: 'boolean' },
        filteredIngredients: {
          type: 'array',
          items: { type: 'string' }
        },
        weekRecipeIds: {
          type: 'array',
          items: { type: 'string' }
        },
        dailyRecommended: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        weeklyGoals: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        updated_at: { type: 'string' }
      }
    })

    // ==================== EXPORTED METHODS ====================

    return {
      exports: {
        /**
         * Save a recipe
         * @param {Object} recipe - The recipe to save
         * @param {Object} [options] - Optional: { skipListUpdate: boolean, currentList: Array }
         *   - skipListUpdate: if true, only write the recipe file; do not read/update list.json (use with batch import; call refreshRecipesList after).
         *   - currentList: if provided, use this array instead of calling getRecipesList() (avoids re-fetching the list).
         * @returns {Promise<string|void>} When skipListUpdate is true, returns the timestamp used (for passing to refreshRecipesList).
         */
        saveRecipe: async function (recipe, options = {}) {
          const timestamp = new Date().toISOString()
          const data = {
            ...recipe,
            updated_at: timestamp
          }

          // Normalize ingredients so quantity.value is never undefined (schema expects number if present)
          if (Array.isArray(data.ingredients)) {
            data.ingredients = data.ingredients.map((ing) => {
              if (!ing || typeof ing !== 'object') return ing
              if (!ing.quantity || typeof ing.quantity !== 'object') return ing
              const q = ing.quantity
              if (q.value === undefined) {
                const { value, ...rest } = q
                return { ...ing, quantity: rest }
              }
              return ing
            })
          }

          await privateClient.storeObject('recipe', `recipes/${recipe.id}.json`, data)

          if (options.skipListUpdate) {
            return timestamp
          }

          let recipesList = options.currentList != null && Array.isArray(options.currentList)
            ? options.currentList
            : await this.getRecipesList()

          const recipesMap = new Map()
          recipesList.forEach(r => {
            if (r && r.id) {
              const existing = recipesMap.get(r.id)
              if (!existing || (r.updated_at && existing.updated_at && new Date(r.updated_at) > new Date(existing.updated_at))) {
                recipesMap.set(r.id, r)
              }
            }
          })
          recipesMap.set(recipe.id, { id: recipe.id, title: recipe.title, updated_at: timestamp })

          const uniqueList = Array.from(recipesMap.values())
          uniqueList.sort((a, b) => {
            const dateA = a.updated_at ? new Date(a.updated_at) : new Date(0)
            const dateB = b.updated_at ? new Date(b.updated_at) : new Date(0)
            return dateB - dateA
          })
          await writeRecipesListBuckets(uniqueList)
        },

        /**
         * Merge a batch of recipe entries into buckets (or append only for fast import).
         * @param {Array<{id: string, title: string, updated_at: string}>} entriesToMerge
         * @param {Object} [options] - { appendOnly: boolean }
         *   - appendOnly: true = do not load existing buckets; only read meta, append new bucket files, update meta. Much faster for import. Duplicates by id are merged on next getRecipesList().
         */
        refreshRecipesList: async function (entriesToMerge, options = {}) {
          if (!entriesToMerge || entriesToMerge.length === 0) return

          if (options.appendOnly) {
            let bucketCount = 0
            try {
              let metaFile = await privateClient.getFile(LIST_META_PATH).catch(() => null)
              if (!metaFile?.data) metaFile = await privateClient.getFile('recipes/meta.json').catch(() => null)
              const meta = metaFile?.data ? (typeof metaFile.data === 'string' ? JSON.parse(metaFile.data) : metaFile.data) : null
              bucketCount = meta?.bucketCount ?? 0
            } catch (_) { /* use 0 */ }

            const list = entriesToMerge.filter(e => e && e.id).map(e => ({
              id: e.id,
              title: e.title || '',
              updated_at: e.updated_at || new Date().toISOString()
            }))
            if (list.length === 0) return

            const chunks = []
            for (let i = 0; i < list.length; i += BUCKET_SIZE) {
              chunks.push(list.slice(i, i + BUCKET_SIZE))
            }
            for (let i = 0; i < chunks.length; i++) {
              await privateClient.storeFile('application/json', listBucketPath(bucketCount + i), JSON.stringify(chunks[i]))
            }
            await privateClient.storeFile('application/json', LIST_META_PATH, JSON.stringify({ bucketCount: bucketCount + chunks.length }))
            return
          }

          const recipesList = await this.getRecipesList()
          const recipesMap = new Map()
          recipesList.forEach(r => {
            if (r && r.id) {
              const existing = recipesMap.get(r.id)
              if (!existing || (r.updated_at && existing.updated_at && new Date(r.updated_at) > new Date(existing.updated_at))) {
                recipesMap.set(r.id, r)
              }
            }
          })
          entriesToMerge.forEach(e => {
            if (!e || !e.id) return
            const existing = recipesMap.get(e.id)
            const updated_at = e.updated_at || existing?.updated_at
            if (!existing || (updated_at && existing.updated_at && new Date(updated_at) > new Date(existing.updated_at))) {
              recipesMap.set(e.id, { id: e.id, title: e.title || existing?.title || '', updated_at: updated_at || new Date().toISOString() })
            }
          })

          const uniqueList = Array.from(recipesMap.values())
          uniqueList.sort((a, b) => {
            const dateA = a.updated_at ? new Date(a.updated_at) : new Date(0)
            const dateB = b.updated_at ? new Date(b.updated_at) : new Date(0)
            return dateB - dateA
          })
          await writeRecipesListBuckets(uniqueList)
        },

        /**
         * Load a recipe by ID
         * @param {string} id - The recipe ID
         * @returns {Promise<Object|null>}
         */
        loadRecipe: async function (id) {
          try {
            const data = await privateClient.getObject(`recipes/${id}.json`)
            return data || null
          } catch (error) {
            if (isNotFoundError(error)) {
              await this.removeStaleRecipeId(id).catch(() => {})
              return null
            }
            throw error
          }
        },

        /**
         * Remove a recipe ID from the list and from week settings (e.g. after 404 on load).
         * Does not delete the recipe file; use deleteRecipe for that.
         * @param {string} id - The recipe ID to remove from list and week
         * @returns {Promise<void>}
         */
        removeStaleRecipeId: async function (id) {
          if (!id) return
          try {
            const recipesList = await this.getRecipesList()
            const updatedList = recipesList.filter((r) => r && r.id !== id)
            if (updatedList.length !== recipesList.length) {
              await writeRecipesListBuckets(updatedList)
            }
            const settings = await this.loadSettings()
            const weekIds = settings.weekRecipeIds || []
            if (weekIds.includes(id)) {
              await this.saveSettings({
                ...settings,
                weekRecipeIds: weekIds.filter((rid) => rid !== id)
              })
            }
          } catch (err) {
            console.warn("removeStaleRecipeId failed:", err)
            throw err
          }
        },

        /**
         * Lightweight check: do we have any recipes? Does not load the full list (only meta / legacy list).
         * @returns {Promise<boolean>}
         */
        hasAnyRecipes: async function () {
          return await checkHasAnyRecipes()
        },

        /**
         * Get list of all recipes (metadata only)
         * @returns {Promise<Array>}
         */
        getRecipesList: async function () {
          try {
            const parsed = await readRecipesListBuckets()
            if (!Array.isArray(parsed) || parsed.length === 0) return parsed?.length === 0 ? [] : []

            const uniqueMap = new Map()
            parsed.forEach(recipe => {
              if (recipe && recipe.id) {
                const existing = uniqueMap.get(recipe.id)
                if (!existing || (recipe.updated_at && existing.updated_at && new Date(recipe.updated_at) > new Date(existing.updated_at))) {
                  uniqueMap.set(recipe.id, recipe)
                }
              }
            })
            const unique = Array.from(uniqueMap.values())
            unique.sort((a, b) => {
              const dateA = a.updated_at ? new Date(a.updated_at) : new Date(0)
              const dateB = b.updated_at ? new Date(b.updated_at) : new Date(0)
              return dateB - dateA
            })
            if (unique.length !== parsed.length) {
              console.log(`Cleaned up ${parsed.length - unique.length} duplicate(s) from recipes list`)
              await writeRecipesListBuckets(unique)
            }
            return unique
          } catch (error) {
            if (isNotFoundError(error)) return []
            console.error("Error loading recipes list:", error)
            return []
          }
        },

        /**
         * Delete a recipe by ID
         * @param {string} id - The recipe ID
         * @returns {Promise<void>}
         */
        deleteRecipe: async function (id) {
          try {
            // Remove the recipe file
            await privateClient.remove(`recipes/${id}.json`)

            // Update the recipes list
            const recipesList = await this.getRecipesList()
            const updatedList = recipesList.filter(r => r.id !== id)

            await writeRecipesListBuckets(updatedList)
          } catch (error) {
            console.error("Error deleting recipe:", error)
            throw error
          }
        },

        /**
         * Clean up duplicate recipes by title (keeps most recent version of each title)
         * @returns {Promise<{removed: number, kept: number}>}
         */
        cleanupDuplicatesByTitle: async function () {
          try {
            const recipesList = await this.getRecipesList()
            
            if (recipesList.length === 0) {
              return { removed: 0, kept: 0 }
            }

            // Group by title, keeping the most recent
            const uniqueByTitle = new Map()
            recipesList.forEach(recipe => {
              if (recipe && recipe.title) {
                const existing = uniqueByTitle.get(recipe.title)
                if (!existing) {
                  uniqueByTitle.set(recipe.title, recipe)
                } else if (recipe.updated_at && existing.updated_at) {
                  if (new Date(recipe.updated_at) > new Date(existing.updated_at)) {
                    uniqueByTitle.set(recipe.title, recipe)
                  }
                }
              }
            })

            const keptRecipes = Array.from(uniqueByTitle.values())
            const keptIds = new Set(keptRecipes.map(r => r.id))
            
            // Delete recipe files for duplicates
            const deletePromises = recipesList
              .filter(r => !keptIds.has(r.id))
              .map(r => privateClient.remove(`recipes/${r.id}.json`).catch(err => {
                console.warn(`Could not delete recipe ${r.id}:`, err)
              }))
            
            await Promise.all(deletePromises)

            // Sort by updated_at descending
            keptRecipes.sort((a, b) => {
              const dateA = a.updated_at ? new Date(a.updated_at) : new Date(0)
              const dateB = b.updated_at ? new Date(b.updated_at) : new Date(0)
              return dateB - dateA
            })

            await writeRecipesListBuckets(keptRecipes)

            return {
              removed: recipesList.length - keptRecipes.length,
              kept: keptRecipes.length
            }
          } catch (error) {
            console.error("Error cleaning up duplicates:", error)
            throw error
          }
        },

        // ==================== SETTINGS METHODS ====================

        /**
         * Save settings
         * @param {Object} settings - Settings object
         * @returns {Promise<void>}
         */
        saveSettings: async function (settings) {
          const data = {
            ...settings,
            updated_at: new Date().toISOString()
          }
          await privateClient.storeObject('settings', 'settings.json', data)
        },

        /**
         * Load settings
         * @returns {Promise<Object>}
         */
        loadSettings: async function () {
          const         defaultSettings = {
            theme: 'light',
            language: 'en',
            defaultServings: 2,
            confirmDelete: true,  // Default to requiring confirmation
            filteredIngredients: [],  // Array of ingredient names to filter out
            weekRecipeIds: [],  // Recipe IDs selected for the current week (main view shows only these)
            optimizeNumToSelect: 7,
            optimizeMinMatchRate: 60,
            optimizePerMealLimits: {},  // e.g. { calories: 800, lactose: 2000 }
            optimizePerMealMinimums: {},  // e.g. { calories: 500 }
            dailyRecommended: {
              protein: 50,      // grams
              fat: 70,          // grams
              carbs: 250,       // grams (carb2)
              fiber: 25,        // grams (dietaryFibre)
              sodium: 2300,      // milligrams
              saturatedFat: 20, // grams
              kcal: 2000        // kilocalories
            }
          }

          try {
            const data = await privateClient.getObject('settings.json')
            return data ? { ...defaultSettings, ...data } : defaultSettings
          } catch (error) {
            if (isNotFoundError(error)) {
              return defaultSettings
            }
            console.error("Error loading settings:", error)
            return defaultSettings
          }
        }
      }
    }
  }
}

/**
 * Helper function to check if error is a "not found" error
 * @param {Error} error - The error to check
 * @returns {boolean}
 */
function isNotFoundError(error) {
  return (
    error?.status === 404 ||
    error?.code === 404 ||
    error?.code === "NotFound" ||
    error?.name === "NotFoundError" ||
    (error?.message && error.message.includes("404")) ||
    (error?.message && error.message.includes("Not Found")) ||
    (error?.message && error.message.includes("Not a folder"))
  )
}

