"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

interface CreateThreadFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateThreadForm({ isOpen, onClose, onSuccess }: CreateThreadFormProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<"Honey" | "Boasts" | "Free">("Free");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError("You must be logged in to create a thread");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const now = new Date().toISOString();
      
      // Insert the thread into the database
      const { data, error: insertError } = await supabase
        .from('threads')
        .insert({
          title,
          content,
          category,
          author_id: user.id,
          created_at: now,
          updated_at: now,
          views: 0,
          hide_youtube_embed: false
        })
        .select();
      
      if (insertError) {
        throw insertError;
      }
      
      // Reset form
      setTitle("");
      setContent("");
      setCategory("Free");
      
      // Close dialog
      onClose();
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error("Error creating thread:", err);
      setError("Failed to create thread. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Reset form
    setTitle("");
    setContent("");
    setCategory("Free");
    setError(null);
    
    // Close dialog
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Thread</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-100 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="flex gap-2 mt-4">
            <Button
              type="button"
              variant={category === "Honey" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setCategory("Honey")}
            >
              Honey
            </Button>
            <Button
              type="button"
              variant={category === "Boasts" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setCategory("Boasts")}
            >
              Boasts
            </Button>
            <Button
              type="button"
              variant={category === "Free" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setCategory("Free")}
            >
              Free
            </Button>
          </div>
          
          <div className="space-y-2">
            <input
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
          
          <div className="space-y-2">
            <textarea
              className="w-full h-40 px-4 py-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 