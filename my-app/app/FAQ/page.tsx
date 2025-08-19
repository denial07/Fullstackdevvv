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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

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
  Plus,
} from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"

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
  const [isLoading, setIsLoading] = useState(true)

  // Search
  const [searchTerm, setSearchTerm] = useState("")

  // Add FAQ dialog state
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newQuestion, setNewQuestion] = useState("")
  const [newAnswer, setNewAnswer] = useState("")
  const [newCategory, setNewCategory] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const fetchFaqs = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/faq", { cache: "no-store" })
      const faqs: Faq[] = await res.json()
      setFaqCategories(groupFaqs(faqs))
    } catch (e) {
      // In production, handle error (toast/log). For now, keep empty state.
      setFaqCategories([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFaqs()
  }, [fetchFaqs])

  function formatTitle(slug: string) {
    return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  }

  function groupFaqs(faqs: Faq[]): GroupedCategory[] {
    const grouped: Record<string, GroupedCategory> = {}
    for (const faq of faqs) {
      const id = faq.category.trim()
      if (!grouped[id]) {
        grouped[id] = {
          id,
          title: formatTitle(id || "general"),
          questions: [],
        }
      }
      grouped[id].questions.push(faq)
    }
    // Sort categories by title asc, then questions by question asc
    return Object.values(grouped)
      .sort((a, b) => a.title.localeCompare(b.title))
      .map((cat) => ({
        ...cat,
        questions: [...cat.questions].sort((a, b) =>
          a.question.localeCompare(b.question)
        ),
      }))
  }

  // Derived: list of unique categories (for quick-fill)
  const categoryIds = useMemo(
    () => faqCategories.map((c) => c.id),
    [faqCategories]
  )

  // Filter by search term (matches question or answer)
  const visibleCategories: GroupedCategory[] = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return faqCategories
    const filtered: GroupedCategory[] = []
    for (const cat of faqCategories) {
      const qs = cat.questions.filter(
        (q) =>
          q.question.toLowerCase().includes(term) ||
          q.answer.toLowerCase().includes(term)
      )
      if (qs.length > 0) {
        filtered.push({ ...cat, questions: qs })
      }
    }
    return filtered
  }, [faqCategories, searchTerm])

  const totalQuestions = useMemo(
    () => faqCategories.reduce((acc, cat) => acc + cat.questions.length, 0),
    [faqCategories]
  )

  async function handleAddFaq(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    const question = newQuestion.trim()
    const answer = newAnswer.trim()
    const category = (newCategory || "general").trim().toLowerCase().replace(/\s+/g, "-")

    if (!question || !answer) {
      setSubmitError("Please provide both a question and an answer.")
      return
    }

    const newFaq: Faq = { question, answer, category }

    // Optimistic UI update
    setIsSubmitting(true)
    setFaqCategories((prev) => {
      const existingIdx = prev.findIndex((c) => c.id === category)
      if (existingIdx === -1) {
        return [
          ...prev,
          {
            id: category,
            title: formatTitle(category),
            questions: [newFaq],
          },
        ].sort((a, b) => a.title.localeCompare(b.title))
      } else {
        const copy = [...prev]
        copy[existingIdx] = {
          ...copy[existingIdx],
          questions: [...copy[existingIdx].questions, newFaq].sort((a, b) =>
            a.question.localeCompare(b.question)
          ),
        }
        return copy
      }
    })

    try {
      const res = await fetch("/api/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFaq),
      })
      if (!res.ok) {
        throw new Error(`Failed to save (HTTP ${res.status})`)
      }
      // Optionally re-fetch to ensure consistency with server
      // await fetchFaqs()

      // Reset form & close
      setNewQuestion("")
      setNewAnswer("")
      setNewCategory("")
      setIsAddOpen(false)
    } catch (err: any) {
      // Rollback by refetching canonical data
      await fetchFaqs()
      setSubmitError(err?.message ?? "Something went wrong while saving.")
    } finally {
      setIsSubmitting(false)
    }
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

              {/* Add FAQ trigger */}
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add a new FAQ</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddFaq} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="faq-question">Question</Label>
                      <Input
                        id="faq-question"
                        placeholder="e.g., How do I track my shipment?"
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="faq-answer">Answer</Label>
                      <Textarea
                        id="faq-answer"
                        placeholder="Provide a clear, concise answer..."
                        value={newAnswer}
                        onChange={(e) => setNewAnswer(e.target.value)}
                        required
                        rows={6}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="faq-category">Category (new or existing)</Label>
                      <Input
                        id="faq-category"
                        placeholder="e.g., shipments"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        list="faq-category-suggestions"
                      />
                      {/* Quick-pick existing categories */}
                      {categoryIds.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {categoryIds.map((id) => (
                            <button
                              key={id}
                              type="button"
                              onClick={() => setNewCategory(id)}
                              className="text-xs rounded-full px-2 py-1 border hover:bg-gray-50"
                              aria-label={`Use category ${id}`}
                            >
                              {id}
                            </button>
                          ))}
                        </div>
                      )}
                      <datalist id="faq-category-suggestions">
                        {categoryIds.map((id) => (
                          <option key={id} value={id} />
                        ))}
                      </datalist>
                      <p className="text-xs text-gray-500">
                        Leave blank to default to <code>general</code>. Spaces will become dashes.
                      </p>
                    </div>

                    {submitError && (
                      <p className="text-sm text-red-600">{submitError}</p>
                    )}

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddOpen(false)}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : "Save FAQ"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
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
              <Input
                placeholder="Search for answers..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search FAQs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {totalQuestions}
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

        {/* Loading / Empty */}
        {isLoading ? (
          <div className="text-center text-sm text-gray-600 py-12">Loading FAQs…</div>
        ) : visibleCategories.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-gray-600">
              No questions found{searchTerm ? ` for "${searchTerm}"` : ""}.
            </CardContent>
          </Card>
        ) : (
          /* FAQ Categories */
          <div className="space-y-6">
            {visibleCategories.map((category) => {
              const Icon =
                iconMap[category.id as keyof typeof iconMap]
              const badgeColor =
                colorMap[category.id as keyof typeof colorMap] ||
                "bg-gray-100 text-gray-800"

              return (
                <Card key={category.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      {Icon && <Icon className="h-5 w-5 mr-2" />}
                      {category.title}
                      <Badge className={`ml-2 ${badgeColor}`}>
                        {category.questions.length}{" "}
                        {category.questions.length === 1 ? "question" : "questions"}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Common questions about {category.title.toLowerCase()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {category.questions.map((faq, index) => (
                        <Collapsible key={`${faq.question}-${index}`}>
                          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border p-4 text-left hover:bg-gray-50">
                            <span className="font-medium">{faq.question}</span>
                            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="px-4 pb-4">
                            <div className="pt-2 text-gray-600 leading-relaxed whitespace-pre-wrap">
                              {faq.answer}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Contact Support */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Still need help?</CardTitle>
            <CardDescription>
              Can&apos;t find the answer you&apos;re looking for? Our support team is here to help.
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
