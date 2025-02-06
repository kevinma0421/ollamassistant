'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

export default function Home() {
	const [input, setInput] = useState('');
	const [userMessages, setUserMessages] = useState<string[]>([]); // User inputs
	const [aiResponses, setAiResponses] = useState<string[]>([]); // LLM responses

	// Handle pasted text from Electron
	useEffect(() => {
		window.electron?.on('pasteText', (event, text) => {
			setInput(text);
		});
	}, []);

	const handleQuery = async () => {
		if (!input.trim()) return;

		try {
			// Add the user's input to userMessages
			setUserMessages((prev) => [...prev, input]);

			// Fetch AI response
			const res = await axios.post(
				'http://127.0.0.1:5000/chat',
				{ message: input },
				{ withCredentials: true }
			);

			// ✅ Preserve markdown formatting, replace <br> with newlines
			console.log(res.data.response);
			const cleanedResponse = res.data.response
				.replace(/<\/?think>/g, '')
				.replace(/<br>/g, '\n');

			// Add AI response to aiResponses
			setAiResponses((prev) => [...prev, cleanedResponse]);
		} catch (error) {
			console.error('Error fetching AI response:', error);
		}
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === 'Enter') {
			event.preventDefault(); // Prevent form submission (if inside a form)
			handleQuery();
			setInput('');
		}
	};

	return (
		<div className='flex flex-col h-screen items-center p-4 bg-zinc-800 justify-between'>
			<h1 className='text-2xl font-bold text-gray-200'>LLM Assistant</h1>
			<div className='flex-grow overflow-y-auto my-10 w-full px-20 space-y-4'>
				{/* Render messages */}
				{userMessages.map((message, index) => (
					<div
						key={`user-${index}`}
						className='flex flex-col'>
						{/* User message */}
						<div className='px-4 py-2 rounded-full bg-neutral-700 text-white w-fit self-end'>
							{message}
						</div>

						{/* AI response */}
						{aiResponses[index] ? (
							<div className='px-4 py-2 mt-2 text-gray-200 bg-neutral-800 p-4 rounded-lg prose max-w-full'>
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
			<input
				className='w-full max-w-[calc(100%-10rem)] h-10 p-2 text-gray-200 select-none outline-none bg-neutral-700 rounded-xl placeholder-gray-400'
				value={input}
				onChange={(e) => setInput(e.target.value)}
				onKeyDown={handleKeyDown} // Listen for Enter key
				placeholder='Type and press Enter...'
			/>
		</div>
	);
}
