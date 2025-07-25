import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { 
  GraduationCap, 
  Search, 
  Plus, 
  Bell, 
  MessageSquare,
  User,
  Settings,
  LogOut,
  LogIn,
  X
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppContext } from "@/hooks/useAppContext";
import LoginDialog from "@/components/dialogs/LoginDialog";
import RegisterDialog from "@/components/dialogs/RegisterDialog";

const AppHeader = () => {
  const { currentUser, logout } = useAppContext();
  const navigate = useNavigate();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearchResults(false);
    }
  };

  const handleSearchFocus = () => {
    setShowSearchResults(true);
  };

  const handleSearchBlur = (e: React.FocusEvent) => {
    // Only hide results if the blur is not caused by clicking on a dropdown item
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !relatedTarget.closest('[data-search-dropdown]')) {
      setTimeout(() => setShowSearchResults(false), 100);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const switchToRegister = () => {
    setShowLoginDialog(false);
    setShowRegisterDialog(true);
  };

  const switchToLogin = () => {
    setShowRegisterDialog(false);
    setShowLoginDialog(true);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 ">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-gradient-primary">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold font-space text-foreground">EdLoop</span>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8 relative">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search communities, posts, notes..."
                className="pl-10 pr-10 bg-muted/50 border-0 focus:bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </form>

            {/* Search Results Dropdown */}
            {showSearchResults && searchQuery && (
              <Card 
                className="absolute top-full mt-2 w-full z-50 border shadow-lg max-h-80 overflow-y-auto"
                data-search-dropdown
              >
                <CardContent className="p-3">
                  <div className="text-sm text-muted-foreground mb-2">
                    Press Enter to search for "{searchQuery}"
                  </div>
                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-left"
                      onClick={() => {
                        navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
                        setShowSearchResults(false);
                      }}
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Search for "{searchQuery}"
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Mobile Search Button */}
          <div className="flex md:hidden">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/search')}
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {/* Create Post - only show if logged in */}
            {/* {currentUser && (
              <Button variant="primary" size="sm" className="hidden sm:flex">
                <Plus className="w-4 h-4 mr-1" />
                Create
              </Button>
            )} */}

            {/* Show login/register buttons if not logged in */}
            {!currentUser ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => setShowLoginDialog(true)}>
                  <LogIn className="w-4 h-4 mr-1" />
                  Sign In
                </Button>
                <Button variant="primary" size="sm" onClick={() => setShowRegisterDialog(true)}>
                  Sign Up
                </Button>
              </>
            ) : (
              <>
                {/* Notifications */}
                {/*<Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                </Button> */}

                {/* Messages */}
                <Button variant="ghost" size="icon">
                  <MessageSquare className="h-5 w-5" />
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={""} />
                        <AvatarFallback className="bg-gradient-primary text-white text-xs">
                          {currentUser.displayName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{currentUser.displayName}</p>
                          {currentUser.verified && (
                            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">u/{currentUser.username}</p>
                        {/* <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{currentUser.karma} karma</span>
                          {currentUser.university && <span>{currentUser.university}</span>}
                        </div> */}
                        {currentUser.domain && (
                          <p className="text-xs text-muted-foreground">
                            Domain: {currentUser.domain}
                          </p>
                        )}
                        {currentUser.interests && currentUser.interests.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            <span>Interests: {currentUser.interests.slice(0, 3).join(', ')}</span>
                            {currentUser.interests.length > 3 && <span> +{currentUser.interests.length - 3} more</span>}
                          </div>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleProfileClick}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      {/* <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span> */}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search communities, posts, notes..."
              className="pl-10 pr-10 bg-muted/50 border-0 focus:bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </form>
        </div>
      </div>

      {/* Auth Dialogs */}
      <LoginDialog 
        open={showLoginDialog} 
        onOpenChange={setShowLoginDialog}
        onSwitchToRegister={switchToRegister}
      />
      <RegisterDialog 
        open={showRegisterDialog} 
        onOpenChange={setShowRegisterDialog}
        onSwitchToLogin={switchToLogin}
      />
    </header>
  );
};

export default AppHeader;