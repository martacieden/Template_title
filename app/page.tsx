"use client"

import { useState } from "react"
import { CategoryModal } from "@/components/category-modal"
import { Button } from "@/components/ui/button"

export default function Home() {
  const [modalOpen, setModalOpen] = useState(true)

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Category Management</h1>
        <p className="text-gray-600 mb-8">Click the button below to open the category settings modal</p>
        <Button onClick={() => setModalOpen(!modalOpen)} size="lg">
          Toggle Category Settings
        </Button>

        <CategoryModal open={modalOpen} onOpenChange={setModalOpen} />
      </div>
    </main>
  )
}
