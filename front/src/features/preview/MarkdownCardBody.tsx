import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

type Props = {
  content: string
  className?: string
}

export function MarkdownCardBody({ content, className }: Props) {
  return (
    <div className={cn('markdown-card-body', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeRaw]}
        urlTransform={(url) =>
          // Allow data:image/* (pasted base64 images); keep default filtering for everything else
          /^(https?:|mailto:|tel:|data:image\/|#|\/|\.)/.test(url) ? url : ''
        }
        components={{
          h1: ({ ...props }) => (
            <h1
              className="mb-4 mt-0 text-[length:calc(1.75rem*var(--font-scale,1))] font-extrabold leading-tight tracking-tight text-[var(--heading-color,var(--accent))]"
              style={{ fontFamily: 'var(--heading-font)' }}
              {...props}
            />
          ),
          h2: ({ ...props }) => (
            <h2
              className="mb-3 mt-7 border-b border-[var(--hr-color)] pb-1.5 text-[length:calc(1.35rem*var(--font-scale,1))] font-bold tracking-tight text-[var(--heading-color,var(--accent))]"
              style={{ fontFamily: 'var(--heading-font)' }}
              {...props}
            />
          ),
          h3: ({ ...props }) => (
            <h3
              className="mb-3 mt-5 flex items-center gap-2 text-[length:calc(1.15rem*var(--font-scale,1))] font-bold text-[var(--heading-color,var(--card-fg))] before:inline-block before:h-5 before:w-1.5 before:rounded before:bg-[var(--accent)] before:content-['']"
              style={{ fontFamily: 'var(--heading-font)' }}
              {...props}
            />
          ),
          p: ({ ...props }) => (
            <p
              className="my-3 text-[length:calc(0.9rem*var(--font-scale,1))] leading-[1.75] text-[var(--card-fg)]"
              style={{ fontFamily: 'var(--body-font)' }}
              {...props}
            />
          ),
          a: ({ ...props }) => (
            <a
              className="font-medium text-[var(--link-color)] underline underline-offset-2"
              {...props}
            />
          ),
          ul: ({ ...props }) => (
            <ul
              className="my-3 list-disc pl-6 text-[length:calc(0.95rem*var(--font-scale,1))] leading-[1.7] text-[var(--card-fg)] marker:text-[var(--accent)]"
              {...props}
            />
          ),
          ol: ({ ...props }) => (
            <ol
              className="my-3 list-decimal pl-7 text-[length:calc(0.95rem*var(--font-scale,1))] leading-[1.7] text-[var(--card-fg)] marker:font-semibold marker:text-[var(--accent)]"
              {...props}
            />
          ),
          li: ({ ...props }) => (
            <li className="my-1.5 pl-1" {...props} />
          ),
          blockquote: ({ ...props }) => (
            <blockquote
              className="my-4 border-l-[6px] border-[var(--quote-border)] bg-[var(--quote-bg)] py-2.5 pl-4 pr-3 text-[length:calc(1rem*var(--font-scale,1))] font-medium text-[var(--card-fg)]"
              {...props}
            />
          ),
          code: ({ className, children, ...props }) => {
            const isBlock = /language-/.test(className ?? '')
            if (isBlock) {
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              )
            }
            return (
              <code
                className="rounded bg-[var(--code-bg)] px-1.5 py-0.5 font-mono text-[0.9em] text-[var(--code-fg)]"
                {...props}
              >
                {children}
              </code>
            )
          },
          pre: ({ ...props }) => (
            <pre
              className="my-3 overflow-x-auto rounded-lg border border-[var(--table-border)] bg-[var(--code-bg)] p-3 font-mono text-[length:calc(0.85rem*var(--font-scale,1))] text-[var(--code-fg)]"
              {...props}
            />
          ),
          hr: () => (
            <hr className="my-7 border-0 border-t border-[var(--hr-color)]" />
          ),
          table: ({ ...props }) => (
            <div className="my-3 w-full overflow-x-auto">
              <table
                className="w-full border-collapse border border-[var(--table-border)] text-[length:calc(0.9rem*var(--font-scale,1))]"
                {...props}
              />
            </div>
          ),
          th: ({ ...props }) => (
            <th
              className="border border-[var(--table-border)] bg-[var(--accent-soft)] px-2 py-1.5 text-left font-semibold text-[var(--card-fg)]"
              {...props}
            />
          ),
          td: ({ ...props }) => (
            <td
              className="border border-[var(--table-border)] px-2 py-1.5 text-[var(--card-fg)]"
              {...props}
            />
          ),
          img: ({ alt, ...props }) => (
            <img
              className="my-3 max-h-[40%] w-full rounded-lg object-cover"
              alt={alt ?? ''}
              {...props}
            />
          ),
          strong: ({ ...props }) => (
            <strong className="font-bold text-[var(--accent)]" {...props} />
          ),
          em: ({ ...props }) => (
            <em className="italic text-[var(--card-fg)]" {...props} />
          ),
          del: ({ ...props }) => (
            <del className="text-[var(--card-muted)]" {...props} />
          ),
          mark: ({ children, ...props }) => (
            <mark
              className="rounded-sm bg-[var(--accent-soft)] px-0.5 text-[var(--card-fg)]"
              {...props}
            >
              {children}
            </mark>
          ),
          u: ({ children, ...props }) => (
            <u
              className="underline decoration-2 decoration-[var(--accent)]"
              {...props}
            >
              {children}
            </u>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
