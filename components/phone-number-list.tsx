"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Phone, UserPlus, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { motion, AnimatePresence } from "framer-motion"

interface PhoneNumberListProps {
  phoneNumbers: string[]
  setPhoneNumbers: (phones: string[]) => void
  disabled?: boolean
}

export function PhoneNumberList({ phoneNumbers, setPhoneNumbers, disabled = false }: PhoneNumberListProps) {
  const { toast } = useToast()
  const [newPhoneNumber, setNewPhoneNumber] = useState("")
  const [error, setError] = useState<string | null>(null)

  // Validate Vietnamese phone number
  const isValidPhoneNumber = (phone: string) => {
    // Basic Vietnamese phone number validation
    return /^(0|\+84)(\d{9,10})$/.test(phone)
  }

  // Add a new phone number
  const addPhoneNumber = () => {
    if (!newPhoneNumber) {
      setError("Vui lòng nhập số điện thoại")
      return
    }

    if (!isValidPhoneNumber(newPhoneNumber)) {
      setError("Số điện thoại không hợp lệ")
      return
    }

    if (phoneNumbers.includes(newPhoneNumber)) {
      setError("Số điện thoại đã tồn tại trong danh sách")
      return
    }

    setPhoneNumbers([...phoneNumbers, newPhoneNumber])
    setNewPhoneNumber("")
    setError(null)

    toast({
      title: "Đã thêm số điện thoại",
      description: `Số ${newPhoneNumber} đã được thêm vào danh sách`,
    })
  }

  // Remove a phone number
  const removePhoneNumber = (index: number) => {
    const updatedNumbers = [...phoneNumbers]
    const removedNumber = updatedNumbers[index]
    updatedNumbers.splice(index, 1)
    setPhoneNumbers(updatedNumbers)

    toast({
      title: "Đã xóa số điện thoại",
      description: `Số ${removedNumber} đã được xóa khỏi danh sách`,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={newPhoneNumber}
            onChange={(e) => {
              setNewPhoneNumber(e.target.value)
              setError(null)
            }}
            placeholder="Nhập số điện thoại..."
            className="pl-10 py-6 text-base"
            disabled={disabled}
          />
        </div>
        <Button
          onClick={addPhoneNumber}
          type="button"
          size="lg"
          className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 transition-all duration-300"
          disabled={disabled}
        >
          <UserPlus className="mr-2 h-5 w-5" />
          Thêm
        </Button>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-500 flex items-center"
        >
          <AlertTriangle className="h-4 w-4 mr-1" />
          {error}
        </motion.p>
      )}

      <div className="space-y-3 mt-2">
        <AnimatePresence>
          {phoneNumbers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-8 px-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900"
            >
              <Phone className="h-10 w-10 text-slate-400 mb-2" />
              <p className="text-slate-500 dark:text-slate-400 text-center">
                Chưa có số điện thoại nào trong danh sách
              </p>
              <p className="text-slate-400 dark:text-slate-500 text-sm text-center mt-1">
                Thêm số điện thoại để nhận tin nhắn khẩn cấp
              </p>
            </motion.div>
          ) : (
            phoneNumbers.map((number, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center mr-3">
                    <Phone className="h-4 w-4 text-pink-500" />
                  </div>
                  <span className="font-medium">{number}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removePhoneNumber(index)}
                  className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30"
                  disabled={disabled}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                  <span className="sr-only">Xóa số điện thoại</span>
                </Button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
