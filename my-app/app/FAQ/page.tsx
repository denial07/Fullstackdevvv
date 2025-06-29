import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  ArrowLeft,
  Search,
  ChevronDown,
  HelpCircle,
  Ship,
  Package,
  ShoppingCart,
  Settings,
  Shield,
  Mail,
} from "lucide-react"
import Link from "next/link"

const faqCategories = [
  {
    id: "general",
    title: "General",
    icon: HelpCircle,
    color: "bg-blue-100 text-blue-800",
    questions: [
      {
        question: "What is Singapore Pallet Works Dashboard?",
        answer:
          "Singapore Pallet Works Dashboard is a comprehensive management system designed for tracking shipments, managing inventory, processing orders, and monitoring business operations for wood pallet manufacturing and logistics companies.",
      },
      {
        question: "How do I get started with the dashboard?",
        answer:
          "After logging in with your credentials, you'll see the main dashboard with key metrics. Navigate through different sections using the menu: Shipments for tracking deliveries, Inventory for stock management, and Orders for customer order processing.",
      },
      {
        question: "Can I export data from the dashboard?",
        answer:
          'Yes, most sections include export functionality. Look for the "Export" button in the top-right corner of data tables. You can export data in various formats including CSV and PDF for reporting purposes.',
      },
      {
        question: "Is the dashboard mobile-friendly?",
        answer:
          "Yes, the dashboard is fully responsive and works on mobile devices, tablets, and desktop computers. The interface adapts to different screen sizes for optimal viewing and interaction.",
      },
    ],
  },
  {
    id: "shipments",
    title: "Shipments",
    icon: Ship,
    color: "bg-green-100 text-green-800",
    questions: [
      {
        question: "How do I track incoming shipments?",
        answer:
          "Go to Shipments > Incoming Shipments to view all raw material shipments from overseas vendors. You can see vessel information, expected arrival dates, customs clearance status, and any delays. Use the search function to find specific shipments by ID or vendor.",
      },
      {
        question: "What does the AI email processing feature do?",
        answer:
          "Our AI system automatically processes vendor emails to extract shipment information, tracking numbers, and delivery updates. This reduces manual data entry and ensures accurate, up-to-date shipment information in the system.",
      },
      {
        question: "How do I manage outgoing deliveries?",
        answer:
          "Navigate to Shipments > Outgoing Shipments to manage customer deliveries. You can assign drivers, track vehicles, schedule deliveries, and monitor delivery status. The system also provides fleet management capabilities.",
      },
      {
        question: "What should I do if a shipment is delayed?",
        answer:
          "Delayed shipments are automatically flagged in the system with red badges. You can view delay details, contact vendors, and update customers. The system also tracks delay patterns to help improve future planning.",
      },
    ],
  },
  {
    id: "inventory",
    title: "Inventory",
    icon: Package,
    color: "bg-purple-100 text-purple-800",
    questions: [
      {
        question: "How does inventory tracking work?",
        answer:
          "The inventory system tracks all wood materials by type, quantity, location, and expiry date. Items are categorized by wood type (hardwood, softwood, engineered) and stored across different warehouse locations with capacity monitoring.",
      },
      {
        question: "What are the different inventory statuses?",
        answer:
          'Inventory items have several statuses: "Good" (normal stock levels), "Low Stock" (below minimum threshold), "Expiring Soon" (within 30 days of expiry), and "Expired" (past expiry date). Each status has visual indicators and alerts.',
      },
      {
        question: "How do I set up low stock alerts?",
        answer:
          "Low stock alerts are automatically generated when inventory falls below the minimum stock level set for each item. You can adjust these thresholds in the inventory management section and configure notification preferences in your account settings.",
      },
      {
        question: "Can I track inventory across multiple warehouses?",
        answer:
          "Yes, the system supports multi-warehouse inventory tracking. Each item shows its specific warehouse location (e.g., Warehouse A-1, B-2), and you can view capacity utilization for each warehouse facility.",
      },
    ],
  },
  {
    id: "orders",
    title: "Orders",
    icon: ShoppingCart,
    color: "bg-orange-100 text-orange-800",
    questions: [
      {
        question: "How do I track order payments?",
        answer:
          'The Orders section shows payment status for each order: "Paid" (payment received), "Pending" (awaiting payment), or "Overdue" (past due date). Overdue orders are highlighted with alerts and can trigger automatic payment reminders.',
      },
      {
        question: "What are the different shipping statuses?",
        answer:
          'Orders progress through several shipping stages: "Pending" (not yet processed), "Processing" (being prepared), "Preparing" (items being gathered), "Scheduled" (delivery planned), "In Transit" (out for delivery), and "Delivered" (completed).',
      },
      {
        question: "How do I handle priority orders?",
        answer:
          'Orders can be marked as "High Priority" or "Standard". High priority orders are highlighted throughout the system and should be processed first. You can filter orders by priority level to focus on urgent deliveries.',
      },
      {
        question: "Can I send payment reminders automatically?",
        answer:
          "Yes, the system can send automated payment reminders for overdue orders. Configure this in your notification settings, and the system will send reminders via email to customers with outstanding payments.",
      },
    ],
  },
  {
    id: "account",
    title: "Account & Settings",
    icon: Settings,
    color: "bg-gray-100 text-gray-800",
    questions: [
      {
        question: "How do I change my password?",
        answer:
          "Go to Settings > Security tab to change your password. Enter your current password, then your new password twice for confirmation. Passwords must be at least 8 characters long for security.",
      },
      {
        question: "How do I update my notification preferences?",
        answer:
          "Visit Settings > Notifications to customize which alerts you receive. You can enable/disable email notifications, shipment alerts, inventory warnings, payment reminders, and weekly reports according to your preferences.",
      },
      {
        question: "What is two-factor authentication?",
        answer:
          "Two-factor authentication (2FA) adds an extra security layer to your account. When enabled, you'll need both your password and a verification code from your phone to log in. Enable this in Settings > Security for enhanced account protection.",
      },
      {
        question: "How do I update my profile information?",
        answer:
          "Go to Settings > Profile to update your name, email, phone number, department, and bio. Changes are saved immediately and will be reflected throughout the system.",
      },
    ],
  },
  {
    id: "security",
    title: "Security & Privacy",
    icon: Shield,
    color: "bg-red-100 text-red-800",
    questions: [
      {
        question: "Is my data secure?",
        answer:
          "Yes, we implement industry-standard security measures including data encryption, secure connections (HTTPS), regular security audits, and access controls. Your business data is protected and stored securely.",
      },
      {
        question: "Who can access my company data?",
        answer:
          "Access is controlled by user roles and permissions. Only authorized users within your organization can access your data. Administrators can manage user access levels and monitor system usage.",
      },
      {
        question: "How long is data retained?",
        answer:
          "Data retention policies vary by data type. Operational data (shipments, orders, inventory) is retained for 7 years for business and compliance purposes. User activity logs are kept for 1 year. You can request data deletion by contacting support.",
      },
      {
        question: "What happens if I forget my password?",
        answer:
          "Use the \"Forgot Password\" link on the login page to reset your password. You'll receive an email with instructions to create a new password. If you don't receive the email, contact your system administrator.",
      },
    ],
  },
]

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h1>
                <p className="text-gray-600">Find answers to common questions about the dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" asChild>
                <Link href="mailto:support@palletworks.sg">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Support
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search for answers..." className="pl-10" />
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">24</div>
                <div className="text-sm text-gray-600">Total Questions</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">6</div>
                <div className="text-sm text-gray-600">Categories</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">24/7</div>
                <div className="text-sm text-gray-600">Support Available</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-6">
          {faqCategories.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <category.icon className="h-5 w-5 mr-2" />
                  {category.title}
                  <Badge className={`ml-2 ${category.color}`}>{category.questions.length} questions</Badge>
                </CardTitle>
                <CardDescription>Common questions about {category.title.toLowerCase()}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {category.questions.map((faq, index) => (
                    <Collapsible key={index}>
                      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border p-4 text-left hover:bg-gray-50">
                        <span className="font-medium">{faq.question}</span>
                        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="px-4 pb-4">
                        <div className="pt-2 text-gray-600 leading-relaxed">{faq.answer}</div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Support */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Still need help?</CardTitle>
            <CardDescription>
              Can't find the answer you're looking for? Our support team is here to help.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="font-medium">Email Support</h4>
                <p className="text-sm text-gray-600">Get help via email within 24 hours</p>
                <Button variant="outline" asChild>
                  <Link href="mailto:support@palletworks.sg">
                    <Mail className="h-4 w-4 mr-2" />
                    support@palletworks.sg
                  </Link>
                </Button>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Phone Support</h4>
                <p className="text-sm text-gray-600">Speak with our team during business hours</p>
                <Button variant="outline" asChild>
                  <Link href="tel:+6561234567">+65 6123 4567</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
