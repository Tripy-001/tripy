'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, 
  Send, 
  X, 
  Minimize2, 
  Maximize2,
  AlertCircle,
  Bot,
  User as UserIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatAssistantProps {
  tripId: string;
  className?: string;
}

export default function ChatAssistant({ tripId, className }: ChatAssistantProps) {
  const {
    chatMessages,
    isChatConnected,
    chatError,
    isTyping,
    connectChat,
    disconnectChat,
    sendChatMessage,
    setChatError,
  } = useAppStore();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastMessageCountRef = useRef(0);

  // Connect to chat when component mounts or tripId changes
  useEffect(() => {
    if (tripId) {
      connectChat(tripId);
    }

    // Cleanup: disconnect when component unmounts
    return () => {
      disconnectChat();
    };
  }, [tripId, connectChat, disconnectChat]);

  // Auto-scroll to bottom when new messages arrive and handle unread count
  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
      // Reset unread count when chat is open and visible
      setUnreadCount(0);
      lastMessageCountRef.current = chatMessages.length;
    } else if (!isOpen && chatMessages.length > lastMessageCountRef.current) {
      // Only increment unread count for NEW messages while chat is closed
      const newMessages = chatMessages.slice(lastMessageCountRef.current);
      const newAiMessages = newMessages.filter(msg => msg.sender === 'ai').length;
      if (newAiMessages > 0) {
        setUnreadCount((prev) => prev + newAiMessages);
      }
      lastMessageCountRef.current = chatMessages.length;
    }
  }, [chatMessages, isOpen, isMinimized]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!inputMessage.trim()) return;
    if (!isChatConnected) {
      setChatError('Not connected to chat server');
      return;
    }

    sendChatMessage(inputMessage);
    setInputMessage('');
    
    // Focus back on input after sending
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleChat = () => {
    const newOpenState = !isOpen;
    setIsOpen(newOpenState);
    if (newOpenState && isMinimized) {
      setIsMinimized(false);
    }
  };

  const toggleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMinimized(!isMinimized);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    setIsMinimized(false);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(date));
  };

  // Floating chat button when closed
  if (!isOpen) {
    return (
      <div className={cn('fixed bottom-6 right-6 z-50', className)}>
        <Button
          onClick={toggleChat}
          size="lg"
          className="h-16 w-16 rounded-full shadow-2xl theme-bg theme-bg-hover relative hover:scale-105 transition-transform"
          aria-label="Tripy Guide"
        >
          <MessageCircle className="h-7 w-7 text-white" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs font-bold shadow-lg"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  // Chat window
  return (
    <div className={cn('fixed bottom-6 right-6 z-50', className)}>
      <Card className={cn(
        'w-[400px] shadow-2xl transition-all duration-300 border-2',
        isMinimized ? 'h-auto' : 'h-[650px]',
        'flex flex-col'
      )}>
        {/* Header */}
        <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between space-y-0 pb-3 pt-4 px-4 border-b bg-gradient-to-r from-background to-muted/30">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full theme-bg flex items-center justify-center shadow-md">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">Tripy Guide</CardTitle>
              <div className="flex items-center space-x-1 mt-0.5">
                {isChatConnected ? (
                  <>
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-green-600 font-medium">Connected</span>
                  </>
                ) : (
                  <>
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    <span className="text-xs text-red-600 font-medium">Disconnected</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleMinimize}
              aria-label={isMinimized ? 'Maximize chat' : 'Minimize chat'}
            >
              {isMinimized ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleClose}
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        {/* Content - only show when not minimized */}
        {!isMinimized && (
          <CardContent className="flex-1 p-0 flex flex-col min-h-0 overflow-hidden">
            {/* Error Banner */}
            {chatError && (
              <div className="flex-shrink-0 px-4 py-3 bg-red-50 border-b border-red-200 flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <span className="text-sm text-red-700 flex-1">{chatError}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setChatError(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4 min-h-0" ref={scrollAreaRef}>
              {chatMessages.length === 0 && !isTyping ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-8">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                    <MessageCircle className="h-10 w-10 text-primary/60" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-foreground">Start a conversation</h3>
                    <p className="text-sm text-muted-foreground max-w-[280px] leading-relaxed">
                      Ask me anything about your trip, get recommendations, or modify your itinerary!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pb-2">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        'flex items-start gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300',
                        message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                      )}
                    >
                      {/* Avatar */}
                      <div
                        className={cn(
                          'h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm',
                          message.sender === 'user' 
                            ? 'bg-primary' 
                            : 'theme-bg'
                        )}
                      >
                        {message.sender === 'user' ? (
                          <UserIcon className="h-4 w-4 text-white" />
                        ) : (
                          <Bot className="h-4 w-4 text-white" />
                        )}
                      </div>

                      {/* Message Bubble */}
                      <div
                        className={cn(
                          'flex flex-col gap-1 max-w-[75%]',
                          message.sender === 'user' ? 'items-end' : 'items-start'
                        )}
                      >
                        <div
                          className={cn(
                            'rounded-2xl px-4 py-2.5 shadow-sm',
                            message.sender === 'user'
                              ? 'bg-primary text-primary-foreground rounded-tr-md'
                              : 'bg-muted text-foreground rounded-tl-md'
                          )}
                        >
                          <p className="text-sm whitespace-pre-line leading-relaxed break-words">
                            {message.text}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground px-2">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex items-start gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="h-8 w-8 rounded-full theme-bg flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-muted rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                        <div className="flex items-center gap-1">
                          <div className="h-2 w-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }} />
                          <div className="h-2 w-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '200ms', animationDuration: '1s' }} />
                          <div className="h-2 w-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '400ms', animationDuration: '1s' }} />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input Area */}
            <div className="flex-shrink-0 p-4 border-t bg-muted/30">
              <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    type="text"
                    placeholder={isChatConnected ? "Type your message..." : "Connecting..."}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={!isChatConnected || isTyping}
                    className="pr-4 min-h-[44px] resize-none bg-background"
                    autoComplete="off"
                  />
                </div>
                <Button
                  type="submit"
                  size="icon"
                  disabled={!isChatConnected || !inputMessage.trim() || isTyping}
                  className="theme-bg theme-bg-hover h-11 w-11 flex-shrink-0 shadow-md hover:shadow-lg transition-shadow"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              {isTyping && (
                <p className="text-xs text-muted-foreground mt-2 animate-pulse">
                  AI is thinking...
                </p>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
