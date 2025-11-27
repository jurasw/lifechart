import { useMemo, useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format, subDays } from "date-fns"
import type { DailyDish } from "@/types/diet"

interface DietChartProps {
  dishes: DailyDish[]
}

type Period = "7d" | "30d" | "90d" | "all"
type ChartType = "kcal" | "macros"

interface DataPoint {
  date: Date
  kcal: number
  protein: number
  carbs: number
  fats: number
}

export const DietChart = ({ dishes }: DietChartProps) => {
  const [period, setPeriod] = useState<Period>("30d")
  const [chartType, setChartType] = useState<ChartType>("kcal")
  const [hoveredPoint, setHoveredPoint] = useState<{ date: Date; values: DataPoint; x: number; y: number } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const dateRange = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    let startDate: Date

    switch (period) {
      case "7d":
        startDate = subDays(now, 7)
        break
      case "30d":
        startDate = subDays(now, 30)
        break
      case "90d":
        startDate = subDays(now, 90)
        break
      case "all":
        if (dishes.length === 0) {
          startDate = subDays(now, 30)
        } else {
          const earliestDate = Math.min(...dishes.map((d) => d.date))
          startDate = new Date(earliestDate)
        }
        break
    }

    startDate.setHours(0, 0, 0, 0)
    return { startDate, endDate: now }
  }, [period, dishes])

  const chartData = useMemo(() => {
    const dataMap = new Map<string, DataPoint>()

    dishes.forEach((dish) => {
      const dishDate = new Date(dish.date)
      dishDate.setHours(0, 0, 0, 0)

      if (dishDate >= dateRange.startDate && dishDate <= dateRange.endDate) {
        const dateKey = dishDate.toISOString()
        const existing = dataMap.get(dateKey)

        if (existing) {
          existing.kcal += dish.kcal
          existing.protein += dish.protein
          existing.carbs += dish.carbs
          existing.fats += dish.fats
        } else {
          dataMap.set(dateKey, {
            date: dishDate,
            kcal: dish.kcal,
            protein: dish.protein,
            carbs: dish.carbs,
            fats: dish.fats,
          })
        }
      }
    })

    const dataPoints: DataPoint[] = []
    const currentDate = new Date(dateRange.startDate)

    while (currentDate <= dateRange.endDate) {
      const dateKey = currentDate.toISOString()
      const existing = dataMap.get(dateKey)

      if (existing) {
        dataPoints.push(existing)
      } else {
        dataPoints.push({
          date: new Date(currentDate),
          kcal: 0,
          protein: 0,
          carbs: 0,
          fats: 0,
        })
      }

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return dataPoints.sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [dishes, dateRange])

  const maxValue = useMemo(() => {
    if (chartType === "kcal") {
      return Math.max(...chartData.map((d) => d.kcal), 1)
    } else {
      return Math.max(
        ...chartData.map((d) => d.protein + d.carbs + d.fats),
        1
      )
    }
  }, [chartData, chartType])

  const chartWidth = 600
  const chartHeight = 250
  const padding = 50

  const getX = (index: number) => {
    if (chartData.length === 0) return padding
    return padding + (index / (chartData.length - 1 || 1)) * (chartWidth - padding * 2)
  }

  const getY = (value: number) => {
    return chartHeight - padding - (value / maxValue) * (chartHeight - padding * 2)
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return

    const rect = svgRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left

    let closestIndex = 0
    let minDistance = Infinity

    chartData.forEach((_point, index) => {
      const pointX = getX(index)
      const distance = Math.abs(x - pointX)
      if (distance < minDistance) {
        minDistance = distance
        closestIndex = index
      }
    })

    if (minDistance < 20) {
      const point = chartData[closestIndex]
      setHoveredPoint({
        date: point.date,
        values: point,
        x: e.clientX,
        y: e.clientY,
      })
    } else {
      setHoveredPoint(null)
    }
  }

  const handleMouseLeave = () => {
    setHoveredPoint(null)
  }

  return (
    <Card className="border-foreground/30">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h2 className="text-lg font-semibold">Nutrition Trends</h2>
          <div className="flex gap-2">
            <div className="flex gap-1 border border-border rounded-md">
              <Button
                variant={chartType === "kcal" ? "default" : "ghost"}
                size="sm"
                onClick={() => setChartType("kcal")}
                className="h-8"
              >
                Calories
              </Button>
              <Button
                variant={chartType === "macros" ? "default" : "ghost"}
                size="sm"
                onClick={() => setChartType("macros")}
                className="h-8"
              >
                Macros
              </Button>
            </div>
            <div className="flex gap-1 border border-border rounded-md">
              <Button
                variant={period === "7d" ? "default" : "ghost"}
                size="sm"
                onClick={() => setPeriod("7d")}
                className="h-8"
              >
                7d
              </Button>
              <Button
                variant={period === "30d" ? "default" : "ghost"}
                size="sm"
                onClick={() => setPeriod("30d")}
                className="h-8"
              >
                30d
              </Button>
              <Button
                variant={period === "90d" ? "default" : "ghost"}
                size="sm"
                onClick={() => setPeriod("90d")}
                className="h-8"
              >
                90d
              </Button>
              <Button
                variant={period === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setPeriod("all")}
                className="h-8"
              >
                All
              </Button>
            </div>
          </div>
        </div>

        <div className="relative">
          <svg
            ref={svgRef}
            width={chartWidth}
            height={chartHeight}
            className="w-full h-auto"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = chartHeight - padding - ratio * (chartHeight - padding * 2)
              return (
                <line
                  key={ratio}
                  x1={padding}
                  y1={y}
                  x2={chartWidth - padding}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity={0.1}
                  strokeWidth={1}
                />
              )
            })}

            {/* Chart lines */}
            {chartType === "kcal" ? (
              <polyline
                points={chartData
                  .map((point, index) => `${getX(index)},${getY(point.kcal)}`)
                  .join(" ")}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="text-foreground"
              />
            ) : (
              <>
                <polyline
                  points={chartData
                    .map((point, index) => `${getX(index)},${getY(point.protein)}`)
                    .join(" ")}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth={2}
                />
                <polyline
                  points={chartData
                    .map((point, index) => `${getX(index)},${getY(point.carbs)}`)
                    .join(" ")}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
                <polyline
                  points={chartData
                    .map((point, index) => `${getX(index)},${getY(point.fats)}`)
                    .join(" ")}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth={2}
                />
              </>
            )}

            {/* Data points */}
            {chartData.map((point, index) => {
              const value = chartType === "kcal" ? point.kcal : point.protein + point.carbs + point.fats
              return (
                <circle
                  key={index}
                  cx={getX(index)}
                  cy={getY(value)}
                  r={4}
                  fill="currentColor"
                  className="text-foreground"
                />
              )
            })}

            {/* Y-axis labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = chartHeight - padding - ratio * (chartHeight - padding * 2)
              const value = Math.round(maxValue * ratio)
              return (
                <text
                  key={ratio}
                  x={padding - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-xs fill-muted-foreground"
                >
                  {value}
                </text>
              )
            })}

            {/* X-axis labels */}
            {chartData.length > 0 && (
              <>
                <text
                  x={getX(0)}
                  y={chartHeight - padding + 20}
                  textAnchor="middle"
                  className="text-xs fill-muted-foreground"
                >
                  {format(chartData[0].date, "MMM d")}
                </text>
                {chartData.length > 1 && (
                  <text
                    x={getX(chartData.length - 1)}
                    y={chartHeight - padding + 20}
                    textAnchor="middle"
                    className="text-xs fill-muted-foreground"
                  >
                    {format(chartData[chartData.length - 1].date, "MMM d")}
                  </text>
                )}
              </>
            )}
          </svg>

          {hoveredPoint && (
            <div
              className="fixed bg-popover border border-border rounded-md p-2 text-xs shadow-lg z-50 pointer-events-none"
              style={{ left: hoveredPoint.x + 10, top: hoveredPoint.y - 10 }}
            >
              <div className="font-semibold mb-1">{format(hoveredPoint.date, "MMM d, yyyy")}</div>
              {chartType === "kcal" ? (
                <div>Calories: {hoveredPoint.values.kcal} kcal</div>
              ) : (
                <>
                  <div>Protein: {hoveredPoint.values.protein}g</div>
                  <div>Carbs: {hoveredPoint.values.carbs}g</div>
                  <div>Fats: {hoveredPoint.values.fats}g</div>
                </>
              )}
            </div>
          )}
        </div>

        {chartType === "macros" && (
          <div className="flex gap-4 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-muted-foreground">Protein</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-muted-foreground">Carbs</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500 rounded"></div>
              <span className="text-muted-foreground">Fats</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

