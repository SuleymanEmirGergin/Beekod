import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TypewriterProps {
  text: string;
  speed?: number;
  className?: string;
}

// Local Error Boundary for Typewriter
class MarkdownErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Typewriter Markdown Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <span>{this.props.children}</span>; // Fallback: render raw text if markdown fails
    }
    return this.props.children;
  }
}

export function Typewriter({ text, speed = 15, className = '' }: TypewriterProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // Reset if text changes (e.g. from Analyzing... to actual reply)
    setDisplayedText('');
    setIndex(0);
  }, [text]);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text.charAt(index));
        setIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    }
  }, [index, text, speed]);

  return (
    <div
      className={`prose prose-sm max-w-none prose-img:max-h-48 prose-img:w-auto prose-img:rounded-lg prose-img:object-contain prose-p:leading-relaxed prose-pre:bg-gray-800 prose-pre:text-white prose-table:border prose-table:border-gray-200 ${className}`}
    >
      <MarkdownErrorBoundary>
        <ReactMarkdown
          key={displayedText.length} // Force re-render on every character to prevent reconciliation errors
          remarkPlugins={[remarkGfm]}
          components={{
            img: ({ node, ...props }) => (
              <img {...props} className="max-h-64 max-w-full rounded-lg object-contain bg-white border border-gray-100 my-2" />
            )
          }}
        >
          {displayedText}
        </ReactMarkdown>
      </MarkdownErrorBoundary>
    </div>
  );
}
