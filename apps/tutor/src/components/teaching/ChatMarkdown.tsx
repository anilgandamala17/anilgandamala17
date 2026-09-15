import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import type { Components } from 'react-markdown';
import type { ReactNode } from 'react';
import 'highlight.js/styles/github.css';
import { isFormulaLine } from '../../utils/chatFormat';

interface ChatMarkdownProps {
    content: string;
    isStreaming?: boolean;
}

const FORMULA_LANGS = new Set(['math', 'equation', 'formula']);

function isFormulaBlock(className?: string, children?: ReactNode): boolean {
    const lang = className?.replace('language-', '') ?? '';
    if (FORMULA_LANGS.has(lang)) return true;
    const text = String(children ?? '').trim();
    return isFormulaLine(text);
}

const components: Components = {
    h1: ({ children }) => (
        <h2 className="chat-md-heading">{children}</h2>
    ),
    h2: ({ children }) => (
        <h2 className="chat-md-heading">{children}</h2>
    ),
    h3: ({ children }) => (
        <h3 className="chat-md-subheading">{children}</h3>
    ),
    h4: ({ children }) => (
        <h4 className="chat-md-subheading text-base">{children}</h4>
    ),
    p: ({ children }) => {
        const text = String(children ?? '').trim();
        if (isFormulaLine(text)) {
            return <div className="chat-formula">{text}</div>;
        }
        return <p className="chat-md-p">{children}</p>;
    },
    strong: ({ children }) => (
        <strong className="chat-md-strong">{children}</strong>
    ),
    em: ({ children }) => (
        <em className="chat-md-em">{children}</em>
    ),
    ul: ({ children }) => (
        <ul className="chat-md-ul">{children}</ul>
    ),
    ol: ({ children }) => (
        <ol className="chat-md-ol">{children}</ol>
    ),
    li: ({ children }) => (
        <li className="chat-md-li">{children}</li>
    ),
    blockquote: ({ children }) => (
        <blockquote className="chat-md-blockquote">{children}</blockquote>
    ),
    hr: () => <hr className="chat-md-hr" />,
    table: ({ children }) => (
        <div className="chat-md-table-wrap">
            <table className="chat-md-table">{children}</table>
        </div>
    ),
    thead: ({ children }) => <thead className="chat-md-thead">{children}</thead>,
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => <tr className="chat-md-tr">{children}</tr>,
    th: ({ children }) => <th className="chat-md-th">{children}</th>,
    td: ({ children }) => <td className="chat-md-td">{children}</td>,
    code: ({ className, children, ...props }) => {
        const isBlock = Boolean(className);
        if (isBlock) {
            const lang = className?.replace('language-', '') ?? '';
            const text = String(children ?? '').replace(/\n$/, '');
            if (isFormulaBlock(className, text)) {
                return <div className="chat-formula">{text}</div>;
            }
            return (
                <div className="chat-md-code-block">
                    {lang && lang !== 'text' && (
                        <div className="chat-md-code-lang">{lang}</div>
                    )}
                    <pre className="chat-md-pre">
                        <code className={className} {...props}>{children}</code>
                    </pre>
                </div>
            );
        }
        return (
            <code className="chat-md-inline-code" {...props}>{children}</code>
        );
    },
    pre: ({ children }) => <>{children}</>,
    a: ({ href, children }) => (
        <a href={href} className="chat-md-link" target="_blank" rel="noopener noreferrer">
            {children}
        </a>
    ),
};

export default function ChatMarkdown({ content, isStreaming }: ChatMarkdownProps) {
    if (!content && isStreaming) {
        return (
            <span className="chat-stream-cursor" aria-hidden="true" />
        );
    }

    return (
        <div className="chat-md">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={components}
            >
                {content}
            </ReactMarkdown>
            {isStreaming && (
                <span className="chat-stream-cursor" aria-hidden="true" />
            )}
        </div>
    );
}
