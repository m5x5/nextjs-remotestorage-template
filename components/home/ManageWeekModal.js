"use client"

import { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter } from "../ui/Modal"
import { Button } from "../ui/Button"

export default function ManageWeekModal({
  isOpen,
  onClose,
  recipesList,
  manageWeekSelectedIds,
  setManageWeekSelectedIds,
  handleSetWeekRecipes,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <ModalTitle>Recipes for this week</ModalTitle>
      </ModalHeader>
      <ModalContent>
        <p className="text-sm text-muted-foreground mb-4">
          Select which recipes to show on the main view. Only selected recipes
          appear under &quot;This week&quot;.
        </p>
        {recipesList.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No recipes yet. Import from Settings (JSON or CSV).
          </p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto border border-border rounded-lg p-3 bg-card">
            {recipesList.map((r) => {
              if (!r?.id) return null
              const checked = manageWeekSelectedIds.includes(r.id)
              return (
                <label
                  key={r.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      setManageWeekSelectedIds((prev) =>
                        prev.includes(r.id)
                          ? prev.filter((id) => id !== r.id)
                          : [...prev, r.id]
                      )
                    }}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm flex-1 truncate">{r.title || r.id}</span>
                </label>
              )
            })}
          </div>
        )}
      </ModalContent>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={() => handleSetWeekRecipes(manageWeekSelectedIds)}
          disabled={recipesList.length === 0}
        >
          Save week
        </Button>
      </ModalFooter>
    </Modal>
  )
}
