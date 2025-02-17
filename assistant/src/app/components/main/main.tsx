'use client';
import { useState, useEffect, SetStateAction } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

export default function main() {
	const [input, setInput] = useState('');
	const [userMessages, setUserMessages] = useState<string[]>([]);
	const [aiResponses, setAiResponses] = useState<string[]>([]);
	const [sessionId, setSessionId] = useState<string | null>(null);

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

			messages.forEach((msg: { user: string; ai: string }) => {
				userMessages.push(msg.user);
				aiResponses.push(msg.ai);
			});

			setUserMessages(userMessages);
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

			const aiResponse = res.data.response
				.replace(/<\/?think>/g, '')
				.replace(/<br>/g, '\n');

			setAiResponses((prev) => [...prev, aiResponse]);

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

	return (
		<div className='flex flex-col h-screen items-center p-4 bg-zinc-800 relative'>
			<h1 className='text-2xl font-bold text-gray-200'>LLM Assistant</h1>
			<div className='flex-grow overflow-y-auto my-10 w-full px-20 space-y-4'>
				{userMessages.map((message, index) => (
					<div
						key={`user-${index}`}
						className='flex flex-col'>
						<div className='px-4 py-2 rounded-3xl bg-neutral-700 text-white w-fit max-w-4/6 self-end'>
							{message}
						</div>

						{aiResponses[index] ? (
							<div className='px-4 py-2 mt-2 text-gray-200 p-4 rounded-lg prose max-w-full'>
								<ReactMarkdown>
									{aiResponses[index]}
								</ReactMarkdown>
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
