"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { FileSpreadsheet, Loader2, Upload, X } from "lucide-react"

interface ExcelImportModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ExcelImportModal({ isOpen, onClose, onSuccess }: ExcelImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [importResult, setImportResult] = useState<{
    success: boolean
    message: string
    insertedCount: number
    updatedCount: number
    errors?: string[]
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Check file type
    const fileExtension = selectedFile.name.split(".").pop()?.toLowerCase()
    if (fileExtension !== "xlsx" && fileExtension !== "xls") {
      toast.error("Invalid file format", {
        description: "Please upload an Excel file (.xlsx or .xls)",
      })
      return
    }

    setFile(selectedFile)
    setImportResult(null)
    setUploadProgress(0)
  }

  const handleImport = async () => {
    if (!file) {
      toast.error("No file selected")
      return
    }

    setIsUploading(true)
    setUploadProgress(10)

    try {
      const formData = new FormData()
      formData.append('file', file)

      setUploadProgress(30)

      const response = await fetch("/api/import", {
        method: "POST",
        body: formData
      })

      setUploadProgress(70)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || "Import failed")
      }

      const result = await response.json()
      setUploadProgress(100)
      setImportResult(result)

      toast.success("Import completed successfully! 🎉", {
        description: `${result.insertedCount || 0} items added, ${result.updatedCount || 0} items updated`,
      })

      // Notify parent component after a short delay
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 2000)

    } catch (error: any) {
      console.error("Import error:", error)
      setImportResult({
        success: false,
        message: error.message || "Import failed",
        insertedCount: 0,
        updatedCount: 0,
        errors: [error.message]
      })

      toast.error("Import failed", {
        description: error.message || "An unexpected error occurred",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const resetForm = () => {
    setFile(null)
    setImportResult(null)
    setUploadProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center">
              <FileSpreadsheet className="h-5 w-5 mr-2" />
              Import Inventory from Excel
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Upload an Excel file with inventory data. The file should have columns matching the inventory schema.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* File Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              ref={fileInputRef}
              disabled={isUploading}
            />

            {!file ? (
              <div>
                <FileSpreadsheet className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">Drag and drop your Excel file here, or click to browse</p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  variant="outline"
                  className="mx-auto"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Select Excel File
                </Button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-center mb-4">
                  <FileSpreadsheet className="h-8 w-8 text-green-500 mr-2" />
                  <span className="font-medium">{file.name}</span>
                </div>

                {isUploading ? (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-sm text-gray-500">
                      {uploadProgress < 30 ? "Uploading file..." :
                        uploadProgress < 70 ? "Processing..." :
                          "Importing data..."}
                    </p>
                  </div>
                ) : (
                  <div className="flex justify-center space-x-2">
                    <Button variant="outline" size="sm" onClick={resetForm}>
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Import Results */}
          {importResult && (
            <div className={`p-4 rounded-lg border ${importResult.success
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
              }`}>
              <h4 className={`font-medium mb-2 ${importResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                {importResult.success ? '✅ Import Successful!' : '❌ Import Failed'}
              </h4>
              <p className={`text-sm ${importResult.success ? 'text-green-700' : 'text-red-700'
                }`}>
                {importResult.message}
              </p>
              {importResult.success && (
                <div className="mt-2 text-sm text-green-600">
                  • {importResult.insertedCount} new items added
                  • {importResult.updatedCount} existing items updated
                </div>
              )}
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-red-800">Errors:</p>
                  <ul className="list-disc list-inside text-sm text-red-700">
                    {importResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={isUploading || !file || importResult?.success}
            className="bg-green-600 hover:bg-green-700"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {uploadProgress < 30 ? "Uploading..." :
                  uploadProgress < 70 ? "Processing..." :
                    "Importing..."}
              </>
            ) : importResult?.success ? (
              "Import Complete"
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Import Excel File
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
