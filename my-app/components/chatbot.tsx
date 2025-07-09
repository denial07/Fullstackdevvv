"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, Send, Bot, User, Lightbulb, BarChart3, TrendingUp, Package } from "lucide-react"

interface Message {
    id: string
    type: "user" | "bot"
    content: string
    timestamp: Date
}

interface ChatBotProps {
    isOpen: boolean
    onClose: () => void
}

const colors = {
    primary: "#1e40af",
    primaryLight: "#3b82f6",
    secondary: "#059669",
    accent: "#dc2626",
    warning: "#d97706",
    neutral: "#6b7280",
    background: "#f8fafc",
    surface: "#ffffff",
}

const quickActions = [
    { icon: BarChart3, label: "Explain Revenue Chart", query: "Can you explain the revenue vs expenditure chart?" },
    { icon: TrendingUp, label: "Shipment Trends", query: "What do the shipment trends show?" },
    { icon: Package, label: "Inventory Status", query: "Help me understand the inventory health metrics" },
    { icon: Lightbulb, label: "Dashboard Tips", query: "Give me tips on using this dashboard effectively" },
]

const botResponses: { [key: string]: string } = {
    revenue:
        "The Revenue vs Expenditure chart shows your monthly financial performance. The green area represents revenue (income from sales), the red area shows expenditure (costs), and the blue line indicates profit (revenue minus expenditure). Your profit has been steadily increasing from S$40k in January to S$67k in June, showing healthy business growth.",

    shipment:
        "The Shipment Trends chart displays weekly activity: 'Incoming' (green bars) shows raw materials arriving from vendors, 'Outgoing' (blue bars) represents finished products delivered to customers, and 'Delayed' (red bars) indicates shipments behind schedule. Week 4 shows the highest activity with 22 incoming and 18 outgoing shipments.",

    inventory:
        "The Inventory Health section shows three key metrics: 'Normal Stock' (green) indicates items with adequate quantities, 'Low Stock' (yellow) shows items below minimum thresholds that need reordering, and 'Expiring Soon' (red) highlights items approaching their expiry dates. Currently, you have 12 low stock items and 8 items expiring soon that require immediate attention.",

    dashboard:
        "Here are key dashboard tips: 1) Use the color-coded badges to quickly identify urgent items (red = critical, yellow = attention needed, green = good). 2) Click on any chart section for detailed views. 3) The top metrics cards show real-time KPIs. 4) Use the tabs to switch between Overview, Analytics, Operations, and Reports. 5) Set up notifications in Settings to get alerts for critical issues.",

    orders:
        "The Order Status section tracks customer orders through their lifecycle: 'Delivered' (green) shows completed orders, 'Shipped' (blue) indicates orders in transit, 'Processing' (yellow) means orders being prepared, and 'Pending Payment' (red) highlights orders awaiting payment. Focus on the red items to improve cash flow.",

    alerts:
        "Critical alerts appear when: 1) Inventory items are low stock or expiring, 2) Shipments are delayed, 3) Payments are overdue. The red alert badge shows 10 items needing attention. Click on specific sections to see detailed information and take action.",

    navigation:
        "Navigate the dashboard using: 1) Top buttons (Shipments, Inventory, Orders) for main sections, 2) Tabs (Overview, Analytics, Operations, Reports) for different views, 3) Cards and charts are clickable for details, 4) Use the search function in each section to find specific items.",

    performance:
        "Your business performance indicators: Revenue is up 12% month-over-month, you have 8 active shipments in transit, 156 inventory items with 12 requiring attention, and 42 active orders with 8 pending payment. Focus on collecting overdue payments and restocking low inventory items.",
}

export function ChatBot({ isOpen, onClose }: ChatBotProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            type: "bot",
            content:
                "Hello! I'm your AI assistant. I can help you understand the dashboard data, explain charts, and provide insights about your business metrics. What would you like to know?",
            timestamp: new Date(),
        },
    ])
    const [inputValue, setInputValue] = useState("")
    const [isTyping, setIsTyping] = useState(false)
    const scrollAreaRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (message: string) => {
        if (!message.trim()) return

        const timestamp = new Date()
        const userMessage: Message = {
            id: timestamp.getTime().toString(),
            type: "user",
            content: message,
            timestamp,
        }

        setMessages((prev) => [...prev, userMessage])
        setInputValue("")
        setIsTyping(true)

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message }),
            })

            const data = await res.json()

            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: "bot",
                content: data.reply || "Sorry, I didn't understand that.",
                timestamp: new Date(),
            }

            setMessages((prev) => [...prev, botMessage])
        } catch (err) {
            console.error("Chat error:", err)

            setMessages((prev) => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    type: "bot",
                    content: "⚠️ Oops! There was a problem reaching Gemini.",
                    timestamp: new Date(),
                },
            ])
        } finally {
            setIsTyping(false)
        }
    }



    const handleQuickAction = (query: string) => {
        handleSendMessage(query)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-6">
            <Card className="w-96 h-[600px] flex flex-col">
                <CardHeader className="p-0">
                    <div className="flex items-center justify-between px-4 py-3 bg-blue-800 rounded-t-md">
                        <CardTitle className="flex items-center space-x-2 text-white text-base font-semibold">
                            <Bot className="h-5 w-5" />
                            <span>AI Assistant</span>
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="text-white hover:bg-blue-700"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>


                <CardContent className="flex flex-col flex-1 min-h-0 p-0">
                    {/* Quick Actions */}
                    <div className="p-4 border-b border-slate-200 bg-slate-50">
                        <p className="text-xs text-slate-600 mb-2">Quick Actions:</p>
                        <div className="grid grid-cols-2 gap-2">
                            {quickActions.map((action, index) => (
                                <Button
                                    key={index}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleQuickAction(action.query)}
                                    className="text-xs h-8 justify-start border-slate-300 hover:bg-slate-100"
                                >
                                    <action.icon className="h-3 w-3 mr-1" />
                                    {action.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 min-h-0 overflow-y-auto" ref={scrollAreaRef}>
                        <div className="flex flex-col gap-4 px-4 py-2">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm whitespace-pre-wrap break-words ${message.type === "user"
                                            ? "bg-blue-600 text-white"
                                            : "bg-slate-100 text-slate-900"
                                            }`}
                                    >
                                        <div className="flex items-end gap-2">
                                            {message.type === "bot" && (
                                                <Bot className="h-4 w-4 text-blue-600 shrink-0" />
                                            )}
                                            <div>
                                                <p className="text-sm leading-relaxed">{message.content}</p>
                                                <p
                                                    className={`text-xs mt-1 ${message.type === "user" ? "text-blue-200" : "text-slate-500"
                                                        }`}
                                                >
                                                    {message.timestamp.toLocaleTimeString([], {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-slate-100 rounded-lg px-4 py-2 max-w-[75%] flex items-center gap-2">
                                        <Bot className="h-4 w-4 text-blue-600" />
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                                            <div
                                                className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                                                style={{ animationDelay: "0.1s" }}
                                            />
                                            <div
                                                className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                                                style={{ animationDelay: "0.2s" }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-slate-200">
                        <div className="flex space-x-2">
                            <Input
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Ask about charts, data, or dashboard features..."
                                onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputValue)}
                                className="flex-1 border-slate-300"
                            />
                            <Button
                                onClick={() => handleSendMessage(inputValue)}
                                disabled={!inputValue.trim() || isTyping}
                                style={{
                                    backgroundColor: colors.primary,
                                    borderColor: colors.primary,
                                }}
                                className="hover:opacity-90"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                </CardContent>
            </Card>
        </div>
    )
}
