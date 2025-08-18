// components/Markdown.tsx
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeSanitize from "rehype-sanitize"

export function Markdown({ children }: { children: string }) {
    return (
        <div className="
      prose prose-sm prose-slate max-w-none
      prose-p:my-1 prose-strong:font-semibold
      prose-ul:my-2 prose-ol:my-2
      prose-li:my-0
    ">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                {children}
            </ReactMarkdown>
        </div>
    )
}
