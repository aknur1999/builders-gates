"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowUp, ArrowDown, MessageSquare, MoreVertical, Trash } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Comment type definition
interface Comment {
  id: string;
  content: string;
  author_id: string;
  created_at: string;
  parent_id: string | null;
  user: {
    username: string;
    avatar_url?: string;
  };
}

interface ThreadItemProps {
  id: string;
  title: string;
  content: string;
  author: {
    name: string;
    image?: string;
  };
  authorId: string; // Add authorId to check if current user is the author
  votes: number;
  commentCount: number;
  time: string;
  category: "Free" | "Honey" | "Boasts";
  onVoteChange?: () => void;
  onDelete?: () => void; // Add callback for when thread is deleted
}

export function ThreadItem({
  id,
  title,
  content,
  author,
  authorId,
  votes: initialVotes,
  commentCount: initialCommentCount,
  time,
  category,
  onVoteChange,
  onDelete,
}: ThreadItemProps) {
  const { user } = useAuth();
  const [votes, setVotes] = useState(initialVotes);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [threadTime, setThreadTime] = useState(time);
  
  // Check if current user is the author of this thread
  const isAuthor = user && user.id === authorId;

  // Add a ref to keep track of whether we should keep the input visible
  const keepInputVisibleRef = useRef(false);

  // Function to fetch comments
  const fetchComments = useCallback(async () => {
    try {
      // First fetch the comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('thread_id', id)
        .order('created_at', { ascending: true });
      
      if (commentsError) throw commentsError;
      
      // If we have comments, get the user data for each comment author
      if (commentsData && commentsData.length > 0) {
        // Get unique author IDs
        const authorIds = [...new Set(commentsData.map(comment => comment.author_id))];
        
        // Fetch user profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', authorIds);
        
        if (profilesError) throw profilesError;
        
        // Create a map of author ID to profile data
        const profilesMap = (profilesData || []).reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {} as Record<string, { id: string; username: string; avatar_url?: string }>);
        
        // Combine comment and profile data
        const formattedComments = commentsData.map(comment => {
          const profile = profilesMap[comment.author_id] || {};
          return {
            id: comment.id,
            content: comment.content,
            author_id: comment.author_id,
            created_at: comment.created_at,
            parent_id: comment.parent_id,
            user: {
              username: profile.username || `user_${comment.author_id.substring(0, 8)}`,
              avatar_url: profile.avatar_url
            }
          };
        });
        
        console.log('Formatted comments:', formattedComments);
        
        setComments(formattedComments);
        setCommentCount(formattedComments.length);
      } else {
        setComments([]);
        // Don't update comment count to 0 if there are no comments yet
        if (commentCount === 0) {
          setCommentCount(0);
        }
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  }, [id, commentCount]);

  // Fetch comments when component mounts
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);
  
  // Check if user has already voted on this thread when component mounts
  useEffect(() => {
    if (!user) return;
    
    const checkUserVote = async () => {
      const { data, error } = await supabase
        .from('votes')
        .select('vote_type')
        .eq('thread_id', id)
        .eq('user_id', user.id)
        .single();
      
      if (data && !error) {
        setUserVote(data.vote_type as 'up' | 'down');
      }
    };
    
    checkUserVote();
  }, [id, user]);
  
  // Format date to relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'less than a minute ago';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
  };

  const handleVote = async (voteType: 'up' | 'down') => {
    if (!user) {
      alert('You must be logged in to vote');
      return;
    }
    
    if (isVoting) return;
    
    setIsVoting(true);
    
    try {
      // First check if user has already voted
      const { data: existingVote } = await supabase
        .from('votes')
        .select('id, vote_type')
        .eq('thread_id', id)
        .eq('user_id', user.id)
        .single();
      
      // If same vote type (e.g., clicking upvote when already upvoted), remove the vote
      if (existingVote && existingVote.vote_type === voteType) {
        // Delete the vote
        const { error: deleteError } = await supabase
          .from('votes')
          .delete()
          .eq('id', existingVote.id);
          
        if (deleteError) throw deleteError;
        
        // Update local state
        setVotes(prevVotes => voteType === 'up' ? prevVotes - 1 : prevVotes + 1);
        setUserVote(null);
      } 
      // If different vote type, update the vote
      else if (existingVote && existingVote.vote_type !== voteType) {
        // Update the vote
        const { error: updateError } = await supabase
          .from('votes')
          .update({ vote_type: voteType })
          .eq('id', existingVote.id);
          
        if (updateError) throw updateError;
        
        // Update local state
        setVotes(prevVotes => {
          if (voteType === 'up') return prevVotes + 2; // +1 for removing downvote, +1 for adding upvote
          return prevVotes - 2; // -1 for removing upvote, -1 for adding downvote
        });
        setUserVote(voteType);
      } 
      // If no existing vote, insert a new vote
      else {
        // Insert the vote
        const { error: insertError } = await supabase
          .from('votes')
          .insert({
            thread_id: id,
            user_id: user.id,
            vote_type: voteType,
            created_at: new Date().toISOString()
          });
          
        if (insertError) throw insertError;
        
        // Update local state
        setVotes(prevVotes => voteType === 'up' ? prevVotes + 1 : prevVotes - 1);
        setUserVote(voteType);
      }
      
      // Notify parent component about vote change
      if (onVoteChange) {
        onVoteChange();
      }
    } catch (error) {
      console.error('Error updating vote:', error);
      alert('Failed to update vote. Please try again.');
    } finally {
      setIsVoting(false);
    }
  };

  // Handle thread deletion
  const handleDeleteThread = async () => {
    if (!user || !isAuthor) return;
    
    setIsDeleting(true);
    
    try {
      // First delete all votes related to this thread
      const { error: votesError } = await supabase
        .from('votes')
        .delete()
        .eq('thread_id', id);
      
      if (votesError) throw votesError;
      
      // Delete all comments related to this thread
      const { error: commentsError } = await supabase
        .from('comments')
        .delete()
        .eq('thread_id', id);
      
      if (commentsError) throw commentsError;
      
      // Finally delete the thread
      const { error: threadError } = await supabase
        .from('threads')
        .delete()
        .eq('id', id);
      
      if (threadError) throw threadError;
      
      // Call the onDelete callback to refresh the thread list
      if (onDelete) {
        onDelete();
      }
      
    } catch (error) {
      console.error('Error deleting thread:', error);
      alert('Failed to delete thread. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Handle comment submission
  const handleSubmitComment = async () => {
    if (!user) {
      alert('You must be logged in to comment');
      return;
    }
    
    if (!commentText.trim()) return;
    
    setIsSubmittingComment(true);
    keepInputVisibleRef.current = true; // Set flag to keep input visible
    
    try {
      // Insert the comment into the database
      const { data, error } = await supabase
        .from('comments')
        .insert({
          thread_id: id,
          author_id: user.id,
          content: commentText.trim(),
          created_at: new Date().toISOString(),
          hide_youtube_embed: false,
          parent_id: null // Setting as null since this is a top-level comment
        })
        .select();
      
      if (error) {
        console.error('Supabase error details:', JSON.stringify(error, null, 2));
        throw error;
      }
      
      console.log('Comment submitted successfully:', data);
      
      // Clear comment text but keep the input field visible
      setCommentText("");
      
      // Fetch updated comments
      fetchComments();
      
      // Don't call onVoteChange as it might be resetting UI state
      // Update the comment count manually instead
      setCommentCount(prevCount => prevCount + 1);
      
      // Force show the input after a short delay
      setTimeout(() => {
        if (keepInputVisibleRef.current) {
          setShowCommentInput(true);
        }
      }, 50);
      
    } catch (error) {
      console.error('Error submitting comment:', error instanceof Error ? error.message : JSON.stringify(error));
      alert('Failed to submit comment. Please try again.');
      keepInputVisibleRef.current = false; // Reset flag on error
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Handle comment deletion
  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('author_id', user.id); // Ensure user can only delete their own comments
      
      if (error) throw error;
      
      // Refresh comments
      fetchComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment. Please try again.');
    }
  };

  // Handle reply submission
  const handleSubmitReply = async (parentId: string) => {
    if (!user) {
      alert('You must be logged in to reply');
      return;
    }
    
    if (!replyText.trim()) return;
    
    setIsSubmittingReply(true);
    
    try {
      // Insert the reply into the database
      const { data, error } = await supabase
        .from('comments')
        .insert({
          thread_id: id,
          author_id: user.id,
          content: replyText.trim(),
          created_at: new Date().toISOString(),
          hide_youtube_embed: false,
          parent_id: parentId // Set parent_id to the comment we're replying to
        })
        .select();
      
      if (error) {
        console.error('Supabase error details:', JSON.stringify(error, null, 2));
        throw error;
      }
      
      console.log('Reply submitted successfully:', data);
      
      // Clear reply text and hide input
      setReplyText("");
      setReplyingTo(null);
      
      // Fetch updated comments
      fetchComments();
    } catch (error) {
      console.error('Error submitting reply:', error instanceof Error ? error.message : JSON.stringify(error));
      alert('Failed to submit reply. Please try again.');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Group comments by parent_id for threaded display
  const commentsByParentId = comments.reduce((acc, comment) => {
    const parentId = comment.parent_id || 'root';
    if (!acc[parentId]) {
      acc[parentId] = [];
    }
    acc[parentId].push(comment);
    return acc;
  }, {} as Record<string, Comment[]>);

  // Render a comment and its replies
  const renderComment = (comment: Comment) => {
    const replies = commentsByParentId[comment.id] || [];
    
    return (
      <div key={comment.id} className="mb-4 last:mb-0">
        <div className="flex items-start">
          <Avatar className="h-6 w-6 mr-2 mt-1">
            <AvatarImage src={comment.user.avatar_url} />
            <AvatarFallback>{comment.user.username.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{comment.user.username}</span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">{formatRelativeTime(comment.created_at)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 rounded-full p-0 text-gray-500 hover:text-gray-700 flex items-center justify-center"
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                >
                  <MessageSquare className="h-3 w-3" />
                </Button>
                
                {user && (user.id === comment.author_id) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 rounded-full p-0 text-gray-500 hover:text-gray-700">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        className="text-red-600 focus:text-red-600"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        <Trash className="h-3 w-3 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
            <p className="text-sm my-1">{comment.content}</p>
            
            {/* Reply input field */}
            {replyingTo === comment.id && (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  placeholder="댓글을 작성하세요..."
                  value={replyText}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReplyText(e.target.value)}
                  className="flex-1 h-9 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter' && !e.shiftKey && replyText.trim()) {
                      e.preventDefault();
                      handleSubmitReply(comment.id);
                    }
                  }}
                />
                <Button 
                  onClick={() => handleSubmitReply(comment.id)}
                  disabled={isSubmittingReply || !replyText.trim()}
                  className="bg-gray-700 hover:bg-gray-800 h-9 text-xs"
                >
                  작성하기
                </Button>
              </div>
            )}
            
            {/* Render replies */}
            {replies.length > 0 && (
              <div className="mt-2 ml-6 pl-2 border-l border-gray-200 mb-2">
                {replies.map(reply => renderComment(reply))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Add console logging and a useEffect to track showCommentInput state
  useEffect(() => {
    console.log('showCommentInput state changed:', showCommentInput);
  }, [showCommentInput]);

  // Add a useEffect to ensure input stays visible after handleSubmitComment
  useEffect(() => {
    if (isSubmittingComment === false && !showCommentInput) {
      // Restore input visibility after submission completes
      setShowCommentInput(true);
    }
  }, [isSubmittingComment, showCommentInput]);

  // Add a useEffect to update the timestamp periodically
  useEffect(() => {
    // Function to update timestamp
    const updateThreadTime = async () => {
      try {
        // Fetch the thread to get the real timestamp
        const { data, error } = await supabase
          .from('threads')
          .select('created_at')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        if (data) {
          const timestamp = formatRelativeTime(data.created_at);
          setThreadTime(timestamp);
        }
      } catch (err) {
        console.error('Error fetching thread timestamp:', err);
      }
    };
    
    // Update immediately on mount
    updateThreadTime();
    
    // Set up interval to update every minute
    const interval = setInterval(updateThreadTime, 60000);
    
    // Clean up on unmount
    return () => clearInterval(interval);
  }, [id]);

  return (
    <Card className="mb-4 relative">
      <div className="flex">
        <div className="flex flex-col items-center px-3 py-4 bg-muted/30 border-r">
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn("h-8 w-8", userVote === 'up' && "text-green-600")}
            onClick={() => handleVote('up')}
            disabled={isVoting}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">{votes}</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn("h-8 w-8", userVote === 'down' && "text-red-600")}
            onClick={() => handleVote('down')}
            disabled={isVoting}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-4 flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={author.image} />
              <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{author.name}</span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">{threadTime}</span>
          </div>
          <h3 className="text-lg font-medium mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground mb-4">{content}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 flex items-center gap-1"
                onClick={() => {
                  if (showComments) {
                    // If comments are showing, close everything
                    setShowComments(false);
                    setShowCommentInput(false);
                  } else {
                    // If comments are hidden, show both comments and input
                    setShowComments(true);
                    setShowCommentInput(true);
                  }
                }}
              >
                <MessageSquare className="h-4 w-4" />
                <span className="text-xs">{commentCount}</span>
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-muted px-2 py-1 rounded-md">{category}</span>
              
              {/* Only show options menu if user is the author */}
              {isAuthor && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      className="text-red-600 focus:text-red-600"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          
          {/* Comment input area */}
          {showCommentInput && showComments && (
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                placeholder="댓글을 작성하세요..."
                value={commentText}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCommentText(e.target.value)}
                className="flex-1 h-10 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter' && !e.shiftKey && commentText.trim()) {
                    e.preventDefault();
                    handleSubmitComment();
                  }
                }}
              />
              <Button 
                onClick={handleSubmitComment}
                disabled={isSubmittingComment || !commentText.trim()}
                className="bg-gray-700 hover:bg-gray-800"
              >
                작성하기
              </Button>
            </div>
          )}
          
          {/* Comments section - updated to use renderComment */}
          {comments.length > 0 && showComments && (
            <div className="mt-4 border-t pt-4">
              {(commentsByParentId['root'] || [])
                .filter(comment => !comment.parent_id)
                .map(comment => renderComment(comment))}
            </div>
          )}
        </div>
      </div>
      
      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Thread</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this thread? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteThread}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
} 