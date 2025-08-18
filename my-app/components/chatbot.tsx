// "use client"

// import { useState, useRef, useEffect } from "react"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { ScrollArea } from "@/components/ui/scroll-area"
// import { X, Send, Bot, User, Lightbulb, BarChart3, TrendingUp, Package } from "lucide-react"

// interface Message {
//     id: string
//     type: "user" | "bot"
//     content: string
//     timestamp: Date
// }

// interface ChatBotProps {
//     isOpen: boolean
//     onClose: () => void
// }

// const colors = {
//     primary: "#1e40af",
//     primaryLight: "#3b82f6",
//     secondary: "#059669",
//     accent: "#dc2626",
//     warning: "#d97706",
//     neutral: "#6b7280",
//     background: "#f8fafc",
//     surface: "#ffffff",
// }

// const quickActions = [
//     { icon: BarChart3, label: "Explain Revenue Chart", query: "Can you explain the revenue vs expenditure chart?" },
//     { icon: TrendingUp, label: "Shipment Trends", query: "What do the shipment trends show?" },
//     { icon: Package, label: "Inventory Status", query: "Help me understand the inventory health metrics" },
//     { icon: Lightbulb, label: "Dashboard Tips", query: "Give me tips on using this dashboard effectively" },
// ]

// const botResponses: { [key: string]: string } = {
//     revenue:
//         "The Revenue vs Expenditure chart shows your monthly financial performance. The green area represents revenue (income from sales), the red area shows expenditure (costs), and the blue line indicates profit (revenue minus expenditure). Your profit has been steadily increasing from S$40k in January to S$67k in June, showing healthy business growth.",

//     shipment:
//         "The Shipment Trends chart displays weekly activity: 'Incoming' (green bars) shows raw materials arriving from vendors, 'Outgoing' (blue bars) represents finished products delivered to customers, and 'Delayed' (red bars) indicates shipments behind schedule. Week 4 shows the highest activity with 22 incoming and 18 outgoing shipments.",

//     inventory:
//         "The Inventory Health section shows three key metrics: 'Normal Stock' (green) indicates items with adequate quantities, 'Low Stock' (yellow) shows items below minimum thresholds that need reordering, and 'Expiring Soon' (red) highlights items approaching their expiry dates. Currently, you have 12 low stock items and 8 items expiring soon that require immediate attention.",

//     dashboard:
//         "Here are key dashboard tips: 1) Use the color-coded badges to quickly identify urgent items (red = critical, yellow = attention needed, green = good). 2) Click on any chart section for detailed views. 3) The top metrics cards show real-time KPIs. 4) Use the tabs to switch between Overview, Analytics, Operations, and Reports. 5) Set up notifications in Settings to get alerts for critical issues.",

//     orders:
//         "The Order Status section tracks customer orders through their lifecycle: 'Delivered' (green) shows completed orders, 'Shipped' (blue) indicates orders in transit, 'Processing' (yellow) means orders being prepared, and 'Pending Payment' (red) highlights orders awaiting payment. Focus on the red items to improve cash flow.",

//     alerts:
//         "Critical alerts appear when: 1) Inventory items are low stock or expiring, 2) Shipments are delayed, 3) Payments are overdue. The red alert badge shows 10 items needing attention. Click on specific sections to see detailed information and take action.",

//     navigation:
//         "Navigate the dashboard using: 1) Top buttons (Shipments, Inventory, Orders) for main sections, 2) Tabs (Overview, Analytics, Operations, Reports) for different views, 3) Cards and charts are clickable for details, 4) Use the search function in each section to find specific items.",

//     performance:
//         "Your business performance indicators: Revenue is up 12% month-over-month, you have 8 active shipments in transit, 156 inventory items with 12 requiring attention, and 42 active orders with 8 pending payment. Focus on collecting overdue payments and restocking low inventory items.",
// }

// export function ChatBot({ isOpen, onClose }: ChatBotProps) {
//     const [messages, setMessages] = useState<Message[]>([
//         {
//             id: "1",
//             type: "bot",
//             content:
//                 "Hello! I'm your AI assistant. I can help you understand the dashboard data, explain charts, and provide insights about your business metrics. What would you like to know?",
//             timestamp: new Date(),
//         },
//     ])
//     const [inputValue, setInputValue] = useState("")
//     const [isTyping, setIsTyping] = useState(false)
//     const scrollAreaRef = useRef<HTMLDivElement>(null)

//     useEffect(() => {
//         if (scrollAreaRef.current) {
//             scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
//         }
//     }, [messages]);

//     const handleSendMessage = async (message: string) => {
//         if (!message.trim()) return

//         const timestamp = new Date()
//         const userMessage: Message = {
//             id: timestamp.getTime().toString(),
//             type: "user",
//             content: message,
//             timestamp,
//         }

//         setMessages((prev) => [...prev, userMessage])
//         setInputValue("")
//         setIsTyping(true)

//         try {
//             const res = await fetch("/api/chat", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ message }),
//             })

//             const data = await res.json()

//             const botMessage: Message = {
//                 id: (Date.now() + 1).toString(),
//                 type: "bot",
//                 content: data.reply || "Sorry, I didn't understand that.",
//                 timestamp: new Date(),
//             }

//             setMessages((prev) => [...prev, botMessage])
//         } catch (err) {
//             console.error("Chat error:", err)

//             setMessages((prev) => [
//                 ...prev,
//                 {
//                     id: (Date.now() + 1).toString(),
//                     type: "bot",
//                     content: "⚠️ Oops! There was a problem reaching Gemini.",
//                     timestamp: new Date(),
//                 },
//             ])
//         } finally {
//             setIsTyping(false)
//         }
//     }



//     const handleQuickAction = (query: string) => {
//         handleSendMessage(query)
//     }

//     if (!isOpen) return null

//     return (
//         <div className="fixed inset-0 z-50 flex items-end justify-end p-6 pt-0">
//             <Card className="w-96 h-[600px] flex flex-col gap-0 py-0">
//                 <div className="flex items-center justify-between px-4 py-3 bg-blue-800 rounded-t-md">
//                     <CardTitle className="flex items-center space-x-2 text-white text-base font-semibold">
//                         <Bot className="h-5 w-5" />
//                         <span>AI Assistant</span>
//                     </CardTitle>
//                     <Button
//                         variant="ghost"
//                         size="icon"
//                         onClick={onClose}
//                         className="text-white hover:bg-blue-700"
//                     >
//                         <X className="h-4 w-4" />
//                     </Button>
//                 </div>


//                 <CardContent className="flex flex-col flex-1 min-h-0 p-0">
//                     {/* Quick Actions */}
//                     <div className="p-4 border-b border-slate-200 bg-slate-50">
//                         <p className="text-xs text-slate-600 mb-2">Quick Actions:</p>
//                         <div className="grid grid-cols-2 gap-2">
//                             {quickActions.map((action, index) => (
//                                 <Button
//                                     key={index}
//                                     variant="outline"
//                                     size="sm"
//                                     onClick={() => handleQuickAction(action.query)}
//                                     className="text-xs h-8 justify-start border-slate-300 hover:bg-slate-100"
//                                 >
//                                     <action.icon className="h-3 w-3 mr-1" />
//                                     {action.label}
//                                 </Button>
//                             ))}
//                         </div>
//                     </div>

//                     {/* Messages */}
//                     <div className="flex-1 min-h-0 overflow-y-auto" ref={scrollAreaRef}>
//                         <div className="flex flex-col gap-4 px-4 py-2">
//                             {messages.map((message) => (
//                                 <div
//                                     key={message.id}
//                                     className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
//                                 >
//                                     <div
//                                         className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm whitespace-pre-wrap break-words ${message.type === "user"
//                                             ? "bg-blue-600 text-white"
//                                             : "bg-slate-100 text-slate-900"
//                                             }`}
//                                     >
//                                         <div className="flex items-end gap-2">
//                                             {message.type === "bot" && (
//                                                 <Bot className="h-4 w-4 text-blue-600 shrink-0" />
//                                             )}
//                                             <div>
//                                                 <p className="text-sm leading-relaxed">{message.content}</p>
//                                                 <p
//                                                     className={`text-xs mt-1 ${message.type === "user" ? "text-blue-200" : "text-slate-500"
//                                                         }`}
//                                                 >
//                                                     {message.timestamp.toLocaleTimeString([], {
//                                                         hour: "2-digit",
//                                                         minute: "2-digit",
//                                                     })}
//                                                 </p>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </div>
//                             ))}

//                             {isTyping && (
//                                 <div className="flex justify-start">
//                                     <div className="bg-slate-100 rounded-lg px-4 py-2 max-w-[75%] flex items-center gap-2">
//                                         <Bot className="h-4 w-4 text-blue-600" />
//                                         <div className="flex gap-1">
//                                             <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
//                                             <div
//                                                 className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
//                                                 style={{ animationDelay: "0.1s" }}
//                                             />
//                                             <div
//                                                 className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
//                                                 style={{ animationDelay: "0.2s" }}
//                                             />
//                                         </div>
//                                     </div>
//                                 </div>
//                             )}
//                         </div>
//                     </div>

//                     {/* Input */}
//                     <div className="p-4 border-t border-slate-200">
//                         <div className="flex space-x-2">
//                             <Input
//                                 value={inputValue}
//                                 onChange={(e) => setInputValue(e.target.value)}
//                                 placeholder="Ask about charts, data, or dashboard features..."
//                                 onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputValue)}
//                                 className="flex-1 border-slate-300"
//                             />
//                             <Button
//                                 onClick={() => handleSendMessage(inputValue)}
//                                 disabled={!inputValue.trim() || isTyping}
//                                 style={{
//                                     backgroundColor: colors.primary,
//                                     borderColor: colors.primary,
//                                 }}
//                                 className="hover:opacity-90"
//                             >
//                                 <Send className="h-4 w-4" />
//                             </Button>
//                         </div>
//                     </div>

//                 </CardContent>
//             </Card>
//         </div>
//     )
// }


"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Send, Bot, Lightbulb, BarChart3, TrendingUp, Package, ExternalLink } from "lucide-react"
import { Markdown } from "@/components/Markdown"


/** ---------- Rich message schema ---------- */
export type ChatBlock =
    | { type: "text"; content: string; collapsible?: boolean; summary?: string }
    | { type: "bullets"; items: string[] }
    | { type: "steps"; items: string[] }
    | { type: "keyValue"; rows: { label: string; value: string }[] }
    | { type: "callout"; tone: "success" | "warning" | "info" | "danger"; content: string }
    | { type: "actions"; actions: { id: string; label: string; url?: string }[] }
    | { type: "sourceList"; items: { title: string; url: string }[] }
    | { type: "suggestions"; items: string[] }

export interface ChatResponse {
    title?: string
    headline?: string
    blocks: ChatBlock[]
}

/** ---------- Message model ---------- */
interface Message {
    id: string
    type: "user" | "bot"
    text?: string
    rich?: ChatResponse
    timestamp: Date
}

interface ChatBotProps {
    isOpen: boolean
    onClose: () => void
}

/** ---------- UI constants ---------- */
const colors = {
    primary: "#1e40af",
}

const quickActions = [
    { icon: BarChart3, label: "Explain Revenue Chart", query: "Can you explain the revenue vs expenditure chart?" },
    { icon: TrendingUp, label: "Shipment Trends", query: "What do the shipment trends show?" },
    { icon: Package, label: "Inventory Status", query: "Help me understand the inventory health metrics" },
    { icon: Lightbulb, label: "Dashboard Tips", query: "Give me tips on using this dashboard effectively" },
]

/** ---------- Type guards / helpers ---------- */
function isChatResponse(x: unknown): x is ChatResponse {
    return !!x && typeof x === "object" && Array.isArray((x as any).blocks)
}

function tryParseChatResponse(input: unknown): { rich?: ChatResponse; text?: string } {
    // 1) Already structured
    if (isChatResponse(input)) return { rich: input as ChatResponse }

    // 2) String that might be JSON
    if (typeof input === "string") {
        try {
            const parsed = JSON.parse(input)
            if (isChatResponse(parsed)) return { rich: parsed }
        } catch {
            /* noop */
        }
        return { text: input }
    }

    // 3) Default fallback
    return { text: "Sorry, I didn’t understand that." }
}

/** ---------- Rich renderer ---------- */
function RichMessage({
    data,
    onAction,
}: {
    data: ChatResponse
    onAction: (id: string) => void
}) {
    return (
        <div className="space-y-3">
            {data.title && <h4 className="text-sm font-semibold">{data.title}</h4>}
            {data.headline && (
                <div className="rounded-xl bg-slate-100 p-3 text-sm font-medium">{data.headline}</div>
            )}

            {data.blocks.map((b, i) => {
                if (b.type === "text") {
                    if (b.collapsible) {
                        return (
                            <details key={i} className="rounded-xl border p-3 bg-white open:shadow-sm">
                                <summary className="cursor-pointer text-sm font-medium">{b.summary || "Details"}</summary>
                                <div className="pt-2 text-sm leading-relaxed whitespace-pre-wrap">{b.content}</div>
                            </details>
                        )
                    }
                    return (
                        <p key={i} className="text-sm leading-relaxed whitespace-pre-wrap">
                            {b.content}
                        </p>
                    )
                }

                if (b.type === "bullets") {
                    return (
                        <ul key={i} className="list-disc pl-5 space-y-1 text-sm">
                            {b.items.map((it, j) => (
                                <li key={j}>{it}</li>
                            ))}
                        </ul>
                    )
                }

                if (b.type === "steps") {
                    return (
                        <ol key={i} className="list-decimal pl-5 space-y-1 text-sm">
                            {b.items.map((it, j) => (
                                <li key={j}>{it}</li>
                            ))}
                        </ol>
                    )
                }

                if (b.type === "keyValue") {
                    return (
                        <div key={i} className="divide-y rounded-xl border bg-white">
                            {b.rows.map((r, j) => (
                                <div key={j} className="flex justify-between gap-4 p-3 text-sm">
                                    <span className="text-slate-500">{r.label}</span>
                                    <span className="font-medium">{r.value}</span>
                                </div>
                            ))}
                        </div>
                    )
                }

                if (b.type === "callout") {
                    const tone =
                        b.tone === "success"
                            ? "bg-green-50 border-green-200"
                            : b.tone === "warning"
                                ? "bg-yellow-50 border-yellow-200"
                                : b.tone === "danger"
                                    ? "bg-red-50 border-red-200"
                                    : "bg-blue-50 border-blue-200"
                    return (
                        <div key={i} className={`rounded-xl border p-3 text-sm ${tone}`}>
                            {b.content}
                        </div>
                    )
                }

                if (b.type === "actions") {
                    return (
                        <div key={i} className="flex flex-wrap gap-2">
                            {b.actions.map((a, j) =>
                                a.url ? (
                                    <a
                                        key={j}
                                        href={a.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-sm hover:bg-slate-50"
                                    >
                                        {a.label}
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                ) : (
                                    <Button
                                        key={j}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onAction(a.id)}
                                        className="rounded-xl"
                                    >
                                        {a.label}
                                    </Button>
                                )
                            )}
                        </div>
                    )
                }

                if (b.type === "sourceList") {
                    return (
                        <div key={i} className="text-xs text-slate-500">
                            Sources:
                            <ul className="list-disc pl-5">
                                {b.items.map((s, j) => (
                                    <li key={j}>
                                        <a className="underline" href={s.url} target="_blank" rel="noreferrer">
                                            {s.title}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )
                }

                if (b.type === "suggestions") {
                    return (
                        <div key={i} className="flex flex-wrap gap-2">
                            {b.items.map((txt, j) => (
                                <button
                                    key={j}
                                    onClick={() => onAction(`suggest:${txt}`)}
                                    className="rounded-full border px-3 py-1 text-sm hover:bg-slate-50"
                                >
                                    {txt}
                                </button>
                            ))}
                        </div>
                    )
                }

                return null
            })}
        </div>
    )
}

/** ---------- Main component ---------- */
export function ChatBot({ isOpen, onClose }: ChatBotProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            type: "bot",
            text:
                "Hello! I’m your AI assistant. I can help you understand the dashboard data, explain charts, and provide insights about your business metrics. What would you like to know?",
            timestamp: new Date(),
        },
    ])
    const [inputValue, setInputValue] = useState("")
    const [isTyping, setIsTyping] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    // Always keep scrolled to bottom when messages change
    useEffect(() => {
        const el = scrollRef.current
        if (el) el.scrollTop = el.scrollHeight
    }, [messages, isTyping])

    const handleAction = useCallback(
        (id: string) => {
            // Wire your tool calls here. Some examples:
            // - id === "start-return" -> POST /api/returns
            // - id.startsWith("suggest:") -> send that text as a user message
            if (id.startsWith("suggest:")) {
                const suggestion = id.replace("suggest:", "")
                handleSendMessage(suggestion)
                return
            }
            // Default: send the action id as an instruction to the backend
            handleSendMessage(`/${id}`)
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    )

    const handleSendMessage = async (message: string) => {
        if (!message.trim()) return

        const timestamp = new Date()
        const userMessage: Message = {
            id: timestamp.getTime().toString(),
            type: "user",
            text: message,
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
            // Accept either:
            // { reply: string } OR { reply: ChatResponse } OR ChatResponse directly
            const payload = data?.reply ?? data
            const { rich, text } = tryParseChatResponse(payload)

            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: "bot",
                ...(rich ? { rich } : { text: text || "Sorry, I didn’t understand that." }),
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
                    rich: {
                        headline: "I’m having trouble reaching the AI service.",
                        blocks: [
                            { type: "callout", tone: "danger", content: "Network error or timeout." },
                            {
                                type: "actions",
                                actions: [
                                    { id: "retry", label: "Retry" },
                                    { id: "contact-human", label: "Contact support", url: "/support" },
                                ],
                            },
                        ],
                    },
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
        <div className="fixed inset-0 z-50 flex items-end justify-end p-6 pt-0">
            <Card className="w-96 h-[600px] flex flex-col gap-0 py-0">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-blue-800 rounded-t-md">
                    <CardTitle className="flex items-center space-x-2 text-white text-base font-semibold">
                        <Bot className="h-5 w-5" />
                        <span>AI Assistant</span>
                        <span className="ml-2 inline-flex items-center text-[10px] rounded-full bg-white/15 px-2 py-0.5">
                            beta
                        </span>
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
                                    className="text-xs h-8 justify-start border-slate-300 hover:bg-slate-100 rounded-xl"
                                >
                                    <action.icon className="h-3 w-3 mr-1" />
                                    {action.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 min-h-0 overflow-y-auto" ref={scrollRef}>
                        <div className="flex flex-col gap-4 px-4 py-2">
                            {messages.map((m) => (
                                <div key={m.id} className={`flex ${m.type === "user" ? "justify-end" : "justify-start"}`}>
                                    <div
                                        className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-sm break-words ${m.type === "user" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-900"
                                            }`}
                                    >
                                        <div className="flex items-start gap-2">
                                            {m.type === "bot" && <Bot className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />}
                                            <div className="w-full">
                                                {/* Render rich or markdown/plain */}
                                                {m.rich ? (
                                                    <RichMessage data={m.rich} onAction={handleAction} />
                                                ) : m.text ? (
                                                    <Markdown>{m.text}</Markdown>
                                                ) : null}

                                                <p className={`text-[11px] mt-2 ${m.type === "user" ? "text-blue-200" : "text-slate-500"}`}>
                                                    {m.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {isTyping && (
                                <div className="flex justify-start" aria-live="polite" role="status">
                                    <div className="bg-slate-100 rounded-2xl px-4 py-3 max-w-[80%] flex items-center gap-2 shadow-sm">
                                        <Bot className="h-4 w-4 text-blue-600" />
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:100ms]" />
                                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:200ms]" />
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
                                placeholder="Ask about charts, data, or dashboard features…"
                                onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputValue)}
                                className="flex-1 border-slate-300"
                            />
                            <Button
                                onClick={() => handleSendMessage(inputValue)}
                                disabled={!inputValue.trim() || isTyping}
                                style={{ backgroundColor: colors.primary, borderColor: colors.primary }}
                                className="hover:opacity-90 rounded-xl"
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
