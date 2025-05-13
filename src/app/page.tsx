'use client';

import { Sidebar } from "@/components/forum/sidebar";
import { ThreadList } from "@/components/forum/thread-list";
import { useState } from "react";
import { Menu, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen relative">
      <div className={`transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-64' : 'w-0'} h-full relative overflow-hidden`}>
        <Sidebar />
        {sidebarOpen && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSidebarOpen(false)}
            className="absolute top-4 right-0 transform translate-x-1/2 bg-white border rounded-full shadow-sm z-10 hover:bg-gray-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex-1 overflow-auto">
        {!sidebarOpen && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSidebarOpen(true)}
            className="m-4 bg-white border rounded-full shadow-sm hover:bg-gray-100"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <ThreadList />
      </div>
    </div>
  );
}
