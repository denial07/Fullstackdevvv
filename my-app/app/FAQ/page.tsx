"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  ArrowLeft,
  ChevronDown,
  HelpCircle,
  Mail,
  Package,
  Search,
  Settings,
  Shield,
  Ship,
  ShoppingCart,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

const iconMap = {
  general: HelpCircle,
  shipments: Ship,
  inventory: Package,
  orders: ShoppingCart,
  account: Settings,
  security: Shield,
}

const colorMap = {
  general: "bg-blue-100 text-blue-800",
  shipments: "bg-green-100 text-green-800",
  inventory: "bg-purple-100 text-purple-800",
  orders: "bg-orange-100 text-orange-800",
  account: "bg-gray-100 text-gray-800",
  security: "bg-red-100 text-red-800",
}

type Faq = {
  question: string
  answer: string
  category: string
}

type GroupedCategory = {
  id: string
  title: string
  questions: Faq[]
}

export default function FAQPage() {
  const [faqCategories, setFaqCategories] = useState<GroupedCategory[]>([])

  useEffect(() => {
    async function fetchFaqs() {
      const res = await fetch("/api/faq")
      const faqs: Faq[] = await res.json()

      const grouped: Record<string, GroupedCategory> = {}

      for (const faq of faqs) {
        if (!grouped[faq.category]) {
          grouped[faq.category] = {
            id: faq.category,
            title: formatTitle(faq.category),
            questions: [],
          }
        }
        grouped[faq.category].questions.push(faq)
      }

      setFaqCategories(Object.values(grouped))
    }

    fetchFaqs()
  }, [])

  function formatTitle(slug: string) {
    return slug
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
  }

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
                <p className="text-gray-600">
                  Find answers to common questions about the dashboard
                </p>
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

      {/* Main */}
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
                <div className="text-3xl font-bold text-blue-600">
                  {faqCategories.reduce((acc, cat) => acc + cat.questions.length, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Questions</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {faqCategories.length}
                </div>
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
          {faqCategories.map((category) => {
            const Icon = iconMap[category.id as keyof typeof iconMap]
            const badgeColor = colorMap[category.id as keyof typeof colorMap] || "bg-gray-100 text-gray-800"

            return (
              <Card key={category.id}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {Icon && <Icon className="h-5 w-5 mr-2" />}
                    {category.title}
                    <Badge className={`ml-2 ${badgeColor}`}>
                      {category.questions.length} questions
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Common questions about {category.title.toLowerCase()}
                  </CardDescription>
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
            )
          })}
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
                <p className="text-sm text-gray-600">
                  Speak with our team during business hours
                </p>
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
