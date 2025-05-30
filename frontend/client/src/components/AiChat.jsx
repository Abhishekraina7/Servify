"use client"

import { useState, useEffect, useRef } from "react"
import { Bot, X, Send, Maximize2, Minimize2, AlertCircle, Loader2 } from "lucide-react"
import "./AiChat.css"

function AiChat() {
    const [isOpen, setIsOpen] = useState(false)
    const [isMinimized, setIsMinimized] = useState(false)
    const [messages, setMessages] = useState([
        { id: 1, type: "bot", content: "Hello! I'm your AI monitoring assistant. I can help you analyze server metrics, diagnose issues, and provide recommendations. What would you like to know?" },
    ])
    const [inputValue, setInputValue] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const [aiStatus, setAiStatus] = useState(null)
    const messagesEndRef = useRef(null)
    const inputRef = useRef(null)

    // Get API base URL - adjust this based on your setup
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000'

    // Scroll to bottom of messages when new message is added
    useEffect(() => {
        if (messagesEndRef.current && isOpen && !isMinimized) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages, isOpen, isMinimized])

    // Focus input when chat is opened
    useEffect(() => {
        if (isOpen && !isMinimized && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isOpen, isMinimized])

    // Check AI service status when component mounts
    useEffect(() => {
        checkAiStatus()
    }, [])

    const checkAiStatus = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/ai-status`)
            if (response.ok) {
                const status = await response.json()
                setAiStatus(status)
                if (!status.geminiConfigured) {
                    setError("AI service is not configured. Please contact your administrator.")
                }
            }
        } catch (err) {
            console.error('Failed to check AI status:', err)
            setError("Unable to connect to AI service.")
        }
    }

    const toggleChat = () => {
        setIsOpen(!isOpen)
        if (isMinimized) {
            setIsMinimized(false)
        }
        // Clear error when opening chat
        if (!isOpen) {
            setError(null)
        }
    }

    const toggleMinimize = (e) => {
        e.stopPropagation()
        setIsMinimized(!isMinimized)
    }

    const sendMessage = async (userMessage) => {
        try {
            setIsLoading(true)
            setError(null)

            // Prepare conversation history (exclude the current user message)
            const conversationHistory = messages.map(msg => ({
                type: msg.type === "bot" ? "assistant" : "user",
                content: msg.content
            }))

            const response = await fetch(`${API_BASE_URL}/api/ai-chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage,
                    conversationHistory
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
            }

            const data = await response.json()
            
            // Add bot response
            const botMessage = { 
                id: Date.now() + 1, 
                type: "bot", 
                content: data.response,
                timestamp: data.timestamp
            }
            setMessages(prevMessages => [...prevMessages, botMessage])

        } catch (err) {
            console.error('AI Chat error:', err)
            setError(err.message)
            
            // Add error message to chat
            const errorMessage = { 
                id: Date.now() + 1, 
                type: "bot", 
                content: `Sorry, I encountered an error: ${err.message}. Please try again.`,
                isError: true
            }
            setMessages(prevMessages => [...prevMessages, errorMessage])
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!inputValue.trim() || isLoading) return

        const userMessageContent = inputValue.trim()
        
        // Add user message immediately
        const userMessage = { 
            id: Date.now(), 
            type: "user", 
            content: userMessageContent 
        }
        setMessages(prevMessages => [...prevMessages, userMessage])
        setInputValue("")

        // Send to AI
        await sendMessage(userMessageContent)
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(e)
        }
    }

    const retryLastMessage = () => {
        if (messages.length >= 2) {
            const lastUserMessage = [...messages].reverse().find(msg => msg.type === "user")
            if (lastUserMessage) {
                // Remove the last bot message (which was an error)
                setMessages(prevMessages => 
                    prevMessages.filter((msg, index) => index !== prevMessages.length - 1)
                )
                sendMessage(lastUserMessage.content)
            }
        }
    }

    return (
        <>
            <button 
                className={`ai-chat-button ${isOpen ? "active" : ""}`} 
                onClick={toggleChat} 
                aria-label="AI Assistant"
                title="AI Assistant"
            >
                {isOpen ? <X size={24} /> : <Bot size={24} />}
                {error && !isOpen && (
                    <div className="ai-chat-error-indicator" title="AI service error">
                        <AlertCircle size={12} />
                    </div>
                )}
            </button>

            {isOpen && (
                <div className={`ai-chat-container ${isMinimized ? "minimized" : ""}`}>
                    <div className="ai-chat-header">
                        <div className="ai-chat-title">
                            <Bot size={18} />
                            <span>AI Assistant</span>
                            {aiStatus && (
                                <div className={`ai-status-indicator ${aiStatus.geminiConfigured ? 'online' : 'offline'}`} 
                                     title={aiStatus.geminiConfigured ? 'AI Online' : 'AI Offline'}>
                                    <div className="status-dot"></div>
                                </div>
                            )}
                        </div>
                        <div className="ai-chat-actions">
                            <button
                                className="ai-chat-action"
                                onClick={toggleMinimize}
                                aria-label={isMinimized ? "Maximize chat" : "Minimize chat"}
                            >
                                {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                            </button>
                            <button className="ai-chat-action" onClick={toggleChat} aria-label="Close chat">
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {!isMinimized && (
                        <>
                            {error && (
                                <div className="ai-chat-error">
                                    <AlertCircle size={16} />
                                    <span>{error}</span>
                                    <button 
                                        className="ai-chat-retry"
                                        onClick={() => setError(null)}
                                        title="Dismiss error"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            )}

                            <div className="ai-chat-messages">
                                {messages.map((message) => (
                                    <div key={message.id} className={`ai-chat-message ${message.type} ${message.isError ? 'error' : ''}`}>
                                        {message.type === "bot" && (
                                            <div className="ai-chat-icon-container">
                                                <Bot size={16} className="ai-chat-icon" />
                                            </div>
                                        )}
                                        <div className="ai-chat-bubble">
                                            {message.content}
                                            {message.isError && (
                                                <button 
                                                    className="ai-chat-retry-button"
                                                    onClick={retryLastMessage}
                                                    title="Retry message"
                                                >
                                                    Retry
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                
                                {isLoading && (
                                    <div className="ai-chat-message bot">
                                        <div className="ai-chat-icon-container">
                                            <Loader2 size={16} className="ai-chat-icon spinning" />
                                        </div>
                                        <div className="ai-chat-bubble typing">
                                            <div className="typing-indicator">
                                                <span></span>
                                                <span></span>
                                                <span></span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                <div ref={messagesEndRef} />
                            </div>

                            <form className="ai-chat-input-container" onSubmit={handleSubmit}>
                                <textarea
                                    ref={inputRef}
                                    className="ai-chat-input"
                                    placeholder={isLoading ? "AI is thinking..." : "Ask about your servers, metrics, or monitoring..."}
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    disabled={isLoading || (aiStatus && !aiStatus.geminiConfigured)}
                                    rows={1}
                                    style={{
                                        resize: 'none',
                                        overflow: 'hidden',
                                        minHeight: '40px',
                                        maxHeight: '120px'
                                    }}
                                    onInput={(e) => {
                                        // Auto-resize textarea
                                        e.target.style.height = 'auto'
                                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                                    }}
                                />
                                <button 
                                    type="submit" 
                                    className="ai-chat-send" 
                                    disabled={!inputValue.trim() || isLoading || (aiStatus && !aiStatus.geminiConfigured)}
                                    aria-label="Send message"
                                >
                                    {isLoading ? (
                                        <Loader2 size={16} className="spinning" />
                                    ) : (
                                        <Send size={16} />
                                    )}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            )}
        </>
    )
}

export default AiChat