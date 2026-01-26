import React, { useState, useRef, useEffect, useContext } from 'react';
import axios from 'axios';
import { AppContext } from '../context/AppContext';

const ChatBot = () => {
    const { backendUrl } = useContext(AppContext);
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'bot',
            content: 'Hello! 👋 I\'m the Appointy AI assistant. How can I help you today?'
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const quickActions = [
        { label: '📅 Book Appointment', message: 'How do I book an appointment?' },
        { label: '👨‍⚕️ Find Doctors', message: 'How can I find doctors by specialty?' },
        { label: '⏰ Timings', message: 'What are your working hours?' },
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const sendMessage = async (messageText) => {
        if (!messageText.trim() || isLoading) return;

        const userMessage = { role: 'user', content: messageText };
        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);

        try {
            const { data } = await axios.post(`${backendUrl}/api/chat`, {
                message: messageText,
                sessionId: 'user-session'
            });

            if (data.success) {
                setMessages(prev => [...prev, { role: 'bot', content: data.message }]);
            } else {
                setMessages(prev => [...prev, {
                    role: 'bot',
                    content: 'Sorry, I encountered an error. Please try again.'
                }]);
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                role: 'bot',
                content: 'Sorry, I\'m having trouble connecting. Please try again later.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        sendMessage(inputMessage);
    };

    const handleQuickAction = (message) => {
        sendMessage(message);
    };

    return (
        <>
            {/* Floating Chat Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-primary rounded-full shadow-lg 
                           flex items-center justify-center text-white text-2xl z-50
                           hover:scale-110 transition-all duration-300 hover:shadow-xl"
                aria-label="Open chat"
            >
                {isOpen ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                )}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 w-[360px] max-w-[calc(100vw-48px)] h-[500px] max-h-[70vh]
                                bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl z-50
                                flex flex-col overflow-hidden border border-gray-200
                                animate-[slideUp_0.3s_ease-out]">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-primary to-indigo-600 text-white p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <span className="text-xl">🏥</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold">Appointy Assistant</h3>
                            <p className="text-xs text-white/80">AI-powered help</p>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed
                                        ${msg.role === 'user'
                                            ? 'bg-primary text-white rounded-br-md'
                                            : 'bg-gray-100 text-gray-800 rounded-bl-md'
                                        }`}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        ))}

                        {/* Typing indicator */}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-gray-100 p-3 rounded-2xl rounded-bl-md">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Actions */}
                    {messages.length <= 2 && (
                        <div className="px-4 pb-2 flex flex-wrap gap-2">
                            {quickActions.map((action, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleQuickAction(action.message)}
                                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 
                                               px-3 py-1.5 rounded-full transition-colors"
                                >
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input Form */}
                    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-100">
                        <div className="flex gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                placeholder="Type your message..."
                                className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm
                                           focus:outline-none focus:ring-2 focus:ring-primary/50"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !inputMessage.trim()}
                                className="w-10 h-10 bg-primary text-white rounded-full 
                                           flex items-center justify-center
                                           hover:bg-primary/90 disabled:opacity-50 
                                           disabled:cursor-not-allowed transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Animation styles */}
            <style>{`
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </>
    );
};

export default ChatBot;
