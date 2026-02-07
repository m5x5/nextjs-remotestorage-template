"use client"

import { useState } from "react"
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter } from "../ui/Modal"
import { Button } from "../ui/Button"
import { Badge } from "../ui/Badge"
import { Input } from "../ui/Input"
import {
  ArrowTopRightOnSquareIcon,
  CalculatorIcon,
  DocumentMagnifyingGlassIcon,
  ChartBarIcon,
  MinusCircleIcon,
  NoSymbolIcon,
} from "@heroicons/react/24/outline"
import { getPerServingLabel, getEffectiveServings } from "../../lib/recipe-schema"
import { getRecipeNutrientsForGoals, getIngredientContributionsForNutrient, getEffectiveAuditTrail } from "../../lib/weekly-goals"

export default function RecipeDetailModal({
  isOpen,
  onClose,
  recipe: selectedRecipe,
  // Cookidoo URL
  editingCookidooUrl,
  setEditingCookidooUrl,
  cookidooUrlInput,
  setCookidooUrlInput,
  handleSaveCookidooUrl,
  // Yield/servings
  editingYield,
  setEditingYield,
  yieldTypeInput,
  setYieldTypeInput,
  yieldQuantityInput,
  setYieldQuantityInput,
  yieldUnitInput,
  setYieldUnitInput,
  servingsInput,
  setServingsInput,
  handleSaveYield,
  // Nutrients
  formatNutrientType,
  getDailyPercentage,
  blsAuditRef,
  showFullBlsAudit,
  setShowFullBlsAudit,
  showInspectCalculation,
  setShowInspectCalculation,
  formatBlsNutrientKey,
  // Ingredients
  editingIngredients,
  ingredientsEditList,
  setIngredientsEditList,
  startEditingIngredients,
  handleSaveIngredients,
  handleToggleExcludeFromNutrition,
  formatIngredientQuantity,
  schemaOrgIngredientIndex,
  setSchemaOrgIngredientIndex,
  blsIngredientIndex,
  setBlsIngredientIndex,
  // Actions
  handleDelete,
  onExcludeIngredient,
}) {
  const [nutrientBreakdownFor, setNutrientBreakdownFor] = useState(null)

  if (!selectedRecipe) return null

  const getPerServing = () => getPerServingLabel(selectedRecipe)
  const servings = getEffectiveServings(selectedRecipe)
  const effectiveAuditTrail = getEffectiveAuditTrail(selectedRecipe)

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <ModalTitle>{selectedRecipe.title}</ModalTitle>
      </ModalHeader>
      <ModalContent>
        <div className="space-y-6">
          {selectedRecipe.image && (
            <div className="relative w-full h-64 bg-muted rounded-lg overflow-hidden">
              <img
                src={selectedRecipe.image}
                alt={selectedRecipe.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-muted-foreground">
                Cookidoo URL
              </label>
              {!editingCookidooUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingCookidooUrl(true)}
                >
                  {selectedRecipe.cookidooUrl ? "Edit" : "Add URL"}
                </Button>
              )}
            </div>
            {editingCookidooUrl ? (
              <div className="flex gap-2">
                <Input
                  type="url"
                  value={cookidooUrlInput}
                  onChange={(e) => setCookidooUrlInput(e.target.value)}
                  placeholder="https://cookidoo.de/recipe/..."
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={handleSaveCookidooUrl}>
                  Save
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingCookidooUrl(false)
                    setCookidooUrlInput(selectedRecipe?.cookidooUrl || "")
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : selectedRecipe.cookidooUrl ? (
              <div className="flex items-center gap-2">
                <a
                  href={selectedRecipe.cookidooUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline truncate flex-1"
                >
                  {selectedRecipe.cookidooUrl}
                </a>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No Cookidoo URL set</p>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">
              Serving / yield
            </h4>
            {editingYield ? (
              <div className="space-y-3 rounded-lg border border-border p-3 bg-card">
                <div className="flex flex-wrap gap-3 items-center">
                  <span className="text-sm text-muted-foreground">Yield as:</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="yieldType"
                      checked={yieldTypeInput === "portions"}
                      onChange={() => setYieldTypeInput("portions")}
                      className="rounded border-border text-primary"
                    />
                    <span className="text-sm">Portions</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="yieldType"
                      checked={yieldTypeInput === "weight"}
                      onChange={() => setYieldTypeInput("weight")}
                      className="rounded border-border text-primary"
                    />
                    <span className="text-sm">Weight (e.g. grams)</span>
                  </label>
                </div>
                {yieldTypeInput === "portions" ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Number of portions:
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={servingsInput}
                      onChange={(e) =>
                        setServingsInput(Number(e.target.value) || 1)
                      }
                      className="w-20 px-2 py-1 text-sm rounded border border-border bg-background"
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-muted-foreground">
                        Total yield:
                      </span>
                      <input
                        type="number"
                        min={0.1}
                        step={1}
                        value={yieldQuantityInput}
                        onChange={(e) =>
                          setYieldQuantityInput(Number(e.target.value) || 0)
                        }
                        className="w-24 px-2 py-1 text-sm rounded border border-border bg-background"
                      />
                      <input
                        type="text"
                        placeholder="g"
                        value={yieldUnitInput}
                        onChange={(e) =>
                          setYieldUnitInput(e.target.value.trim() || "g")
                        }
                        className="w-14 px-2 py-1 text-sm rounded border border-border bg-background"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Divide into how many portions?
                      </span>
                      <input
                        type="number"
                        min={1}
                        value={servingsInput}
                        onChange={(e) =>
                          setServingsInput(Number(e.target.value) || 1)
                        }
                        className="w-20 px-2 py-1 text-sm rounded border border-border bg-background"
                      />
                    </div>
                  </>
                )}
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" onClick={handleSaveYield}>
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingYield(false)
                      setYieldTypeInput(selectedRecipe?.yieldType || "portions")
                      setYieldQuantityInput(
                        selectedRecipe?.yieldQuantity ?? 500
                      )
                      setYieldUnitInput(selectedRecipe?.yieldUnit || "g")
                      setServingsInput(selectedRecipe?.servings ?? 2)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  {getPerServing()}
                  {selectedRecipe?.yieldType === "weight" &&
                    selectedRecipe?.yieldQuantity != null && (
                      <span className="ml-2">
                        (total {selectedRecipe.yieldQuantity}{" "}
                        {selectedRecipe.yieldUnit || "g"})
                      </span>
                    )}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingYield(true)}
                >
                  Edit
                </Button>
              </div>
            )}
          </div>

          {selectedRecipe.nutrients &&
            selectedRecipe.nutrients.length > 0 && (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h4 className="text-sm font-semibold text-muted-foreground">
                    Nutritional Information
                  </h4>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs flex items-center gap-1"
                      onClick={() => {
                        const hasBls =
                          selectedRecipe.ingredient_audit_trail?.length > 0 ||
                          selectedRecipe.match_rate != null
                        if (hasBls) {
                          setShowFullBlsAudit(true)
                          setShowInspectCalculation(false)
                          setTimeout(
                            () =>
                              blsAuditRef.current?.scrollIntoView({
                                behavior: "smooth",
                                block: "nearest",
                              }),
                            100
                          )
                        } else {
                          setShowInspectCalculation(true)
                        }
                      }}
                    >
                      <CalculatorIcon className="h-4 w-4" />
                      Inspect calculation
                    </Button>
                    <Badge variant="default">{getPerServing()}</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {getRecipeNutrientsForGoals(selectedRecipe).map((nutrient) => {
                    const divisor = 2
                    const displayValue = nutrient.number / divisor
                    const percentage = getDailyPercentage(
                      nutrient.type,
                      nutrient.number,
                      nutrient.unittype,
                      divisor
                    )
                    const hasBreakdown =
                      selectedRecipe.ingredient_audit_trail?.length > 0
                    const isBreakdownOpen = nutrientBreakdownFor === nutrient.type
                    return (
                      <button
                        key={nutrient.type}
                        type="button"
                        onClick={() =>
                          setNutrientBreakdownFor(
                            isBreakdownOpen ? null : nutrient.type
                          )
                        }
                        className={`rounded-lg border p-3 bg-card text-left transition-colors ${
                          hasBreakdown
                            ? "border-border hover:border-primary/40 cursor-pointer"
                            : "border-border cursor-default"
                        } ${isBreakdownOpen ? "ring-2 ring-primary/50 border-primary/50" : ""}`}
                        title={
                          hasBreakdown
                            ? "Click to see which ingredients contribute most"
                            : undefined
                        }
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            {formatNutrientType(nutrient.type)}
                            {hasBreakdown && (
                              <ChartBarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </div>
                          {percentage != null && (
                            <Badge variant="muted" className="text-xs">
                              {percentage}%
                            </Badge>
                          )}
                        </div>
                        <div className="text-lg font-semibold">
                          {displayValue.toFixed(1)}
                          {nutrient.unittype}
                        </div>
                        {percentage != null && (
                          <div className="text-xs text-muted-foreground mt-1">
                            of daily value
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
                {nutrientBreakdownFor != null && (
                  <div
                    className="mt-4 rounded-lg border border-border bg-muted/20 p-3"
                    role="region"
                    aria-label={`Contributors to ${formatNutrientType(nutrientBreakdownFor)}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-semibold text-foreground">
                        What contributes to {formatNutrientType(nutrientBreakdownFor)}?
                      </h5>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => setNutrientBreakdownFor(null)}
                      >
                        Close
                      </Button>
                    </div>
                    {(() => {
                      const {
                        contributions,
                        total,
                        unittype,
                      } = getIngredientContributionsForNutrient(
                        selectedRecipe,
                        nutrientBreakdownFor
                      )
                      if (contributions.length === 0) {
                        return (
                          <p className="text-sm text-muted-foreground">
                            Per-ingredient breakdown is only available when this
                            recipe was calculated from BLS data (e.g. imported
                            from recipe_final.csv). Use “Inspect calculation” to
                            see how totals were derived.
                          </p>
                        )
                      }
                      return (
                        <>
                          <p className="text-xs text-muted-foreground mb-2">
                            Total: {total.toFixed(1)}
                            {unittype} (total ÷ 2: {(total / 2).toFixed(1)}
                            {unittype})
                          </p>
                          <ul className="space-y-1.5 text-sm">
                            {contributions.map((c, i) => (
                              <li
                                key={i}
                                className="flex items-center justify-between gap-2"
                              >
                                <span className="text-foreground truncate min-w-0">
                                  {c.label}
                                </span>
                                <span className="text-muted-foreground shrink-0">
                                  {c.contribution.toFixed(1)}
                                  {unittype} ({c.percentOfTotal.toFixed(0)}%)
                                </span>
                              </li>
                            ))}
                          </ul>
                        </>
                      )
                    })()}
                  </div>
                )}
                {showInspectCalculation &&
                  !selectedRecipe.ingredient_audit_trail?.length &&
                  selectedRecipe.match_rate == null && (
                    <div
                      className="mt-4 rounded-lg border border-border bg-muted/20 p-3"
                      ref={blsAuditRef}
                    >
                      <h5 className="text-xs font-semibold text-muted-foreground mb-2">
                        How was this calculated?
                      </h5>
                      <p className="text-sm text-foreground mb-2">
                        This recipe has no BLS audit data. The values above are
                        from schema.org (author-provided) or from a previous
                        import.
                      </p>
                      <p className="text-xs text-muted-foreground mb-3">
                        To see how nutrition was calculated, re-import this
                        recipe from <strong>recipe_final.csv</strong> (Settings
                        → Import from pipeline CSV).
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => setShowInspectCalculation(false)}
                      >
                        Hide
                      </Button>
                    </div>
                  )}
                {(selectedRecipe.ingredients_matched != null ||
                  selectedRecipe.match_rate != null) && (
                  <div
                    ref={blsAuditRef}
                    className="mt-4 rounded-lg border border-border bg-muted/20 p-3"
                  >
                    <h5 className="text-xs font-semibold text-muted-foreground mb-2">
                      BLS nutrition calculation
                    </h5>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      {(selectedRecipe.ingredients_matched != null ||
                        selectedRecipe.ingredients_skipped != null) && (
                        <span>
                          <strong>
                            {selectedRecipe.ingredients_matched ?? 0}
                          </strong>{" "}
                          of{" "}
                          {(selectedRecipe.ingredients_matched ?? 0) +
                            (selectedRecipe.ingredients_skipped ?? 0)}{" "}
                          ingredients matched
                        </span>
                      )}
                      {selectedRecipe.match_rate != null && (
                        <Badge variant="default">
                          {Number(selectedRecipe.match_rate)}% match rate
                        </Badge>
                      )}
                      {selectedRecipe.ingredient_audit_trail?.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => setShowFullBlsAudit((v) => !v)}
                        >
                          {showFullBlsAudit ? "Hide" : "Show"} per-ingredient
                          calculation
                        </Button>
                      )}
                    </div>
                    {showFullBlsAudit &&
                      effectiveAuditTrail?.length > 0 && (
                        <ul className="mt-3 space-y-2 text-xs border-t border-border pt-3">
                          {effectiveAuditTrail.map(
                            (entry, idx) => {
                              const sameBlsInRecipe = entry.bls_name
                                ? selectedRecipe.ingredient_audit_trail?.filter(
                                    (e) => e.bls_name === entry.bls_name
                                  ).length ?? 0
                                : 0
                              const excluded = entry.excludeFromNutrition
                              return (
                                <li
                                  key={idx}
                                  className={`rounded border p-2 ${
                                    excluded
                                      ? "border-amber-500/50 bg-amber-500/5"
                                      : "border-border/60 bg-card"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                      <div className="font-medium text-foreground">
                                        {entry.original ??
                                          entry.parsed_name ??
                                          `Ingredient ${idx + 1}`}
                                      </div>
                                      {entry.matched ? (
                                        <>
                                          <div className="text-muted-foreground mt-1">
                                            → BLS:{" "}
                                            <strong>{entry.bls_name}</strong>
                                            {sameBlsInRecipe > 1 && (
                                              <span className="ml-1">
                                                (used {sameBlsInRecipe}× in this
                                                recipe)
                                              </span>
                                            )}
                                          </div>
                                          {entry.weight_g != null && (
                                            <div className="text-muted-foreground">
                                              Weight used: {entry.weight_g} g
                                            </div>
                                          )}
                                          {entry.nutrient_contribution &&
                                            Object.keys(entry.nutrient_contribution)
                                              .length > 0 && (
                                              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-0.5">
                                                {Object.entries(
                                                  entry.nutrient_contribution
                                                )
                                                  .slice(0, 8)
                                                  .map(([k, v]) => (
                                                    <span key={k}>
                                                      {formatBlsNutrientKey(k)}:{" "}
                                                      {typeof v === "number"
                                                        ? v.toFixed(1)
                                                        : v}
                                                    </span>
                                                  ))}
                                                {Object.keys(
                                                  entry.nutrient_contribution
                                                ).length > 8 && (
                                                  <span className="col-span-2 text-muted-foreground">
                                                    +
                                                    {Object.keys(
                                                      entry.nutrient_contribution
                                                    ).length - 8}{" "}
                                                    more
                                                  </span>
                                                )}
                                              </div>
                                            )}
                                        </>
                                      ) : (
                                        <div className="text-muted-foreground mt-1">
                                          Not matched in BLS (skipped)
                                        </div>
                                      )}
                                    </div>
                                    {handleToggleExcludeFromNutrition &&
                                      entry.matched && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="shrink-0 text-xs"
                                          title={
                                            excluded
                                              ? "Include in nutrition calculation again"
                                              : "Exclude from this recipe’s nutrition only (e.g. wrong BLS mapping). Does not affect optimizations or ingredient list."
                                          }
                                          onClick={() =>
                                            handleToggleExcludeFromNutrition(idx)
                                          }
                                        >
                                          {excluded ? (
                                            <>
                                              <MinusCircleIcon className="h-3.5 w-3.5 mr-1 opacity-70" />
                                              Include
                                            </>
                                          ) : (
                                            <>
                                              <MinusCircleIcon className="h-3.5 w-3.5 mr-1 opacity-70" />
                                              Exclude
                                            </>
                                          )}
                                        </Button>
                                      )}
                                  </div>
                                  {excluded && (
                                    <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                                      Excluded from this recipe’s nutrition totals only (e.g. wrong BLS mapping). Not excluded from optimizations or ingredient list.
                                    </div>
                                  )}
                                </li>
                              )
                            }
                          )}
                        </ul>
                      )}
                  </div>
                )}
              </div>
            )}

          {selectedRecipe.ingredients &&
            Array.isArray(selectedRecipe.ingredients) &&
            selectedRecipe.ingredients.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-muted-foreground">
                    Ingredients
                  </h4>
                  {!editingIngredients && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={startEditingIngredients}
                    >
                      Edit
                    </Button>
                  )}
                </div>
                {!editingIngredients && (
                  <p className="text-xs text-muted-foreground mb-2">
                    {selectedRecipe.ingredient_audit_trail?.length > 0 ? (
                      <>
                        Use the <strong>calculator icon</strong> for BLS
                        calculation. Use the <strong>document icon</strong> for
                        schema.org source.
                      </>
                    ) : (
                      <>
                        To see BLS mapping, import from{" "}
                        <strong>recipe_final.csv</strong> (Settings → Import
                        from pipeline CSV).
                      </>
                    )}
                  </p>
                )}
                {editingIngredients ? (
                  <div className="space-y-3 rounded-lg border border-border p-3 bg-card">
                    <p className="text-xs text-muted-foreground">
                      Set <strong>Weight (g)</strong> for grams or{" "}
                      <strong>Amount</strong> for count (e.g. 2 eggs).
                    </p>
                    <ul className="space-y-2">
                      {ingredientsEditList.map((row, index) => (
                        <li
                          key={index}
                          className="flex flex-wrap items-center gap-2 text-sm border-b border-border/60 pb-2 last:border-0"
                        >
                          <span
                            className="w-full sm:w-40 min-w-0 truncate font-medium"
                            title={row.ingredientNotation}
                          >
                            {row.ingredientNotation || "—"}
                          </span>
                          <input
                            type="number"
                            min={0}
                            step={
                              row.quantityType === "weight" ? 1 : 0.25
                            }
                            value={
                              row.quantity?.value !== undefined &&
                              row.quantity?.value !== ""
                                ? row.quantity.value
                                : ""
                            }
                            onChange={(e) => {
                              const raw = e.target.value
                              const v =
                                raw === "" ? "" : parseFloat(raw) || 0
                              setIngredientsEditList((prev) => {
                                const next = [...prev]
                                next[index] = {
                                  ...next[index],
                                  quantity: {
                                    ...next[index].quantity,
                                    value: v,
                                  },
                                }
                                return next
                              })
                            }}
                            placeholder="Qty"
                            className="w-20 px-2 py-1 text-sm rounded border border-border bg-background"
                          />
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="radio"
                                name={`qty-type-${index}`}
                                checked={row.quantityType === "amount"}
                                onChange={() =>
                                  setIngredientsEditList((prev) => {
                                    const next = [...prev]
                                    next[index] = {
                                      ...next[index],
                                      quantityType: "amount",
                                    }
                                    return next
                                  })
                                }
                                className="rounded border-border text-primary"
                              />
                              <span className="text-xs">Amount</span>
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="radio"
                                name={`qty-type-${index}`}
                                checked={row.quantityType === "weight"}
                                onChange={() =>
                                  setIngredientsEditList((prev) => {
                                    const next = [...prev]
                                    next[index] = {
                                      ...next[index],
                                      quantityType: "weight",
                                      quantity: {
                                        ...next[index].quantity,
                                        unitNotation:
                                          next[index].quantity?.unitNotation ||
                                          "g",
                                      },
                                    }
                                    return next
                                  })
                                }
                                className="rounded border-border text-primary"
                              />
                              <span className="text-xs">Weight (g)</span>
                            </label>
                          </div>
                          {row.quantityType === "weight" && (
                            <input
                              type="text"
                              value={row.quantity?.unitNotation ?? "g"}
                              onChange={(e) =>
                                setIngredientsEditList((prev) => {
                                  const next = [...prev]
                                  next[index] = {
                                    ...next[index],
                                    quantity: {
                                      ...next[index].quantity,
                                      unitNotation:
                                        e.target.value.trim() || "g",
                                    },
                                  }
                                  return next
                                })
                              }
                              placeholder="g"
                              className="w-12 px-2 py-1 text-sm rounded border border-border bg-background"
                            />
                          )}
                        </li>
                      ))}
                    </ul>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSaveIngredients}
                      >
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingIngredients(false)
                          setIngredientsEditList([])
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {selectedRecipe.ingredients.map((ingredient, index) => {
                      if (!ingredient || typeof ingredient !== "object")
                        return null
                      const ingredientName =
                        typeof ingredient.ingredientNotation === "string"
                          ? ingredient.ingredientNotation
                          : ingredient.ingredientNotation
                            ? String(ingredient.ingredientNotation)
                            : "Unknown ingredient"
                      const qtyDisplay =
                        formatIngredientQuantity(ingredient)
                      const schemaIngredient =
                        selectedRecipe.schema?.recipeIngredient?.[index]
                      const hasSchema =
                        schemaIngredient !== undefined &&
                        schemaIngredient !== null
                      const showSchema =
                        schemaOrgIngredientIndex === index
                      const auditEntry =
                        effectiveAuditTrail[index] ??
                        selectedRecipe.ingredient_audit_trail?.[index]
                      const hasBls =
                        selectedRecipe.ingredient_audit_trail?.[index] != null
                      const showBls = blsIngredientIndex === index
                      return (
                        <li key={index} className="text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <span className="flex-1 min-w-0">
                              {ingredientName}
                              {ingredient.optional && (
                                <Badge
                                  variant="muted"
                                  className="text-xs ml-2"
                                >
                                  Optional
                                </Badge>
                              )}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              {qtyDisplay != null && (
                                <span className="text-muted-foreground">
                                  {qtyDisplay}
                                </span>
                              )}
                              {onExcludeIngredient && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    console.log("[RecipeDetailModal] Exclude button clicked", ingredientName)
                                    e.preventDefault()
                                    e.stopPropagation()
                                    onExcludeIngredient(ingredientName)
                                  }}
                                  className="min-w-[2.25rem] min-h-[2.25rem] inline-flex items-center justify-center rounded-lg p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
                                  title="Exclude this ingredient from ingredients list and future optimizations"
                                  aria-label={`Exclude ${ingredientName}`}
                                >
                                  <NoSymbolIcon className="h-4 w-4" />
                                </button>
                              )}
                              {hasBls && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setBlsIngredientIndex(showBls ? null : index)
                                  }
                                  className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                  title={
                                    showBls
                                      ? "Hide BLS calculation"
                                      : "View BLS match and nutrition calculation"
                                  }
                                >
                                  <CalculatorIcon className="h-4 w-4" />
                                </button>
                              )}
                              {hasSchema && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSchemaOrgIngredientIndex(
                                      showSchema ? null : index
                                    )
                                  }
                                  className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                  title={
                                    showSchema
                                      ? "Hide schema.org source"
                                      : "View original schema.org for this ingredient"
                                  }
                                >
                                  <DocumentMagnifyingGlassIcon className="h-4 w-4" />
                                </button>
                              )}
                              {handleToggleExcludeFromNutrition &&
                                hasBls &&
                                auditEntry?.matched && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleToggleExcludeFromNutrition(index)
                                    }
                                    className={`p-1.5 rounded transition-colors ${
                                      auditEntry.excludeFromNutrition
                                        ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/30"
                                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                    }`}
                                    title={
                                      auditEntry.excludeFromNutrition
                                        ? "Include in nutrition calculation again"
                                        : "Exclude from this recipe’s nutrition only (e.g. wrong BLS mapping). Does not affect optimizations or ingredient list."
                                    }
                                    aria-label={
                                      auditEntry.excludeFromNutrition
                                        ? "Include in nutrition"
                                        : "Exclude from nutrition"
                                    }
                                  >
                                    <MinusCircleIcon className="h-4 w-4" />
                                  </button>
                                )}
                            </div>
                          </div>
                          {hasBls && showBls && auditEntry && (
                            <div className="mt-2 rounded-lg border border-border bg-muted/30 p-3">
                              <div className="text-xs font-medium text-muted-foreground mb-1">
                                BLS calculation for this ingredient
                              </div>
                              {auditEntry.matched ? (
                                <>
                                  <p className="text-xs text-foreground">
                                    Matched to:{" "}
                                    <strong>{auditEntry.bls_name}</strong>
                                    {selectedRecipe.ingredient_audit_trail.filter(
                                      (e) => e.bls_name === auditEntry.bls_name
                                    ).length > 1 && (
                                      <span className="ml-1 text-muted-foreground">
                                        (this BLS entry used{" "}
                                        {
                                          selectedRecipe.ingredient_audit_trail.filter(
                                            (e) =>
                                              e.bls_name === auditEntry.bls_name
                                          ).length
                                        }
                                        × in recipe)
                                      </span>
                                    )}
                                  </p>
                                  {auditEntry.weight_g != null && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Weight used: {auditEntry.weight_g} g
                                    </p>
                                  )}
                                  {auditEntry.nutrient_contribution &&
                                    Object.keys(
                                      auditEntry.nutrient_contribution
                                    ).length > 0 && (
                                      <div className="mt-2 text-xs grid grid-cols-2 gap-x-4 gap-y-0.5">
                                        {Object.entries(
                                          auditEntry.nutrient_contribution
                                        ).map(([k, v]) => (
                                          <span key={k}>
                                            {formatBlsNutrientKey(k)}:{" "}
                                            {typeof v === "number"
                                              ? v.toFixed(1)
                                              : v}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                </>
                              ) : (
                                <p className="text-xs text-muted-foreground">
                                  Not matched in BLS — no nutrition
                                  contribution.
                                </p>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-2 text-xs"
                                onClick={() => setBlsIngredientIndex(null)}
                              >
                                Hide
                              </Button>
                            </div>
                          )}
                          {hasSchema && showSchema && (
                            <div className="mt-2 rounded-lg border border-border bg-muted/30 p-3">
                              <div className="text-xs font-medium text-muted-foreground mb-1">
                                Original schema.org
                              </div>
                              <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-words font-mono text-foreground">
                                {typeof schemaIngredient === "string"
                                  ? schemaIngredient
                                  : JSON.stringify(schemaIngredient, null, 2)}
                              </pre>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-2 text-xs"
                                onClick={() =>
                                  setSchemaOrgIngredientIndex(null)
                                }
                              >
                                Hide
                              </Button>
                            </div>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )}

          <div className="pt-4 border-t border-border">
            {selectedRecipe.created_at && (
              <div className="text-xs text-muted-foreground">
                Created:{" "}
                {new Date(selectedRecipe.created_at).toLocaleString()}
              </div>
            )}
            {selectedRecipe.updated_at && (
              <div className="text-xs text-muted-foreground">
                Updated:{" "}
                {new Date(selectedRecipe.updated_at).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </ModalContent>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        {selectedRecipe.cookidooUrl && (
          <Button
            variant="outline"
            onClick={() =>
              window.open(
                selectedRecipe.cookidooUrl,
                "_blank",
                "noopener,noreferrer"
              )
            }
            className="flex items-center gap-2"
          >
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            Open in Cookidoo
          </Button>
        )}
        <Button
          variant="destructive"
          onClick={() => handleDelete(selectedRecipe.id)}
        >
          Delete Recipe
        </Button>
      </ModalFooter>
    </Modal>
  )
}
