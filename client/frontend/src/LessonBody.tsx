import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"

export function LessonBody({ content }: { content: string }) {
  const markdown = content.replace(
    /^> \[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*$/gim,
    (_, kind: string) =>
      `> **${kind[0].toUpperCase()}${kind.slice(1).toLowerCase()}**\n>`
  )
  return (
    <div className="lesson-markdown">
      <Markdown
        skipHtml
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h2>{children}</h2>,
          table: ({ children }) => (
            <div
              className="table-wrap"
              tabIndex={0}
              role="region"
              aria-label="Lesson table"
            >
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {markdown}
      </Markdown>
    </div>
  )
}
