"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Input } from "@/components/ui/Input"
import {
  ExclamationTriangleIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PlusIcon,
  XMarkIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline"
import {
  DEFAULT_DAILY_GOALS,
  NUTRIENT_LABELS,
  NUTRIENT_UNITS,
  getNutrientsByCategory,
  CORE_NUTRIENT_KEYS,
} from "@/lib/nutrient-registry"

export default function SettingsTab({
  isConnected,
  theme,
  handleThemeChange,
  settings,
  saveSettings,
  setMessage,
  setMessageType,
  editingDefaultServings,
  setEditingDefaultServings,
  defaultServingsInput,
  setDefaultServingsInput,
  handleSaveDefaultServings,
  setShowImportModal,
  csvFileInputRef,
  handleImportFromCsv,
  isImportingCsv,
  csvLinksFileInputRef,
  handleImportFromCsvByLinks,
  isImportingByLinks,
  handleManualCleanup,
  isCleaningUp,
  getAllIngredients,
  ingredientsRecipes,
  recipesList = [],
  handleSetRecipeExcludedPin,
}) {
  const [expandedCategories, setExpandedCategories] = useState({})
  const [showAddNutrient, setShowAddNutrient] = useState(false)
  const [newFilterInput, setNewFilterInput] = useState("")
  const [isMobile, setIsMobile] = useState(false)
  const [mobileCategory, setMobileCategory] = useState(null)

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  if (!isConnected) {
    return (
      <div className="py-8 text-center">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          Please connect to RemoteStorage to access settings.
        </p>
      </div>
    )
  }

  const dailyRecommended = { ...DEFAULT_DAILY_GOALS, ...settings.dailyRecommended }
  const allAvailableIngredients = getAllIngredients(true, ingredientsRecipes)
  const filteredIngredients = settings.filteredIngredients || []
  const excludedRecipes = (recipesList || []).filter((r) => r && r.excluded)

  /** Case-sensitive: ingredient name is filtered if it contains any filter string. */
  const ingredientMatchesFilter = (ingredientName, filterList) =>
    filterList.some((f) => ingredientName.includes(f))

  const handleAddFilter = () => {
    const value = newFilterInput.trim()
    if (!value) return
    const current = settings.filteredIngredients || []
    if (current.some((f) => f === value)) {
      setNewFilterInput("")
      setMessage('Filter already in list (e.g. "' + value + '")')
      setMessageType("info")
      setTimeout(() => setMessage(""), 3000)
      return
    }
    setNewFilterInput("")
    setMessage("Filter added")
    setMessageType("success")
    setTimeout(() => setMessage(""), 2000)
    saveSettings((prev) => ({
      ...prev,
      filteredIngredients: [...(prev.filteredIngredients || []), value],
    })).catch((err) => {
      setMessage("Error saving filter: " + err.message)
      setMessageType("error")
      setTimeout(() => setMessage(""), 3000)
      setNewFilterInput(value)
    })
  }

  const isMobileList = isMobile && mobileCategory == null
  const isMobileDetail = isMobile && mobileCategory != null
  const sectionClass = "pt-4 border-t border-border"
  const sectionClassMaybe = isMobileDetail ? "" : sectionClass

  const categoryList = [
    { id: "general", title: "General", subtitle: "Theme, servings, delete confirmation" },
    { id: "dailyRecommended", title: "Daily Recommended Nutritional Values", subtitle: "" },
    { id: "excluded", title: "Excluded from optimization", subtitle: excludedRecipes.length > 0 ? `${excludedRecipes.length} recipe(s)` : "" },
    { id: "filterIngredients", title: "Filter Ingredients", subtitle: filteredIngredients.length > 0 ? `${filteredIngredients.length} active` : "" },
    { id: "dataManagement", title: "Data Management", subtitle: "Import, cleanup" },
  ]

  if (isMobileList) {
    return (
      <div className="rounded-lg border border-border overflow-hidden">
        <ul className="divide-y divide-border">
          {categoryList.map((cat) => (
            <li key={cat.id}>
              <button
                type="button"
                onClick={() => setMobileCategory(cat.id)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/50 active:bg-muted transition-colors"
              >
                <span className="font-medium text-foreground">{cat.title}</span>
                <span className="flex items-center gap-1 min-w-0">
                  {cat.subtitle && (
                    <span className="text-sm text-muted-foreground truncate">{cat.subtitle}</span>
                  )}
                  <ChevronRightIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const renderBackHeader = (title) => (
    <div className="flex items-center gap-2 mb-4">
      <button
        type="button"
        onClick={() => setMobileCategory(null)}
        className="flex items-center justify-center p-2 -ml-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Back to settings"
      >
        <ArrowLeftIcon className="h-5 w-5" />
      </button>
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
  )

  return (
    <div className={isMobileDetail ? "rounded-lg border border-border overflow-hidden" : ""}>
      <div className={isMobileDetail ? "px-4 py-4" : ""}>
        <div className="space-y-6">
          {(mobileCategory == null || mobileCategory === "general") && (
            <div className={sectionClassMaybe}>
              {isMobileDetail && renderBackHeader("General")}
              <div>
            <label className="mb-3 block text-sm font-medium">Theme</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleThemeChange("light")}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                  theme === "light"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                }`}
              >
                <SunIcon className="h-6 w-6" />
                <span className="text-sm font-medium">Light</span>
              </button>
              <button
                onClick={() => handleThemeChange("dark")}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                  theme === "dark"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                }`}
              >
                <MoonIcon className="h-6 w-6" />
                <span className="text-sm font-medium">Dark</span>
              </button>
              <button
                onClick={() => handleThemeChange("system")}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                  theme === "system"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                }`}
              >
                <ComputerDesktopIcon className="h-6 w-6" />
                <span className="text-sm font-medium">System</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Language</span>
            <Badge variant="muted">{settings.language}</Badge>
          </div>

          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Default Servings</span>
              {!editingDefaultServings && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingDefaultServings(true)}
                >
                  Edit
                </Button>
              )}
            </div>
            {editingDefaultServings ? (
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  min="1"
                  value={defaultServingsInput}
                  onChange={(e) => setDefaultServingsInput(e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">people</span>
                <Button variant="outline" size="sm" onClick={handleSaveDefaultServings}>
                  Save
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingDefaultServings(false)
                    setDefaultServingsInput(settings.defaultServings || 2)
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div>
                <Badge variant="default">{settings.defaultServings || 2} people</Badge>
                <p className="text-xs text-muted-foreground mt-2">
                  Default number of servings for new recipes
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <span className="text-sm font-medium block mb-1">
                  Confirm Before Deleting
                </span>
                <p className="text-xs text-muted-foreground">
                  Show a confirmation dialog before deleting recipes
                </p>
              </div>
              <button
                onClick={async () => {
                  const newValue = !(settings.confirmDelete !== false)
                  try {
                    await saveSettings({ ...settings, confirmDelete: newValue })
                    setMessage(
                      `Delete confirmation ${newValue ? "enabled" : "disabled"}`
                    )
                    setMessageType("success")
                    setTimeout(() => setMessage(""), 2000)
                  } catch (error) {
                    setMessage("Error saving setting: " + error.message)
                    setMessageType("error")
                    setTimeout(() => setMessage(""), 3000)
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.confirmDelete !== false ? "bg-primary" : "bg-muted"
                }`}
                role="switch"
                aria-checked={settings.confirmDelete !== false}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.confirmDelete !== false
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
            </div>
          )}

          {(mobileCategory == null || mobileCategory === "dailyRecommended") && (
          <div className={sectionClassMaybe}>
              {isMobileDetail && renderBackHeader("Daily Recommended Nutritional Values")}
            <h3 className="text-sm font-medium mb-3">
              Daily Recommended Nutritional Values
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              These values are used to calculate the percentage of daily value
              shown on recipes and weekly goal coverage.
            </p>
            {/* Active goals (nutrients with values set) */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {Object.entries(dailyRecommended)
                .filter(([, value]) => value != null && value > 0)
                .map(([key, value]) => {
                  const label = NUTRIENT_LABELS[key] || key
                  const unit = NUTRIENT_UNITS[key] || ""
                  return (
                    <div
                      key={key}
                      className="rounded-lg border border-border p-3 bg-card group relative"
                    >
                      <div className="text-xs text-muted-foreground mb-1">
                        {label}
                      </div>
                      <div className="text-lg font-semibold">
                        {value}
                        {unit}
                      </div>
                      {!CORE_NUTRIENT_KEYS.includes(key) && (
                        <button
                          className="absolute top-1 right-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity text-xs p-1"
                          onClick={async () => {
                            const updated = { ...dailyRecommended }
                            delete updated[key]
                            try {
                              await saveSettings({ ...settings, dailyRecommended: updated })
                              setMessage("Nutrient removed")
                              setMessageType("success")
                              setTimeout(() => setMessage(""), 2000)
                            } catch (error) {
                              setMessage("Error: " + error.message)
                              setMessageType("error")
                              setTimeout(() => setMessage(""), 3000)
                            }
                          }}
                          title="Remove this nutrient goal"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  )
                })}
            </div>
            {/* Add nutrient from all categories */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddNutrient(!showAddNutrient)}
              className="w-full flex items-center justify-center gap-1 mb-3"
            >
              {showAddNutrient ? (
                <ChevronDownIcon className="h-4 w-4" />
              ) : (
                <PlusIcon className="h-4 w-4" />
              )}
              {showAddNutrient ? "Hide nutrient browser" : "Add nutrient goal"}
            </Button>
            {showAddNutrient && (
              <div className="border border-border rounded-lg p-3 bg-card space-y-2 max-h-80 overflow-y-auto">
                {getNutrientsByCategory().map(({ category, nutrients }) => {
                  const isExpanded = expandedCategories[category]
                  const available = nutrients.filter(
                    (n) => !(dailyRecommended[n.key] > 0)
                  )
                  if (available.length === 0) return null
                  return (
                    <div key={category}>
                      <button
                        className="flex items-center gap-1 w-full text-left text-sm font-medium py-1 hover:text-primary"
                        onClick={() =>
                          setExpandedCategories((prev) => ({
                            ...prev,
                            [category]: !prev[category],
                          }))
                        }
                      >
                        {isExpanded ? (
                          <ChevronDownIcon className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRightIcon className="h-3.5 w-3.5" />
                        )}
                        {category}
                        <span className="text-xs text-muted-foreground ml-1">
                          ({available.length})
                        </span>
                      </button>
                      {isExpanded && (
                        <div className="pl-5 space-y-1 mt-1">
                          {available.map((n) => (
                            <button
                              key={n.key}
                              className="flex items-center justify-between w-full text-left text-sm py-1 px-2 rounded hover:bg-muted/50"
                              onClick={async () => {
                                const defaultVal =
                                  n.defaultDaily || DEFAULT_DAILY_GOALS[n.key] || 0
                                const input = prompt(
                                  `Set daily goal for ${n.label} (${n.unit}):`,
                                  defaultVal > 0 ? String(defaultVal) : ""
                                )
                                if (input === null) return
                                const val = parseFloat(input)
                                if (!Number.isFinite(val) || val <= 0) return
                                const updated = {
                                  ...dailyRecommended,
                                  [n.key]: val,
                                }
                                try {
                                  await saveSettings({
                                    ...settings,
                                    dailyRecommended: updated,
                                  })
                                  setMessage(`${n.label} goal set to ${val} ${n.unit}`)
                                  setMessageType("success")
                                  setTimeout(() => setMessage(""), 2000)
                                } catch (error) {
                                  setMessage("Error: " + error.message)
                                  setMessageType("error")
                                  setTimeout(() => setMessage(""), 3000)
                                }
                              }}
                            >
                              <span>
                                {n.label}{" "}
                                <span className="text-muted-foreground">
                                  ({n.unit})
                                </span>
                              </span>
                              <PlusIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          )}

          {(mobileCategory == null || mobileCategory === "excluded") && (
          <div className={sectionClassMaybe}>
              {isMobileDetail && renderBackHeader("Excluded from optimization")}
            <h3 className="text-sm font-medium mb-3">Excluded from optimization</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Recipes marked as excluded are not suggested when you run &quot;Optimize week&quot;. You can include them again below.
            </p>
            {excludedRecipes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No recipes excluded. Use the ⋮ menu on a recipe (Home or Manage week) to exclude it from optimization.
              </p>
            ) : (
              <ul className="space-y-2 max-h-48 overflow-y-auto border border-border rounded-lg p-3 bg-card">
                {excludedRecipes.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/50"
                  >
                    <span className="text-sm truncate flex-1 min-w-0 flex items-center gap-1.5" title={r.title}>
                      <NoSymbolIcon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                      {r.title || r.id}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-xs"
                      onClick={async () => {
                        if (!handleSetRecipeExcludedPin) return
                        try {
                          await handleSetRecipeExcludedPin(r.id, { excluded: false })
                          setMessage("Recipe included in optimization")
                          setMessageType("success")
                          setTimeout(() => setMessage(""), 2000)
                        } catch (err) {
                          setMessage("Error: " + err.message)
                          setMessageType("error")
                          setTimeout(() => setMessage(""), 3000)
                        }
                      }}
                    >
                      <CheckCircleIcon className="h-4 w-4 inline mr-1" />
                      Include
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          )}

          {(mobileCategory == null || mobileCategory === "filterIngredients") && (
          <div className={sectionClassMaybe}>
              {isMobileDetail && renderBackHeader("Filter Ingredients")}
            <h3 className="text-sm font-medium mb-3">Filter Ingredients</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Hide ingredients from the ingredients page and exclude recipes
              containing them from optimization. Matching is case-sensitive and
              by substring (ingredient name contains the filter).
            </p>
            <form
              className="flex gap-2 mb-3"
              onSubmit={(e) => {
                e.preventDefault()
                handleAddFilter()
              }}
            >
              <Input
                placeholder="Add filter (e.g. Salt or nuts)"
                value={newFilterInput}
                onChange={(e) => setNewFilterInput(e.target.value)}
                className="flex-1"
                aria-label="Filter text to add"
              />
              <button
                type="submit"
                title="Add filter"
                className="inline-flex items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-opacity hover:bg-muted hover:border-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlusIcon className="h-4 w-4 shrink-0" aria-hidden />
                <span>Add</span>
              </button>
            </form>
            {filteredIngredients.length > 0 && (
              <div className="mb-3">
                <h4 className="text-xs font-medium text-muted-foreground mb-2">
                  Active filters ({filteredIngredients.length})
                </h4>
                <ul className="flex flex-wrap gap-2">
                  {filteredIngredients.map((filter) => (
                    <li
                      key={filter}
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-sm"
                    >
                      <span>{filter}</span>
                      <button
                        type="button"
                        onClick={async () => {
                          const next = (settings.filteredIngredients || []).filter(
                            (f) => f !== filter
                          )
                          try {
                            await saveSettings({
                              ...settings,
                              filteredIngredients: next,
                            })
                            setMessage(`Filter "${filter}" removed`)
                            setMessageType("success")
                            setTimeout(() => setMessage(""), 2000)
                          } catch (err) {
                            setMessage("Error removing filter: " + err.message)
                            setMessageType("error")
                            setTimeout(() => setMessage(""), 3000)
                          }
                        }}
                        className="rounded p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title={`Remove "${filter}"`}
                        aria-label={`Remove filter ${filter}`}
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {allAvailableIngredients.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No ingredients found. Add some recipes first.
              </p>
            ) : (
              <>
                <div className="space-y-2 max-h-64 overflow-y-auto border border-border rounded-lg p-3 bg-card">
                  {allAvailableIngredients.map((ingredient) => {
                    const isFiltered = ingredientMatchesFilter(
                      ingredient.name,
                      filteredIngredients
                    )
                    return (
                      <label
                        key={ingredient.name}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isFiltered}
                          onChange={async (e) => {
                            const currentFiltered = filteredIngredients || []
                            let newFiltered
                            if (e.target.checked) {
                              if (
                                !currentFiltered.some((f) => f === ingredient.name)
                              ) {
                                newFiltered = [...currentFiltered, ingredient.name]
                              } else {
                                newFiltered = currentFiltered
                              }
                            } else {
                              newFiltered = currentFiltered.filter(
                                (f) => !ingredient.name.includes(f)
                              )
                            }
                            try {
                              await saveSettings({
                                ...settings,
                                filteredIngredients: newFiltered,
                              })
                              setMessage(
                                `Ingredient filter ${e.target.checked ? "added" : "removed"}`
                              )
                              setMessageType("success")
                              setTimeout(() => setMessage(""), 2000)
                            } catch (error) {
                              setMessage("Error saving filter: " + error.message)
                              setMessageType("error")
                              setTimeout(() => setMessage(""), 3000)
                            }
                          }}
                          className="rounded border-border text-primary focus:ring-primary"
                        />
                        <span className="text-sm flex-1">{ingredient.name}</span>
                        {ingredient.recipes.length > 0 && (
                          <Badge variant="muted" className="text-xs">
                            {ingredient.recipes.length} recipe
                            {ingredient.recipes.length !== 1 ? "s" : ""}
                          </Badge>
                        )}
                      </label>
                    )
                  })}
                </div>
                {filteredIngredients.length > 0 && (
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          await saveSettings({
                            ...settings,
                            filteredIngredients: [],
                          })
                          setMessage("All ingredient filters removed")
                          setMessageType("success")
                          setTimeout(() => setMessage(""), 2000)
                        } catch (error) {
                          setMessage("Error clearing filters: " + error.message)
                          setMessageType("error")
                          setTimeout(() => setMessage(""), 3000)
                        }
                      }}
                      className="w-full"
                    >
                      Clear All Filters
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
          )}

          {(mobileCategory == null || mobileCategory === "dataManagement") && (
          <div className={sectionClassMaybe}>
              {isMobileDetail && renderBackHeader("Data Management")}
            <h3 className="text-sm font-medium mb-3">Data Management</h3>
            <div className="space-y-3">
              <div>
                <Button
                  onClick={() => setShowImportModal(true)}
                  variant="primary"
                  className="w-full"
                >
                  Import Recipes from JSON
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Paste schema.org Recipe JSON or an array of recipe objects.
                </p>
              </div>
              <div>
                <input
                  ref={csvFileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleImportFromCsv}
                />
                <Button
                  onClick={() => csvFileInputRef.current?.click()}
                  variant="outline"
                  disabled={isImportingCsv}
                  className="w-full"
                >
                  {isImportingCsv ? "Importing…" : "Import from pipeline CSV"}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Upload recipe_database.csv or recipe_final.csv from
                  recipe_pipeline/data/.
                </p>
              </div>
              <div>
                <input
                  ref={csvLinksFileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleImportFromCsvByLinks}
                />
                <Button
                  onClick={() => csvLinksFileInputRef.current?.click()}
                  variant="outline"
                  disabled={isImportingByLinks}
                  className="w-full"
                >
                  {isImportingByLinks ? "Importing…" : "Import from CSV (by links)"}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Upload a CSV with a column of recipe URLs. Each link is fetched
                  and schema.org Recipe is scraped.
                </p>
              </div>
              <div>
                <Button
                  onClick={handleManualCleanup}
                  variant="outline"
                  disabled={isCleaningUp}
                  className="w-full"
                >
                  {isCleaningUp ? "Cleaning up..." : "Clean Up Duplicate Recipes"}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Remove duplicate recipes by title, keeping only the most
                  recent version.
                </p>
              </div>
            </div>
          </div>
          )}
        </div>
        {!isMobileDetail && (
          <p className="mt-4 text-xs text-muted-foreground">
            Theme preference is saved to your RemoteStorage. Customize more
            settings here!
          </p>
        )}
      </div>
    </div>
  )
}
