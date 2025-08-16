import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Send, Bot, Plus, Trash2 } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { User, ChatSession, ChatMessage, CreateChatSessionInput, CreateChatMessageInput, MessageType } from '../../../server/src/schema';

interface ChatProps {
  currentUser: User | null;
}

export function Chat({ currentUser }: ChatProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSessions = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const result = await trpc.getChatSessionsByUser.query({ userId: currentUser.id });
      setSessions(result);
      
      // If no active session but sessions exist, select the first one
      if (!activeSession && result.length > 0) {
        setActiveSession(result[0]);
      }
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
    }
  }, [currentUser, activeSession]);

  const loadMessages = useCallback(async () => {
    if (!activeSession) return;
    
    try {
      setIsLoading(true);
      const result = await trpc.getChatMessagesBySession.query({ sessionId: activeSession.id });
      setMessages(result);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeSession]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const createNewSession = async () => {
    if (!currentUser) return;

    try {
      const sessionData: CreateChatSessionInput = {
        user_id: currentUser.id,
        title: `New Conversation - ${new Date().toLocaleDateString()}`
      };
      
      const newSession = await trpc.createChatSession.mutate(sessionData);
      setSessions((prev: ChatSession[]) => [newSession, ...prev]);
      setActiveSession(newSession);
      setMessages([]);
    } catch (error) {
      console.error('Failed to create new session:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession || !newMessage.trim() || isSending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    try {
      // Send user message
      const userMessageData: CreateChatMessageInput = {
        session_id: activeSession.id,
        message_type: 'User',
        content: messageContent
      };
      
      const userMessage = await trpc.createChatMessage.mutate(userMessageData);
      setMessages((prev: ChatMessage[]) => [...prev, userMessage]);
      
      // Simulate AI response with a delay
      setTimeout(async () => {
        try {
          const aiResponses = [
            "That's a great question! Based on your goals and progress, I'd recommend focusing on skill development in areas that align with your career objectives.",
            "I can help you track your professional growth! Let me suggest some strategies based on your current achievements and goals.",
            "Your recent achievements show excellent progress. Have you considered setting stretch goals to challenge yourself further?",
            "It looks like you're doing well with goal completion. How about we work on identifying areas for improvement?",
            "I notice you've been consistent with your professional development. Would you like suggestions for new learning opportunities?",
            "Based on your profile, I can recommend some specific actions to help accelerate your career growth.",
            "That's an interesting point. Let me analyze your achievement patterns and provide personalized recommendations.",
            "I can see you're committed to professional growth. What specific areas would you like to focus on next?"
          ];
          
          const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
          
          const aiMessageData: CreateChatMessageInput = {
            session_id: activeSession.id,
            message_type: 'Assistant',
            content: randomResponse
          };
          
          const aiMessage = await trpc.createChatMessage.mutate(aiMessageData);
          setMessages((prev: ChatMessage[]) => [...prev, aiMessage]);
          setTimeout(scrollToBottom, 100);
        } catch (error) {
          console.error('Failed to send AI response:', error);
        } finally {
          setIsSending(false);
        }
      }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
      
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsSending(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Please sign in to access the AI assistant.</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6">
      {/* Sessions Sidebar */}
      <div className="lg:w-80 flex-shrink-0">
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Conversations
              </CardTitle>
              <Button size="sm" onClick={createNewSession}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>
              Chat with your AI career assistant
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 pb-4">
            <ScrollArea className="h-[calc(100vh-16rem)]">
              <div className="space-y-2 p-4 pt-0">
                {sessions.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No conversations yet</p>
                  </div>
                ) : (
                  sessions.map((session: ChatSession) => (
                    <button
                      key={session.id}
                      onClick={() => setActiveSession(session)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        activeSession?.id === session.id
                          ? 'bg-blue-50 border-blue-200 text-blue-800'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {session.title || `Chat ${session.id}`}
                          </p>
                          <p className="text-xs text-slate-500">
                            {session.created_at.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {!activeSession ? (
          <Card className="flex-1 flex items-center justify-center">
            <CardContent className="text-center">
              <Bot className="h-16 w-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-medium text-slate-800 mb-2">Welcome to your AI Assistant</h3>
              <p className="text-slate-600 mb-4">
                Start a conversation to get personalized career guidance and track your professional growth.
              </p>
              <Button onClick={createNewSession}>
                <Plus className="h-4 w-4 mr-2" />
                Start New Conversation
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="flex-1 flex flex-col">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-blue-600" />
                AI Career Assistant
              </CardTitle>
              <CardDescription>
                Get personalized advice on your professional development
              </CardDescription>
            </CardHeader>
            
            {/* Messages */}
            <div className="flex-1 flex flex-col">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="text-center py-8 text-slate-500">
                      <p>Loading conversation...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Start the conversation! Ask me anything about your career growth.</p>
                      <div className="mt-4 space-y-2 text-sm">
                        <p className="text-slate-400">Try asking:</p>
                        <div className="space-y-1 text-left max-w-md mx-auto">
                          <p>• "How can I improve my goal completion rate?"</p>
                          <p>• "What skills should I focus on developing?"</p>
                          <p>• "Can you analyze my achievement patterns?"</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    messages.map((message: ChatMessage) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.message_type === 'User' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {message.message_type === 'Assistant' && (
                          <Avatar className="h-8 w-8 bg-blue-100">
                            <AvatarFallback>
                              <Bot className="h-4 w-4 text-blue-600" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.message_type === 'User'
                              ? 'bg-blue-600 text-white ml-12'
                              : 'bg-slate-100 text-slate-800 mr-12'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.message_type === 'User' 
                              ? 'text-blue-100' 
                              : 'text-slate-500'
                          }`}>
                            {message.created_at.toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                        {message.message_type === 'User' && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={currentUser.profile_picture || undefined} />
                            <AvatarFallback>
                              {currentUser.first_name[0]}{currentUser.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))
                  )}
                  {isSending && (
                    <div className="flex gap-3 justify-start">
                      <Avatar className="h-8 w-8 bg-blue-100">
                        <AvatarFallback>
                          <Bot className="h-4 w-4 text-blue-600" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-slate-100 text-slate-800 px-4 py-2 rounded-lg mr-12">
                        <div className="flex items-center gap-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                          <span className="text-xs text-slate-500">AI is typing...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="border-t p-4">
                <form onSubmit={sendMessage} className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)}
                    placeholder="Ask your AI assistant anything..."
                    disabled={isSending}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={!newMessage.trim() || isSending}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}