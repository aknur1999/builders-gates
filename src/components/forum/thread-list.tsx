'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ThreadItem } from "./thread-item";
import { Flame, FilePlus, ArrowUp } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useCategory } from "@/lib/category-context";
import { CreateThreadForm } from "./create-thread-form";
import { supabase } from "@/lib/supabase";

// Define thread type based on the database schema
interface Thread {
  id: string;
  title: string;
  content: string;
  category: "Free" | "Honey" | "Boasts";
  author_id: string;
  created_at: string;
  updated_at: string;
  views: number;
  hide_youtube_embed: boolean;
  // Join with profiles
  profiles?: {
    username: string;
    avatar_url: string;
  };
}

// For display in the UI
interface ThreadWithAuthor {
  id: string;
  title: string;
  content: string;
  category: "Free" | "Honey" | "Boasts";
  author: {
    name: string;
    image: string;
  };
  author_id: string;
  votes: number;
  commentCount: number;
  time: string;
}

export function ThreadList() {
  const { user } = useAuth();
  const { selectedCategory } = useCategory();
  const [isCreateThreadOpen, setIsCreateThreadOpen] = useState(false);
  const [threads, setThreads] = useState<ThreadWithAuthor[]>([]);
  const [filteredThreads, setFilteredThreads] = useState<ThreadWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Function to fetch threads from Supabase
  const fetchThreads = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get threads with author information
      const { data, error: fetchError } = await supabase
        .from('threads')
        .select(`
          *,
          profiles:author_id (
            username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });
      
      if (fetchError) {
        throw fetchError;
      }
      
      if (data) {
        // Format threads for display
        const formattedThreads = await Promise.all(data.map(async (thread: Thread) => {
          // Get comment count for each thread
          const { count: commentCount } = await supabase
            .from('comments')
            .select('id', { count: 'exact' })
            .eq('thread_id', thread.id);
          
          // Get vote count for each thread
          const { count: upvotes } = await supabase
            .from('votes')
            .select('id', { count: 'exact' })
            .eq('thread_id', thread.id)
            .eq('vote_type', 'up');
            
          const { count: downvotes } = await supabase
            .from('votes')
            .select('id', { count: 'exact' })
            .eq('thread_id', thread.id)
            .eq('vote_type', 'down');
            
          const netVotes = (upvotes || 0) - (downvotes || 0);
          
          // Format the created_at date for display
          const createdAt = new Date(thread.created_at);
          const now = new Date();
          const diffInHours = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60));
          
          let timeDisplay;
          if (diffInHours < 1) {
            timeDisplay = "just now";
          } else if (diffInHours === 1) {
            timeDisplay = "1 hour ago";
          } else if (diffInHours < 24) {
            timeDisplay = `${diffInHours} hours ago`;
          } else {
            const days = Math.floor(diffInHours / 24);
            timeDisplay = days === 1 ? "1 day ago" : `${days} days ago`;
          }
          
          return {
            id: thread.id,
            title: thread.title,
            content: thread.content,
            category: thread.category,
            author: {
              name: thread.profiles?.username || "Anonymous",
              image: thread.profiles?.avatar_url || "",
            },
            author_id: thread.author_id,
            votes: netVotes,
            commentCount: commentCount || 0,
            time: timeDisplay,
          };
        }));
        
        setThreads(formattedThreads);
      }
    } catch (err) {
      console.error("Error fetching threads:", err);
      setError("Failed to load threads. Please refresh the page.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load threads on component mount
  useEffect(() => {
    fetchThreads();
  }, []);

  // Filter threads when selectedCategory changes
  useEffect(() => {
    if (selectedCategory === 'All') {
      setFilteredThreads(threads);
    } else {
      setFilteredThreads(threads.filter(thread => thread.category === selectedCategory));
    }
  }, [selectedCategory, threads]);
  
  const handleNewThreadClick = () => {
    setIsCreateThreadOpen(true);
  };
  
  const handleCloseCreateThread = () => {
    setIsCreateThreadOpen(false);
  };
  
  return (
    <div className="px-4 pt-2 pb-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {selectedCategory === 'All' ? 'Threads' : `${selectedCategory} Threads`}
        </h1>
        {user && (
          <Button 
            variant="default" 
            className="flex items-center gap-2"
            onClick={handleNewThreadClick}
          >
            <FilePlus className="h-4 w-4" />
            <span>New Thread</span>
          </Button>
        )}
      </div>
      
      <div className="flex gap-2 mb-6">
        <Button variant="outline" size="sm" className="rounded-full flex gap-1">
          <Flame className="h-4 w-4" />
          <span>Hot</span>
        </Button>
        <Button variant="outline" size="sm" className="rounded-full flex gap-1">
          <FilePlus className="h-4 w-4" />
          <span>New</span>
        </Button>
        <Button variant="outline" size="sm" className="rounded-full flex gap-1">
          <ArrowUp className="h-4 w-4" />
          <span>Top</span>
        </Button>
      </div>
      
      {error && (
        <div className="bg-red-100 text-red-600 p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent"></div>
          <p className="mt-2 text-muted-foreground">Loading threads...</p>
        </div>
      ) : filteredThreads.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {selectedCategory === 'All' 
              ? "No threads yet. Be the first to create one!"
              : `No ${selectedCategory} threads found.`
            }
          </p>
        </div>
      ) : (
        <div>
          {filteredThreads.map((thread) => (
            <ThreadItem
              key={thread.id}
              id={thread.id}
              title={thread.title}
              content={thread.content}
              author={thread.author}
              authorId={thread.author_id}
              votes={thread.votes}
              commentCount={thread.commentCount}
              time={thread.time}
              category={thread.category}
              onVoteChange={fetchThreads}
              onDelete={fetchThreads}
            />
          ))}
        </div>
      )}
      
      <CreateThreadForm
        isOpen={isCreateThreadOpen}
        onClose={handleCloseCreateThread}
        onSuccess={fetchThreads}
      />
    </div>
  );
} 