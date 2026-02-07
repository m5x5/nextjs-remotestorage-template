"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card"
import { Button } from "../ui/Button"
import { Input } from "../ui/Input"
import {
  NUTRIENT_LABELS,
  NUTRIENT_UNITS,
  getNutrientsByCategory,
} from "../../lib/nutrient-registry"

export default function OptimizeTab({
  isConnected,
  isOptimizing,
  optimizeNumToSelect,
  setOptimizeNumToSelect,
  optimizeMinMatchRate,
  setOptimizeMinMatchRate,
  optimizePerMealLimits,
  setOptimizePerMealLimits,
  optimizePerMealMinimums,
  setOptimizePerMealMinimums,
  runOptimization,
}) {
  const [addLimitKey, setAddLimitKey] = useState("calories")
  const [addLimitValue, setAddLimitValue] = useState("")
  const [addMinKey, setAddMinKey] = useState("calories")
  const [addMinValue, setAddMinValue] = useState("")

  const handleAddPerMealLimit = () => {
    const value = parseFloat(addLimitValue)
    if (!Number.isFinite(value) || value <= 0) return
    setOptimizePerMealLimits((prev) => ({ ...prev, [addLimitKey]: value }))
    setAddLimitValue("")
  }

  const removePerMealLimit = (key) => {
    setOptimizePerMealLimits((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const handleAddPerMealMinimum = () => {
    const value = parseFloat(addMinValue)
    if (!Number.isFinite(value) || value <= 0) return
    setOptimizePerMealMinimums((prev) => ({ ...prev, [addMinKey]: value }))
    setAddMinValue("")
  }

  const removePerMealMinimum = (key) => {
    setOptimizePerMealMinimums((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            Connect RemoteStorage to use the optimizer.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Optimize week</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Load all recipes and run the optimizer to pick recipes that best meet
          your weekly nutrient goals. Data is loaded only when you press Run.
        </p>
        <Input
          label="Number of recipes to select"
          type="number"
          min={1}
          max={100}
          value={String(optimizeNumToSelect)}
          onChange={(e) => setOptimizeNumToSelect(e.target.value)}
        />
        <Input
          label="Minimum BLS match rate (%)"
          type="number"
          min={0}
          max={100}
          value={String(optimizeMinMatchRate)}
          onChange={(e) => setOptimizeMinMatchRate(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Recipes with BLS match rate below this are excluded from optimization
          (0 = no filter). Recipes without BLS data are always included.
        </p>

        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            Per-meal limits (optional)
          </p>
          <p className="text-xs text-muted-foreground">
            Recipes that exceed any limit are excluded. Leave empty for no
            limit.
          </p>
          <div className="flex flex-wrap items-end gap-2">
            <select
              className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              value={addLimitKey}
              onChange={(e) => setAddLimitKey(e.target.value)}
              aria-label="Nutrient for limit"
            >
              {getNutrientsByCategory().map(({ category, nutrients }) => (
                <optgroup key={category} label={category}>
                  {nutrients.map((n) => (
                    <option key={n.key} value={n.key}>
                      {n.label} ({n.unit})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <div className="w-28">
              <Input
                label="Max per meal"
                type="number"
                min={0.1}
                step="any"
                placeholder={
                  addLimitKey === "calories"
                    ? "e.g. 800"
                    : addLimitKey === "protein"
                      ? "e.g. 50"
                      : ""
                }
                value={addLimitValue}
                onChange={(e) => setAddLimitValue(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddPerMealLimit}
              disabled={
                !addLimitValue.trim() ||
                !Number.isFinite(parseFloat(addLimitValue)) ||
                parseFloat(addLimitValue) <= 0
              }
            >
              Add limit
            </Button>
          </div>
            {optimizePerMealLimits &&
            Object.keys(optimizePerMealLimits).length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-2">
                {Object.entries(optimizePerMealLimits).map(([key, value]) => (
                  <li
                    key={key}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-1 text-sm"
                  >
                    <span className="text-foreground">
                      {NUTRIENT_LABELS[key]} ≤ {value}{" "}
                      {NUTRIENT_UNITS[key]}
                    </span>
                    <button
                      type="button"
                      onClick={() => removePerMealLimit(key)}
                      className="rounded p-0.5 text-muted-foreground hover:bg-muted-foreground/20 hover:text-foreground"
                      aria-label={`Remove limit for ${NUTRIENT_LABELS[key]}`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            Per-meal minimums (optional)
          </p>
          <p className="text-xs text-muted-foreground">
            Recipes below any minimum are excluded (e.g. at least 500 kcal per
            meal).
          </p>
          <div className="flex flex-wrap items-end gap-2">
            <select
              className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              value={addMinKey}
              onChange={(e) => setAddMinKey(e.target.value)}
              aria-label="Nutrient for minimum"
            >
              {getNutrientsByCategory().map(({ category, nutrients }) => (
                <optgroup key={category} label={category}>
                  {nutrients.map((n) => (
                    <option key={n.key} value={n.key}>
                      {n.label} ({n.unit})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <div className="w-28">
              <Input
                label="Min per meal"
                type="number"
                min={0.1}
                step="any"
                placeholder={
                  addMinKey === "calories"
                    ? "e.g. 500"
                    : addMinKey === "protein"
                      ? "e.g. 20"
                      : ""
                }
                value={addMinValue}
                onChange={(e) => setAddMinValue(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddPerMealMinimum}
              disabled={
                !addMinValue.trim() ||
                !Number.isFinite(parseFloat(addMinValue)) ||
                parseFloat(addMinValue) <= 0
              }
            >
              Add minimum
            </Button>
          </div>
          {optimizePerMealMinimums &&
            Object.keys(optimizePerMealMinimums).length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-2">
                {Object.entries(optimizePerMealMinimums).map(([key, value]) => (
                  <li
                    key={key}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-1 text-sm"
                  >
                    <span className="text-foreground">
                      {NUTRIENT_LABELS[key]} ≥ {value}{" "}
                      {NUTRIENT_UNITS[key]}
                    </span>
                    <button
                      type="button"
                      onClick={() => removePerMealMinimum(key)}
                      className="rounded p-0.5 text-muted-foreground hover:bg-muted-foreground/20 hover:text-foreground"
                      aria-label={`Remove minimum for ${NUTRIENT_LABELS[key]}`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
        </div>

        <Button
          variant="primary"
          onClick={runOptimization}
          disabled={isOptimizing}
          className="w-full"
        >
          {isOptimizing
            ? "Loading recipes & optimizing…"
            : "Run optimization"}
        </Button>
      </CardContent>
    </Card>
  )
}
