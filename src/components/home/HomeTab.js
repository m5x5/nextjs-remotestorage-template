"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter } from "@/components/ui/Modal"
import { TrashIcon, ArrowTopRightOnSquareIcon, ChartBarIcon, EllipsisVerticalIcon, NoSymbolIcon, MapPinIcon } from "@heroicons/react/24/outline"
import { MapPinIcon as MapPinIconSolid } from "@heroicons/react/24/solid"
import RecipeCharts from "@/components/RecipeCharts"
import {
  NUTRIENT_LABELS,
  NUTRIENT_UNITS,
  CORE_NUTRIENT_KEYS,
  DEFAULT_WEEKLY_GOALS,
} from "@/lib/nutrient-registry"
import {
  getRecipeNutrientsForGoals,
  getRecipeValueForGoal,
  getIngredientContributionsForNutrient,
  getAppNutrientTypeForGoalKey,
} from "@/lib/weekly-goals"

export default function HomeTab({
  isConnected,
  isLoading,
  recipes,
  weekRecipes,
  weeklyTotalsByKey,
  settings,
  getMainNutrients,
  getAllNutrientPercentages,
  formatNutrientType,
  getEffectiveServings: getServings,
  handleLoadRecipe,
  handleDelete,
  handleSetRecipeExcludedPin,
  openManageWeekModal,
  openSaveWeekModal,
  showPinOptions = true,
  showWeekActions = true,
  title = "This week",
  onCopyToCurrentWeek,
  showEmptyStateAction = true,
  emptyStateMessage,
}) {
  const [goalKeyForBreakdown, setGoalKeyForBreakdown] = useState(null)
  const [openMenuId, setOpenMenuId] = useState(null)
  const menuRef = useRef(null)

  useEffect(() => {
    if (openMenuId == null) return
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenuId(null)
    }
    document.addEventListener("click", onDocClick, true)
    return () => document.removeEventListener("click", onDocClick, true)
  }, [openMenuId])

  const breakdownData = useMemo(() => {
    if (!goalKeyForBreakdown || !weekRecipes?.length) return null
    const unit = NUTRIENT_UNITS[goalKeyForBreakdown] || ""
    const appType = getAppNutrientTypeForGoalKey(goalKeyForBreakdown)
    const byRecipe = weekRecipes
      .map((recipe) => ({
        recipe,
        value: getRecipeValueForGoal(recipe?.nutrients ?? [], goalKeyForBreakdown, recipe),
      }))
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value)
    const withIngredients = byRecipe.map(({ recipe, value }) => {
      const breakdown =
        appType != null
          ? getIngredientContributionsForNutrient(recipe, appType)
          : { contributions: [], total: value, unittype: unit }
      return {
        recipe,
        value,
        contributions: breakdown.contributions.slice(0, 8),
        unittype: breakdown.unittype || unit,
      }
    })
    return { unit, byRecipe: withIngredients }
  }, [goalKeyForBreakdown, weekRecipes])

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Click the RemoteStorage widget in the bottom right corner</li>
            <li>
              Connect to a RemoteStorage server (e.g.,
              https://remotestorage-widget.m5x5.com/)
            </li>
            <li>Grant access to your data</li>
            <li>Start creating and managing items!</li>
          </ol>
          <div className="rounded-lg border border-primary bg-primary/5 p-4">
            <p className="text-sm text-primary">
              <strong>Tip:</strong> Your data is stored on your own RemoteStorage
              server, giving you full control and ownership of your information.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex items-center gap-2">
          {onCopyToCurrentWeek != null ? (
            <Button
              variant="primary"
              size="sm"
              onClick={onCopyToCurrentWeek}
              className="flex items-center gap-2"
            >
              Copy to current week
            </Button>
          ) : showWeekActions ? (
            <>
              {openSaveWeekModal && weekRecipes.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openSaveWeekModal}
                  className="flex items-center gap-2"
                >
                  Save this week
                </Button>
              )}
              <Link
                href="/optimize"
                className="inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-opacity border-2 border-dashed border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:border-muted-foreground/50 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <ChartBarIcon className="h-4 w-4" />
                Optimize week
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={openManageWeekModal}
                className="flex items-center gap-2"
              >
                Manage week
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Weekly nutrition goals</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Goals for the week (aligned with Python pipeline). Current and
            coverage are <strong>per person</strong> (sum of week recipes ÷ 2
            people).
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 font-medium">Nutrient</th>
                  <th className="text-right py-2 pr-4 font-medium">Goal (week)</th>
                  <th className="text-right py-2 pr-4 font-medium">Current</th>
                  <th className="text-right py-2 font-medium">Coverage</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Show all nutrients that have a weekly goal (from settings or defaults)
                  const customGoalKeys = settings.weeklyGoals
                    ? Object.keys(settings.weeklyGoals).filter(
                        (k) => settings.weeklyGoals[k] > 0
                      )
                    : []
                  const dailyKeys = settings.dailyRecommended
                    ? Object.keys(settings.dailyRecommended).filter(
                        (k) => settings.dailyRecommended[k] > 0
                      )
                    : []
                  const allGoalKeys = [
                    ...new Set([
                      ...CORE_NUTRIENT_KEYS,
                      ...customGoalKeys,
                      ...dailyKeys,
                    ]),
                  ]
                  return allGoalKeys.map((key) => {
                    const weeklyGoal =
                      (settings.weeklyGoals && settings.weeklyGoals[key]) ??
                      (DEFAULT_WEEKLY_GOALS[key] != null
                        ? DEFAULT_WEEKLY_GOALS[key]
                        : settings.dailyRecommended?.[key] != null
                        ? settings.dailyRecommended[key] * 7
                        : null)
                    if (weeklyGoal == null || weeklyGoal <= 0) return null
                    const householdTotal = weeklyTotalsByKey[key] || 0
                    const currentPerPerson = householdTotal / 2
                    const coverage = Math.round((currentPerPerson / weeklyGoal) * 100)
                    const unit = NUTRIENT_UNITS[key] || ""
                    return (
                      <tr key={key} className="border-b border-border/60">
                        <td className="py-1.5 pr-4">
                          {NUTRIENT_LABELS[key] || key}
                        </td>
                        <td className="text-right py-1.5 pr-4">
                          {weeklyGoal.toLocaleString()} {unit}
                        </td>
                        <td
                          className="text-right py-1.5 pr-4 cursor-pointer hover:bg-muted/50 rounded select-none"
                          onClick={() =>
                            setGoalKeyForBreakdown((k) =>
                              k === key ? null : key
                            )
                          }
                          title="Click to see which recipes and ingredients contributed"
                        >
                          <span className="inline-flex items-center gap-1">
                            {currentPerPerson.toLocaleString(undefined, {
                              maximumFractionDigits: 1,
                            })}{" "}
                            {unit}
                            <ChartBarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          </span>
                        </td>
                        <td className="text-right py-1.5">
                          <span
                            className={
                              coverage >= 100
                                ? "text-success"
                                : coverage >= 80
                                ? "text-foreground"
                                : "text-muted-foreground"
                            }
                          >
                            {coverage}%
                          </span>
                        </td>
                      </tr>
                    )
                  })
                })()}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Click a value in <strong>Current</strong> to see which recipes and
            ingredients contributed.
          </p>
        </CardContent>
      </Card>

      <Modal
        isOpen={goalKeyForBreakdown != null}
        onClose={() => setGoalKeyForBreakdown(null)}
      >
        <ModalHeader>
          <ModalTitle>
            {goalKeyForBreakdown != null
              ? `Contributions: ${NUTRIENT_LABELS[goalKeyForBreakdown] || goalKeyForBreakdown}`
              : ""}
          </ModalTitle>
        </ModalHeader>
        <ModalContent>
          {breakdownData && (
            <div className="space-y-4">
              <ul className="space-y-4">
                {breakdownData.byRecipe.map(({ recipe, value, contributions, unittype }) => (
                  <li
                    key={recipe.id}
                    className="rounded-lg border border-border bg-card p-3"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-left font-medium text-foreground hover:bg-muted/50 justify-start flex-1 min-w-0"
                        onClick={() => {
                          handleLoadRecipe(recipe.id)
                          setGoalKeyForBreakdown(null)
                        }}
                      >
                        <span className="truncate">{recipe.title}</span>
                        <ArrowTopRightOnSquareIcon className="h-4 w-4 shrink-0 ml-1 opacity-70" />
                      </Button>
                      <span className="text-sm font-semibold shrink-0">
                        {value.toLocaleString(undefined, {
                          maximumFractionDigits: 1,
                        })}{" "}
                        {unittype}
                      </span>
                    </div>
                    {contributions.length > 0 ? (
                      <ul className="text-xs text-muted-foreground space-y-1 pl-1">
                        {contributions.map((c, i) => (
                          <li key={i} className="flex justify-between gap-2">
                            <span className="truncate">{c.label}</span>
                            <span className="shrink-0">
                              {c.contribution.toFixed(1)} {unittype}
                              {c.percentOfTotal != null && (
                                <span className="ml-1 opacity-80">
                                  ({c.percentOfTotal.toFixed(0)}%)
                                </span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        No per-ingredient breakdown (BLS audit not available for
                        this recipe).
                      </p>
                    )}
                  </li>
                ))}
              </ul>
              {breakdownData.byRecipe.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No contributions from this week’s recipes.
                </p>
              )}
            </div>
          )}
        </ModalContent>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setGoalKeyForBreakdown(null)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>

      {weekRecipes.length > 0 && (
        <RecipeCharts recipes={weekRecipes} settings={settings} />
      )}

      {isLoading ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Loading recipes...</p>
          </CardContent>
        </Card>
      ) : weekRecipes.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center space-y-4">
            <p className="text-muted-foreground">
              {emptyStateMessage != null
                ? emptyStateMessage
                : recipes.length === 0
                ? "No recipes yet. Import recipes from Settings."
                : "No recipes selected for this week."}
            </p>
            {showEmptyStateAction && (
              <Button variant="primary" onClick={openManageWeekModal}>
                {recipes.length === 0
                  ? "Import recipes"
                  : "Select recipes for this week"}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {weekRecipes.map((recipe) => {
            const nutrientsForDisplay = getRecipeNutrientsForGoals(recipe)
            const mainNutrients = getMainNutrients(nutrientsForDisplay)
            const divisor = 2
            const nutrientPercentages = getAllNutrientPercentages(
              nutrientsForDisplay,
              divisor
            )
            return (
              <Card
                key={recipe.id}
                className="overflow-hidden cursor-pointer hover:shadow-none"
                onClick={() => handleLoadRecipe(recipe.id)}
              >
                <div className="flex gap-4">
                  <div className="relative w-32 h-32 md:w-48 md:h-48 bg-muted overflow-hidden rounded-lg shrink-0">
                    {recipe.image ? (
                      <Image
                        src={recipe.image}
                        alt={recipe.title}
                        fill
                        className="object-cover"
                        unoptimized
                        onError={(e) => {
                          e.target.style.display = "none"
                          e.target.nextSibling.style.display = "flex"
                        }}
                      />
                    ) : null}
                    <div className="hidden absolute inset-0 items-center justify-center bg-muted text-muted-foreground">
                      <span className="text-xs">No Image</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="font-semibold text-lg line-clamp-2 flex-1 leading-tight min-w-0">
                        {recipe.title}
                      </h3>
                      <div className="flex items-center gap-0.5 shrink-0">
                        {showPinOptions && (recipe.excluded || recipe.pinned) && (
                          <span className="flex items-center gap-0.5 text-muted-foreground" title={recipe.excluded ? "Excluded from optimization" : ""}>
                            {recipe.excluded && <NoSymbolIcon className="h-4 w-4" />}
                            {recipe.pinned && <MapPinIconSolid className="h-4 w-4 text-primary" title="Pinned to week" />}
                          </span>
                        )}
                        {showPinOptions && (
                          <div className="relative" ref={openMenuId === recipe.id ? menuRef : null}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setOpenMenuId((id) => (id === recipe.id ? null : recipe.id))
                              }}
                              className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                              aria-label="Recipe options"
                              aria-expanded={openMenuId === recipe.id}
                            >
                              <EllipsisVerticalIcon className="h-5 w-5" />
                            </button>
                            {openMenuId === recipe.id && (
                              <div
                                className="absolute right-0 top-full mt-1 z-20 min-w-[200px] rounded-lg border border-border bg-card py-1 shadow-lg"
                                role="menu"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
                                  role="menuitem"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleSetRecipeExcludedPin?.(recipe.id, { excluded: !recipe.excluded })
                                    setOpenMenuId(null)
                                  }}
                                >
                                  {recipe.excluded ? (
                                    <>
                                      <NoSymbolIcon className="h-4 w-4" />
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
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleSetRecipeExcludedPin?.(recipe.id, { pinned: !recipe.pinned })
                                    setOpenMenuId(null)
                                  }}
                                >
                                  {recipe.pinned ? (
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
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 pt-4 border-t border-border">
                      {recipe.cookidooUrl ? (
                        <a
                          href={recipe.cookidooUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="w-full"
                        >
                          <Button
                            variant="primary"
                            size="sm"
                            className="w-full flex items-center justify-center gap-2"
                          >
                            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                            Open in Cookidoo
                          </Button>
                        </a>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full flex items-center justify-center gap-2 border-dashed"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleLoadRecipe(recipe.id)
                          }}
                        >
                          <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                          Add Cookidoo Link
                        </Button>
                      )}
                      <div className="hidden md:flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleLoadRecipe(recipe.id)
                          }}
                        >
                          View Details
                        </Button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(recipe.id)
                          }}
                          className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          title="Delete recipe"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                {mainNutrients.length > 0 && (
                  <div className="flex border-t border-border -mx-4 -mb-4 mt-4">
                    {mainNutrients.map((nutrient, index) => {
                      const displayValue = (nutrient.number / divisor).toFixed(0)
                      const percentage = nutrientPercentages[nutrient.type]
                      const isLast = index === mainNutrients.length - 1
                      return (
                        <div
                          key={nutrient.type}
                          className={`flex-1 px-3 py-2 text-center ${
                            !isLast ? "border-r border-border" : ""
                          }`}
                        >
                          <div className="text-xs text-muted-foreground mb-0.5">
                            {formatNutrientType(nutrient.type)}
                          </div>
                          <div className="text-sm font-semibold">
                            {displayValue}
                            {nutrient.unittype}
                          </div>
                          {percentage != null && (
                            <div className="text-xs text-muted-foreground">
                              {percentage}%
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
