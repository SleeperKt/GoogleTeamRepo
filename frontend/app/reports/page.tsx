"use client"

import { useState } from "react"
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  Filter,
  LineChart,
  PieChart,
  PlayCircle,
  Plus,
  RefreshCw,
  Users,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"

// Sample project data
const projectData = {
  name: "TestProject-Dev",
  lastUpdated: "15 minutes ago",
}

// Sample report data
const reportData = {
  summary: {
    totalTasks: 48,
    completedTasks: 32,
    inProgressTasks: 12,
    averageCompletionTime: "3.2 days",
    burndownRate: "8.5 tasks/week",
  },
  taskStatusDistribution: [
    { status: "To Do", count: 4, color: "#e2e8f0" },
    { status: "In Progress", count: 12, color: "#93c5fd" },
    { status: "Review", count: 8, color: "#c4b5fd" },
    { status: "Done", count: 24, color: "#86efac" },
  ],
  burndownData: [
    { date: "May 1", planned: 48, actual: 48 },
    { date: "May 8", planned: 40, actual: 42 },
    { date: "May 15", planned: 32, actual: 35 },
    { date: "May 22", planned: 24, actual: 28 },
    { date: "May 29", planned: 16, actual: 20 },
    { date: "Jun 5", planned: 8, actual: 16 },
    { date: "Jun 12", planned: 0, actual: 8 },
    { date: "Jun 19", planned: null, actual: 0 },
  ],
  taskCompletionData: [
    { date: "May 1-7", count: 6 },
    { date: "May 8-14", count: 7 },
    { date: "May 15-21", count: 7 },
    { date: "May 22-28", count: 8 },
    { date: "May 29-Jun 4", count: 4 },
    { date: "Jun 5-11", count: 8 },
    { date: "Jun 12-18", count: 8 },
  ],
  assigneeLoad: [
    { name: "Sarah Lee", initials: "SL", image: "/placeholder.svg?height=32&width=32", tasks: 8 },
    { name: "Michael Johnson", initials: "MJ", image: "/placeholder.svg?height=32&width=32", tasks: 6 },
    { name: "Alex Kim", initials: "AK", image: "/placeholder.svg?height=32&width=32", tasks: 10 },
    { name: "Jessica Taylor", initials: "JT", image: "/placeholder.svg?height=32&width=32", tasks: 5 },
    { name: "David Miller", initials: "DM", image: "/placeholder.svg?height=32&width=32", tasks: 7 },
    { name: "Emma Wilson", initials: "EW", image: "/placeholder.svg?height=32&width=32", tasks: 4 },
  ],
}

// Summary card data
const summaryCards = [
  {
    label: "Total Tasks",
    value: reportData.summary.totalTasks,
    icon: BarChart3,
    color: "bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
  },
  {
    label: "Completed",
    value: reportData.summary.completedTasks,
    icon: CheckCircle2,
    color: "bg-green-50 text-green-600 dark:bg-green-900 dark:text-green-300",
  },
  {
    label: "In Progress",
    value: reportData.summary.inProgressTasks,
    icon: PlayCircle,
    color: "bg-violet-50 text-violet-600 dark:bg-violet-900 dark:text-violet-300",
  },
  {
    label: "Avg. Completion Time",
    value: reportData.summary.averageCompletionTime,
    icon: Clock,
    color: "bg-amber-50 text-amber-600 dark:bg-amber-900 dark:text-amber-300",
  },
  {
    label: "Burndown Rate",
    value: reportData.summary.burndownRate,
    icon: LineChart,
    color: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300",
  },
]

export default function ReportsPage() {
  const [reportType, setReportType] = useState("overview")
  const [dateRange, setDateRange] = useState("last30days")
  const [showEmptyState, setShowEmptyState] = useState(false)
  const [chartType, setChartType] = useState({
    taskCompletion: "bar",
    burndown: "line",
  })

  // Calculate total tasks for pie chart
  const totalTasks = reportData.taskStatusDistribution.reduce((sum, item) => sum + item.count, 0)

  // Toggle empty state for demo
  const toggleEmptyState = () => {
    setShowEmptyState(!showEmptyState)
  }

  return (
    <div className="p-4 md:p-6 w-full">
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Reports</h1>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">{projectData.name}</span>
            <span className="text-sm text-muted-foreground">Last updated {projectData.lastUpdated}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" className="h-9">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="mb-6">
        <Tabs defaultValue="overview" value={reportType} onValueChange={setReportType}>
          <TabsList className="grid w-full grid-cols-3 md:w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sprint">Sprint</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Empty State */}
      {showEmptyState ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-6 mb-4">
            <BarChart3 className="h-12 w-12 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-xl font-medium mb-2">No report data found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
            Start by creating tasks or assigning team members to generate reports and analytics.
          </p>
          <Button className="bg-violet-600 hover:bg-violet-700 text-white">
            <Plus className="mr-2 h-4 w-4" /> Create Task
          </Button>
        </div>
      ) : (
        <>
          {/* Filters and Controls */}
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg border shadow-sm p-4">
            <div className="flex flex-wrap gap-3">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[180px] h-9">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last7days">Last 7 Days</SelectItem>
                  <SelectItem value="last30days">Last 30 Days</SelectItem>
                  <SelectItem value="last90days">Last 90 Days</SelectItem>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="lastMonth">Last Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuItem>All Task Types</DropdownMenuItem>
                  <DropdownMenuItem>Features Only</DropdownMenuItem>
                  <DropdownMenuItem>Bugs Only</DropdownMenuItem>
                  <DropdownMenuItem>By Assignee</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" size="sm" className="h-9 px-3 flex items-center gap-1">
                <X className="h-3.5 w-3.5" />
                <span>Clear Filters</span>
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {summaryCards.map((card, index) => (
                <Card key={index} className="bg-white dark:bg-gray-800 hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <div className={`rounded-full p-2 mb-2 ${card.color}`}>
                      <card.icon className="h-5 w-5" />
                    </div>
                    <div className="text-2xl font-bold">{card.value}</div>
                    <div className="text-sm text-muted-foreground">{card.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Burndown Chart */}
            <Card className="bg-white dark:bg-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Burndown Chart</h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <LineChart className="mr-2 h-4 w-4" />
                        {chartType.burndown === "line" ? "Line" : "Area"}
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setChartType({ ...chartType, burndown: "line" })}>
                        Line Chart
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setChartType({ ...chartType, burndown: "area" })}>
                        Area Chart
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Burndown Chart SVG */}
                <div className="h-64 relative">
                  <svg className="w-full h-full" viewBox="0 0 800 400" preserveAspectRatio="none">
                    {/* Grid lines */}
                    <g className="grid-lines">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <line key={i} x1="0" y1={i * 80} x2="800" y2={i * 80} stroke="#e2e8f0" strokeDasharray="5,5" />
                      ))}
                      {reportData.burndownData.map((_, i) => (
                        <line
                          key={i}
                          x1={i * (800 / (reportData.burndownData.length - 1))}
                          y1="0"
                          x2={i * (800 / (reportData.burndownData.length - 1))}
                          y2="400"
                          stroke="#e2e8f0"
                          strokeDasharray="5,5"
                        />
                      ))}
                    </g>

                    {/* Planned line */}
                    <path
                      d={reportData.burndownData
                        .filter((d) => d.planned !== null)
                        .map((d, i) => {
                          const x = i * (800 / (reportData.burndownData.length - 1))
                          const y = 400 - (d.planned / 48) * 400
                          return `${i === 0 ? "M" : "L"}${x},${y}`
                        })
                        .join(" ")}
                      stroke="#94a3b8"
                      strokeWidth="2"
                      fill="none"
                    />

                    {/* Actual line */}
                    <path
                      d={reportData.burndownData
                        .map((d, i) => {
                          const x = i * (800 / (reportData.burndownData.length - 1))
                          const y = 400 - (d.actual / 48) * 400
                          return `${i === 0 ? "M" : "L"}${x},${y}`
                        })
                        .join(" ")}
                      stroke="#7c3aed"
                      strokeWidth="3"
                      fill="none"
                    />

                    {/* Area under actual line (if area chart) */}
                    {chartType.burndown === "area" && (
                      <path
                        d={`${reportData.burndownData
                          .map((d, i) => {
                            const x = i * (800 / (reportData.burndownData.length - 1))
                            const y = 400 - (d.actual / 48) * 400
                            return `${i === 0 ? "M" : "L"}${x},${y}`
                          })
                          .join(
                            " ",
                          )} L${(reportData.burndownData.length - 1) * (800 / (reportData.burndownData.length - 1))},400 L0,400 Z`}
                        fill="url(#burndownGradient)"
                        opacity="0.2"
                      />
                    )}

                    {/* Data points */}
                    {reportData.burndownData.map((d, i) => {
                      if (d.planned !== null) {
                        const x = i * (800 / (reportData.burndownData.length - 1))
                        const y = 400 - (d.planned / 48) * 400
                        return <circle key={`planned-${i}`} cx={x} cy={y} r="4" fill="#94a3b8" />
                      }
                      return null
                    })}

                    {reportData.burndownData.map((d, i) => {
                      const x = i * (800 / (reportData.burndownData.length - 1))
                      const y = 400 - (d.actual / 48) * 400
                      return <circle key={`actual-${i}`} cx={x} cy={y} r="5" fill="#7c3aed" />
                    })}

                    {/* Gradient for area chart */}
                    <defs>
                      <linearGradient id="burndownGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.1" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Y-axis labels */}
                  <div className="absolute top-0 left-0 h-full flex flex-col justify-between text-xs text-gray-500 py-2">
                    <div>48</div>
                    <div>36</div>
                    <div>24</div>
                    <div>12</div>
                    <div>0</div>
                  </div>
                </div>

                {/* X-axis labels */}
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  {reportData.burndownData.map((d, i) => (
                    <div key={i}>{d.date}</div>
                  ))}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center mt-4 gap-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
                    <span className="text-sm">Planned</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-violet-600 rounded-full mr-2"></div>
                    <span className="text-sm">Actual</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Task Status Distribution */}
            <Card className="bg-white dark:bg-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Task Status Distribution</h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <PieChart className="mr-2 h-4 w-4" />
                        Pie Chart
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Pie Chart</DropdownMenuItem>
                      <DropdownMenuItem>Donut Chart</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                  {/* Pie Chart */}
                  <div className="relative w-48 h-48">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      {reportData.taskStatusDistribution.map((item, index) => {
                        // Calculate the pie segments
                        const percentage = (item.count / totalTasks) * 100
                        const previousPercentages = reportData.taskStatusDistribution
                          .slice(0, index)
                          .reduce((sum, i) => sum + (i.count / totalTasks) * 100, 0)

                        // Convert percentages to coordinates on a circle
                        const startAngle = (previousPercentages / 100) * 2 * Math.PI - Math.PI / 2
                        const endAngle = ((previousPercentages + percentage) / 100) * 2 * Math.PI - Math.PI / 2

                        const startX = 50 + 40 * Math.cos(startAngle)
                        const startY = 50 + 40 * Math.sin(startAngle)
                        const endX = 50 + 40 * Math.cos(endAngle)
                        const endY = 50 + 40 * Math.sin(endAngle)

                        // Create the arc path
                        const largeArcFlag = percentage > 50 ? 1 : 0
                        const pathData = `M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArcFlag} 1 ${endX} ${endY} Z`

                        return <path key={index} d={pathData} fill={item.color} />
                      })}
                    </svg>
                  </div>

                  {/* Legend */}
                  <div className="space-y-3">
                    {reportData.taskStatusDistribution.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: item.color }}></div>
                        <div className="flex-1">{item.status}</div>
                        <div className="font-medium">{item.count}</div>
                        <div className="text-muted-foreground text-sm">
                          {Math.round((item.count / totalTasks) * 100)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Task Completion */}
            <Card className="bg-white dark:bg-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Task Completion</h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        {chartType.taskCompletion === "bar" ? "Bar" : "Line"}
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setChartType({ ...chartType, taskCompletion: "bar" })}>
                        Bar Chart
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setChartType({ ...chartType, taskCompletion: "line" })}>
                        Line Chart
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Task Completion Chart */}
                <div className="h-64 relative">
                  <svg className="w-full h-full" viewBox="0 0 800 400" preserveAspectRatio="none">
                    {/* Grid lines */}
                    <g className="grid-lines">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <line key={i} x1="0" y1={i * 80} x2="800" y2={i * 80} stroke="#e2e8f0" strokeDasharray="5,5" />
                      ))}
                    </g>

                    {/* Bar Chart */}
                    {chartType.taskCompletion === "bar" &&
                      reportData.taskCompletionData.map((d, i) => {
                        const barWidth = (800 / reportData.taskCompletionData.length) * 0.6
                        const barSpacing = 800 / reportData.taskCompletionData.length
                        const x = i * barSpacing + (barSpacing - barWidth) / 2
                        const height = (d.count / 10) * 400
                        const y = 400 - height

                        return <rect key={i} x={x} y={y} width={barWidth} height={height} fill="#7c3aed" rx="4" />
                      })}

                    {/* Line Chart */}
                    {chartType.taskCompletion === "line" && (
                      <>
                        <path
                          d={reportData.taskCompletionData
                            .map((d, i) => {
                              const x = i * (800 / (reportData.taskCompletionData.length - 1))
                              const y = 400 - (d.count / 10) * 400
                              return `${i === 0 ? "M" : "L"}${x},${y}`
                            })
                            .join(" ")}
                          stroke="#7c3aed"
                          strokeWidth="3"
                          fill="none"
                        />

                        <path
                          d={`${reportData.taskCompletionData
                            .map((d, i) => {
                              const x = i * (800 / (reportData.taskCompletionData.length - 1))
                              const y = 400 - (d.count / 10) * 400
                              return `${i === 0 ? "M" : "L"}${x},${y}`
                            })
                            .join(
                              " ",
                            )} L${(reportData.taskCompletionData.length - 1) * (800 / (reportData.taskCompletionData.length - 1))},400 L0,400 Z`}
                          fill="url(#completionGradient)"
                          opacity="0.2"
                        />

                        {reportData.taskCompletionData.map((d, i) => {
                          const x = i * (800 / (reportData.taskCompletionData.length - 1))
                          const y = 400 - (d.count / 10) * 400
                          return <circle key={i} cx={x} cy={y} r="5" fill="#7c3aed" />
                        })}

                        <defs>
                          <linearGradient id="completionGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.1" />
                          </linearGradient>
                        </defs>
                      </>
                    )}
                  </svg>

                  {/* Y-axis labels */}
                  <div className="absolute top-0 left-0 h-full flex flex-col justify-between text-xs text-gray-500 py-2">
                    <div>10</div>
                    <div>8</div>
                    <div>6</div>
                    <div>4</div>
                    <div>2</div>
                    <div>0</div>
                  </div>
                </div>

                {/* X-axis labels */}
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  {reportData.taskCompletionData.map((d, i) => (
                    <div key={i}>{d.date}</div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Assignee Load */}
            <Card className="bg-white dark:bg-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Assignee Load</h3>
                  <Button variant="ghost" size="sm">
                    <Users className="mr-2 h-4 w-4" />
                    All Team Members
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  {reportData.assigneeLoad.map((assignee, index) => {
                    const maxTasks = Math.max(...reportData.assigneeLoad.map((a) => a.tasks))
                    const percentage = (assignee.tasks / maxTasks) * 100

                    return (
                      <div key={index} className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={assignee.image} alt={assignee.name} />
                          <AvatarFallback>{assignee.initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between mb-1">
                            <span className="font-medium truncate">{assignee.name}</span>
                            <span className="text-sm font-medium">{assignee.tasks} tasks</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Insights */}
          <Card className="bg-white dark:bg-gray-800 mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Key Insights</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full p-2 bg-green-50 text-green-600 dark:bg-green-900 dark:text-green-300">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium">Completion Rate Improving</h4>
                    <p className="text-muted-foreground">
                      Task completion rate has increased by 15% compared to last month.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full p-2 bg-amber-50 text-amber-600 dark:bg-amber-900 dark:text-amber-300">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium">Sprint Velocity</h4>
                    <p className="text-muted-foreground">
                      Current sprint velocity is 8.5 tasks per week, which is on target.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full p-2 bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium">Team Workload</h4>
                    <p className="text-muted-foreground">
                      Workload is well-distributed among team members with no significant bottlenecks.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Demo Controls - Remove in production */}
      <div className="mt-8 pt-4 border-t">
        <Button variant="outline" onClick={toggleEmptyState} className="text-xs">
          Toggle Empty State (Demo)
        </Button>
      </div>
    </div>
  )
}
