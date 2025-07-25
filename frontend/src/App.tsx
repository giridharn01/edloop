import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import Feed from "./pages/Feed";
import Community from "./pages/Community";
import Groups from "./pages/Groups";
import GroupDetail from "./pages/GroupDetail";
import NotFound from "./pages/NotFound";
import Notes from './pages/Notes';
import NoteDetail from './pages/NoteDetail';
import Search from './pages/Search';
import Profile from './pages/Profile';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Feed />} />
            <Route path="/popular" element={<Feed />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/groups/:id" element={<GroupDetail />} />
            <Route path="/study-groups" element={<Feed />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/notes/:noteId" element={<NoteDetail />} />
            <Route path="/study-buddy" element={<Feed />} />
            <Route path="/discussions" element={<Feed />} />
            <Route path="/share" element={<Feed />} />
            <Route path="/goals" element={<Feed />} />
            <Route path="/achievements" element={<Feed />} />
            <Route path="/community/:communityId" element={<Community />} />
            <Route path="/r/:communityId" element={<Community />} />
            <Route path="/search" element={<Search />} />
            <Route path="/profile" element={<Profile />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            {/* Catch-all route must be last */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
