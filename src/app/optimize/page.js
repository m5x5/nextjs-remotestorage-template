"use client"

import { useRecipePage } from "@/hooks/use-recipe-page"
import OptimizeTab from "@/components/home/OptimizeTab"

export default function OptimizePage() {
  const {
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
  } = useRecipePage()

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Optimize week</h1>
      </div>
      <OptimizeTab
        isConnected={isConnected}
        isOptimizing={isOptimizing}
        optimizeNumToSelect={optimizeNumToSelect}
        setOptimizeNumToSelect={setOptimizeNumToSelect}
        optimizeMinMatchRate={optimizeMinMatchRate}
        setOptimizeMinMatchRate={setOptimizeMinMatchRate}
        optimizePerMealLimits={optimizePerMealLimits}
        setOptimizePerMealLimits={setOptimizePerMealLimits}
        optimizePerMealMinimums={optimizePerMealMinimums}
        setOptimizePerMealMinimums={setOptimizePerMealMinimums}
        runOptimization={runOptimization}
      />
    </div>
  )
}
