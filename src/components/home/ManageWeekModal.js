"use client"

import { useState, useRef, useEffect } from "react"
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter } from "@/components/ui/Modal"
import { Button } from "@/components/ui/Button"
import { EllipsisVerticalIcon, NoSymbolIcon, CheckCircleIcon, MapPinIcon } from "@heroicons/react/24/outline"
import { MapPinIcon as MapPinIconSolid } from "@heroicons/react/24/solid"

export default function ManageWeekModal({
  isOpen,
  onClose,
  recipesList,
  manageWeekSelectedIds,
  setManageWeekSelectedIds,
  handleSetWeekRecipes,
  handleSetRecipeExcludedPin,
}) {
  const [openMenuId, setOpenMenuId] = useState(null)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!isOpen) setOpenMenuId(null)
  }, [isOpen])

  useEffect(() => {
    if (openMenuId == null) return
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenuId(null)
    }
    document.addEventListener("click", onDocClick, true)
    return () => document.removeEventListener("click", onDocClick, true)
  }, [openMenuId])

  const handleExcludePin = (recipeId, updates) => {
    handleSetRecipeExcludedPin?.(recipeId, updates)
    setOpenMenuId(null)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <ModalTitle>Recipes for this week</ModalTitle>
      </ModalHeader>
      <ModalContent>
        <p className="text-sm text-muted-foreground mb-4">
          Select which recipes to show on the main view. Only selected recipes
          appear under &quot;This week&quot;. Use the ⋮ menu to exclude recipes
          from optimization or pin them so they stay fixed when optimizing.
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
              const excluded = !!r.excluded
              const pinned = !!r.pinned
              const menuOpen = openMenuId === r.id
              return (
                <div
                  key={r.id}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 group"
                >
                  <label className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
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
                      className="rounded border-border text-primary focus:ring-primary shrink-0"
                    />
                    <span className="text-sm flex-1 truncate">{r.title || r.id}</span>
                  </label>
                  <div className="flex items-center gap-1 shrink-0">
                    {(excluded || pinned) && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        {excluded && (
                          <span className="inline-flex items-center gap-0.5" title="Excluded from optimization">
                            <NoSymbolIcon className="h-3.5 w-3.5" />
                          </span>
                        )}
                        {pinned && (
                          <span className="inline-flex items-center gap-0.5 text-primary" title="Pinned to week">
                            <MapPinIconSolid className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </span>
                    )}
                    <div className="relative" ref={menuOpen ? menuRef : null}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          setOpenMenuId((id) => (id === r.id ? null : r.id))
                        }}
                        className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label="Recipe options"
                        aria-expanded={menuOpen}
                      >
                        <EllipsisVerticalIcon className="h-5 w-5" />
                      </button>
                      {menuOpen && (
                        <div
                          className="absolute right-0 top-full mt-1 z-10 min-w-[200px] rounded-lg border border-border bg-card py-1 shadow-lg"
                          role="menu"
                        >
                          <button
                            type="button"
                            className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
                            role="menuitem"
                            onClick={() => handleExcludePin(r.id, { excluded: !excluded })}
                          >
                            {excluded ? (
                              <>
                                <CheckCircleIcon className="h-4 w-4" />
                                Include in optimization
                              </>
                            ) : (
                              <>
                                <NoSymbolIcon className="h-4 w-4" />
                                Exclude from optimization
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
                            role="menuitem"
                            onClick={() => handleExcludePin(r.id, { pinned: !pinned })}
                          >
                            {pinned ? (
                              <>
                                <MapPinIcon className="h-4 w-4" />
                                Unpin from week
                              </>
                            ) : (
                              <>
                                <MapPinIcon className="h-4 w-4" />
                                Pin to week
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
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
