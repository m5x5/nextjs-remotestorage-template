"use client"

import { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter } from "@/components/ui/Modal"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

export default function SaveWeekModal({
  isOpen,
  onClose,
  saveWeekLabel,
  setSaveWeekLabel,
  onSave,
  isLoading,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <ModalTitle>Save this week to history</ModalTitle>
      </ModalHeader>
      <ModalContent>
        <p className="text-sm text-muted-foreground mb-4">
          Save the current week&apos;s recipes so you can view or copy them later.
        </p>
        <Input
          label="Label (optional)"
          type="text"
          placeholder="e.g. Week of Feb 3"
          value={saveWeekLabel}
          onChange={(e) => setSaveWeekLabel(e.target.value)}
        />
      </ModalContent>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={onSave} disabled={isLoading}>
          {isLoading ? "Saving…" : "Save week"}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
