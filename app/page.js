"use client"

import { useRecipePage } from "../hooks/use-recipe-page"
import { getEffectiveServings } from "../lib/recipe-schema"
import MessageBanner from "../components/home/MessageBanner"
import HomeTab from "../components/home/HomeTab"
import OptimizeTab from "../components/home/OptimizeTab"
import IngredientsTab from "../components/home/IngredientsTab"
import SettingsTab from "../components/home/SettingsTab"
import ImportRecipesModal from "../components/home/ImportRecipesModal"
import ManageWeekModal from "../components/home/ManageWeekModal"
import RecipeDetailModal from "../components/home/RecipeDetailModal"

export default function Home() {
  const {
    isConnected,
    isLoading,
    recipes,
    recipesList,
    weekRecipes,
    weeklyTotalsByKey,
    settings,
    activeTab,
    setActiveTab,
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
    ingredientsRecipes,
    ingredientsRecipesLoading,
    getAllIngredients,
    copiedIngredient,
    copyIngredient,
    copyAllIngredients,
    handleExcludeIngredient,
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
    setMessage,
    setMessageType,
    formatNutrientType,
    formatIngredientQuantity,
    formatBlsNutrientKey,
    getMainNutrients,
    getDailyPercentage,
    getAllNutrientPercentages,
    WEEKLY_GOAL_KEYS,
  } = useRecipePage()

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Recipe Collection</h1>
      </div>

      <MessageBanner message={message} messageType={messageType} />

      {activeTab === "home" && (
        <HomeTab
          isConnected={isConnected}
          isLoading={isLoading}
          recipes={recipes}
          weekRecipes={weekRecipes}
          weeklyTotalsByKey={weeklyTotalsByKey}
          settings={settings}
          setActiveTab={setActiveTab}
          getMainNutrients={getMainNutrients}
          getAllNutrientPercentages={getAllNutrientPercentages}
          formatNutrientType={formatNutrientType}
          getEffectiveServings={getEffectiveServings}
          handleLoadRecipe={handleLoadRecipe}
          handleDelete={handleDelete}
          openManageWeekModal={openManageWeekModal}
        />
      )}

      {activeTab === "optimize" && (
        <OptimizeTab
          isConnected={isConnected}
          isOptimizing={isOptimizing}
          optimizeNumToSelect={optimizeNumToSelect}
          setOptimizeNumToSelect={setOptimizeNumToSelect}
          optimizeMinMatchRate={optimizeMinMatchRate}
          setOptimizeMinMatchRate={setOptimizeMinMatchRate}
          optimizePerMealLimits={optimizePerMealLimits}
          setOptimizePerMealLimits={setOptimizePerMealLimits}
          optimizePerMealMinimums={optimizePerMealMinimums}
          setOptimizePerMealMinimums={setOptimizePerMealMinimums}
          runOptimization={runOptimization}
        />
      )}

      {activeTab === "ingredients" && (
        <IngredientsTab
          isConnected={isConnected}
          ingredientsRecipesLoading={ingredientsRecipesLoading}
          ingredientsRecipes={ingredientsRecipes}
          getAllIngredients={getAllIngredients}
          formatIngredientQuantity={formatIngredientQuantity}
          copiedIngredient={copiedIngredient}
          copyIngredient={copyIngredient}
          copyAllIngredients={copyAllIngredients}
        />
      )}

      {activeTab === "settings" && (
        <SettingsTab
          isConnected={isConnected}
          theme={theme}
          handleThemeChange={handleThemeChange}
          settings={settings}
          saveSettings={saveSettings}
          setMessage={setMessage}
          setMessageType={setMessageType}
          editingDefaultServings={editingDefaultServings}
          setEditingDefaultServings={setEditingDefaultServings}
          defaultServingsInput={defaultServingsInput}
          setDefaultServingsInput={setDefaultServingsInput}
          handleSaveDefaultServings={handleSaveDefaultServings}
          setShowImportModal={setShowImportModal}
          csvFileInputRef={csvFileInputRef}
          handleImportFromCsv={handleImportFromCsv}
          isImportingCsv={isImportingCsv}
          csvLinksFileInputRef={csvLinksFileInputRef}
          handleImportFromCsvByLinks={handleImportFromCsvByLinks}
          isImportingByLinks={isImportingByLinks}
          handleManualCleanup={handleManualCleanup}
          isCleaningUp={isCleaningUp}
          getAllIngredients={getAllIngredients}
          ingredientsRecipes={ingredientsRecipes}
        />
      )}

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
