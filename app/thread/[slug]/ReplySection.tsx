'use client';

import { useState } from 'react';
import type { ForumReply } from '../../../shared/schema';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ThumbsUp, CheckCircle2, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

// FIXED: Use relative URLs for client-side API calls (works with Next.js rewrites)
// No hardcoded localhost URLs in client components!

interface ReplySectionProps {
  threadId: string;
  threadSlug: string;
  replies: any[];
  isLocked: boolean;
  threadAuthorId: string;
}

export function ReplySection({
  threadId,
  threadSlug,
  replies: initialReplies,
  isLocked,
  threadAuthorId,
}: ReplySectionProps) {
  const [replies, setReplies] = useState(initialReplies);
  const [replyBody, setReplyBody] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Fetch current user on mount
  useState(() => {
    fetch('/api/me', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data))
      .catch(() => setUser(null));
  });

  const handleSubmitReply = async () => {
    if (!user) {
      // Redirect to login
      window.location.href = '/api/login';
      return;
    }

    if (!replyBody.trim()) {
      alert('Reply cannot be empty');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/threads/${threadId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          body: replyBody,
          userId: user.id,
          ...(replyingTo && { parentId: replyingTo }),
        }),
      });

      if (response.ok) {
        // Refresh the page to show new reply
        window.location.reload();
      } else {
        alert('Failed to post reply');
      }
    } catch (error) {
      alert('An error occurred while posting your reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkHelpful = async (replyId: string) => {
    if (!user) {
      window.location.href = '/api/login';
      return;
    }

    try {
      const response = await fetch(`/api/replies/${replyId}/helpful`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to mark as helpful:', error);
    }
  };

  const handleMarkAccepted = async (replyId: string) => {
    if (!user) {
      window.location.href = '/api/login';
      return;
    }

    try {
      const response = await fetch(`/api/replies/${replyId}/accept`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to mark as accepted:', error);
    }
  };

  const rootReplies = replies.filter((r) => !r.parentId);

  const getReplies = (parentId: string) => {
    return replies.filter((r) => r.parentId === parentId);
  };

  const renderReply = (reply: any, depth: number = 0) => {
    const childReplies = getReplies(reply.id);

    return (
      <div key={reply.id} className={depth > 0 ? 'ml-8 mt-4' : ''}>
        <Card className={reply.isAcceptedAnswer ? 'border-green-500 border-2' : ''}>
          <CardContent className="p-4">
            {/* Reply Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {reply.author?.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Link
                    href={`/user/${reply.author?.username || 'unknown'}`}
                    className="font-medium hover:underline"
                  >
                    {reply.author?.username || 'Unknown'}
                  </Link>
                  <div suppressHydrationWarning className="text-xs text-muted-foreground">
                    {reply.createdAt && formatDistanceToNow(new Date(reply.createdAt), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
              </div>
              {reply.isAcceptedAnswer && (
                <Badge className="bg-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Accepted Answer
                </Badge>
              )}
            </div>

            {/* Reply Content */}
            <div
              className="prose prose-sm dark:prose-invert max-w-none mb-3"
              dangerouslySetInnerHTML={{ __html: reply.body || '' }}
            />

            {/* Reply Actions */}
            <div className="flex items-center gap-4 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleMarkHelpful(reply.id)}
                className="text-xs"
              >
                <ThumbsUp className="h-3 w-3 mr-1" />
                Helpful ({reply.helpfulCount || 0})
              </Button>

              {user && user.id === threadAuthorId && !reply.isAcceptedAnswer && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMarkAccepted(reply.id)}
                  className="text-xs"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Mark as Answer
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyingTo(reply.id)}
                className="text-xs"
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                Reply
              </Button>
            </div>

            {/* Nested Reply Form */}
            {replyingTo === reply.id && (
              <div className="mt-4 pt-4 border-t">
                <Textarea
                  placeholder="Write your reply..."
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  className="mb-2"
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button onClick={handleSubmitReply} disabled={isSubmitting} size="sm">
                    {isSubmitting ? 'Posting...' : 'Post Reply'}
                  </Button>
                  <Button
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyBody('');
                    }}
                    variant="ghost"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Render child replies */}
        {childReplies.map((childReply) => renderReply(childReply, depth + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Reply Form */}
      {!isLocked && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Write a Reply</h3>
            <Textarea
              placeholder={
                user
                  ? 'Share your thoughts or solution...'
                  : 'Please log in to reply'
              }
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              disabled={!user || replyingTo !== null}
              rows={5}
              className="mb-3"
            />
            <Button
              onClick={handleSubmitReply}
              disabled={!user || isSubmitting || replyingTo !== null}
            >
              {isSubmitting ? 'Posting...' : 'Post Reply'}
            </Button>
            {!user && (
              <p className="text-sm text-muted-foreground mt-2">
                <Link href="/api/login" className="text-primary hover:underline">
                  Log in
                </Link>{' '}
                to participate in the discussion
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {isLocked && (
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-muted-foreground">
              This thread is locked. No new replies can be added.
            </p>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Render all replies */}
      <div className="space-y-4">
        {rootReplies.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No replies yet. Be the first to respond!
            </CardContent>
          </Card>
        ) : (
          rootReplies.map((reply) => renderReply(reply))
        )}
      </div>
    </div>
  );
}
