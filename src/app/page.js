"use client"

import { useRecipePage } from "@/hooks/use-recipe-page"
import { getEffectiveServings } from "@/lib/recipe-schema"
import MessageBanner from "@/components/home/MessageBanner"
import HomeTab from "@/components/home/HomeTab"
import ImportRecipesModal from "@/components/home/ImportRecipesModal"
import ManageWeekModal from "@/components/home/ManageWeekModal"
import SaveWeekModal from "@/components/home/SaveWeekModal"
import RecipeDetailModal from "@/components/home/RecipeDetailModal"

export default function Home() {
  const {
    isConnected,
    isLoading,
    recipes,
    recipesList,
    weekRecipes,
    weeklyTotalsByKey,
    settings,
    message,
    messageType,
    selectedRecipe,
    showRecipeModal,
    closeRecipeModal,
    handleLoadRecipe,
    handleDelete,
    handleSetRecipeExcludedPin,
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
    showImportModal,
    setShowImportModal,
    importJsonInput,
    setImportJsonInput,
    isImporting,
    handleImportRecipes,
    showManageWeekModal,
    setShowManageWeekModal,
    manageWeekSelectedIds,
    setManageWeekSelectedIds,
    openManageWeekModal,
    handleSetWeekRecipes,
    showSaveWeekModal,
    setShowSaveWeekModal,
    saveWeekLabel,
    setSaveWeekLabel,
    openSaveWeekModal,
    handleSaveWeekToHistory,
    getMainNutrients,
    getAllNutrientPercentages,
    formatNutrientType,
    getDailyPercentage,
    formatBlsNutrientKey,
    formatIngredientQuantity,
    handleExcludeIngredient,
  } = useRecipePage()

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Recipe Collection</h1>
      </div>

      <MessageBanner message={message} messageType={messageType} />

      <HomeTab
        isConnected={isConnected}
        isLoading={isLoading}
        recipes={recipes}
        weekRecipes={weekRecipes}
        weeklyTotalsByKey={weeklyTotalsByKey}
        settings={settings}
        getMainNutrients={getMainNutrients}
        getAllNutrientPercentages={getAllNutrientPercentages}
        formatNutrientType={formatNutrientType}
        getEffectiveServings={getEffectiveServings}
        handleLoadRecipe={handleLoadRecipe}
        handleDelete={handleDelete}
        handleSetRecipeExcludedPin={handleSetRecipeExcludedPin}
        openManageWeekModal={openManageWeekModal}
        openSaveWeekModal={openSaveWeekModal}
      />

      <ImportRecipesModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        importJsonInput={importJsonInput}
        setImportJsonInput={setImportJsonInput}
        isImporting={isImporting}
        handleImportRecipes={handleImportRecipes}
        defaultServings={settings.defaultServings}
      />

      <ManageWeekModal
        isOpen={showManageWeekModal}
        onClose={() => setShowManageWeekModal(false)}
        recipesList={recipesList}
        manageWeekSelectedIds={manageWeekSelectedIds}
        setManageWeekSelectedIds={setManageWeekSelectedIds}
        handleSetWeekRecipes={handleSetWeekRecipes}
        handleSetRecipeExcludedPin={handleSetRecipeExcludedPin}
      />

      <SaveWeekModal
        isOpen={showSaveWeekModal}
        onClose={() => setShowSaveWeekModal(false)}
        saveWeekLabel={saveWeekLabel}
        setSaveWeekLabel={setSaveWeekLabel}
        onSave={handleSaveWeekToHistory}
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
        onExcludeIngredient={handleExcludeIngredient}
      />
    </div>
  )
}
