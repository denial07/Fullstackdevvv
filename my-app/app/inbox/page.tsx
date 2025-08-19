"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  RefreshCw,
  Archive,
  Trash2,
  Star,
  StarOff,
  Mail,
  MailOpen,
  Reply,
  ReplyAll,
  Forward,
  MoreHorizontal,
  Paperclip,
  AlertCircle,
  Download,
  Eye,
  EyeOff,
  X,
  Inbox,
  Bell,
  Loader2,
  CloudDownload,
  Brain,
  Save,
  CheckCircle,
  AlertTriangle,
  Edit,
  Plus,
} from "lucide-react"
import { Navbar } from "@/components/navbar"
import { toast } from "sonner"

interface Email {
  id: string
  from: {
    name: string
    email: string
    avatar?: string
  }
  subject: string
  preview: string
  body: string
  timestamp: string
  isRead: boolean
  isStarred: boolean
  hasAttachments: boolean
  labels: string[]
  priority: "high" | "normal" | "low"
  category: "primary" | "updates"
  threadId?: string
}

interface EmailAnalysis {
  isShipmentRelated: boolean
  type?: string
  extractedData?: {
    trackingNumber?: string
    shipmentId?: string
    status?: string
    origin?: string
    destination?: string
    estimatedDelivery?: string
    carrier?: string
    items?: Array<{ name: string; quantity?: number; description?: string; price?: number }>
    price?: number
    urgency?: string
    actionRequired?: boolean
    notes?: string
  }
  summary: string
  suggestedAction?: string
}

const categories = [
  { key: "updates", label: "Updates", icon: Bell, count: 0 },
]

export default function InboxPage() {
  const [emails, setEmails] = useState<Email[]>([])
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("updates")
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoadingGmail, setIsLoadingGmail] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)
  const [emailAnalysis, setEmailAnalysis] = useState<EmailAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSavingShipment, setIsSavingShipment] = useState(false)
  const [shipmentSaved, setShipmentSaved] = useState(false)
  const [isEditingAnalysis, setIsEditingAnalysis] = useState(false)
  const [editableAnalysis, setEditableAnalysis] = useState<EmailAnalysis | null>(null)

  // Sample test emails for testing AI analysis
  const createTestEmail = (type: 'incoming-order' | 'outgoing-order' | 'ocean-freight-order' | 'local-order' | 'non-shipment' = 'incoming-order'): Email => {
    const baseId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    switch (type) {
      case 'incoming-order':
        return {
          id: baseId,
          from: {
            name: "Timber Supplies Asia",
            email: "orders@timbersupplies.com",
            avatar: "/placeholder.svg"
          },
          subject: "Order Confirmation #PO-2025-0789 - Raw Wood Materials",
          preview: "Thank you for your order. Your raw wood materials order has been confirmed and will be shipped soon...",
          body: `Dear Valued Customer,

Thank you for your order! We are pleased to confirm your purchase of raw wood materials.

ORDER CONFIRMATION DETAILS:
- Order Number: PO-2025-0789
- Shipment ID: SH-IN-240789
- Order Date: January 16, 2025
- Status: Confirmed - In Transit
- Tracking Number: TS789456123
- Vendor: Timber Supplies Asia Pte Ltd
- Estimated Delivery: January 20, 2025
- Delivery Destination: Singapore Warehouse, 123 Industrial Road, Singapore 628123
- Total Order Value: $8,450.00

SHIPPING DETAILS:
- Carrier: Maritime Express Lines
- Vessel: MV Wood Trader
- Port of Departure: Port Klang, Malaysia
- Port of Arrival: PSA Singapore Terminal
- Driver (Final Mile): Lim Boon Hock (License: D9988776)
- Vehicle: Timber Truck SGX-7755B
- Delivery Address: Singapore Warehouse, 123 Industrial Road, Block A, Receiving Dock 2, Singapore 628123

ORDERED ITEMS:
1. Premium Teak Wood Planks Grade A - 50 pieces @ $85.00 each = $4,250.00
2. Oak Wood Beams 4x6 inch Kiln Dried - 25 pieces @ $120.00 each = $3,000.00
3. Pine Wood Sheets 15mm Treated - 40 pieces @ $30.00 each = $1,200.00

DELIVERY INSTRUCTIONS:
Your order will be delivered to Singapore Warehouse receiving dock. Driver Lim Boon Hock will contact you 2 hours before delivery. Please ensure forklift is available for unloading heavy timber pieces. All wood has been treated and certified for quality.

PAYMENT TERMS:
Payment is due upon delivery. Please have your receiving manager ready to inspect and sign for the materials.

Thank you for choosing Timber Supplies Asia for your wood material needs!

Best regards,
Sales Team
Timber Supplies Asia Pte Ltd
Email: orders@timbersupplies.com
Phone: +60-3-1234-5678`,
          timestamp: new Date().toISOString(),
          isRead: false,
          isStarred: false,
          hasAttachments: false,
          labels: ["High Priority"],
          priority: "high" as const,
          category: "updates" as const,
          threadId: `thread-${baseId}`
        }

      case 'outgoing-order':
        return {
          id: baseId,
          from: {
            name: "DHL Express",
            email: "notifications@dhl.com",
            avatar: "/placeholder.svg"
          },
          subject: "Package Delivered Successfully - Tracking #DHL9876543210",
          preview: "Your raw wood materials from Forest Products Malaysia have been delivered successfully...",
          body: `Dear Valued Customer,

We are pleased to inform you that your raw wood materials shipment has been delivered successfully.

DELIVERY CONFIRMATION:
- Tracking Number: DHL9876543210
- Status: Delivered
- Delivery Date: January 16, 2025 at 2:45 PM
- Delivered to: Malaysian Warehouse - Receiving Dock B
- Signed by: Ahmad Razak (Warehouse Manager)
- Carrier: DHL Express

SHIPMENT DETAILS:
- Vendor: Forest Products Malaysia Sdn Bhd
- Origin: Kuching Timber Port, Sarawak, Malaysia
- Destination: Malaysian Warehouse, 456 Industrial Park, Johor Bahru
- Final Delivery Address: Malaysian Warehouse, 456 Industrial Park Drive, Level 1, Dock B, Johor Bahru 81100, Malaysia
- Total Weight: 2,450 kg
- Total Value: $6,850.50

TRANSPORT DETAILS:
- Ground Transport: Timber Truck MY-7755K
- Driver: Rahman bin Abdullah (Employee ID: DHL-MY-8834)
- Route: Kuching → Johor Bahru Highway

RAW WOOD MATERIALS DELIVERED:
1. Meranti Wood Logs Grade AA - 15 logs @ $180.00 each = $2,700.00
2. Rubber Wood Planks Kiln Dried - 80 pieces @ $45.00 each = $3,600.00
3. Bamboo Poles Premium Grade - 200 pieces @ $3.25 each = $650.00
4. Shipping & Handling Fee: $100.50

DELIVERY NOTES:
All wood materials were inspected for moisture content and quality upon delivery. Driver Rahman confirmed all timber was properly treated and ready for warehouse storage. Items are now available for processing at Malaysian Warehouse Dock B receiving area.

Please ensure proper ventilation and humidity control for wood storage.

Thank you for choosing DHL Express!

DHL Customer Service Team`,
          timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          isRead: false,
          isStarred: true,
          hasAttachments: false,
          labels: [],
          priority: "normal" as const,
          category: "updates" as const,
          threadId: `thread-${baseId}`
        }

      case 'outgoing-order':
        return {
          id: baseId,
          from: {
            name: "Singapore Warehouse System",
            email: "orders@sgwarehouse.com",
            avatar: "/placeholder.svg"
          },
          subject: "Order Confirmation #SO-2025-0156 - Wood Materials Dispatch",
          preview: "Your order has been confirmed and dispatched to Furniture Makers Malaysia...",
          body: `ORDER DISPATCH CONFIRMATION

We are pleased to confirm that your wood materials order has been processed and dispatched.

ORDER DETAILS:
- Sales Order Number: SO-2025-0156
- Shipment ID: SH-OUT-240156
- Order Date: January 15, 2025
- Status: In Transit
- Customer: Furniture Makers Sdn Bhd
- Delivery Destination: 789 Furniture Industrial Estate, Shah Alam, Selangor, Malaysia
- Tracking Number: SG999AA1234567890
- Total Order Value: $12,200.00

SHIPPING INFORMATION:
- Dispatched From: Singapore Warehouse, 123 Industrial Road
- Carrier: Cross-Border Logistics Sdn Bhd
- Vehicle: Heavy Duty Timber Truck MY-7788K
- Driver: Ahmad bin Hassan (License: MY-D5521)
- Estimated Delivery: January 19, 2025
- Delivery Address: Furniture Makers Sdn Bhd, 789 Furniture Industrial Estate, Block D, Unit 25-30, Shah Alam, Selangor 40000, Malaysia

TRANSPORT ROUTE:
- Departure Point: Singapore Tuas Checkpoint
- Arrival Point: Johor Bahru Checkpoint, Malaysia
- Final Route: North-South Highway → Shah Alam Industrial Area

ORDERED WOOD MATERIALS:
1. Premium Teak Wood Boards 25mm Grade AAA - 30 pieces @ $150.00 each = $4,500.00
2. Mahogany Wood Planks Kiln Dried - 50 pieces @ $95.00 each = $4,750.00
3. Cherry Wood Veneers Premium Grade - 100 sheets @ $28.00 each = $2,800.00
4. Wood Treatment & Finishing Kit - 5 sets @ $30.00 each = $150.00

DELIVERY INSTRUCTIONS:
Driver Ahmad will contact your receiving supervisor Encik Lim Boon Huat 2 hours before arrival. Please ensure forklift equipment is available for timber unloading. All wood materials have been quality checked and are ready for furniture production.

CUSTOMER REQUIREMENTS:
- Delivery Time: 8 AM - 4 PM weekdays only
- Special Handling: Moisture-sensitive materials require covered unloading
- Inspection Required: Customer quality check upon delivery

Thank you for your business!

Best regards,
Singapore Warehouse Operations Team
Phone: +65-6234-5678
Email: orders@sgwarehouse.com`,
          timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
          isRead: false,
          isStarred: false,
          hasAttachments: true,
          labels: [],
          priority: "normal" as const,
          category: "updates" as const,
          threadId: `thread-${baseId}`
        }

      case 'local-order':
        return {
          id: baseId,
          from: {
            name: "Malaysian Forest Products",
            email: "sales@malayforest.com",
            avatar: "/placeholder.svg"
          },
          subject: "Order Confirmation #MY-ORD-4567 - Local Wood Supply",
          preview: "Your local wood materials order has been confirmed for delivery to Malaysian Warehouse...",
          body: `ORDER CONFIRMATION - LOCAL DELIVERY

Thank you for your order of premium Malaysian wood materials!

ORDER CONFIRMATION:
- Order Number: MY-ORD-4567
- Shipment ID: SH-LOC-564567
- Order Date: January 16, 2025
- Status: Confirmed - Ready for Delivery
- Vendor: Malaysian Forest Products Sdn Bhd
- Customer: Your Company Malaysian Operations
- Delivery Destination: Malaysian Warehouse, 456 Industrial Park, Johor Bahru
- Tracking Number: MFP567890123
- Total Order Value: $6,850.50

LOCAL DELIVERY DETAILS:
- Departure: Kuching Timber Processing Plant, Sarawak
- Driver: Rahman bin Abdullah (License: JKR-MY-8834)
- Vehicle: Malaysian Timber Truck MY-7755K
- Route: Kuching → Johor Bahru Highway (Local Transport)
- Estimated Delivery: January 18, 2025
- Delivery Address: Malaysian Warehouse, 456 Industrial Park Drive, Level 1, Dock B, Johor Bahru 81100, Malaysia

CONFIRMED WOOD MATERIALS:
1. Meranti Wood Logs Grade AA Premium - 15 logs @ $180.00 each = $2,700.00
2. Rubber Wood Planks Kiln Dried - 80 pieces @ $45.00 each = $3,600.00
3. Bamboo Poles Construction Grade - 200 pieces @ $3.25 each = $650.00
4. Local Delivery & Handling: $100.50

QUALITY SPECIFICATIONS:
- All timber kiln dried to 12% moisture content
- Graded according to Malaysian Timber Standards
- Certified sustainable forestry sources
- Fumigation treatment completed for storage

DELIVERY ARRANGEMENTS:
Driver Rahman will contact Malaysian Warehouse 2 hours before arrival. Please ensure proper ventilation in storage area for wood materials. Forklift assistance required for log handling.

PAYMENT TERMS:
Net 30 days from delivery date. Invoice will be sent upon successful delivery confirmation.

Thank you for supporting local Malaysian timber industry!

Warm regards,
Sales Department
Malaysian Forest Products Sdn Bhd
Kuching, Sarawak
Phone: +60-82-123-4567
Email: sales@malayforest.com`,
          timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          isRead: false,
          isStarred: true,
          hasAttachments: false,
          labels: [],
          priority: "normal" as const,
          category: "updates" as const,
          threadId: `thread-${baseId}`
        }

      case 'ocean-freight-order':
        return {
          id: baseId,
          from: {
            name: "Indonesian Timber Exports",
            email: "orders@indotimber.co.id",
            avatar: "/placeholder.svg"
          },
          subject: "Order Confirmation #ITE-2025-789 - Premium Timber Ocean Freight",
          preview: "Your premium Indonesian timber order has been confirmed and loaded for ocean freight delivery...",
          body: `PREMIUM TIMBER ORDER CONFIRMATION - OCEAN FREIGHT

We are pleased to confirm your large-scale timber order for ocean freight delivery.

ORDER DETAILS:
- Order Number: ITE-2025-789
- Shipment ID: SH-OF-890789
- Order Date: January 10, 2025
- Status: Confirmed - Shipped via Ocean Freight
- Vendor: Indonesian Timber Exports Ltd
- Bill of Lading: MAEU789456123
- Container Number: MSKU 7891234 5
- Estimated Delivery: January 22, 2025
- Total Order Value: $35,750.00

OCEAN FREIGHT DETAILS:
- Vessel Name: MAERSK ESSEX
- Voyage Number: 125E
- Port of Loading: Tanjung Priok Port, Jakarta, Indonesia
- Port of Discharge: PSA Singapore Pasir Panjang Terminal
- Terminal: PPT Container Terminal 1, Berth 14A
- Container Type: 40ft Open Top Container (for timber)

FINAL MILE DELIVERY:
- Pickup Driver: Kumar Raj (CDL License: T1234567S)
- Vehicle: Mercedes Timber Truck SGP-9988T
- Pickup Address: PSA Singapore, 200 Pasir Panjang Road, Terminal 1, Gate 3
- Final Destination: Singapore Warehouse, 123 Industrial Road, Block A, Singapore 628123

PREMIUM TIMBER ORDER:
1. Indonesian Teak Logs Grade AAA - 25 logs @ $800.00 each = $20,000.00
2. Mahogany Timber Planks Kiln Dried - 120 pieces @ $85.00 each = $10,200.00  
3. Ironwood Beams Heavy Duty Construction - 40 pieces @ $125.00 each = $5,000.00
4. Bamboo Construction Poles Premium - 500 pieces @ $1.10 each = $550.00

CARGO SPECIFICATIONS:
- Total Weight: 28,500 kg
- All timber fumigated and certified for international export
- Phytosanitary certificates included
- Moisture content verified at 12-15% for optimal quality

DELIVERY ARRANGEMENTS:
Container arrives January 17, 2025. Free time expires January 24, 2025. Driver Kumar will coordinate pickup and contact Singapore Warehouse 2 hours before delivery. Crane/forklift required for unloading heavy timber logs.

QUALITY ASSURANCE:
All timber has been graded and inspected according to international standards. Quality certificates and sustainable forestry documentation included.

Thank you for choosing Indonesian Timber Exports for your premium wood needs!

Best regards,
Export Sales Department
Indonesian Timber Exports Ltd
Jakarta, Indonesia
Phone: +62-21-567-8901
Email: orders@indotimber.co.id`,
          timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
          isRead: false,
          isStarred: false,
          hasAttachments: true,
          labels: ["High Priority"],
          priority: "high" as const,
          category: "updates" as const,
          threadId: `thread-${baseId}`
        }

      case 'non-shipment':
        return {
          id: baseId,
          from: {
            name: "HR Department",
            email: "hr@company.com",
            avatar: "/placeholder.svg"
          },
          subject: "Monthly Team Meeting - January 2025",
          preview: "Please join us for our monthly team meeting scheduled for next week...",
          body: `Dear Team,

I hope this email finds you well. I wanted to reach out regarding our upcoming monthly team meeting.

MEETING DETAILS:
- Date: January 22, 2025
- Time: 10:00 AM - 11:30 AM (SGT)
- Location: Conference Room A / Zoom (Hybrid)
- Meeting ID: 123-456-789

AGENDA:
1. Q4 2024 Performance Review (15 minutes)
2. Q1 2025 Goals and Objectives (30 minutes)
3. New Process Updates (20 minutes)
4. Team Building Activities Discussion (15 minutes)
5. Q&A Session (10 minutes)

PREPARATION:
Please prepare a brief update on your current projects and any challenges you're facing. We'll also be discussing the new inventory management system implementation.

RSVP:
Please confirm your attendance by January 20, 2025. If you cannot attend, please let me know in advance.

Looking forward to seeing everyone!

Best regards,
Sarah Johnson
HR Manager

Company Confidential - Internal Use Only`,
          timestamp: new Date(Date.now() - 14400000).toISOString(), // 4 hours ago
          isRead: true,
          isStarred: false,
          hasAttachments: false,
          labels: [],
          priority: "low" as const,
          category: "updates" as const,
          threadId: `thread-${baseId}`
        }

      default:
        return createTestEmail('incoming-order')
    }
  }

  const handleTestEmail = () => {
    const testTypes: Array<'incoming-order' | 'outgoing-order' | 'local-order' | 'ocean-freight-order' | 'non-shipment'> = [
      'incoming-order', 'outgoing-order', 'local-order', 'ocean-freight-order', 'non-shipment'
    ]
    const randomType = testTypes[Math.floor(Math.random() * testTypes.length)]
    const testEmail = createTestEmail(randomType)
    setEmails(prev => [testEmail, ...prev])
    toast.success(`Test email added: ${randomType.replace('-', ' ')}`, {
      description: "Click on the test email to analyze it with AI"
    })
  }

  const filteredEmails = emails.filter((email) => {
    const matchesSearch =
      !searchTerm ||
      email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.from.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.preview.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = email.category === selectedCategory
    const matchesReadStatus = !showUnreadOnly || !email.isRead

    return matchesSearch && matchesCategory && matchesReadStatus
  })

  // Update category counts
  const updatesCount = emails.filter((email) => email.category === "updates").length

  categories[0].count = updatesCount

  const unreadCount = emails.filter((email) => !email.isRead).length

  const handleEmailSelect = (emailId: string) => {
    setSelectedEmails((prev) => (prev.includes(emailId) ? prev.filter((id) => id !== emailId) : [...prev, emailId]))
  }

  const handleSelectAll = () => {
    if (selectedEmails.length === filteredEmails.length) {
      setSelectedEmails([])
    } else {
      setSelectedEmails(filteredEmails.map((email) => email.id))
    }
  }

  const handleEmailClick = async (email: Email) => {
    setSelectedEmail(email)
    setIsEmailDialogOpen(true)
    setEmailAnalysis(null) // Reset analysis when opening new email
    setShipmentSaved(false) // Reset saved state when opening new email
    setIsEditingAnalysis(false) // Reset editing state
    setEditableAnalysis(null) // Reset editable analysis
    if (!email.isRead) {
      // Mark as read locally
      setEmails((prev) => prev.map((e) => (e.id === email.id ? { ...e, isRead: true } : e)))

      // Mark as read on Gmail
      try {
        await fetch("/api/gmail", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "markRead",
            messageId: email.id,
          }),
        })
      } catch (error) {
        console.error("Failed to mark email as read:", error)
      }
    }
  }

  const analyzeEmailWithAI = async () => {
    if (!selectedEmail) return

    setIsAnalyzing(true)
    
    const loadingToast = toast.loading("Analyzing email with AI...", {
      description: "Extracting shipment information from email content",
    })

    try {
      const response = await fetch("/api/analyze-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: selectedEmail }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze email")
      }

      if (data.success) {
        setEmailAnalysis(data.analysis)
        setEditableAnalysis(data.analysis) // Initialize editable version
        
        toast.dismiss(loadingToast)
        if (data.analysis.isShipmentRelated) {
          toast.success("Shipment information extracted! 🚚", {
            description: `Detected: ${data.analysis.type?.replace('_', ' ') || 'shipment update'}`,
          })
        } else {
          toast.info("No shipment information found", {
            description: "This email doesn't appear to be shipment-related",
          })
        }
      } else {
        throw new Error(data.error || "Analysis failed")
      }
    } catch (error: any) {
      console.error("Error analyzing email:", error)
      toast.dismiss(loadingToast)
      toast.error("Failed to analyze email", {
        description: error.message || "Please try again",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const toggleEditMode = () => {
    setIsEditingAnalysis(!isEditingAnalysis)
    if (!isEditingAnalysis && emailAnalysis) {
      // Enter edit mode - create a deep copy
      setEditableAnalysis(JSON.parse(JSON.stringify(emailAnalysis)))
    }
  }

  const updateEditableField = (field: string, value: any) => {
    if (!editableAnalysis) return
    
    if (field.startsWith('extractedData.')) {
      const subField = field.replace('extractedData.', '')
      setEditableAnalysis({
        ...editableAnalysis,
        extractedData: {
          ...editableAnalysis.extractedData,
          [subField]: value
        }
      })
    } else {
      setEditableAnalysis({
        ...editableAnalysis,
        [field]: value
      })
    }
  }

  const addEditableItem = () => {
    if (!editableAnalysis?.extractedData) return
    
    const newItem = { name: "", quantity: 1, description: "", price: 0 }
    const currentItems = editableAnalysis.extractedData.items || []
    
    setEditableAnalysis({
      ...editableAnalysis,
      extractedData: {
        ...editableAnalysis.extractedData,
        items: [...currentItems, newItem]
      }
    })
  }

  const updateEditableItem = (index: number, field: string, value: any) => {
    if (!editableAnalysis?.extractedData?.items) return
    
    const updatedItems = [...editableAnalysis.extractedData.items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    
    setEditableAnalysis({
      ...editableAnalysis,
      extractedData: {
        ...editableAnalysis.extractedData,
        items: updatedItems
      }
    })
  }

  const removeEditableItem = (index: number) => {
    if (!editableAnalysis?.extractedData?.items) return
    
    const updatedItems = editableAnalysis.extractedData.items.filter((_, i) => i !== index)
    
    setEditableAnalysis({
      ...editableAnalysis,
      extractedData: {
        ...editableAnalysis.extractedData,
        items: updatedItems
      }
    })
  }

  const saveShipmentData = async () => {
    if (!selectedEmail || !editableAnalysis || !editableAnalysis.isShipmentRelated) return

    console.log("Starting shipment save process...")
    console.log("Selected email:", selectedEmail)
    console.log("Editable analysis:", editableAnalysis)

    setIsSavingShipment(true)
    
    const loadingToast = toast.loading("Saving shipment data...", {
      description: "Committing changes to database",
    })

    try {
      const requestData = {
        emailData: selectedEmail,
        analysisResult: editableAnalysis, // Use the editable version
      }
      
      console.log("Sending request to save-shipment API:", requestData)

      const response = await fetch("/api/save-shipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      })

      console.log("Response status:", response.status)
      console.log("Response OK:", response.ok)

      const data = await response.json()
      console.log("Response data:", data)

      if (!response.ok) {
        console.error("Response not OK:", data)
        throw new Error(data.error || "Failed to save shipment")
      }

      if (data.success) {
        console.log("Shipment saved successfully!")
        setShipmentSaved(true) // Set saved state to true
        toast.dismiss(loadingToast)
        toast.success("Shipment data saved successfully! ✅", {
          description: `${data.message} - Tracking: ${data.shipment.trackingNumber || 'N/A'}`,
        })
      } else {
        console.error("Save failed:", data)
        throw new Error(data.error || "Save failed")
      }
    } catch (error: any) {
      console.error("Error saving shipment:", error)
      toast.dismiss(loadingToast)
      toast.error("Failed to save shipment data", {
        description: error.message || "Please try again",
      })
    } finally {
      setIsSavingShipment(false)
    }
  }

  const handleStarToggle = async (emailId: string, event: React.MouseEvent) => {
    event.stopPropagation()

    const email = emails.find((e) => e.id === emailId)
    if (!email) return

    // Update locally
    setEmails((prev) => prev.map((email) => (email.id === emailId ? { ...email, isStarred: !email.isStarred } : email)))

    // Update on Gmail
    try {
      await fetch("/api/gmail", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggleStar",
          messageId: emailId,
          isStarred: email.isStarred,
        }),
      })
    } catch (error) {
      console.error("Failed to toggle star:", error)
      // Revert local change on error
      setEmails((prev) =>
        prev.map((email) => (email.id === emailId ? { ...email, isStarred: !email.isStarred } : email)),
      )
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate refresh
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsRefreshing(false)
    toast.success("Inbox refreshed")
  }

  const fetchGmailEmails = async () => {
    setIsLoadingGmail(true)

    const loadingToast = toast.loading("Fetching shipment emails from Gmail...", {
      description: "Searching for shipment-related emails from the last 3 days",
    })

    try {
      const response = await fetch("/api/gmail")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to fetch emails")
      }

      if (data.success) {
        setEmails(data.emails)
        setLastSyncTime(data.timestamp)

        toast.dismiss(loadingToast)
        toast.success(`Successfully loaded ${data.count} shipment emails! �`, {
          description: `Found shipment-related emails from the last 3 days`,
        })
      } else {
        throw new Error(data.error || "Failed to fetch emails")
      }
    } catch (error: any) {
      console.error("Error fetching Gmail emails:", error)

      toast.dismiss(loadingToast)
      toast.error("Failed to fetch shipment emails", {
        description: error.message || "Please check your Gmail API configuration",
      })
    } finally {
      setIsLoadingGmail(false)
    }
  }

  const handleArchive = () => {
    setEmails((prev) => prev.filter((email) => !selectedEmails.includes(email.id)))
    setSelectedEmails([])
    toast.success(`Archived ${selectedEmails.length} email${selectedEmails.length !== 1 ? "s" : ""}`)
  }

  const handleDelete = () => {
    setEmails((prev) => prev.filter((email) => !selectedEmails.includes(email.id)))
    setSelectedEmails([])
    toast.success(`Deleted ${selectedEmails.length} email${selectedEmails.length !== 1 ? "s" : ""}`)
  }

  const handleMarkAsRead = async () => {
    setEmails((prev) => prev.map((email) => (selectedEmails.includes(email.id) ? { ...email, isRead: true } : email)))

    // Update on Gmail for each selected email
    for (const emailId of selectedEmails) {
      try {
        await fetch("/api/gmail", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "markRead",
            messageId: emailId,
          }),
        })
      } catch (error) {
        console.error("Failed to mark email as read:", error)
      }
    }

    setSelectedEmails([])
    toast.success(`Marked ${selectedEmails.length} email${selectedEmails.length !== 1 ? "s" : ""} as read`)
  }

  const handleMarkAsUnread = async () => {
    setEmails((prev) => prev.map((email) => (selectedEmails.includes(email.id) ? { ...email, isRead: false } : email)))

    // Update on Gmail for each selected email
    for (const emailId of selectedEmails) {
      try {
        await fetch("/api/gmail", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "markUnread",
            messageId: emailId,
          }),
        })
      } catch (error) {
        console.error("Failed to mark email as unread:", error)
      }
    }

    setSelectedEmails([])
    toast.success(`Marked ${selectedEmails.length} email${selectedEmails.length !== 1 ? "s" : ""} as unread`)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-500"
      case "low":
        return "text-green-500"
      default:
        return "text-gray-500"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Navbar />
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gmail Inbox</h1>
              <p className="text-gray-600">
                {unreadCount} unread message{unreadCount !== 1 ? "s" : ""} • {emails.length} total
                {lastSyncTime && (
                  <span className="ml-2 text-sm">• Last sync: {new Date(lastSyncTime).toLocaleTimeString()}</span>
                )}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestEmail}
                className="bg-purple-600 text-white hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Test Email
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchGmailEmails}
                disabled={isLoadingGmail}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {isLoadingGmail ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CloudDownload className="h-4 w-4 mr-2" />
                )}
                {isLoadingGmail ? "Loading..." : "Get Shipment Emails"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.map((category) => {
                  const Icon = category.icon
                  return (
                    <button
                      key={category.key}
                      onClick={() => setSelectedCategory(category.key)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                        selectedCategory === category.key
                          ? "bg-blue-100 text-blue-700"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{category.label}</span>
                      </div>
                      {category.count > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {category.count}
                        </Badge>
                      )}
                    </button>
                  )
                })}
              </CardContent>
            </Card>

            {/* Gmail API Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Gmail Integration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-gray-600">
                  Click "Get Shipment Emails" to fetch shipment-related emails from the last 3 days using advanced Gmail search filters.
                </div>
                {lastSyncTime && (
                  <div className="text-xs text-gray-500">Last synced: {new Date(lastSyncTime).toLocaleString()}</div>
                )}
              </CardContent>
            </Card>


            {/* AI Analysis Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center">
                  <Brain className="h-4 w-4 mr-2 text-purple-600" />
                  AI Email Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-gray-600">
                  Use AI to automatically extract shipment information from emails and save to your database.
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-xs text-gray-500">
                    <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                    Detects shipment updates
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                    Extracts tracking info
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                    Auto-formats data
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Email List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Mail className="h-5 w-5" />
                    <span>{categories.find((c) => c.key === selectedCategory)?.label}</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                      className={showUnreadOnly ? "bg-blue-100 text-blue-700" : ""}
                    >
                      {showUnreadOnly ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search emails..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Toolbar */}
                {selectedEmails.length > 0 && (
                  <div className="flex items-center justify-between p-4 bg-blue-50 border-b">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-blue-700">{selectedEmails.length} selected</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={handleMarkAsRead}>
                        <MailOpen className="h-4 w-4 mr-1" />
                        Mark as read
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleMarkAsUnread}>
                        <Mail className="h-4 w-4 mr-1" />
                        Mark as unread
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleArchive}>
                        <Archive className="h-4 w-4 mr-1" />
                        Archive
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleDelete}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                )}

                {/* Select All */}
                <div className="flex items-center p-4 border-b bg-gray-50">
                  <Checkbox
                    checked={selectedEmails.length === filteredEmails.length && filteredEmails.length > 0}
                    onCheckedChange={handleSelectAll}
                    className="mr-3"
                  />
                  <span className="text-sm text-gray-600">
                    {filteredEmails.length} email{filteredEmails.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Email List */}
                <div className="divide-y">
                  {filteredEmails.length === 0 ? (
                    <div className="text-center py-12">
                      <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {emails.length === 0 ? "No shipment emails loaded" : "No emails found"}
                      </h3>
                      <p className="text-gray-500 mb-4">
                        {emails.length === 0
                          ? "Click 'Get Shipment Emails' to fetch shipment-related emails from the last 3 days"
                          : "Try adjusting your search or filter criteria"}
                      </p>
                      {emails.length === 0 && (
                        <Button onClick={fetchGmailEmails} disabled={isLoadingGmail}>
                          {isLoadingGmail ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <CloudDownload className="h-4 w-4 mr-2" />
                          )}
                          Get Shipment Emails
                        </Button>
                      )}
                    </div>
                  ) : (
                    filteredEmails.map((email) => (
                      <div
                        key={email.id}
                        className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                          !email.isRead ? "bg-blue-50" : ""
                        } ${selectedEmails.includes(email.id) ? "bg-blue-100" : ""}`}
                        onClick={() => handleEmailClick(email)}
                      >
                        <Checkbox
                          checked={selectedEmails.includes(email.id)}
                          onCheckedChange={() => handleEmailSelect(email.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="mr-3"
                        />
                        <button
                          onClick={(e) => handleStarToggle(email.id, e)}
                          className="mr-3 text-gray-400 hover:text-yellow-500 transition-colors"
                        >
                          {email.isStarred ? (
                            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                          ) : (
                            <StarOff className="h-4 w-4" />
                          )}
                        </button>
                        <Avatar className="mr-3">
                          <AvatarImage src={email.from.avatar || "/placeholder.svg"} />
                          <AvatarFallback>{email.from.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-2">
                              <span className={`text-sm ${!email.isRead ? "font-semibold" : "font-medium"}`}>
                                {email.from.name}
                              </span>
                              {email.priority === "high" && <AlertCircle className="h-3 w-3 text-red-500" />}
                              {email.hasAttachments && <Paperclip className="h-3 w-3 text-gray-400" />}
                            </div>
                            <span className="text-xs text-gray-500">{email.timestamp}</span>
                          </div>
                          <div className="mb-1">
                            <span className={`text-sm ${!email.isRead ? "font-semibold" : ""} text-gray-900`}>
                              {email.subject}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600 truncate">{email.preview}</p>
                            <div className="flex items-center space-x-1 ml-2">
                              {email.labels.includes("High Priority") && (
                                <div className="w-2 h-2 rounded-full bg-red-500" title="High Priority"></div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

        </div>

        {/* Email Detail Dialog */}
        <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedEmail && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold pr-8">{selectedEmail.subject}</DialogTitle>
                  <div className="flex items-center space-x-3 mt-4">
                    <Avatar className="size-10">
                      <AvatarImage src={selectedEmail.from.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{selectedEmail.from.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">{selectedEmail.from.name}</div>
                      <div className="text-sm text-gray-500">{selectedEmail.from.email}</div>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>{selectedEmail.timestamp}</span>
                      {selectedEmail.priority === "high" && <AlertCircle className="h-4 w-4 text-red-500" />}
                      {selectedEmail.hasAttachments && <Paperclip className="h-4 w-4" />}
                      <button onClick={(e) => handleStarToggle(selectedEmail.id, e)}>
                        {selectedEmail.isStarred ? (
                          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        ) : (
                          <StarOff className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </DialogHeader>
                
                <Separator className="my-4" />
                
                <div className="space-y-6">
                  {/* AI Analysis Section */}
                  <div className="border rounded-lg p-4 bg-gradient-to-r from-purple-50 to-blue-50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium flex items-center">
                        <Brain className="h-4 w-4 mr-2 text-purple-600" />
                        AI Shipment Analysis
                      </h4>
                      <div className="flex space-x-2">
                        {emailAnalysis && emailAnalysis.isShipmentRelated && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={toggleEditMode}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            {isEditingAnalysis ? "View Mode" : "Edit Mode"}
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={analyzeEmailWithAI}
                          disabled={isAnalyzing}
                        >
                          {isAnalyzing ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Brain className="h-4 w-4 mr-2" />
                          )}
                          {isAnalyzing ? "Analyzing..." : "Analyze Email"}
                        </Button>
                      </div>
                    </div>
                    
                    {emailAnalysis && (
                      <div className="space-y-4">
                        {emailAnalysis.isShipmentRelated ? (
                          <div className="bg-white rounded-lg p-4 border">
                            <div className="flex items-center mb-3">
                              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                              <span className="font-medium text-green-700">Shipment Information Detected</span>
                            </div>
                            
                            {!isEditingAnalysis ? (
                              // View Mode
                              <>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                  {emailAnalysis.type && (
                                    <div>
                                      <label className="text-xs font-medium text-gray-500 uppercase">Type</label>
                                      <div className="text-sm font-medium capitalize">
                                        {emailAnalysis.type.replace('_', ' ')}
                                      </div>
                                    </div>
                                  )}
                                  {emailAnalysis.extractedData?.status && (
                                    <div>
                                      <label className="text-xs font-medium text-gray-500 uppercase">Status</label>
                                      <div className="text-sm font-medium">{emailAnalysis.extractedData.status}</div>
                                    </div>
                                  )}
                                  {emailAnalysis.extractedData?.price && (
                                    <div>
                                      <label className="text-xs font-medium text-gray-500 uppercase">Price</label>
                                      <div className="text-sm font-medium text-green-600">${emailAnalysis.extractedData.price}</div>
                                    </div>
                                  )}
                                  {emailAnalysis.extractedData?.trackingNumber && (
                                    <div>
                                      <label className="text-xs font-medium text-gray-500 uppercase">Tracking Number</label>
                                      <div className="text-sm font-medium font-mono">{emailAnalysis.extractedData.trackingNumber}</div>
                                    </div>
                                  )}
                                  {emailAnalysis.extractedData?.carrier && (
                                    <div>
                                      <label className="text-xs font-medium text-gray-500 uppercase">Carrier</label>
                                      <div className="text-sm font-medium">{emailAnalysis.extractedData.carrier}</div>
                                    </div>
                                  )}
                                  {emailAnalysis.extractedData?.origin && (
                                    <div>
                                      <label className="text-xs font-medium text-gray-500 uppercase">Origin</label>
                                      <div className="text-sm">{emailAnalysis.extractedData.origin}</div>
                                    </div>
                                  )}
                                  {emailAnalysis.extractedData?.destination && (
                                    <div>
                                      <label className="text-xs font-medium text-gray-500 uppercase">Destination</label>
                                      <div className="text-sm">{emailAnalysis.extractedData.destination}</div>
                                    </div>
                                  )}
                                  {emailAnalysis.extractedData?.estimatedDelivery && (
                                    <div>
                                      <label className="text-xs font-medium text-gray-500 uppercase">Estimated Delivery</label>
                                      <div className="text-sm">{emailAnalysis.extractedData.estimatedDelivery}</div>
                                    </div>
                                  )}
                                  {emailAnalysis.extractedData?.urgency && (
                                    <div>
                                      <label className="text-xs font-medium text-gray-500 uppercase">Urgency</label>
                                      <Badge 
                                        variant={emailAnalysis.extractedData.urgency === 'high' ? 'destructive' : 
                                                emailAnalysis.extractedData.urgency === 'medium' ? 'default' : 'secondary'}
                                        className="text-xs"
                                      >
                                        {emailAnalysis.extractedData.urgency}
                                      </Badge>
                                    </div>
                                  )}
                                </div>

                                {emailAnalysis.extractedData?.items && emailAnalysis.extractedData.items.length > 0 && (
                                  <div className="mb-4">
                                    <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">Items</label>
                                    <div className="space-y-1">
                                      {emailAnalysis.extractedData.items.map((item, index) => (
                                        <div key={index} className="text-sm bg-gray-50 rounded p-2">
                                          <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                              <span className="font-medium">{item.name}</span>
                                              {item.quantity && <span className="text-gray-600"> (Qty: {item.quantity})</span>}
                                              {item.description && <div className="text-xs text-gray-500">{item.description}</div>}
                                            </div>
                                            {item.price && (
                                              <div className="text-sm font-medium text-green-600">${item.price}</div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </>
                            ) : (
                              // Edit Mode
                              editableAnalysis && (
                                <>
                                  <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                      <Label className="text-xs font-medium text-gray-500 uppercase">Type</Label>
                                      <Select 
                                        value={editableAnalysis.type || ""} 
                                        onValueChange={(value) => updateEditableField('type', value)}
                                      >
                                        <SelectTrigger className="h-8">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="incoming">Incoming</SelectItem>
                                          <SelectItem value="outgoing">Outgoing</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label className="text-xs font-medium text-gray-500 uppercase">Status</Label>
                                      <Input 
                                        className="h-8"
                                        value={editableAnalysis.extractedData?.status || ""} 
                                        onChange={(e) => updateEditableField('extractedData.status', e.target.value)}
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs font-medium text-gray-500 uppercase">Price</Label>
                                      <Input 
                                        className="h-8"
                                        type="number" 
                                        value={editableAnalysis.extractedData?.price || ""} 
                                        onChange={(e) => updateEditableField('extractedData.price', parseFloat(e.target.value) || 0)}
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs font-medium text-gray-500 uppercase">Tracking Number</Label>
                                      <Input 
                                        className="h-8"
                                        value={editableAnalysis.extractedData?.trackingNumber || ""} 
                                        onChange={(e) => updateEditableField('extractedData.trackingNumber', e.target.value)}
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs font-medium text-gray-500 uppercase">Carrier</Label>
                                      <Input 
                                        className="h-8"
                                        value={editableAnalysis.extractedData?.carrier || ""} 
                                        onChange={(e) => updateEditableField('extractedData.carrier', e.target.value)}
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs font-medium text-gray-500 uppercase">Origin</Label>
                                      <Input 
                                        className="h-8"
                                        value={editableAnalysis.extractedData?.origin || ""} 
                                        onChange={(e) => updateEditableField('extractedData.origin', e.target.value)}
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs font-medium text-gray-500 uppercase">Destination</Label>
                                      <Input 
                                        className="h-8"
                                        value={editableAnalysis.extractedData?.destination || ""} 
                                        onChange={(e) => updateEditableField('extractedData.destination', e.target.value)}
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs font-medium text-gray-500 uppercase">Estimated Delivery</Label>
                                      <Input 
                                        className="h-8"
                                        value={editableAnalysis.extractedData?.estimatedDelivery || ""} 
                                        onChange={(e) => updateEditableField('extractedData.estimatedDelivery', e.target.value)}
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs font-medium text-gray-500 uppercase">Urgency</Label>
                                      <Select 
                                        value={editableAnalysis.extractedData?.urgency || ""} 
                                        onValueChange={(value) => updateEditableField('extractedData.urgency', value)}
                                      >
                                        <SelectTrigger className="h-8">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="low">Low</SelectItem>
                                          <SelectItem value="medium">Medium</SelectItem>
                                          <SelectItem value="high">High</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>

                                  {/* Editable Items */}
                                  <div className="mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                      <Label className="text-xs font-medium text-gray-500 uppercase">Items</Label>
                                      <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={addEditableItem}
                                      >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Add Item
                                      </Button>
                                    </div>
                                    <div className="space-y-2">
                                      {(editableAnalysis.extractedData?.items || []).map((item, index) => (
                                        <div key={index} className="bg-gray-50 rounded p-3 border">
                                          <div className="grid grid-cols-12 gap-2 items-end">
                                            <div className="col-span-4">
                                              <Label className="text-xs">Name</Label>
                                              <Input 
                                                className="h-8"
                                                value={item.name || ""} 
                                                onChange={(e) => updateEditableItem(index, 'name', e.target.value)}
                                                placeholder="Item name"
                                              />
                                            </div>
                                            <div className="col-span-2">
                                              <Label className="text-xs">Quantity</Label>
                                              <Input 
                                                className="h-8"
                                                type="number" 
                                                value={item.quantity || ""} 
                                                onChange={(e) => updateEditableItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                                placeholder="0"
                                              />
                                            </div>
                                            <div className="col-span-4">
                                              <Label className="text-xs">Description</Label>
                                              <Input 
                                                className="h-8"
                                                value={item.description || ""} 
                                                onChange={(e) => updateEditableItem(index, 'description', e.target.value)}
                                                placeholder="Description"
                                              />
                                            </div>
                                            <div className="col-span-2">
                                              <Label className="text-xs">Price</Label>
                                              <div className="flex items-center space-x-1">
                                                <Input 
                                                  className="h-8"
                                                  type="number" 
                                                  value={item.price || ""} 
                                                  onChange={(e) => updateEditableItem(index, 'price', parseFloat(e.target.value) || 0)}
                                                  placeholder="0"
                                                />
                                                <Button 
                                                  type="button" 
                                                  variant="outline" 
                                                  size="sm" 
                                                  onClick={() => removeEditableItem(index)}
                                                  className="h-8 w-8 p-0"
                                                >
                                                  <Trash2 className="h-3 w-3" />
                                                </Button>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </>
                              )
                            )}

                            <div className="mb-4">
                              <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">Summary</label>
                              {!isEditingAnalysis ? (
                                <div className="text-sm bg-gray-50 rounded p-3">{emailAnalysis.summary}</div>
                              ) : (
                                <Textarea 
                                  value={editableAnalysis?.summary || ""} 
                                  onChange={(e) => updateEditableField('summary', e.target.value)}
                                  className="text-sm"
                                  rows={3}
                                />
                              )}
                            </div>

                            {emailAnalysis.suggestedAction && (
                              <div className="mb-4">
                                <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">Suggested Action</label>
                                {!isEditingAnalysis ? (
                                  <div className="text-sm bg-blue-50 rounded p-3 border-l-4 border-blue-400">
                                    {emailAnalysis.suggestedAction}
                                  </div>
                                ) : (
                                  <Textarea 
                                    value={editableAnalysis?.suggestedAction || ""} 
                                    onChange={(e) => updateEditableField('suggestedAction', e.target.value)}
                                    className="text-sm"
                                    rows={2}
                                  />
                                )}
                              </div>
                            )}

                            {emailAnalysis.extractedData?.actionRequired && (
                              <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded p-3">
                                <div className="flex items-center">
                                  <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                                  <span className="text-sm font-medium text-yellow-800">Action Required</span>
                                  {isEditingAnalysis && (
                                    <input 
                                      type="checkbox" 
                                      checked={editableAnalysis?.extractedData?.actionRequired || false}
                                      onChange={(e) => updateEditableField('extractedData.actionRequired', e.target.checked)}
                                      className="ml-2"
                                    />
                                  )}
                                </div>
                              </div>
                            )}

                            {emailAnalysis.extractedData?.notes && (
                              <div className="mb-4">
                                <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">Notes</label>
                                {!isEditingAnalysis ? (
                                  <div className="text-sm bg-gray-50 rounded p-3">{emailAnalysis.extractedData.notes}</div>
                                ) : (
                                  <Textarea 
                                    value={editableAnalysis?.extractedData?.notes || ""} 
                                    onChange={(e) => updateEditableField('extractedData.notes', e.target.value)}
                                    className="text-sm"
                                    rows={3}
                                  />
                                )}
                              </div>
                            )}

                            {shipmentSaved ? (
                              <div className="bg-green-50 border border-green-200 rounded p-4">
                                <div className="flex items-center mb-2">
                                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                                  <span className="font-medium text-green-800">Successfully Saved to Database</span>
                                </div>
                                <div className="text-sm text-green-700">
                                  Shipment data has been committed to your database and is now available in your shipments dashboard.
                                </div>
                              </div>
                            ) : (
                              <Button 
                                onClick={saveShipmentData}
                                disabled={isSavingShipment}
                                className="w-full"
                              >
                                {isSavingShipment ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Save className="h-4 w-4 mr-2" />
                                )}
                                {isSavingShipment ? "Saving..." : "Commit Changes to Database"}
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="bg-white rounded-lg p-4 border">
                            <div className="flex items-center mb-2">
                              <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
                              <span className="font-medium text-orange-700">No Shipment Information Found</span>
                            </div>
                            <div className="text-sm text-gray-600 mb-3">{emailAnalysis.summary}</div>
                            <div className="text-xs text-gray-500">
                              This email doesn't appear to contain shipment or logistics information.
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Labels */}
                  {selectedEmail.labels.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedEmail.labels.map((label) => (
                        <Badge key={label} variant="secondary" className="text-xs">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Email Body */}
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                      {selectedEmail.body}
                    </div>
                  </div>

                  {/* Attachments */}
                  {selectedEmail.hasAttachments && (
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <h4 className="text-sm font-medium mb-3 flex items-center">
                        <Paperclip className="h-4 w-4 mr-2" />
                        Attachments
                      </h4>
                      <div className="flex items-center justify-between p-3 bg-white rounded border">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                            <span className="text-xs font-medium text-red-700">PDF</span>
                          </div>
                          <div>
                            <div className="text-sm font-medium">attachment.pdf</div>
                            <div className="text-xs text-gray-500">Size unknown</div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-2 pt-4 border-t">
                    <Button size="sm" className="flex-1">
                      <Reply className="h-4 w-4 mr-2" />
                      Reply
                    </Button>
                    <Button variant="outline" size="sm">
                      <ReplyAll className="h-4 w-4 mr-2" />
                      Reply All
                    </Button>
                    <Button variant="outline" size="sm">
                      <Forward className="h-4 w-4 mr-2" />
                      Forward
                    </Button>
                    <Button variant="outline" size="sm">
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
