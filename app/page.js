"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { useRemoteStorageContext } from "../contexts/RemoteStorageContext"
import { useNavigation } from "../contexts/NavigationContext"
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card"
import { Button } from "../components/ui/Button"
import { Input, Textarea } from "../components/ui/Input"
import { Badge } from "../components/ui/Badge"
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter } from "../components/ui/Modal"
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  TrashIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon
} from "@heroicons/react/24/outline"

export default function Home() {
  const { isConnected, isLoading, itemsList, saveItem, loadItem, deleteItem, settings, saveSettings } = useRemoteStorageContext()
  const { theme, setTheme } = useTheme()
  const { activeTab, setActiveTab } = useNavigation()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedItem, setSelectedItem] = useState(null)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("info")
  const [showItemModal, setShowItemModal] = useState(false)

  // Sync theme with RemoteStorage settings on load
  useEffect(() => {
    if (isConnected && settings.theme && settings.theme !== theme) {
      setTheme(settings.theme)
    }
  }, [isConnected, settings.theme])

  // Handle theme change
  const handleThemeChange = async (newTheme) => {
    setTheme(newTheme)
    if (isConnected) {
      try {
        await saveSettings({ ...settings, theme: newTheme })
        setMessage("Theme updated successfully!")
        setMessageType("success")
        setTimeout(() => setMessage(""), 2000)
      } catch (error) {
        setMessage("Error saving theme: " + error.message)
        setMessageType("error")
      }
    }
  }

  // Handle save new item
  const handleSave = async (e) => {
    e.preventDefault()

    if (!title.trim()) {
      setMessage("Please enter a title")
      setMessageType("error")
      return
    }

    try {
      const newItem = {
        id: Date.now().toString(),
        title: title,
        description: description,
        created_at: new Date().toISOString()
      }

      await saveItem(newItem)
      setMessage("Item saved successfully!")
      setMessageType("success")
      setTitle("")
      setDescription("")

      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      setMessage("Error saving item: " + error.message)
      setMessageType("error")
    }
  }

  // Handle load item
  const handleLoadItem = async (id) => {
    try {
      const item = await loadItem(id)
      setSelectedItem(item)
      setShowItemModal(true)
    } catch (error) {
      setMessage("Error loading item: " + error.message)
      setMessageType("error")
    }
  }

  // Handle delete item
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this item?")) return

    try {
      await deleteItem(id)
      setMessage("Item deleted successfully!")
      setMessageType("success")
      setSelectedItem(null)
      setShowItemModal(false)

      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      setMessage("Error deleting item: " + error.message)
      setMessageType("error")
    }
  }

  return (
    <div className="py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Next.js RemoteStorage Template
        </h1>
        <p className="text-muted-foreground">
          A minimal example showing RemoteStorage integration
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-border">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab("home")}
            className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
              activeTab === "home"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Home
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
              activeTab === "settings"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Settings
          </button>
        </nav>
      </div>

      {/* Connection Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Connection Status</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : isConnected ? (
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-success" />
              <span className="font-medium text-success">Connected to RemoteStorage</span>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-destructive" />
                <span className="font-medium text-destructive">Not connected</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Click the RemoteStorage widget in the bottom right to connect
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Display */}
      {message && (
        <Card className={`mb-6 border-2 ${
          messageType === "success" ? "border-success bg-success/5" :
          messageType === "error" ? "border-destructive bg-destructive/5" :
          "border-primary bg-primary/5"
        }`}>
          <CardContent className="py-3">
            <p className={
              messageType === "success" ? "text-success" :
              messageType === "error" ? "text-destructive" :
              "text-primary"
            }>{message}</p>
          </CardContent>
        </Card>
      )}

      {/* Home Tab Content */}
      {activeTab === "home" && (
        <>
          {/* Only show content if connected */}
          {isConnected && (
            <>
              {/* Create New Item */}
              <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Item</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <Input
                  id="title"
                  label="Title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter item title"
                />
                <Textarea
                  id="description"
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Enter item description (optional)"
                />
                <Button type="submit">
                  Save Item
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Items List */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Your Items</CardTitle>
            </CardHeader>
            <CardContent>
              {itemsList.length === 0 ? (
                <p className="text-muted-foreground">No items yet. Create one above!</p>
              ) : (
                <div className="space-y-2">
                  {itemsList.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium">{item.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          Updated: {new Date(item.updated_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleLoadItem(item.id)}
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                          title="View item"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          title="Delete item"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

            </>
          )}

          {/* Instructions */}
          {!isConnected && (
            <Card>
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Click the RemoteStorage widget in the bottom right corner</li>
                  <li>Connect to a RemoteStorage server (e.g., https://remotestorage-widget.m5x5.com/)</li>
                  <li>Grant access to your data</li>
                  <li>Start creating and managing items!</li>
                </ol>
                <div className="rounded-lg border border-primary bg-primary/5 p-4">
                  <p className="text-sm text-primary">
                    <strong>Tip:</strong> Your data is stored on your own RemoteStorage server,
                    giving you full control and ownership of your information.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Settings Tab Content */}
      {activeTab === "settings" && (
        <>
          {isConnected ? (
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Theme Selection */}
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

                  {/* Language */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Language</span>
                    <Badge variant="muted">{settings.language}</Badge>
                  </div>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  Theme preference is saved to your RemoteStorage. Customize more settings here!
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Please connect to RemoteStorage to access settings.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Item Details Modal */}
      <Modal isOpen={showItemModal} onClose={() => setShowItemModal(false)}>
        {selectedItem && (
          <>
            <ModalHeader>
              <ModalTitle>Item Details</ModalTitle>
            </ModalHeader>
            <ModalContent>
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Title</span>
                  <p className="mt-1 font-medium">{selectedItem.title}</p>
                </div>
                {selectedItem.description && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Description</span>
                    <p className="mt-1">{selectedItem.description}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Created</span>
                  <p className="mt-1 text-sm">
                    {new Date(selectedItem.created_at).toLocaleString()}
                  </p>
                </div>
                {selectedItem.updated_at && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Updated</span>
                    <p className="mt-1 text-sm">
                      {new Date(selectedItem.updated_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </ModalContent>
            <ModalFooter>
              <Button variant="secondary" onClick={() => setShowItemModal(false)}>
                Close
              </Button>
              <Button variant="destructive" onClick={() => handleDelete(selectedItem.id)}>
                Delete
              </Button>
            </ModalFooter>
          </>
        )}
      </Modal>
    </div>
  )
}
