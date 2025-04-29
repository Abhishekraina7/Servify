"use client"

import { useState, useEffect, useRef } from "react"
import { Bot, X, Send, Maximize2, Minimize2 } from "lucide-react"
import "./AiChat.css"

function AiChat() {
    const [isOpen, setIsOpen] = useState(false)
    const [isMinimized, setIsMinimized] = useState(false)
    const [messages, setMessages] = useState([
        { id: 1, type: "bot", content: "Hello! How can I help you with your server monitoring today?" },
    ])
    const [inputValue, setInputValue] = useState("")
    const messagesEndRef = useRef(null)
    const inputRef = useRef(null)

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

    const toggleChat = () => {
        setIsOpen(!isOpen)
        if (isMinimized) {
            setIsMinimized(false)
        }
    }

    const toggleMinimize = (e) => {
        e.stopPropagation()
        setIsMinimized(!isMinimized)
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!inputValue.trim()) return

        // Add user message
        const userMessage = { id: Date.now(), type: "user", content: inputValue }
        setMessages([...messages, userMessage])
        setInputValue("")

        // Simulate AI response after a short delay
        setTimeout(() => {
            const botResponses = [
                "I'm analyzing your server metrics now. CPU usage appears normal.",
                "Your memory usage is trending upward. Consider optimizing your applications.",
                "I've detected some network latency. Would you like me to investigate further?",
                "All systems are operating within normal parameters.",
                "Based on current trends, you might want to consider scaling resources soon.",
            ]
            const randomResponse = botResponses[Math.floor(Math.random() * botResponses.length)]
            const botMessage = { id: Date.now() + 1, type: "bot", content: randomResponse }
            setMessages((prevMessages) => [...prevMessages, botMessage])
        }, 1000)
    }

    return (
        <>
            <button className={`ai-chat-button ${isOpen ? "active" : ""}`} onClick={toggleChat} aria-label="AI Assistant">
                {isOpen ? <X size={24} /> : <Bot size={24} />}
            </button>

            {isOpen && (
                <div className={`ai-chat-container ${isMinimized ? "minimized" : ""}`}>
                    <div className="ai-chat-header">
                        <div className="ai-chat-title">
                            <Bot size={18} />
                            <span>AI Assistant</span>
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
                            <div className="ai-chat-messages">
                                {messages.map((message) => (
                                    <div key={message.id} className={`ai-chat-message ${message.type}`}>
                                        {message.type === "bot" && <Bot size={16} className="ai-chat-icon" />}
                                        <div className="ai-chat-bubble">{message.content}</div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            <form className="ai-chat-input-container" onSubmit={handleSubmit}>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    className="ai-chat-input"
                                    placeholder="Type your message..."
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                />
                                <button type="submit" className="ai-chat-send" disabled={!inputValue.trim()} aria-label="Send message">
                                    <Send size={16} />
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
