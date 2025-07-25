import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from 'react-router-dom';
import { 
  Home, 
  TrendingUp, 
  Users, 
  Plus,
  BookOpen,
  Calculator,
  Atom,
  Code,
  Palette,
  Building,
  Globe,
  University,
  Lightbulb,
  MessageCircle,
  Search,
  Star,
  Clock,
  UserPlus,
  FileText,
  Share2,
  Calendar,
  Target,
  Award
} from "lucide-react";
import { useAppContext } from "@/hooks/useAppContext";
import CreateCommunityDialog from "@/components/dialogs/CreateCommunityDialog";

const Sidebar = () => {
  const { communities } = useAppContext();
  const navigate = useNavigate();

  // Get top communities (sorted by member count)
  const topCommunities = communities
    .slice()
    .sort((a, b) => b.members - a.members)
    .slice(0, 5);

  const getSubjectIcon = (subject?: string) => {
    switch (subject) {
      case "Computer Science": return Code;
      case "Mathematics": return Calculator;
      case "Physics": return Atom;
      case "Biology": return BookOpen;
      default: return University;
    }
  };

  return (
    <aside className="w-80 h-[calc(100vh-3.5rem)] overflow-y-auto p-4 space-y-4">
      {/* Main Navigation */}
      <Card className="gradient-card border-0 shadow-soft">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Navigation
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-1">
          <Button 
            variant="ghost" 
            className="w-full justify-start h-10 font-medium"
            onClick={() => navigate("/")}
          >
            <Home className="w-4 h-4 mr-3" />
            Home
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start h-10 font-medium"
            onClick={() => navigate("/groups")}
          >
            <Users className="w-4 h-4 mr-3" />
            Study Groups
          </Button>
        </CardContent>
      </Card>

      {/* Study Groups Section */}
      {/* <Card className="gradient-card border-0 shadow-soft"> */}
        {/* <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Study Groups
          </CardTitle>
        </CardHeader> */}
        {/* <CardContent className="p-4 pt-0 space-y-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start h-9"
            onClick={() => navigate("/groups")}
          >
            <Search className="w-4 h-4 mr-3" />
            Browse Groups
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start h-9">
            <Plus className="w-4 h-4 mr-3" />
            Create Group
          </Button> */}
          {/* <Button variant="ghost" size="sm" className="w-full justify-start h-9">
            <Clock className="w-4 h-4 mr-3" />
            My Sessions
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start h-9">
            <Calendar className="w-4 h-4 mr-3" />
            Schedule Study
          </Button> */}
        {/* </CardContent>
      </Card> */}

      {/* Popular Communities */}
      <Card className="gradient-card border-0 shadow-soft">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Communities
            </CardTitle>
            
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-0">
            {topCommunities.length > 0 ? (
              topCommunities.map((community, index) => {
                const IconComponent = getSubjectIcon(community.subject);
                return (
                  <div
                    key={community.id}
                    className="flex items-center gap-3 p-4 hover:bg-muted/50 cursor-pointer transition-smooth border-b last:border-b-0"
                    onClick={() => navigate(`/community/${community.id}`)}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-6 h-6 rounded text-xs font-bold text-muted-foreground">
                        #{index + 1}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                        <IconComponent className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm truncate">
                          {community.displayName}
                        </h3>
                        {community.category === 'academic' && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">
                            Academic
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1">
                         
                          
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center">
                <Globe className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No communities yet</p>
                <p className="text-xs text-muted-foreground mt-1">Create the first one!</p>
              </div>
            )}
          </div>
          
          <div className="p-3 border-t">
            <CreateCommunityDialog />
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="gradient-card border-0 shadow-soft">
        <CardHeader className="pb-2">
          {/* <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Quick Actions
          </CardTitle> */}
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start h-9 font-medium"
            onClick={() => navigate("/notes")}
          >
            <FileText className="w-4 h-4 mr-3" />
            Share Notes
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start h-9 font-medium"
            onClick={() => navigate("/study-buddy")}
          >
            <UserPlus className="w-4 h-4 mr-3" />
            Find Study Buddy
          </Button>
          {/* <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start h-9 font-medium"
            onClick={() => navigate("/discussions")}
          >
            <MessageCircle className="w-4 h-4 mr-3" />
            Join Discussion
          </Button> */}
          {/* <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start h-9 font-medium"
            onClick={() => navigate("/share")}
          >
            <Share2 className="w-4 h-4 mr-3" />
            Share Content
          </Button> */}
          
          <Separator className="my-3" />
          
          {/* <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start h-9 font-medium"
            onClick={() => navigate("/goals")}
          >
            <Target className="w-4 h-4 mr-3" />
            Study Goals
          </Button> */}
          {/* <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start h-9 font-medium"
            onClick={() => navigate("/achievements")}
          >
            <Award className="w-4 h-4 mr-3" />
            Achievements
          </Button> */}
        </CardContent>
      </Card>

      {/* Study Tip of the Day */}
      <Card className="gradient-secondary border-0 shadow-soft">
        <CardContent className="p-4 text-center space-y-3">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto">
            <Lightbulb className="w-6 h-6 text-secondary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-secondary-foreground">Study Tip</h3>
            <p className="text-sm text-secondary-foreground/80 mt-1 leading-relaxed">
              Use the Pomodoro Technique: Study for 25 minutes, then take a 5-minute break to boost productivity.
            </p>
          </div>
          {/* <Button 
            variant="secondary" 
            size="sm" 
            className="bg-white/20 hover:bg-white/30 text-secondary-foreground border-0"
          >
            <Palette className="w-4 h-4 mr-2" />
            More Tips
          </Button> */}
        </CardContent>
      </Card>
    </aside>
  );
};

export default Sidebar;