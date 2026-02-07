"use client"

import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card"
import { Button } from "../ui/Button"
import { Badge } from "../ui/Badge"
import { ExclamationTriangleIcon, ClipboardIcon, CheckIcon } from "@heroicons/react/24/outline"

export default function IngredientsTab({
  isConnected,
  ingredientsRecipesLoading,
  ingredientsRecipes,
  getAllIngredients,
  formatIngredientQuantity,
  copiedIngredient,
  copyIngredient,
  copyAllIngredients,
}) {
  if (!isConnected) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Please connect to RemoteStorage to view ingredients.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (ingredientsRecipesLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            Loading recipes for ingredients…
          </p>
        </CardContent>
      </Card>
    )
  }

  if (ingredientsRecipes.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            No recipes yet. Add some recipes to see ingredients.
          </p>
        </CardContent>
      </Card>
    )
  }

  const allIngredients = getAllIngredients(false, ingredientsRecipes)
  if (allIngredients.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No ingredients found in recipes.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>All Ingredients ({allIngredients.length})</CardTitle>
          <Button
            variant="primary"
            size="sm"
            onClick={() => copyAllIngredients(ingredientsRecipes)}
            className="flex items-center gap-2"
          >
            <ClipboardIcon className="h-4 w-4" />
            Copy All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {allIngredients.map((ingredient, index) => {
            const isCopied = copiedIngredient === ingredient.name
            const qtyDisplay = ingredient.fullIngredient
              ? formatIngredientQuantity(ingredient.fullIngredient)
              : null
            const displayText =
              qtyDisplay != null
                ? `${qtyDisplay} ${ingredient.name}`
                : ingredient.quantity !== null
                ? `${ingredient.quantity}${ingredient.unit ? ` ${ingredient.unit}` : ""} ${ingredient.name}`
                : ingredient.name

            return (
              <div
                key={index}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{displayText}</span>
                    {ingredient.optional && (
                      <Badge variant="muted" className="text-xs">
                        Optional
                      </Badge>
                    )}
                  </div>
                  {ingredient.recipes.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Used in: {ingredient.recipes.join(", ")}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => copyIngredient(ingredient)}
                  className="shrink-0 p-2 rounded-lg hover:bg-muted transition-colors"
                  title="Copy ingredient"
                >
                  {isCopied ? (
                    <CheckIcon className="h-5 w-5 text-success" />
                  ) : (
                    <ClipboardIcon className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
