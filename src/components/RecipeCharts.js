"use client"

import { useMemo } from "react"
import { useTheme } from "next-themes"
import ReactECharts from "echarts-for-react"
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card"
import { getDailyPercentage } from "@/lib/recipe-display-utils"
import { DEFAULT_DAILY_GOALS } from "@/lib/nutrient-registry"

export default function RecipeCharts({ recipes = [], settings = {} }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  // Get daily recommended values from settings with fallback to defaults
  const dailyRecommended = useMemo(
    () => ({ ...DEFAULT_DAILY_GOALS, ...settings.dailyRecommended }),
    [settings.dailyRecommended]
  )
  
  // Process recipe data for charts
  const chartData = useMemo(() => {
    if (!recipes || recipes.length === 0) return null

    // Extract and process nutrients for each recipe
    const divisor = 2
    const processedRecipes = recipes.map((recipe) => {
      const nutrients = recipe.nutrients || []
      
      // Extract individual nutrient values (total for recipe)
      const proteinTotal = nutrients.find(n => n.type === 'protein')?.number || 0
      const fatTotal = nutrients.find(n => n.type === 'fat')?.number || 0
      const carbsTotal = nutrients.find(n => n.type === 'carb2')?.number || 0
      const fiberTotal = nutrients.find(n => n.type === 'dietaryFibre')?.number || 0
      const kcalTotal = nutrients.find(n => n.type === 'kcal')?.number || 0
      
      // Display: total recipe divided by 2 (not per serving)
      const protein = proteinTotal / divisor
      const fat = fatTotal / divisor
      const carbs = carbsTotal / divisor
      const fiber = fiberTotal / divisor
      const kcal = kcalTotal / divisor
      
      // Percentages based on total ÷ 2
      const proteinPct = getDailyPercentage('protein', proteinTotal, 'g', divisor, dailyRecommended)
      const fatPct = getDailyPercentage('fat', fatTotal, 'g', divisor, dailyRecommended)
      const carbsPct = getDailyPercentage('carb2', carbsTotal, 'g', divisor, dailyRecommended)
      const fiberPct = getDailyPercentage('dietaryFibre', fiberTotal, 'g', divisor, dailyRecommended)
      const kcalPct = getDailyPercentage('kcal', kcalTotal, 'kcal', divisor, dailyRecommended)

      return {
        title: recipe.title,
        protein,
        fat,
        carbs,
        fiber,
        kcal,
        proteinPct,
        fatPct,
        carbsPct,
        fiberPct,
        kcalPct
      }
    })

    return processedRecipes
  }, [recipes, dailyRecommended])

  if (!chartData || chartData.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No recipe data available for charts</p>
        </CardContent>
      </Card>
    )
  }

  // Prepare data for stacked bar chart (macronutrients)
  const macronutrientOption = {
    backgroundColor: 'transparent',
    title: [
      {
        text: 'Macronutrient composition, total recipe ÷ 2 (grams)',
        left: 'center',
        top: 10,
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
          color: isDark ? '#e5e7eb' : '#111827'
        }
      },
      {
        text: `Percentages show % of daily values per person (Protein: ${dailyRecommended.protein}g, Fat: ${dailyRecommended.fat}g, Carbs: ${dailyRecommended.carbs}g, Fiber: ${dailyRecommended.fiber}g)`,
        left: 'center',
        top: 35,
        textStyle: {
          fontSize: 10,
          color: isDark ? '#9ca3af' : '#6b7280'
        }
      }
    ],
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: function(params) {
        const recipeIndex = params[0].dataIndex
        const recipe = chartData[recipeIndex]
        let result = params[0].name + '<br/>'
        result += '<em>Total recipe ÷ 2</em><br/><br/>'
        
        params.forEach(param => {
          const value = typeof param.value === 'object' ? param.value.value : param.value
          result += param.marker + param.seriesName + ': ' + value.toFixed(1) + 'g<br/>'
        })
        
        // Add percentages summary using pre-calculated values
        if (recipe) {
          const hasPercentages = recipe.proteinPct !== null || recipe.fatPct !== null || 
                                 recipe.carbsPct !== null || recipe.fiberPct !== null
          if (hasPercentages) {
            result += '<br/><strong>Daily values:</strong><br/>'
            if (recipe.proteinPct !== null) result += 'Protein: ' + recipe.proteinPct + '%<br/>'
            if (recipe.fatPct !== null) result += 'Fat: ' + recipe.fatPct + '%<br/>'
            if (recipe.carbsPct !== null) result += 'Carbs: ' + recipe.carbsPct + '%<br/>'
            if (recipe.fiberPct !== null) result += 'Fiber: ' + recipe.fiberPct + '%<br/>'
          }
        }
        
        return result
      }
    },
    legend: {
      data: ['Protein (g)', 'Fat (g)', 'Carbs (g)', 'Fiber (g)'],
      bottom: 0,
      textStyle: {
        fontSize: 12,
        color: isDark ? '#9ca3af' : '#6b7280'
      }
    },
    grid: {
      left: '15%',
      right: '5%',
      bottom: '15%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: 'Grams',
      nameLocation: 'middle',
      nameGap: 30,
      nameTextStyle: {
        fontSize: 12,
        color: isDark ? '#9ca3af' : '#6b7280'
      },
      axisLabel: {
        fontSize: 11,
        color: isDark ? '#9ca3af' : '#6b7280'
      },
      axisLine: {
        lineStyle: {
          color: isDark ? '#374151' : '#d1d5db'
        }
      },
      splitLine: {
        show: true,
        lineStyle: {
          type: 'dashed',
          color: isDark ? '#374151' : '#e5e7eb'
        }
      }
    },
    yAxis: {
      type: 'category',
      data: chartData.map(r => r.title),
      axisLabel: {
        fontSize: 11,
        interval: 0,
        width: 120,
        overflow: 'truncate',
        color: isDark ? '#e5e7eb' : '#111827'
      },
      axisLine: {
        lineStyle: {
          color: isDark ? '#374151' : '#d1d5db'
        }
      }
    },
    series: [
      {
        name: 'Protein (g)',
        type: 'bar',
        stack: 'macros',
        data: chartData.map(r => r.protein),
        itemStyle: {
          color: '#F5B9B9'
        },
        label: {
          show: true,
          position: 'inside',
          formatter: function(params) {
            const recipe = chartData[params.dataIndex]
            return recipe.proteinPct !== null ? recipe.proteinPct + '%' : ''
          },
          fontSize: 9,
          fontWeight: 'bold',
          color: '#000',
          offset: [0, -15]
        }
      },
      {
        name: 'Fat (g)',
        type: 'bar',
        stack: 'macros',
        data: chartData.map(r => r.fat),
        itemStyle: {
          color: '#FCD7B4'
        },
        label: {
          show: true,
          position: 'inside',
          formatter: function(params) {
            const recipe = chartData[params.dataIndex]
            return recipe.fatPct !== null ? recipe.fatPct + '%' : ''
          },
          fontSize: 9,
          fontWeight: 'bold',
          color: '#000',
          offset: [0, -15]
        }
      },
      {
        name: 'Carbs (g)',
        type: 'bar',
        stack: 'macros',
        data: chartData.map(r => r.carbs),
        itemStyle: {
          color: '#A2D0F0'
        },
        label: {
          show: true,
          position: 'inside',
          formatter: function(params) {
            const recipe = chartData[params.dataIndex]
            return recipe.carbsPct !== null ? recipe.carbsPct + '%' : ''
          },
          fontSize: 10,
          fontWeight: 'bold',
          color: '#000'
        }
      },
      {
        name: 'Fiber (g)',
        type: 'bar',
        stack: 'macros',
        data: chartData.map(r => r.fiber),
        itemStyle: {
          color: '#B9F0B9'
        },
        label: {
          show: true,
          position: 'inside',
          formatter: function(params) {
            const recipe = chartData[params.dataIndex]
            return recipe.fiberPct !== null ? recipe.fiberPct + '%' : ''
          },
          fontSize: 9,
          fontWeight: 'bold',
          color: '#000',
          offset: [0, 15]
        }
      }
    ]
  }

  // Prepare data for energy chart
  const energyOption = {
    backgroundColor: 'transparent',
    title: {
      text: 'Energy per Serving (kcal)',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: isDark ? '#e5e7eb' : '#111827'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: function(params) {
        const recipe = chartData[params[0].dataIndex]
        let result = params[0].name + '<br/>'
        result += '<em>Total recipe ÷ 2</em><br/>'
        result += params[0].marker + 'Energy: ' + params[0].value.toFixed(0) + ' kcal'
        if (recipe.kcalPct !== null) {
          result += '<br/><strong>Daily value: ' + recipe.kcalPct + '%</strong>'
        }
        return result
      }
    },
    grid: {
      left: 10,
      right: 30,
      bottom: 40,
      top: 60,
      containLabel: false
    },
    xAxis: {
      type: 'value',
      name: 'kcal',
      nameLocation: 'middle',
      nameGap: 30,
      nameTextStyle: {
        fontSize: 12,
        color: isDark ? '#9ca3af' : '#6b7280'
      },
      axisLabel: {
        fontSize: 11,
        color: isDark ? '#9ca3af' : '#6b7280'
      },
      axisLine: {
        lineStyle: {
          color: isDark ? '#374151' : '#d1d5db'
        }
      },
      splitLine: {
        show: true,
        lineStyle: {
          type: 'dashed',
          color: isDark ? '#374151' : '#e5e7eb'
        }
      }
    },
    yAxis: {
      type: 'category',
      data: chartData.map(r => r.title),
      show: false, // Hide Y-axis labels since they're already shown in the left chart
      axisLabel: {
        fontSize: 11,
        interval: 0,
        color: isDark ? '#e5e7eb' : '#111827'
      },
      axisLine: {
        lineStyle: {
          color: isDark ? '#374151' : '#d1d5db'
        }
      }
    },
    series: [
      {
        name: 'Energy',
        type: 'bar',
        data: chartData.map(r => r.kcal),
        itemStyle: {
          color: '#F58484'
        },
        label: {
          show: true,
          position: 'right',
          formatter: function(params) {
            const recipe = chartData[params.dataIndex]
            return params.value.toFixed(0) + ' kcal (' + (recipe.kcalPct !== null ? recipe.kcalPct + '%' : 'N/A') + ')'
          },
          fontSize: 10,
          color: isDark ? '#e5e7eb' : '#111827'
        }
      }
    ]
  }

  return (
    <>
      {/* Mobile Table View */}
      <div className="md:hidden mb-6">
        <Card className="p-0">
          <CardHeader className="px-4 pt-4 pb-0">
            <CardTitle className="text-base">Recipe Nutrition Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-2 font-medium">Recipe</th>
                    <th className="text-right p-2 font-medium">Calories</th>
                    <th className="text-right p-2 font-medium">Protein</th>
                    <th className="text-right p-2 font-medium">Fat</th>
                    <th className="text-right p-2 font-medium">Carbs</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((recipe, index) => (
                    <tr key={index} className="border-t border-border">
                      <td className="p-2 font-medium max-w-[120px] truncate">{recipe.title}</td>
                      <td className="text-right p-2">
                        <div className="font-semibold">{recipe.kcal.toFixed(0)}</div>
                        {recipe.kcalPct !== null && (
                          <div className="text-muted-foreground">{recipe.kcalPct}%</div>
                        )}
                      </td>
                      <td className="text-right p-2">
                        <div className="font-semibold">{recipe.protein.toFixed(0)}g</div>
                        {recipe.proteinPct !== null && (
                          <div className="text-muted-foreground">{recipe.proteinPct}%</div>
                        )}
                      </td>
                      <td className="text-right p-2">
                        <div className="font-semibold">{recipe.fat.toFixed(0)}g</div>
                        {recipe.fatPct !== null && (
                          <div className="text-muted-foreground">{recipe.fatPct}%</div>
                        )}
                      </td>
                      <td className="text-right p-2">
                        <div className="font-semibold">{recipe.carbs.toFixed(0)}g</div>
                        {recipe.carbsPct !== null && (
                          <div className="text-muted-foreground">{recipe.carbsPct}%</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-muted/30 text-[10px] text-muted-foreground border-t border-border">
              Total recipe ÷ 2. Percentages show % of daily recommended values.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Desktop Chart View */}
      <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Macronutrient Chart */}
        <Card>
          <CardContent className="p-4">
            <ReactECharts
              key={`macros-${theme}`}
              option={macronutrientOption}
              style={{ height: '500px', width: '100%' }}
              opts={{ renderer: 'svg' }}
            />
          </CardContent>
        </Card>

        {/* Energy Chart */}
        <Card>
          <CardContent className="p-4">
            <ReactECharts
              key={`energy-${theme}`}
              option={energyOption}
              style={{ height: '500px', width: '100%' }}
              opts={{ renderer: 'svg' }}
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
