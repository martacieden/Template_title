"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { X, ChevronDown, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

interface CategoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const steps = [
  { number: 1, label: "Category details", key: "details" },
  { number: 2, label: "Select category capsules", key: "capsules" },
  { number: 3, label: "Set up custom fields", key: "custom" },
  { number: 4, label: "Select a workflow", key: "workflow" },
  { number: 5, label: "Title settings", key: "title", skippable: true },
]

const stepIndexMap: Record<string, number> = {
  details: 0,
  capsules: 1,
  custom: 2,
  workflow: 3,
  title: 4,
}

const variables = {
  "System Fields": [
    { name: "{name}", example: "Category Name" },
    { name: "{creator}", example: "John Doe" },
    { name: "{organization}", example: "Сresset" },
    { name: "{due_date}", example: "03/15/2024" },
    { name: "{created_date}", example: "01/20/2024" },
    { name: "{freeform}", example: "User-entered text" },
  ],
  "Custom Fields": [
    { name: "{field.start}", example: "01/15/2024" },
    { name: "{field.end}", example: "01/20/2024" },
    { name: "{field.project_name}", example: "Summer Vacation" },
    { name: "{field.budget}", example: "$50,000" },
    { name: "{field.location}", example: "Building A" },
  ],
}

const aiSuggestions = [
  {
    template: "{creator} vacation / time off request",
    description: "Combines creator with vacation request type for clear context",
  },
  {
    template: "{creator} {field.start} {field.end}",
    description: "Simple date range format with creator name",
  },
  {
    template: "{creator} vacation / time off request {field.start} {field.end}",
    description: "Combines creator, request type, and date range for comprehensive context",
  },
  {
    template: "{creator} Vacation Request {field.start} to {field.end}",
    description: "Formal vacation request format with date range",
  },
  {
    template: "{organization} - {creator} Time Off {field.start} {field.end}",
    description: "Focus on organization and creator for team context",
  },
  {
    template: "{creator} Time Off Request ({field.start} - {field.end})",
    description: "Alternative format with parentheses for date range",
  },
]

export function CategoryModal({ open, onOpenChange }: CategoryModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([0]))
  const [categoryName, setCategoryName] = useState("Vacation")
  const [templateEnabled, setTemplateEnabled] = useState(true)
  const [templateValue, setTemplateValue] = useState(aiSuggestions[0]?.template || "")
  const [showManualSetup, setShowManualSetup] = useState(false)
  const [currentAISuggestionIndex, setCurrentAISuggestionIndex] = useState(0)
  const [showVariableDropdown, setShowVariableDropdown] = useState(false)
  const [showAISuggestions, setShowAISuggestions] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)
  const [previewText, setPreviewText] = useState("")
  const [templateErrors, setTemplateErrors] = useState<string[]>([])
  const templateInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const aiSuggestionsRef = useRef<HTMLDivElement>(null)

  const validateTemplate = (template: string): string[] => {
    const errors: string[] = []
    
    if (!template) {
      return errors // Порожній шаблон не є помилкою
    }

    // Отримуємо всі доступні змінні
    const allVariables = [
      ...variables["System Fields"].map(v => v.name),
      ...variables["Custom Fields"].map(v => v.name),
    ]

    // Перевірка на незакриті дужки
    const openBraces = (template.match(/\{/g) || []).length
    const closeBraces = (template.match(/\}/g) || []).length
    
    if (openBraces !== closeBraces) {
      errors.push("Unclosed braces: All { } must be properly closed")
    }

    // Знаходимо всі змінні в шаблоні
    const variableRegex = /\{([^}]+)\}/g
    const matches = template.matchAll(variableRegex)
    
    for (const match of matches) {
      const fullMatch = match[0] // {variable_name}
      const variableName = match[1] // variable_name
      
      // Перевіряємо, чи змінна існує
      if (!allVariables.includes(fullMatch)) {
        errors.push(`"${fullMatch}" is not a valid variable`)
      }
    }

    // Перевірка на невалідні символи всередині дужок
    const invalidPattern = /\{[^}\s]*\s[^}]*\}/g
    if (invalidPattern.test(template)) {
      const invalidMatches = template.match(invalidPattern)
      invalidMatches?.forEach(match => {
        if (!errors.some(e => e.includes(match))) {
          errors.push(`Invalid variable format: "${match}" (variables cannot contain spaces)`)
        }
      })
    }

    return errors
  }

  // Ініціалізація: встановлюємо першу AI пропозицію за замовчуванням при відкритті Title settings
  useEffect(() => {
    if (currentStep === 4 && !showManualSetup && aiSuggestions.length > 0) {
      const firstSuggestion = aiSuggestions[0].template
      setTemplateValue(firstSuggestion)
      setCurrentAISuggestionIndex(0)
      // Валідація першої AI пропозиції
      const errors = validateTemplate(firstSuggestion)
      setTemplateErrors(errors)
    }
  }, [currentStep, showManualSetup])

  // Оновлення templateValue коли змінюється AI suggestion
  useEffect(() => {
    if (!showManualSetup && currentAISuggestionIndex < aiSuggestions.length) {
      const suggestion = aiSuggestions[currentAISuggestionIndex].template
      setTemplateValue(suggestion)
      const errors = validateTemplate(suggestion)
      setTemplateErrors(errors)
    }
  }, [currentAISuggestionIndex, showManualSetup])

  // Очищення поля при переході на Manual Setup
  useEffect(() => {
    if (showManualSetup) {
      setTemplateValue("")
      setTemplateErrors([])
    }
  }, [showManualSetup])

  useEffect(() => {
    // Update preview with sample data
    let preview = templateValue || (currentAISuggestionIndex !== null && aiSuggestions[currentAISuggestionIndex] ? aiSuggestions[currentAISuggestionIndex].template : "")
    Object.values(variables)
      .flat()
      .forEach(({ name, example }) => {
        preview = preview.replace(new RegExp(name.replace(/[{}]/g, "\\$&"), "g"), example)
      })
    setPreviewText(preview)
  }, [templateValue, currentAISuggestionIndex])

  useEffect(() => {
    // Close dropdowns when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowVariableDropdown(false)
      }
      if (aiSuggestionsRef.current && !aiSuggestionsRef.current.contains(event.target as Node)) {
        setShowAISuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const insertVariable = (variable: string) => {
    const before = templateValue.substring(0, cursorPosition)
    const after = templateValue.substring(cursorPosition)
    const newValue = before + variable + after
    setTemplateValue(newValue)
    setCursorPosition(cursorPosition + variable.length)
    setShowVariableDropdown(false)
    
    // Валідація після вставки змінної
    if (templateEnabled && newValue) {
      const errors = validateTemplate(newValue)
      setTemplateErrors(errors)
    } else {
      setTemplateErrors([])
    }
    
    templateInputRef.current?.focus()
  }

  const insertAISuggestion = (suggestion: string) => {
    setTemplateValue(suggestion)
    setCursorPosition(suggestion.length)
    setShowAISuggestions(false)
    
    // Валідація після вставки AI suggestion
    if (templateEnabled && suggestion) {
      const errors = validateTemplate(suggestion)
      setTemplateErrors(errors)
    } else {
      setTemplateErrors([])
    }
    
    templateInputRef.current?.focus()
  }

  const goToPreviousSuggestion = () => {
    const newIndex = currentAISuggestionIndex === 0 
      ? aiSuggestions.length - 1 
      : currentAISuggestionIndex - 1
    setCurrentAISuggestionIndex(newIndex)
    // templateValue оновлюється через useEffect
  }

  const goToNextSuggestion = () => {
    const newIndex = currentAISuggestionIndex === aiSuggestions.length - 1
      ? 0
      : currentAISuggestionIndex + 1
    setCurrentAISuggestionIndex(newIndex)
    // templateValue оновлюється через useEffect
  }

  const handleTemplateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setTemplateValue(newValue)
    setCursorPosition(e.currentTarget.selectionStart || 0)
    
    // Валідація в реальному часі
    if (templateEnabled && newValue) {
      const errors = validateTemplate(newValue)
      setTemplateErrors(errors)
    } else {
      setTemplateErrors([])
    }
  }

  const goToStep = (stepIndex: number) => {
    // Дозволяємо переходити на будь-який крок
    setCurrentStep(stepIndex)
    setVisitedSteps((prev) => new Set([...prev, stepIndex]))
  }

  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1
      setCurrentStep(nextStep)
      setVisitedSteps((prev) => new Set([...prev, nextStep]))
    }
  }

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const skipTitleSettings = () => {
    if (currentStep === 4) {
      // Перейти до завершення без Title settings
      handleCreate()
    }
  }

  const handleCreate = () => {
    // Фінальна валідація перед створенням
    if (templateEnabled && templateValue) {
      const errors = validateTemplate(templateValue)
      if (errors.length > 0) {
        setTemplateErrors(errors)
        // Перейти на крок Title settings, якщо є помилки
        setCurrentStep(4)
        return
      }
    }
    
    // Логіка створення категорії
    onOpenChange(false)
  }

  const isLastStep = currentStep === steps.length - 1
  const isFirstStep = currentStep === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[800px] sm:!max-w-[800px] lg:!max-w-[800px] w-[98vw] max-w-none sm:max-w-none p-0 gap-0 h-[650px] overflow-hidden flex flex-col" showCloseButton={false}>
        {/* Header */}
        <div className="flex px-6 py-5 border-b border-[#E5E7EB] flex-row items-center gap-0 justify-between">
          <DialogTitle className="text-lg font-semibold text-[#111827]">Create new category</DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-[#F3F4F6] transition-colors"
          >
            <X className="w-4 h-4 text-[#6B7280]" />
          </button>
        </div>

        {/* Main Layout */}
        <div className="flex flex-1 min-h-0">
          {/* Stepper Sidebar */}
          <div className="w-[240px] bg-[#F9FAFB] border-r border-[#E5E7EB]">
            <nav className="py-6 px-6">
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-[14px] top-[14px] bottom-[14px] w-[2px] bg-[#E5E7EB]" />
                
                {steps.map((step, index) => {
                  const isActive = currentStep === index
                  const isVisited = visitedSteps.has(index)
                  
                  return (
                    <div key={step.key} className="relative flex items-start mb-6 last:mb-0">
                      {/* Step circle */}
                      <button
                        onClick={() => goToStep(index)}
                        className={cn(
                          "relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all flex-shrink-0 cursor-pointer hover:scale-105",
                          isActive
                            ? "bg-[#2563EB] text-white"
                            : isVisited
                            ? "bg-white border-2 border-[#2563EB] text-[#2563EB]"
                            : "bg-white border-2 border-[#D1D5DB] text-[#9CA3AF]"
                        )}
                      >
                        {step.number}
                      </button>
                      
                      {/* Step label */}
                <button
                        onClick={() => goToStep(index)}
                  className={cn(
                          "ml-3 text-left flex-1 pt-1 transition-colors cursor-pointer hover:text-[#2563EB]",
                          isActive
                            ? "text-[#2563EB] font-medium"
                            : isVisited
                            ? "text-[#111827]"
                            : "text-[#9CA3AF]"
                        )}
                      >
                        <div className="text-sm leading-tight whitespace-nowrap">
                          {step.label}
                          {step.skippable && <span className="font-normal text-[#6B7280]"> (optional)</span>}
                        </div>
                </button>
                    </div>
                  )
                })}
              </div>
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto min-w-0">
            <div className="p-6 w-full max-w-full">
              {currentStep === 0 && (
                <div>
                  <h3 className="text-base font-semibold text-[#111827] mb-1">Enter category details</h3>
                  <p className="text-sm text-[#6B7280] mb-6">Enter a name and select the appropriate category type.</p>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-[#374151] mb-1.5">
                        Name <span className="text-[#EF4444]">*</span>
                      </label>
                      <div className="relative">
                        <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                        <input
                          type="text"
                          value={categoryName}
                          onChange={(e) => setCategoryName(e.target.value)}
                          placeholder="Enter category name..."
                          className="w-full pl-10 pr-3 py-2.5 text-sm border border-[#D1D5DB] rounded-md focus:outline-none focus:ring-[3px] focus:ring-blue-500/10 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#374151] mb-1.5">
                        Category type <span className="text-[#EF4444]">*</span>
                      </label>
                      <Select defaultValue="decisions">
                        <SelectTrigger className="w-full border border-[#D1D5DB]">
                          <SelectValue placeholder="Select category type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="decisions">Decisions</SelectItem>
                          <SelectItem value="tasks">Tasks</SelectItem>
                          <SelectItem value="projects">Projects</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-[#6B7280] mt-1 leading-[18px]">
                        Choose where this category will appear.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#374151] mb-1.5">Category description</label>
                      <input
                        type="text"
                        placeholder="Describe what this category is used for"
                        className="w-full px-3 py-2.5 text-sm border border-[#D1D5DB] rounded-md focus:outline-none focus:ring-[3px] focus:ring-blue-500/10 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#374151] mb-1.5">Make this a subcategory of</label>
                      <Select>
                        <SelectTrigger className="w-full border border-[#D1D5DB]">
                          <SelectValue placeholder="Choose a parent category (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None (Main category)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-[#6B7280] mt-1 leading-[18px]">
                        Leave empty for a main category, or select a parent to group it under.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#374151] mb-3">
                        Where can this category be used? <span className="text-[#EF4444]">*</span>
                      </label>
                      <RadioGroup defaultValue="selected-only" className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="selected-only" id="selected-only" />
                          <label htmlFor="selected-only" className="text-sm text-[#111827] cursor-pointer">
                            In selected organization only
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="selected-and-child" id="selected-and-child" />
                          <label htmlFor="selected-and-child" className="text-sm text-[#111827] cursor-pointer">
                            In selected and all its child organizations
                          </label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div>
                  <h3 className="text-base font-semibold text-[#111827] mb-1">Select category capsules</h3>
                  <p className="text-sm text-[#6B7280] mb-6">Choose the information users must provide when creating new items in this category</p>
                  <p className="text-sm text-[#6B7280] mb-6">This section is under construction</p>
                </div>
              )}

              {currentStep === 2 && (
                <div>
                  <h3 className="text-base font-semibold text-[#111827] mb-1">Set up custom fields</h3>
                  <p className="text-sm text-[#6B7280] mb-6">Add custom fields to capture more context for items in this category</p>
                  <p className="text-sm text-[#6B7280] mb-6">This section is under construction</p>
                </div>
              )}

              {currentStep === 3 && (
                <div>
                  <h3 className="text-base font-semibold text-[#111827] mb-1">Select a workflow</h3>
                  <p className="text-sm text-[#6B7280] mb-6">Configure the approval workflow for items in this category</p>
                  <p className="text-sm text-[#6B7280] mb-6">This section is under construction</p>
                </div>
              )}

              {currentStep === 4 && (
                <div>
                  <h3 className="text-base font-semibold text-[#111827] mb-1">Title settings</h3>
                  <p className="text-sm text-[#6B7280] mb-6">
                    Create a title template that automatically fills in information when users create items. For example, use {`{creator}`} to show who created it, or {`{field.start}`} and {`{field.end}`} for dates. The system will replace these placeholders with actual values.
                  </p>

                  {!showManualSetup ? (
                    <div key="ai-view">
                      {/* Automatic Title Template Card */}
                      <div className="mb-4 border border-[#E5E7EB] rounded-lg bg-white p-4">
                        {/* Card Header with Toggle */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-[#111827]">Automatic Title Template</h4>
                          </div>
                      <button
                        onClick={() => setTemplateEnabled(!templateEnabled)}
                        className={cn(
                              "relative w-9 h-5 rounded-full transition-colors ml-4 flex-shrink-0",
                          templateEnabled ? "bg-[#3B82F6]" : "bg-[#E5E7EB]",
                        )}
                      >
                        <span
                          className={cn(
                            "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform",
                            templateEnabled && "translate-x-4",
                          )}
                        />
                      </button>
                    </div>

                        {/* Current AI Suggestion Card */}
                        {templateEnabled && currentAISuggestionIndex < aiSuggestions.length && (
                          <div>
                          {/* Description with Navigation */}
                          <div className="flex items-center justify-between mb-4">
                            <p className="text-sm text-[#6B7280] flex-1">
                              {aiSuggestions[currentAISuggestionIndex].description}
                            </p>
                            {!showManualSetup && aiSuggestions.length > 1 && (
                              <div className="flex items-center gap-2 ml-4">
                                <button
                                  onClick={goToPreviousSuggestion}
                                  className="w-8 h-8 flex items-center justify-center rounded-md transition-colors text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827] bg-white border border-[#D1D5DB]"
                                  title="Previous suggestion"
                                >
                                  <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-xs text-[#6B7280] min-w-[60px] text-center">
                                  {currentAISuggestionIndex + 1} / {aiSuggestions.length}
                                </span>
                                <button
                                  onClick={goToNextSuggestion}
                                  className="w-8 h-8 flex items-center justify-center rounded-md transition-colors text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827] bg-white border border-[#D1D5DB]"
                                  title="Next suggestion"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Inline Template Editor */}
                          <div className="mb-4 space-y-2">
                            <div className="relative">
                              <div className="bg-white border border-[#D1D5DB] rounded-md p-3 focus-within:ring-[3px] focus-within:ring-blue-500/10 focus-within:border-blue-500">
                                <input
                                  type="text"
                                  value={templateValue}
                                  onChange={handleTemplateInputChange}
                                  onSelect={(e) => setCursorPosition(e.currentTarget.selectionStart || 0)}
                                  onFocus={(e) => setCursorPosition(e.currentTarget.selectionStart || 0)}
                                  className="w-full text-xs font-mono focus:outline-none bg-transparent"
                                />
                              </div>

                              {showVariableDropdown && (
                                <div
                                  ref={dropdownRef}
                                  className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#D1D5DB] rounded-md shadow-lg max-h-[200px] overflow-y-auto z-10 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#E5E7EB] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#D1D5DB]"
                                >
                                  {Object.entries(variables).map(([category, items]) => (
                                    <div key={category}>
                                      <div className="px-3 py-1.5 text-[11px] font-semibold uppercase text-[#6B7280] bg-[#F9FAFB] border-b border-[#E5E7EB]">
                                        {category}
                                      </div>
                                      {items.map(({ name, example }) => (
                                        <button
                                          key={name}
                                          onClick={() => insertVariable(name)}
                                          className="w-full px-3 py-2 flex items-center justify-between hover:bg-[#F3F4F6] text-left"
                                        >
                                          <span className="text-xs font-medium font-mono">{name}</span>
                                          <span className="text-[11px] text-[#9CA3AF]">{example}</span>
                                        </button>
                                      ))}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Add Variable Button */}
                            <button
                              onClick={() => {
                                setShowVariableDropdown(!showVariableDropdown)
                                setShowAISuggestions(false)
                              }}
                              className="px-3 py-1.5 text-xs font-medium bg-white border border-[#D1D5DB] rounded-md hover:bg-[#F9FAFB] flex items-center gap-1"
                            >
                              + Variable
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Preview */}
                          <div className="mb-4 p-3 bg-[#EFF6FF] border border-[#DBEAFE] rounded-md">
                            <div className="flex items-start justify-between mb-1">
                              <p className="text-xs font-semibold text-[#1E40AF]">Preview:</p>
                              <span className={cn(
                                "text-xs",
                                templateErrors.length > 0 ? "text-red-600" : "text-green-600"
                              )}>
                                {templateErrors.length > 0 ? "❌ Invalid" : "✅ Ready"}
                              </span>
                            </div>
                            <p className="text-xs text-[#1E3A8A]">
                              {previewText || "No preview available"}
                            </p>
                          </div>
                        </div>
                        )}

                        {/* Manual Setup Link - Low Priority */}
                        {templateEnabled && (
                          <div className="mt-4 text-center pt-3 border-t border-[#E5E7EB]">
                            <p className="text-xs text-[#6B7280] mb-1">
                              Not satisfied with these suggestions?
                            </p>
                            <button
                              onClick={() => setShowManualSetup(true)}
                              className="text-xs text-[#2563EB] hover:underline font-medium"
                            >
                              Set up manually
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div key="manual-view">
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="text-sm font-semibold text-[#111827] mb-1">Automatic Title Template</h4>
                            <p className="text-xs text-[#6B7280]">Configure automatic title generation (optional)</p>
                          </div>
                          <button
                            onClick={() => {
                              setShowManualSetup(false)
                              setCurrentAISuggestionIndex(0)
                            }}
                            className="text-xs text-[#2563EB] hover:underline"
                          >
                            ← Back to AI suggestions
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="relative">
                          <div className="bg-white border border-[#D1D5DB] rounded-md p-2.5 focus-within:ring-[3px] focus-within:ring-blue-500/10 focus-within:border-blue-500">
                            <input
                              ref={templateInputRef}
                              type="text"
                              value={templateValue}
                              onChange={handleTemplateInputChange}
                              onSelect={(e) => setCursorPosition(e.currentTarget.selectionStart || 0)}
                              placeholder="e.g. {creator} - {field.project_name}"
                              className="w-full text-xs font-mono focus:outline-none bg-transparent"
                            />
                          </div>

                          {showVariableDropdown && (
                            <div
                              ref={dropdownRef}
                            className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#D1D5DB] rounded-md shadow-lg max-h-[200px] overflow-y-auto z-10 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#E5E7EB] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#D1D5DB]"
                            >
                              {Object.entries(variables).map(([category, items]) => (
                                <div key={category}>
                                  <div className="px-3 py-1.5 text-[11px] font-semibold uppercase text-[#6B7280] bg-[#F9FAFB] border-b border-[#E5E7EB]">
                                    {category}
                                  </div>
                                  {items.map(({ name, example }) => (
                                    <button
                                      key={name}
                                      onClick={() => insertVariable(name)}
                                      className="w-full px-3 py-2 flex items-center justify-between hover:bg-[#F3F4F6] text-left"
                                    >
                                      <span className="text-xs font-medium font-mono">{name}</span>
                                      <span className="text-[11px] text-[#9CA3AF]">{example}</span>
                                    </button>
                                  ))}
                                </div>
                              ))}
                            </div>
                          )}

                        {showAISuggestions && (
                          <div
                            ref={aiSuggestionsRef}
                            className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#D1D5DB] rounded-md shadow-lg max-h-[200px] overflow-y-auto z-10 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#E5E7EB] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#D1D5DB]"
                          >
                            <div className="px-3 py-1.5 text-[11px] font-semibold uppercase text-[#6B7280] bg-[#F9FAFB] border-b border-[#E5E7EB] sticky top-0">
                              AI SUGGESTIONS
                            </div>
                            {aiSuggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                onClick={() => insertAISuggestion(suggestion.template)}
                                className="w-full px-3 py-2.5 flex items-start hover:bg-[#F3F4F6] text-left border-b border-[#E5E7EB] last:border-b-0"
                              >
                                <span className="text-xs font-mono text-[#111827] break-words">{suggestion.template}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      </div>

                      <div className="flex gap-2 mt-3">
                          <button
                          onClick={() => {
                            setShowVariableDropdown(!showVariableDropdown)
                            setShowAISuggestions(false)
                          }}
                            className="px-3 py-1.5 text-xs font-medium bg-white border border-[#D1D5DB] rounded-md hover:bg-[#F9FAFB] flex items-center gap-1"
                          >
                            + Variable
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>

                      <div className="mt-3 p-3 bg-[#EFF6FF] border border-[#DBEAFE] rounded-md">
                        <div className="flex items-start justify-between mb-1">
                          <p className="text-xs font-semibold text-[#1E40AF]">Preview:</p>
                          {templateValue && (
                            <span className={cn(
                              "text-xs",
                              templateErrors.length > 0 ? "text-red-600" : "text-green-600"
                            )}>
                              {templateErrors.length > 0 ? "❌ Invalid" : "✅ Valid"}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#1E3A8A] mb-2">
                          {templateValue ? (previewText || "No preview available") : "Enter a template to see preview"}
                        </p>
                        {templateErrors.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-red-200">
                            <ul className="space-y-0.5">
                              {templateErrors.map((error, index) => (
                                <li key={index} className="text-[11px] text-red-700">• {error}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#E5E7EB]">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="px-4 py-2 text-sm">
            Cancel
          </Button>
          <div className="flex gap-3">
            {!isFirstStep && (
              <Button variant="outline" onClick={goToPreviousStep} className="px-4 py-2 text-sm">
                Go back
              </Button>
            )}
            <Button 
              onClick={isLastStep ? handleCreate : goToNextStep} 
              className="px-4 py-2 text-sm bg-[#3B82F6] hover:bg-[#2563EB]"
            >
              {isLastStep ? "Create" : "Continue"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
