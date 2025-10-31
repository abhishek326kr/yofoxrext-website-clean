"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: number;
  sender: string;
  content: string;
  createdAt: string;
}

interface Ticket {
  id: number;
  username: string;
  subject: string;
  status: string;
  priority: string;
  category?: string;
  createdAt: string;
  messages?: Message[];
  tags?: string[];
}

interface SupportStats {
  openTickets: number;
  avgResponseTime: string;
  avgResolutionTime: string;
  satisfactionScore: number;
}

export default function Support() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const { toast } = useToast();

  const { data: ticketsRaw, isLoading: ticketsLoading } = useQuery<Ticket[]>({
    queryKey: ["/api/admin/support/tickets", { status: statusFilter, priority: priorityFilter, category: categoryFilter }]
  });

  const tickets: Ticket[] = Array.isArray(ticketsRaw) ? ticketsRaw : [];

  const { data: statsRaw, isLoading: statsLoading } = useQuery<SupportStats>({
    queryKey: ["/api/admin/support/stats"]
  });

  const stats: SupportStats = statsRaw || {
    openTickets: 0,
    avgResponseTime: '0h',
    avgResolutionTime: '0h',
    satisfactionScore: 0
  };

  const updateTicketMutation = useMutation({
    mutationFn: async ({ ticketId, data }: { ticketId: number; data: any }) => {
      return apiRequest("PUT", `/api/admin/support/tickets/${ticketId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support/tickets"] });
      toast({ title: "Ticket updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update ticket", variant: "destructive" });
    }
  });

  const replyToTicketMutation = useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: number; message: string }) => {
      return apiRequest("POST", `/api/admin/support/tickets/${ticketId}/reply`, { message });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support/tickets"] });
      toast({ title: "Reply sent successfully" });
    },
    onError: () => {
      toast({ title: "Failed to send reply", variant: "destructive" });
    }
  });

  const closeTicketMutation = useMutation({
    mutationFn: async (ticketId: number) => {
      return apiRequest("POST", `/api/admin/support/tickets/${ticketId}/close`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support/tickets"] });
      toast({ title: "Ticket closed" });
      setSelectedTicket(null);
    },
    onError: () => {
      toast({ title: "Failed to close ticket", variant: "destructive" });
    }
  });

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Support & Tickets</h1>

      {/* Stats Cards */}
      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card data-testid="card-open-tickets">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-open-tickets">
                {stats.openTickets}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting response</p>
            </CardContent>
          </Card>

          <Card data-testid="card-avg-response-time">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-avg-response-time">
                {stats.avgResponseTime}
              </div>
              <p className="text-xs text-muted-foreground">Time to first response</p>
            </CardContent>
          </Card>

          <Card data-testid="card-avg-resolution-time">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-avg-resolution-time">
                {stats.avgResolutionTime}
              </div>
              <p className="text-xs text-muted-foreground">Time to close</p>
            </CardContent>
          </Card>

          <Card data-testid="card-satisfaction-score">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Satisfaction Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-satisfaction-score">
                {stats.satisfactionScore}%
              </div>
              <p className="text-xs text-muted-foreground">User satisfaction</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-priority-filter">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-category-filter">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="billing">Billing</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      {ticketsLoading ? (
        <Skeleton className="h-96" />
      ) : (
        <Card data-testid="card-tickets">
          <CardHeader>
            <CardTitle>Support Tickets ({tickets.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket #</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.length > 0 ? (
                    tickets.map((ticket) => (
                      <TableRow key={ticket.id} data-testid={`ticket-${ticket.id}`}>
                        <TableCell>#{ticket.id}</TableCell>
                        <TableCell>{ticket.username}</TableCell>
                        <TableCell>{ticket.subject}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{ticket.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPriorityVariant(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedTicket(ticket)}
                            data-testid={`button-view-ticket-${ticket.id}`}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No tickets found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-3xl" data-testid="dialog-ticket-detail">
          <DialogHeader>
            <DialogTitle>Ticket #{selectedTicket?.id}</DialogTitle>
            <DialogDescription>
              {selectedTicket?.subject}
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-4">
              {/* Ticket Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">User</p>
                  <p className="font-medium">{selectedTicket.username}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant="outline">{selectedTicket.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Priority</p>
                  <Badge variant={getPriorityVariant(selectedTicket.priority)}>
                    {selectedTicket.priority}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">{selectedTicket.category || 'N/A'}</p>
                </div>
              </div>

              <Separator />

              {/* Conversation Thread */}
              <div className="space-y-2">
                <Label>Conversation</Label>
                <div className="border rounded-md p-4 space-y-4 max-h-96 overflow-y-auto">
                  {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                    selectedTicket.messages.map((message: Message) => (
                      <div key={message.id} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{message.sender}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        <p className="text-sm">{message.content}</p>
                        <Separator className="mt-2" />
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No messages yet</p>
                  )}
                </div>
              </div>

              {/* Reply Form */}
              <div className="space-y-2">
                <Label htmlFor="reply-message">Reply</Label>
                <Textarea
                  id="reply-message"
                  placeholder="Type your reply..."
                  rows={4}
                  data-testid="textarea-reply"
                />
                <Button
                  onClick={() => {
                    const message = (document.getElementById('reply-message') as HTMLTextAreaElement)?.value;
                    replyToTicketMutation.mutate({ ticketId: selectedTicket.id, message });
                  }}
                  disabled={replyToTicketMutation.isPending}
                  data-testid="button-send-reply"
                >
                  Send Reply
                </Button>
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="assign-admin">Assign to Admin</Label>
                  <Select>
                    <SelectTrigger id="assign-admin" data-testid="select-assign-admin">
                      <SelectValue placeholder="Select admin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin1">Admin 1</SelectItem>
                      <SelectItem value="admin2">Admin 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 space-y-2">
                  <Label htmlFor="update-status">Update Status</Label>
                  <Select
                    defaultValue={selectedTicket.status}
                    onValueChange={(value) => {
                      updateTicketMutation.mutate({
                        ticketId: selectedTicket.id,
                        data: { status: value }
                      });
                    }}
                  >
                    <SelectTrigger id="update-status" data-testid="select-update-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={() => closeTicketMutation.mutate(selectedTicket.id)}
                  disabled={closeTicketMutation.isPending}
                  data-testid="button-close-ticket"
                >
                  Close Ticket
                </Button>
              </div>

              {/* Tags */}
              {selectedTicket.tags && selectedTicket.tags.length > 0 && (
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedTicket.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
