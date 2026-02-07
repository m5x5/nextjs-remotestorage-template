"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import { useRemoteStorageContext } from "@/contexts/RemoteStorageContext"
import { useRecipePage } from "@/hooks/use-recipe-page"
import { getEffectiveServings } from "@/lib/recipe-schema"
import { CORE_NUTRIENT_KEYS } from "@/lib/nutrient-registry"
import { getRecipeValueForGoal } from "@/lib/weekly-goals"
import MessageBanner from "@/components/home/MessageBanner"
import HomeTab from "@/components/home/HomeTab"
import RecipeDetailModal from "@/components/home/RecipeDetailModal"

function formatSavedAt(iso) {
  if (!iso) return "Saved week"
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { dateStyle: "medium" })
}

export default function HistoryWeekPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id

  const {
    loadSavedWeek,
    loadRecipe,
    saveSettings,
    loadRecipesByIds,
    settings,
  } = useRemoteStorageContext()

  const {
    message,
    messageType,
    selectedRecipe,
    showRecipeModal,
    closeRecipeModal,
    handleLoadRecipe,
    handleDelete,
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
    formatNutrientType,
    getDailyPercentage,
    formatBlsNutrientKey,
    formatIngredientQuantity,
    getMainNutrients,
    getAllNutrientPercentages,
  } = useRecipePage()

  const [savedWeek, setSavedWeek] = useState(null)
  const [viewWeekRecipes, setViewWeekRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id || !loadSavedWeek || !loadRecipe) return
    let cancelled = false
    setLoading(true)
    setNotFound(false)
    loadSavedWeek(id)
      .then((week) => {
        if (cancelled) return
        if (!week || !week.recipeIds?.length) {
          setSavedWeek(week || null)
          setViewWeekRecipes([])
          if (week && !week.recipeIds?.length) setNotFound(false)
          else if (!week) setNotFound(true)
          return
        }
        setSavedWeek(week)
        return Promise.all(week.recipeIds.map((rid) => loadRecipe(rid)))
      })
      .then((loaded) => {
        if (cancelled || loaded === undefined) return
        const valid = (loaded || []).filter(Boolean)
        setViewWeekRecipes(valid)
      })
      .catch(() => {
        if (!cancelled) setNotFound(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [id, loadSavedWeek, loadRecipe])

  const weeklyTotalsByKey = useMemo(() => {
    const goalKeys = new Set(CORE_NUTRIENT_KEYS)
    if (settings?.weeklyGoals) {
      Object.keys(settings.weeklyGoals).forEach((k) => {
        if (settings.weeklyGoals[k] > 0) goalKeys.add(k)
      })
    }
    if (settings?.dailyRecommended) {
      Object.keys(settings.dailyRecommended).forEach((k) => {
        if (settings.dailyRecommended[k] > 0) goalKeys.add(k)
      })
    }
    for (const r of viewWeekRecipes) {
      for (const n of (r.nutrients || [])) {
        if (n?.type) goalKeys.add(n.type)
      }
    }
    const totals = {}
    goalKeys.forEach((key) => {
      totals[key] = viewWeekRecipes.reduce(
        (sum, r) => sum + getRecipeValueForGoal(r.nutrients || [], key, r),
        0
      )
    })
    return totals
  }, [viewWeekRecipes, settings?.weeklyGoals, settings?.dailyRecommended])

  const handleCopyToCurrentWeek = async () => {
    if (!savedWeek?.recipeIds?.length || !saveSettings || !loadRecipesByIds) return
    try {
      await saveSettings({ ...settings, weekRecipeIds: savedWeek.recipeIds })
      await loadRecipesByIds(savedWeek.recipeIds)
      router.push("/")
    } catch (err) {
      console.error("Copy to current week failed:", err)
    }
  }

  const title = savedWeek?.label?.trim() || formatSavedAt(savedWeek?.savedAt) || "Saved week"

  if (loading) {
    return (
      <div className="py-8">
        <div className="text-muted-foreground">Loading saved week…</div>
      </div>
    )
  }

  if (notFound || !savedWeek) {
    return (
      <div className="py-8">
        <h1 className="text-3xl font-bold mb-6">Saved week</h1>
        <p className="text-muted-foreground">This saved week could not be found.</p>
        <button
          type="button"
          onClick={() => router.push("/history")}
          className="mt-4 text-primary font-medium hover:underline"
        >
          Back to history
        </button>
      </div>
    )
  }

  return (
    <div className="py-8">
      <MessageBanner message={message} messageType={messageType} />

      <HomeTab
        isConnected
        isLoading={false}
        recipes={viewWeekRecipes}
        weekRecipes={viewWeekRecipes}
        weeklyTotalsByKey={weeklyTotalsByKey}
        settings={settings}
        getMainNutrients={getMainNutrients}
        getAllNutrientPercentages={getAllNutrientPercentages}
        formatNutrientType={formatNutrientType}
        getEffectiveServings={getEffectiveServings}
        handleLoadRecipe={handleLoadRecipe}
        handleDelete={handleDelete}
        handleSetRecipeExcludedPin={undefined}
        openManageWeekModal={() => {}}
        showPinOptions={false}
        showWeekActions={false}
        title={title}
        onCopyToCurrentWeek={handleCopyToCurrentWeek}
        showEmptyStateAction={false}
        emptyStateMessage="No recipes in this saved week."
      />

      <RecipeDetailModal
        isOpen={showRecipeModal}
        onClose={closeRecipeModal}
        recipe={selectedRecipe}
        editingCookidooUrl={editingCookidooUrl}
        setEditingCookidooUrl={setEditingCookidooUrl}
        cookidooUrlInput={cookidooUrlInput}
        setCookidooUrlInput={setCookidooUrlInput}
        handleSaveCookidooUrl={handleSaveCookidooUrl}
        editingYield={editingYield}
        setEditingYield={setEditingYield}
        yieldTypeInput={yieldTypeInput}
        setYieldTypeInput={setYieldTypeInput}
        yieldQuantityInput={yieldQuantityInput}
        setYieldQuantityInput={setYieldQuantityInput}
        yieldUnitInput={yieldUnitInput}
        setYieldUnitInput={setYieldUnitInput}
        servingsInput={servingsInput}
        setServingsInput={setServingsInput}
        handleSaveYield={handleSaveYield}
        formatNutrientType={formatNutrientType}
        getDailyPercentage={getDailyPercentage}
        blsAuditRef={blsAuditRef}
        showFullBlsAudit={showFullBlsAudit}
        setShowFullBlsAudit={setShowFullBlsAudit}
        showInspectCalculation={showInspectCalculation}
        setShowInspectCalculation={setShowInspectCalculation}
        formatBlsNutrientKey={formatBlsNutrientKey}
        editingIngredients={editingIngredients}
        ingredientsEditList={ingredientsEditList}
        setIngredientsEditList={setIngredientsEditList}
        startEditingIngredients={startEditingIngredients}
        handleSaveIngredients={handleSaveIngredients}
        handleToggleExcludeFromNutrition={handleToggleExcludeFromNutrition}
        formatIngredientQuantity={formatIngredientQuantity}
        schemaOrgIngredientIndex={schemaOrgIngredientIndex}
        setSchemaOrgIngredientIndex={setSchemaOrgIngredientIndex}
        blsIngredientIndex={blsIngredientIndex}
        setBlsIngredientIndex={setBlsIngredientIndex}
        handleDelete={handleDelete}
        onExcludeIngredient={() => {}}
      />
    </div>
  )
}
