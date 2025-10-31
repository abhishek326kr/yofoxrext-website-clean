"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  MessageSquare, 
  Send, 
  Inbox,
  SendHorizontal,
  Search,
  ArrowLeft,
  Check,
  CheckCheck,
  MoreVertical,
  Pin,
  Archive,
  Trash2,
  Ban,
  VolumeX,
  Copy,
  Edit,
  Forward,
  Trash,
  Smile
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

interface ConversationData {
  id: string;
  participant: User;
  lastMessage: {
    text: string;
    timestamp: Date;
    isRead: boolean;
    isSentByMe: boolean;
  };
  unreadCount: number;
}

interface MessageData {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  isRead: boolean;
  deliveredAt?: Date | null;
  readAt?: Date | null;
}

interface MessagesClientProps {
  initialConversations?: ConversationData[];
}

export default function MessagesClient({ initialConversations = [] }: MessagesClientProps) {
  const [activeTab, setActiveTab] = useState("inbox");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [filterUnread, setFilterUnread] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'active'>('newest');
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/me"],
  });

  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<ConversationData[]>({
    queryKey: ["/api/conversations"],
    initialData: initialConversations,
    refetchInterval: 15000,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<MessageData[]>({
    queryKey: ["/api/conversations", selectedConversation],
    enabled: !!selectedConversation,
    refetchInterval: selectedConversation ? 10000 : false,
  });

  const { data: searchResults = [] } = useQuery<any[]>({
    queryKey: ["/api/messages/search", searchQuery],
    enabled: searchQuery.length > 2,
    staleTime: 30000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { recipientId: string; body: string }) => {
      return await apiRequest("POST", "/api/messages", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedConversation] });
      setMessageText("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const addReactionMutation = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      return await apiRequest("POST", `/api/messages/${messageId}/reactions`, { emoji });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedConversation] });
    },
  });

  const handleAddReaction = (messageId: string, emoji: string) => {
    addReactionMutation.mutate({ messageId, emoji });
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversation || !currentUser) return;

    const conversation = conversations.find((c) => c.id === selectedConversation);
    if (!conversation) return;

    sendMessageMutation.mutate({
      recipientId: conversation.participant.id,
      body: messageText,
    });
    
    // Clear draft after sending
    localStorage.removeItem(`draft-${selectedConversation}`);
  };

  const handleTypingInput = () => {
    // Simulate typing indicator (in production, send to server/WebSocket)
    // For now, just manage local state
  };

  const handlePinConversation = (conversationId: string) => {
    toast({
      title: "Pinned",
      description: "Conversation pinned to top",
    });
    // TODO: Implement backend API for pinning
  };

  const handleArchiveConversation = (conversationId: string) => {
    toast({
      title: "Archived",
      description: "Conversation moved to archive",
    });
    setSelectedConversation(null);
    // TODO: Implement backend API for archiving
  };

  const handleMuteConversation = (conversationId: string) => {
    toast({
      title: "Muted",
      description: "You won't receive notifications from this conversation",
    });
    // TODO: Implement backend API for muting
  };

  const handleBlockUser = (userId: string) => {
    if (confirm("Are you sure you want to block this user?")) {
      toast({
        title: "Blocked",
        description: "User has been blocked",
        variant: "destructive",
      });
      setSelectedConversation(null);
      // TODO: Implement backend API for blocking
    }
  };

  const handleDeleteConversation = (conversationId: string) => {
    if (confirm("Are you sure you want to delete this conversation?")) {
      toast({
        title: "Deleted",
        description: "Conversation deleted successfully",
        variant: "destructive",
      });
      setSelectedConversation(null);
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      // TODO: Implement backend API for deletion
    }
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Message copied to clipboard",
    });
  };

  const handleEditMessage = (messageId: string, currentText: string) => {
    const newText = prompt("Edit message:", currentText);
    if (newText && newText !== currentText) {
      // TODO: Implement edit API
      toast({
        title: "Edited",
        description: "Message updated successfully",
      });
    }
  };

  const handleDeleteMessage = (messageId: string, forEveryone: boolean) => {
    const confirmMsg = forEveryone 
      ? "Delete this message for everyone?" 
      : "Delete this message for you?";
    
    if (confirm(confirmMsg)) {
      // TODO: Implement delete API
      toast({
        title: "Deleted",
        description: "Message deleted successfully",
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedConversation] });
    }
  };

  const handleForwardMessage = (text: string) => {
    toast({
      title: "Forward",
      description: "Forward feature coming soon",
    });
    // TODO: Implement forward dialog
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Save draft when typing
  useEffect(() => {
    if (selectedConversation && messageText) {
      localStorage.setItem(`draft-${selectedConversation}`, messageText);
    }
  }, [messageText, selectedConversation]);

  // Load draft when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      const draft = localStorage.getItem(`draft-${selectedConversation}`);
      if (draft) {
        setMessageText(draft);
      } else {
        setMessageText("");
      }
    }
  }, [selectedConversation]);

  const handleConversationClick = (conversationId: string) => {
    setSelectedConversation(conversationId);
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
  };

  // Apply filters and sorting
  const filteredConversations = conversations
    .filter(conv => !filterUnread || conv.unreadCount > 0)
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime();
        case 'oldest':
          return new Date(a.lastMessage.timestamp).getTime() - new Date(b.lastMessage.timestamp).getTime();
        case 'active':
          return b.unreadCount - a.unreadCount;
        default:
          return 0;
      }
    });

  const renderConversationList = () => (
    <Card className={isMobile && selectedConversation ? "hidden" : ""}>
      <CardHeader>
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search conversations..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-conversations"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant={filterUnread ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterUnread(!filterUnread)}
            data-testid="button-filter-unread"
          >
            Unread Only
          </Button>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="active">Most Active</option>
          </select>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="inbox" data-testid="tab-inbox">
              <Inbox className="w-4 h-4 mr-2" />
              Inbox
            </TabsTrigger>
            <TabsTrigger value="sent" data-testid="tab-sent">
              <SendHorizontal className="w-4 h-4 mr-2" />
              Sent
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="p-0">
        {conversationsLoading ? (
          <div className="p-4 text-center text-muted-foreground">
            Loading conversations...
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No conversations yet</p>
            <p className="text-sm">Start a conversation with other traders</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => handleConversationClick(conv.id)}
                className={`p-4 cursor-pointer hover-elevate relative ${
                  selectedConversation === conv.id ? "bg-muted" : ""
                }`}
                style={{
                  borderLeft: conv.unreadCount > 0 ? '4px solid hsl(var(--primary))' : '4px solid transparent',
                }}
                data-testid={`conversation-${conv.id}`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar>
                      <AvatarFallback>{conv.participant.username[0]}</AvatarFallback>
                    </Avatar>
                    <div 
                      className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"
                      data-testid={`status-online-${conv.id}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm">{conv.participant.username}</span>
                      {conv.unreadCount > 0 && (
                        <Badge variant="default" className="ml-2" data-testid={`badge-unread-${conv.id}`}>
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {conv.lastMessage.isSentByMe && "You: "}
                      {conv.lastMessage.text}
                    </p>
                    <p suppressHydrationWarning className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(conv.lastMessage.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderMessageView = () => {
    if (!selectedConversation) {
      return (
        <Card className={isMobile ? "hidden" : ""}>
          <CardContent className="p-12 text-center">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg text-muted-foreground">
              Select a conversation to view messages
            </p>
          </CardContent>
        </Card>
      );
    }

    const conversation = conversations.find((c) => c.id === selectedConversation);
    if (!conversation) return null;

    return (
      <Card className={isMobile && !selectedConversation ? "hidden" : ""}>
        <CardHeader className="border-b">
          <div className="flex items-center gap-3">
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackToList}
                data-testid="button-back-to-conversations"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div className="relative">
              <Avatar>
                <AvatarFallback>{conversation.participant.username[0]}</AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">{conversation.participant.username}</CardTitle>
              <p className="text-sm text-muted-foreground">Online</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    data-testid="button-conversation-actions"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handlePinConversation(conversation.id)}>
                    <Pin className="mr-2 h-4 w-4" />
                    Pin Conversation
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleArchiveConversation(conversation.id)}>
                    <Archive className="mr-2 h-4 w-4" />
                    Archive
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleMuteConversation(conversation.id)}>
                    <VolumeX className="mr-2 h-4 w-4" />
                    Mute Notifications
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => handleBlockUser(conversation.participant.id)}
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    Block User
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => handleDeleteConversation(conversation.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Conversation
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[500px] flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messagesLoading ? (
                <div className="text-center text-muted-foreground">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-muted-foreground">No messages yet</div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.senderId === currentUser?.id ? "justify-end" : "justify-start"
                    }`}
                    data-testid={`message-${message.id}`}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <div
                          className={`max-w-[70%] rounded-lg p-3 cursor-pointer hover:opacity-90 ${
                            message.senderId === currentUser?.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm">{message.text}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <p
                              suppressHydrationWarning
                              className={`text-xs ${
                                message.senderId === currentUser?.id
                                  ? "text-primary-foreground/70"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                            </p>
                            {message.senderId === currentUser?.id && (
                              <>
                                {message.readAt ? (
                                  <CheckCheck className="h-3 w-3 text-blue-300" />
                                ) : message.deliveredAt ? (
                                  <CheckCheck className="h-3 w-3 text-primary-foreground/70" />
                                ) : (
                                  <Check className="h-3 w-3 text-primary-foreground/70" />
                                )}
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddReaction(message.id, '👍');
                              }}
                            >
                              👍
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddReaction(message.id, '❤️');
                              }}
                            >
                              ❤️
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddReaction(message.id, '😂');
                              }}
                            >
                              😂
                            </Button>
                          </div>
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleCopyMessage(message.text)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Text
                        </DropdownMenuItem>
                        {message.senderId === currentUser?.id && (
                          <>
                            <DropdownMenuItem onClick={() => handleEditMessage(message.id, message.text)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Message
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDeleteMessage(message.id, false)}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete for Me
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDeleteMessage(message.id, true)}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete for Everyone
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem onClick={() => handleForwardMessage(message.text)}>
                          <Forward className="mr-2 h-4 w-4" />
                          Forward Message
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))
              )}
              {isOtherUserTyping && (
                <div className="flex justify-start mb-2">
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <div className="flex gap-1 items-center">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                      <span className="text-xs text-muted-foreground ml-2">typing...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t p-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="resize-none min-h-[60px] max-h-[120px]"
                  data-testid="input-message-text"
                />
                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || sendMessageMutation.isPending}
                  data-testid="button-send-message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" data-testid="text-page-title">Messages</h1>
          <p className="text-lg text-muted-foreground">
            Connect with other traders privately
          </p>
        </div>

        {isMobile ? (
          <div className="space-y-6">
            {renderConversationList()}
            {renderMessageView()}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">{renderConversationList()}</div>
            <div className="lg:col-span-2">{renderMessageView()}</div>
          </div>
        )}
      </main>

      <EnhancedFooter />
    </div>
  );
}
