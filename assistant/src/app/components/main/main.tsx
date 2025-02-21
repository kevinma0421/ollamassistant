'use client';
import { useState, useEffect, SetStateAction } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import MarkdownComponent from '../../../MarkdownComponent';

export default function Main() {
	const [input, setInput] = useState('');
	const [userMessages, setUserMessages] = useState<string[]>([]);
	const [aiResponses, setAiResponses] = useState<string[]>([]);
	const [aiThink, setAiThink] = useState<string[]>([]);
	const [sessionId, setSessionId] = useState<string | null>(null);
	const [expandedIndexes, setExpandedIndexes] = useState<Set<number>>(
		new Set()
	);

	// fetch session ID or create new one if DNE
	useEffect(() => {
		const fetchSessionId = async () => {
			try {
				const res = await axios.get(
					'http://127.0.0.1:5000/latest_session'
				);
				setSessionId(res.data.session_id);
			} catch (err) {
				console.warn('No session found. Creating a new one.');
				const newRes = await axios.post(
					'http://127.0.0.1:5000/new_session'
				);
				setSessionId(newRes.data.session_id);
			}
		};
		fetchSessionId();
	}, []);

	// load chat history if exists
	useEffect(() => {
		if (sessionId) {
			loadChatHistory(sessionId);
		}
	}, [sessionId]);

	// pasted text handling
	useEffect(() => {
		window.electron?.on(
			'pasteText',
			(event: any, text: SetStateAction<string>) => {
				setInput(text);
			}
		);
	}, []);

	const loadChatHistory = async (sessionId: string) => {
		try {
			const res = await axios.get(
				`http://127.0.0.1:5000/get_chat/${sessionId}`
			);
			const messages = res.data;

			const userMessages: string[] = [];
			const aiResponses: string[] = [];
			const aiThink: string[] = [];

			messages.forEach((msg: { type: string; content: string }) => {
				if (msg.type === 'human') {
					userMessages.push(msg.content);
				} else if (msg.type === 'ai') {
					const { think, final } = parseAiResponse(msg.content);
					aiThink.push(think);
					aiResponses.push(final);
				}
			});

			setUserMessages(userMessages);
			setAiThink(aiThink);
			setAiResponses(aiResponses);
		} catch (err) {
			console.error('Failed to load chat history:', err);
		}
	};

	const handleQuery = async () => {
		if (!input.trim()) return;

		try {
			// send user msg to backend to be answered by LLM
			const userInput = input;
			setUserMessages((prev) => [...prev, userInput]);

			const res = await axios.post('http://127.0.0.1:5000/chat', {
				session_id: sessionId,
				user_message: userInput,
			});

			const aiResponse = res.data.response;
			const { think, final } = parseAiResponse(aiResponse);

			setAiThink((prev) => [...prev, think]);
			setAiResponses((prev) => [...prev, final]);

			// Send both messages to be stored in server
			await axios.post('http://127.0.0.1:5000/append_message', {
				session_id: sessionId,
				user_message: userInput,
				ai_message: aiResponse,
			});

			setInput('');
		} catch (error) {
			console.error('Error during message flow:', error);
		}
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (event.key === 'Enter') {
			event.preventDefault();
			handleQuery();
			setInput('');
		}
	};

	function parseAiResponse(response: string): {
		think: string;
		final: string;
	} {
		const thinkMatch = response.match(/<think>([\s\S]*?)<\/think>/);
		const think = thinkMatch ? thinkMatch[1].trim() : '';

		// Remove <think> block and everything before it, keep the rest
		const final = response.replace(/<think>[\s\S]*?<\/think>/, '').trim();

		return { think, final };
	}

	const toggleThinkVisibility = (index: number) => {
		setExpandedIndexes((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(index)) {
				newSet.delete(index); // Collapse
			} else {
				newSet.add(index); // Expand
			}
			return newSet;
		});
	};

	return (
		<div className='flex flex-col h-screen items-center p-4 bg-zinc-800 relative'>
			<h1 className='text-2xl font-bold text-gray-200'>LLM Assistant</h1>
			<div className='flex-grow overflow-y-auto mt-10 mb-20 w-full px-11 space-y-4'>
				{userMessages.map((message, index) => (
					<div
						key={`user-${index}`}
						className='flex flex-col'>
						<div className='px-4 py-2 rounded-3xl bg-neutral-700 text-gray-200 self-end max-w-[66%] w-fit break-words mr-4'>
							{message}
						</div>

						{aiResponses[index] ? (
							<div className='px-4 py-2 mt-2 text-gray-200 p-4 rounded-lg prose max-w-full '>
								{/* Think Toggle Box */}
								{aiThink[index]?.trim() && (
									<div>
										{/* Toggle Button */}
										<div
											key={index}
											className='bg-neutral-700 text-gray-400 px-4 py-2 cursor-pointer text-xs w-fit rounded-lg'
											onClick={() =>
												toggleThinkVisibility(index)
											}>
											{expandedIndexes.has(index)
												? 'Hide Thinking'
												: 'Show Thinking'}
										</div>

										{/* Show Thinking Process (Toggleable, Scrollable) */}
										{expandedIndexes.has(index) && (
											<div className='my-4 bg-neutral-700 text-gray-200 rounded-lg p-3'>
												<div className='text-xs font-bold text-gray-400'>
													Thinking Process:
												</div>
												<div className='max-h-40 overflow-y-auto  rounded-md p-2'>
													<MarkdownComponent
														content={aiThink[index]}
													/>
												</div>
											</div>
										)}
									</div>
								)}

								{/* Final Answer (Always Visible) */}
								<div className='mt p-4 rounded-lg text-gray-200'>
									{/*<div className='text-xs font-bold text-gray-400 mb-4'>
										Final Answer:
									</div> */}
									<MarkdownComponent
										content={aiResponses[index]}
									/>
								</div>
							</div>
						) : (
							<div className='px-4 py-2 mt-2 text-gray-200'>
								Thinking...
							</div>
						)}
					</div>
				))}
			</div>

			<textarea
				className='absolute bottom-6 w-full max-w-[calc(100%-10rem)] max-h-40 overflow-y-auto p-2 text-gray-200 outline-none bg-neutral-700 rounded-xl placeholder-gray-400 resize-none'
				value={input}
				onChange={(e) => setInput(e.target.value)}
				onKeyDown={handleKeyDown}
				placeholder='Type and press Enter...'
			/>
		</div>
	);
}
