import { Sidebar } from "@/components/forum/sidebar";
import { ThreadList } from "@/components/forum/thread-list";

export default function Home() {
  return (
    <div className="flex h-screen">
      <div className="w-64 h-full">
        <Sidebar />
      </div>
      <div className="flex-1 overflow-auto">
        <ThreadList />
      </div>
    </div>
  );
}
