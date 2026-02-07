"use client"

import { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter } from "../ui/Modal"
import { Button } from "../ui/Button"

export default function ImportRecipesModal({
  isOpen,
  onClose,
  importJsonInput,
  setImportJsonInput,
  isImporting,
  handleImportRecipes,
  defaultServings,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <ModalTitle>Import Recipes from JSON</ModalTitle>
      </ModalHeader>
      <ModalContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Paste schema.org Recipe JSON (single object or array), or an array
            of recipe objects with title, nutrients, ingredients, link. Full
            schema is stored in RemoteStorage.
          </p>
          <div>
            <label className="text-sm font-medium mb-2 block">JSON Data</label>
            <textarea
              value={importJsonInput}
              onChange={(e) => setImportJsonInput(e.target.value)}
              placeholder='{"@type":"Recipe","name":"...","recipeIngredient":[...],"nutrition":{...}} or [{"title":"...","nutrients":[...],...}]'
              className="w-full h-64 px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="rounded-lg border border-primary bg-primary/5 p-3">
            <p className="text-xs text-primary">
              <strong>Note:</strong> This will import recipes with the default
              servings setting ({defaultServings ?? 2} people). The
              &quot;link&quot; field will be mapped to Cookidoo URL automatically.
            </p>
          </div>
        </div>
      </ModalContent>
      <ModalFooter>
        <Button
          variant="secondary"
          onClick={() => {
            onClose()
            setImportJsonInput("")
          }}
          disabled={isImporting}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleImportRecipes}
          disabled={isImporting || !importJsonInput.trim()}
        >
          {isImporting ? "Importing..." : "Import Recipes"}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
