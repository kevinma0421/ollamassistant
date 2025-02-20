import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function MarkdownRenderer({ content }: { content: string }) {
	return (
		<ReactMarkdown
			className='whitespace-pre-wrap text-sm leading-relaxed'
			components={{
				code({
					node,
					inline,
					className,
					children,
					...props
				}: React.HTMLAttributes<HTMLElement> & {
					inline?: boolean;
					node?: any;
				}) {
					const match = /language-(\w+)/.exec(className || '');

					if (!inline && match) {
						return (
							<div className='rounded-md overflow-auto my-2'>
								<SyntaxHighlighter
									style={oneDark}
									language={match[1]}
									PreTag='div'
									{...props}>
									{String(children).replace(/\n$/, '')}
								</SyntaxHighlighter>
							</div>
						);
					}

					// Inline code
					return (
						<code className='text-orange-300 px-1 py-0.5 rounded'>
							{children}
						</code>
					);
				},
			}}>
			{content}
		</ReactMarkdown>
	);
}
