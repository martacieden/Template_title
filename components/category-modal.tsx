"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, ChevronDown, User, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface CategoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const sidebarItems = ["Category details", "Category capsules", "Custom fields", "Workflow", "Advanced settings"]

const variables = {
  "System Fields": [
    { name: "{creator}", example: "Sandra Wu" },
    { name: "{organization}", example: "Engineering" },
    { name: "{due_date}", example: "03/15/2024" },
    { name: "{created_date}", example: "01/20/2024" },
  ],
  "Custom Fields": [
    { name: "{field.project_name}", example: "Solar Panel Installation" },
    { name: "{field.budget}", example: "$50,000" },
    { name: "{field.location}", example: "Building A" },
  ],
}

export function CategoryModal({ open, onOpenChange }: CategoryModalProps) {
  const [activeSection, setActiveSection] = useState(0)
  const [templateEnabled, setTemplateEnabled] = useState(false)
  const [templateValue, setTemplateValue] = useState("")
  const [showVariableDropdown, setShowVariableDropdown] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)
  const [previewText, setPreviewText] = useState("")
  const [peopleWithAccess, setPeopleWithAccess] = useState<Array<{ id: string; name: string; email?: string; type: "user" | "team"; accessLevel: "full" | "viewer" }>>([])
  const [selectedUser, setSelectedUser] = useState<string>("")
  const [selectedAccessLevel, setSelectedAccessLevel] = useState<"full" | "viewer">("full")
  const [userInput, setUserInput] = useState<string>("")
  const templateInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Update preview with sample data
    let preview = templateValue
    Object.values(variables)
      .flat()
      .forEach(({ name, example }) => {
        preview = preview.replace(new RegExp(name.replace(/[{}]/g, "\\$&"), "g"), example)
      })
    setPreviewText(preview)
  }, [templateValue])

  useEffect(() => {
    // Close dropdown when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowVariableDropdown(false)
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
    templateInputRef.current?.focus()
  }

  const handleTemplateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTemplateValue(e.target.value)
    setCursorPosition(e.target.selectionStart || 0)
  }

  const addPerson = () => {
    const nameToAdd = selectedUser || userInput.trim()
    if (!nameToAdd) return
    
    const newPerson = {
      id: `person-${Date.now()}`,
      name: nameToAdd,
      email: nameToAdd.includes("@") ? nameToAdd : undefined,
      type: "user" as const,
      accessLevel: selectedAccessLevel,
    }
    setPeopleWithAccess([...peopleWithAccess, newPerson])
    setSelectedUser("")
    setUserInput("")
  }

  const removePerson = (id: string) => {
    setPeopleWithAccess(peopleWithAccess.filter((p) => p.id !== id))
  }

  const updateAccessLevel = (id: string, level: "full" | "viewer") => {
    setPeopleWithAccess(peopleWithAccess.map((p) => (p.id === id ? { ...p, accessLevel: level } : p)))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[800px] sm:!max-w-[800px] lg:!max-w-[800px] w-[98vw] max-w-none sm:max-w-none p-0 gap-0 max-h-[90vh] overflow-hidden" showCloseButton={false}>
        {/* Header */}
        <div className="flex px-6 py-5 border-b border-[#E5E7EB] flex-row items-center gap-0 justify-between">
          <DialogTitle className="text-lg font-semibold text-[#111827]">Edit Category Settings</DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-[#F3F4F6] transition-colors"
          >
            <X className="w-4 h-4 text-[#6B7280]" />
          </button>
        </div>

        {/* Main Layout */}
        <div className="flex">
          {/* Sidebar */}
          <div className="w-[200px] bg-[#F9FAFB] border-r border-[#E5E7EB]">
            <nav className="py-4">
              {sidebarItems.map((item, index) => (
                <button
                  key={item}
                  onClick={() => setActiveSection(index)}
                  className={cn(
                    "w-full text-left px-6 py-2.5 text-sm transition-colors",
                    activeSection === index
                      ? "bg-[#EFF6FF] text-[#2563EB] font-medium border-l-[3px] border-[#2563EB] pl-[21px]"
                      : "text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]",
                  )}
                >
                  {item}
                </button>
              ))}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto max-h-[calc(90vh-160px)] min-w-0">
            <div className="p-6 w-full max-w-full">
              {activeSection === 0 && (
                <div>
                  <h3 className="text-base font-semibold text-[#111827] mb-1">Category details</h3>
                  <p className="text-sm text-[#6B7280] mb-6">Configure the basic settings for this category</p>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-[#374151] mb-1.5">
                        Category name <span className="text-[#EF4444]">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter category name"
                        className="w-full px-3 py-2.5 text-sm border border-[#D1D5DB] rounded-md focus:outline-none focus:ring-[3px] focus:ring-blue-500/10 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#374151] mb-1.5">Description</label>
                      <textarea
                        placeholder="Enter description"
                        rows={3}
                        className="w-full px-3 py-2.5 text-sm border border-[#D1D5DB] rounded-md resize-y focus:outline-none focus:ring-[3px] focus:ring-blue-500/10 focus:border-blue-500"
                      />
                      <p className="text-xs text-[#6B7280] mt-1 leading-[18px]">
                        This description will be shown to users when they select this category
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#374151] mb-1.5">Icon</label>
                      <select className="w-full px-3 py-2.5 text-sm border border-[#D1D5DB] rounded-md cursor-pointer focus:outline-none focus:ring-[3px] focus:ring-blue-500/10 focus:border-blue-500">
                        <option>Select an icon</option>
                        <option>📋 Clipboard</option>
                        <option>🎯 Target</option>
                        <option>💼 Briefcase</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 4 && (
                <div>
                  <h3 className="text-base font-semibold text-[#111827] mb-1">Advanced settings</h3>
                  <p className="text-sm text-[#6B7280] mb-6">Configure advanced options and automation</p>

                  {/* Template Section */}
                  <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4 mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-semibold text-[#111827]">Automatic Title Template</h4>
                      <button
                        onClick={() => setTemplateEnabled(!templateEnabled)}
                        className={cn(
                          "relative w-9 h-5 rounded-full transition-colors",
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

                    {templateEnabled && (
                      <div className="space-y-3">
                        <div className="relative">
                          <div className="bg-white border border-[#D1D5DB] rounded-md p-3 focus-within:ring-[3px] focus-within:ring-blue-500/10 focus-within:border-blue-500">
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
                              className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#D1D5DB] rounded-md shadow-lg max-h-[200px] overflow-y-auto z-10"
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

                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowVariableDropdown(!showVariableDropdown)}
                            className="px-3 py-1.5 text-xs font-medium bg-white border border-[#D1D5DB] rounded-md hover:bg-[#F9FAFB] flex items-center gap-1"
                          >
                            Insert Variable
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setTemplateValue("")}
                            className="px-3 py-1.5 text-xs font-medium bg-white border border-[#D1D5DB] rounded-md hover:bg-[#F9FAFB]"
                          >
                            Clear
                          </button>
                        </div>

                        {templateValue && (
                          <div className="mt-3 p-3 bg-white border border-[#E5E7EB] rounded-md">
                            <p className="text-xs font-semibold text-[#374151] mb-1">Preview:</p>
                            <p className="text-xs text-[#111827]">{previewText || "No preview available"}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Default Sharing Settings */}
                  <div className="mt-6 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-[#111827] mb-3">Default Sharing Settings</h4>
                    <p className="text-xs text-[#6B7280] mb-4">Who can view and edit decisions in this category by default</p>

                    {/* Add Person Row */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-white border border-[#D1D5DB] rounded-md min-h-[36px]">
                        {selectedUser ? (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-[#F3F4F6] rounded text-sm">
                              <span>{selectedUser}</span>
                              <button
                                onClick={() => setSelectedUser("")}
                                className="hover:bg-[#E5E7EB] rounded-full p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && (selectedUser || userInput.trim())) {
                                e.preventDefault()
                                addPerson()
                              }
                            }}
                            placeholder="Invite others by name or email"
                            className="flex-1 text-sm outline-none bg-transparent"
                          />
                        )}
                      </div>
                      <Select value={selectedAccessLevel} onValueChange={(value) => setSelectedAccessLevel(value as "full" | "viewer")}>
                        <SelectTrigger className="w-[160px] h-9 border border-[#D1D5DB]">
                          <SelectValue>
                            {selectedAccessLevel === "full" ? "Full access" : "Viewer"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">Full access</span>
                              <span className="text-xs text-[#6B7280]">Can edit content and share with others</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="viewer">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">Viewer</span>
                              <span className="text-xs text-[#6B7280]">Can view content, comments and history</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={addPerson}
                        disabled={!selectedUser && !userInput.trim()}
                        className="px-4 py-2 h-9 text-sm bg-[#3B82F6] hover:bg-[#2563EB] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Invite
                      </Button>
                    </div>

                    {/* People with Access List */}
                    {peopleWithAccess.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-[#6B7280] mb-2">People with access</div>
                        {peopleWithAccess.map((person) => (
                          <div key={person.id} className="flex items-center gap-3 px-3 py-2 bg-white border border-[#D1D5DB] rounded-md">
                            <div className="w-8 h-8 rounded-full bg-[#E5E7EB] flex items-center justify-center text-xs font-medium text-[#6B7280]">
                              {person.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-[#111827] truncate">{person.name}</div>
                              {person.email && (
                                <div className="text-xs text-[#6B7280] truncate">{person.email}</div>
                              )}
                            </div>
                            <Select
                              value={person.accessLevel}
                              onValueChange={(value) => updateAccessLevel(person.id, value as "full" | "viewer")}
                            >
                              <SelectTrigger className="w-[160px] h-9 border border-[#D1D5DB]">
                                <SelectValue>
                                  {person.accessLevel === "full" ? "Full access" : "Viewer"}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="full">
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">Full access</span>
                                    <span className="text-xs text-[#6B7280]">Can edit content and share with others</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="viewer">
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">Viewer</span>
                                    <span className="text-xs text-[#6B7280]">Can view content, comments and history</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <button
                              onClick={() => removePerson(person.id)}
                              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-[#F3F4F6] transition-colors"
                            >
                              <X className="w-4 h-4 text-[#6B7280]" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeSection !== 0 && activeSection !== 4 && (
                <div>
                  <h3 className="text-base font-semibold text-[#111827] mb-1">{sidebarItems[activeSection]}</h3>
                  <p className="text-sm text-[#6B7280] mb-6">This section is under construction</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#E5E7EB]">
          <span className="text-xs text-[#6B7280]">Version 2.1.0</span>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="px-4 py-2 text-sm">
              Cancel
            </Button>
            <Button className="px-4 py-2 text-sm bg-[#3B82F6] hover:bg-[#2563EB]">Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
