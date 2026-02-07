"use client"

import { useEffect } from "react"
import { useRecipePage } from "@/hooks/use-recipe-page"
import IngredientsTab from "@/components/home/IngredientsTab"

export default function IngredientsPage() {
  const {
    isConnected,
    ingredientsRecipesLoading,
    ingredientsRecipes,
    loadIngredientsRecipes,
    getAllIngredients,
    formatIngredientQuantity,
    copiedIngredient,
    copyIngredient,
    copyAllIngredients,
  } = useRecipePage()

  useEffect(() => {
    loadIngredientsRecipes?.()
  }, [loadIngredientsRecipes])

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Ingredients</h1>
      </div>
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
    </div>
  )
}
