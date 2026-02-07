"use client"

import { useRecipePage } from "@/hooks/use-recipe-page"
import MessageBanner from "@/components/home/MessageBanner"
import SettingsTab from "@/components/home/SettingsTab"
import ImportRecipesModal from "@/components/home/ImportRecipesModal"

export default function SettingsPage() {
  const {
    message,
    messageType,
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
    showImportModal,
    importJsonInput,
    setImportJsonInput,
    isImporting,
    handleImportRecipes,
    isConnected,
  } = useRecipePage()

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
      </div>
      <MessageBanner message={message} messageType={messageType} />
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
      <ImportRecipesModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        importJsonInput={importJsonInput}
        setImportJsonInput={setImportJsonInput}
        isImporting={isImporting}
        handleImportRecipes={handleImportRecipes}
        defaultServings={settings.defaultServings}
      />
    </div>
  )
}
