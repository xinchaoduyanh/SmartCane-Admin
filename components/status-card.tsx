"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { Cloud, CloudRain, Ruler, Sun } from "lucide-react"

interface StatusCardProps {
  title: string
  value: string
  icon: "distance" | "rain" | "sun" | string
  color: "blue" | "yellow" | "green" | "red" | "purple" | string
  description?: string
  alert?: boolean
}

export function StatusCard({ title, value, icon, color, description, alert = false }: StatusCardProps) {
  const getIcon = () => {
    switch (icon) {
      case "distance":
        return <Ruler className={`h-6 w-6 text-${color}-500`} />
      case "rain":
        return <CloudRain className={`h-6 w-6 text-${color}-500`} />
      case "sun":
        return <Sun className={`h-6 w-6 text-${color}-500`} />
      default:
        return <Cloud className={`h-6 w-6 text-${color}-500`} />
    }
  }

  const getGradient = () => {
    switch (color) {
      case "blue":
        return "from-blue-400 to-blue-500"
      case "yellow":
        return "from-amber-400 to-yellow-500"
      case "green":
        return "from-green-400 to-emerald-500"
      case "red":
        return "from-red-400 to-rose-500"
      case "purple":
        return "from-purple-400 to-indigo-500"
      default:
        return "from-slate-400 to-slate-500"
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
      <Card
        className={`border ${alert ? "border-red-300 dark:border-red-700 shadow-lg" : "border-slate-200 dark:border-slate-800 shadow-md"} overflow-hidden`}
      >
        <div className={`bg-gradient-to-r ${getGradient()} h-1`} />
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            {getIcon()}
            <span className="ml-2">{title}</span>
            {alert && (
              <span className="ml-auto">
                <Badge variant="destructive" className="animate-pulse">
                  Cảnh báo
                </Badge>
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <div className="flex-1">
              <div className={`text-3xl font-bold tracking-tight ${alert ? "text-red-600 dark:text-red-400" : ""}`}>
                {value}
              </div>
              {description && (
                <p
                  className={`text-sm ${alert ? "text-red-500 dark:text-red-400 font-medium" : "text-muted-foreground"} mt-1`}
                >
                  {description}
                </p>
              )}
            </div>
            <div
              className={`h-12 w-12 rounded-full ${alert ? "bg-red-100 dark:bg-red-900/30 animate-pulse" : `bg-${color}-100 dark:bg-${color}-900/30`} flex items-center justify-center`}
            >
              {getIcon()}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
