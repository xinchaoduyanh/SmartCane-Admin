"use client"

import { useEffect, useState } from "react"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface DistanceChartProps {
  distance: number | null
}

export function DistanceChart({ distance }: DistanceChartProps) {
  const [data, setData] = useState<{ time: string; distance: number }[]>([])

  useEffect(() => {
    if (distance !== null) {
      const now = new Date()
      const timeString =
        now.getHours().toString().padStart(2, "0") +
        ":" +
        now.getMinutes().toString().padStart(2, "0") +
        ":" +
        now.getSeconds().toString().padStart(2, "0")

      setData((prev) => {
        // Giữ tối đa 30 điểm dữ liệu
        const newData = [...prev, { time: timeString, distance }]
        if (newData.length > 30) {
          return newData.slice(newData.length - 30)
        }
        return newData
      })
    }
  }, [distance])

  // Nếu không có dữ liệu, hiển thị thông báo
  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Đang chờ dữ liệu...</p>
      </div>
    )
  }

  // Tính toán giá trị min và max cho trục Y
  const minDistance = Math.min(...data.map((d) => d.distance)) * 0.8
  const maxDistance = Math.max(...data.map((d) => d.distance)) * 1.2

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <XAxis
          dataKey="time"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => {
            // Chỉ hiển thị giây
            const parts = value.split(":")
            return parts[2]
          }}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}cm`}
          domain={[minDistance, maxDistance]}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border bg-background p-2 shadow-md">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">Thời gian</span>
                      <span className="font-bold text-xs">{payload[0].payload.time}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">Khoảng cách</span>
                      <span className="font-bold text-xs">{payload[0].value} cm</span>
                    </div>
                  </div>
                </div>
              )
            }
            return null
          }}
        />
        <Line
          type="monotone"
          dataKey="distance"
          stroke={data[data.length - 1]?.distance < 50 ? "#ef4444" : "#3b82f6"}
          strokeWidth={2}
          dot={{ r: 2 }}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
