import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Trophy, 
  TrendingUp,
  Flame,
  Play,
  ArrowRight,
  LogOut,
  Loader2,
  GraduationCap,
  Clock,
  CheckCircle,
  RefreshCw
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { getPlaylistUrl } from "@/lib/youtube-playlists";

interface Profile {
  full_name: string | null;
  user_type: string | null;
  grade_level: string | null;
}

interface UserStreak {
  current_streak: number;
  longest_streak: number;
}

interface LearningProgress {
  subject: string;
  lesson_title: string;
  progress_percent: number;
  completed: boolean;
  last_accessed: string;
}

const DashboardPage = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [progress, setProgress] = useState<LearningProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updateKey, setUpdateKey] = useState(0); // Force re-render key

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const fetchUserData = useCallback(async (showToast = false) => {
    if (!user) return;

    try {
      if (import.meta.env.DEV) {
        console.log('Dashboard: Fetching user data...');
      }
      setRefreshing(true);
      
      const [profileResult, streakResult, progressResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('full_name, user_type, grade_level')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('user_streaks')
          .select('current_streak, longest_streak')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('learning_progress')
          .select('subject, lesson_title, progress_percent, completed, last_accessed')
          .eq('user_id', user.id)
          .order('last_accessed', { ascending: false })
          .limit(10)
      ]);

      if (profileResult.error) {
        console.error('Error fetching profile:', profileResult.error);
      } else if (profileResult.data) {
        setProfile(profileResult.data);
      }

      if (streakResult.error) {
        console.error('Error fetching streak:', streakResult.error);
      } else if (streakResult.data) {
        setStreak(streakResult.data);
      }

      if (progressResult.error) {
        console.error('Error fetching progress:', progressResult.error);
        console.error('Full error details:', JSON.stringify(progressResult.error, null, 2));
      } else {
        const progressData = progressResult.data || [];
        if (import.meta.env.DEV) {
          console.log('Dashboard: Progress data fetched', progressData.length, 'items');
        }
        
        // Force state update by creating a new array reference and updating key
        setProgress([...progressData]);
        setUpdateKey(prev => prev + 1); // Force component re-render
        
        if (showToast) {
          if (progressData.length > 0) {
            const completedCount = progressData.filter(p => p.completed).length;
            toast({
              title: "Dashboard Updated",
              description: `Found ${progressData.length} lesson(s). ${completedCount} completed.`,
            });
          } else {
            toast({
              title: "No Progress Found",
              description: "No lessons found. Start learning to see your progress!",
              variant: "default",
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Error",
        description: "Failed to refresh dashboard. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user, fetchUserData]);

  // Refresh dashboard when page becomes visible (user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        if (import.meta.env.DEV) {
          console.log('Dashboard: Page became visible, refreshing data...');
        }
        fetchUserData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, fetchUserData]);

  // Listen for progress updates from video player
  useEffect(() => {
    if (!user) return;

    let lastUpdateTimestamp = 0;

    const handleProgressUpdate = (event?: CustomEvent) => {
      // Refetch all user data when progress is updated
      const detail = event?.detail;
      if (import.meta.env.DEV) {
        console.log('Dashboard: Progress update event received', detail);
      }
      
      // Prevent duplicate updates within 1 second
      const now = Date.now();
      if (detail?.timestamp && detail.timestamp <= lastUpdateTimestamp) {
        if (import.meta.env.DEV) {
          console.log('Dashboard: Ignoring duplicate update');
        }
        return;
      }
      
      if (detail?.timestamp) {
        lastUpdateTimestamp = detail.timestamp;
      }
      
      // Force immediate update with a small delay to ensure DB write is complete
      setTimeout(() => {
        if (import.meta.env.DEV) {
          console.log('Dashboard: Triggering fetchUserData after event');
        }
        fetchUserData(true);
      }, 300);
    };

    // Listen for custom event
    window.addEventListener('progressUpdated', handleProgressUpdate as EventListener);
    
    // Also listen for localStorage changes (cross-tab updates)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'progressUpdated' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          if (data.userId === user.id) {
            if (import.meta.env.DEV) {
              console.log('Dashboard: Storage event received', data);
            }
            // Prevent duplicate updates
            if (data.timestamp && data.timestamp > lastUpdateTimestamp) {
              lastUpdateTimestamp = data.timestamp;
              fetchUserData();
            }
          }
        } catch (err) {
          if (import.meta.env.DEV) {
            console.error('Error parsing progress update:', err);
          }
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    // Poll localStorage for updates (in case storage event doesn't fire)
    const pollInterval = setInterval(() => {
      const lastUpdate = localStorage.getItem('progressUpdated');
      if (lastUpdate) {
        try {
          const data = JSON.parse(lastUpdate);
          if (data.userId === user.id && data.timestamp) {
            // Update if timestamp is newer than last processed
            if (data.timestamp > lastUpdateTimestamp) {
              if (import.meta.env.DEV) {
                console.log('Dashboard: Polling detected update', data);
              }
              lastUpdateTimestamp = data.timestamp;
              fetchUserData();
            }
          }
        } catch (err) {
          // Ignore parse errors
        }
      }
    }, 1000); // Check every second
    
    // Also poll the database directly every 5 seconds as a fallback
    const dbPollInterval = setInterval(() => {
      if (import.meta.env.DEV) {
        console.log('Dashboard: Periodic database poll');
      }
      fetchUserData();
    }, 5000); // Poll database every 5 seconds

    return () => {
      window.removeEventListener('progressUpdated', handleProgressUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(pollInterval);
      clearInterval(dbPollInterval);
    };
  }, [user, fetchUserData]);

  const handleRefresh = () => {
    if (import.meta.env.DEV) {
      console.log('Dashboard: Manual refresh triggered');
    }
    fetchUserData(true);
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
    navigate('/');
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const studentName = profile?.full_name || user?.email?.split('@')[0] || "Learner";
  const gradeLevel = profile?.grade_level || null;
  const streakDays = streak?.current_streak || 0;
  const longestStreak = streak?.longest_streak || 0;
  
  // Calculate real progress
  const completedLessons = progress.filter(p => p.completed === true).length;
  const totalLessons = progress.length;
  const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  
  // Debug logging (development only)
  if (import.meta.env.DEV) {
    console.log('Dashboard render - Progress state:', {
      totalLessons,
      completedLessons,
      overallProgress,
      progressItems: progress
    });
  }

  // Group progress by subject
  const subjectProgress: Record<string, { completed: number; total: number }> = {};
  progress.forEach(p => {
    if (!p.subject) return; // Skip invalid entries
    if (!subjectProgress[p.subject]) {
      subjectProgress[p.subject] = { completed: 0, total: 0 };
    }
    subjectProgress[p.subject].total++;
    if (p.completed === true) {
      subjectProgress[p.subject].completed++;
    }
  });

  // Recent lessons (last 5)
  const recentLessons = progress.slice(0, 5);

  // Today's study time (placeholder - will track with API)
  const todayStudyMinutes = 45;

  return (
    <Layout>
      {/* Welcome Header */}
      <section className="py-6 md:py-8 bg-gradient-cool border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                Hi, {studentName}!
              </h1>
              <p className="text-muted-foreground">
                {gradeLevel ? `Class ${gradeLevel}` : 'Welcome back'} • Keep up the great work
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                onClick={handleRefresh} 
                title="Refresh dashboard"
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Link to="/learn">
                <Button variant="primary">
                  <Play className="w-4 h-4 mr-2" />
                  Continue Learning
                </Button>
              </Link>
              <Button variant="ghost" onClick={handleSignOut} title="Sign out">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-6 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Current Streak */}
            <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                    <Flame className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{streakDays}</p>
                    <p className="text-xs text-muted-foreground">Day Streak</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lessons Completed */}
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{completedLessons}</p>
                    <p className="text-xs text-muted-foreground">Lessons Done</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Today's Time */}
            <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{todayStudyMinutes}m</p>
                    <p className="text-xs text-muted-foreground">Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Best Streak */}
            <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-success/20 rounded-lg flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{longestStreak}</p>
                    <p className="text-xs text-muted-foreground">Best Streak</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-6 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Progress by Subject */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Your Progress
                    </CardTitle>
                    <span className="text-sm text-muted-foreground">{overallProgress}% overall</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {progress.length > 0 && Object.keys(subjectProgress).length > 0 ? (
                    Object.entries(subjectProgress).map(([subject, data]) => {
                      const percent = Math.round((data.completed / data.total) * 100);
                      return (
                        <div 
                          key={subject}
                          className="cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
                          onClick={() => {
                            if (!gradeLevel) {
                              toast({
                                title: "Class Not Set",
                                description: "Please set your class in your profile to view courses.",
                                variant: "destructive",
                              });
                              return;
                            }
                            
                            // Try to get playlist URL for this subject and class
                            const playlistUrl = getPlaylistUrl(gradeLevel, subject);
                            
                            if (playlistUrl) {
                              // Navigate to video player with the first topic
                              const firstLesson = progress.find(p => p.subject === subject);
                              const topicName = firstLesson?.lesson_title || 'Introduction';
                              navigate(`/learn/video?url=${encodeURIComponent(playlistUrl)}&subject=${encodeURIComponent(subject)}&class=${encodeURIComponent(gradeLevel)}&topic=${encodeURIComponent(topicName)}`);
                            } else {
                              // Fallback: navigate to learn page
                              navigate('/learn');
                            }
                          }}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-medium text-foreground">{subject}</span>
                            <span className="text-xs text-muted-foreground">
                              {data.completed}/{data.total} lessons
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-primary rounded-full transition-all"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : progress.length === 0 ? (
                    <div className="text-center py-8">
                      <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground mb-4">No lessons started yet</p>
                      <Link to="/learn">
                        <Button variant="primary" size="sm">
                          Start Learning
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary mb-3" />
                      <p className="text-muted-foreground">Loading progress...</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              {recentLessons.length > 0 && (
                <Card className="mt-6">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Recent Lessons</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentLessons.map((lesson, idx) => (
                        <div 
                          key={idx}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                          onClick={() => {
                            if (!gradeLevel) {
                              toast({
                                title: "Class Not Set",
                                description: "Please set your class in your profile to view courses.",
                                variant: "destructive",
                              });
                              return;
                            }
                            
                            // Try to get playlist URL for this subject and class
                            const playlistUrl = getPlaylistUrl(gradeLevel, lesson.subject);
                            
                            if (playlistUrl) {
                              // Navigate to video player with the lesson
                              navigate(`/learn/video?url=${encodeURIComponent(playlistUrl)}&subject=${encodeURIComponent(lesson.subject)}&class=${encodeURIComponent(gradeLevel)}&topic=${encodeURIComponent(lesson.lesson_title)}`);
                            } else {
                              // Fallback: navigate to learn page
                              toast({
                                title: "Course Not Available",
                                description: `Course for ${lesson.subject} Class ${gradeLevel} is not configured. Redirecting to learning page.`,
                                variant: "default",
                              });
                              navigate('/learn');
                            }
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              lesson.completed ? 'bg-success/20' : 'bg-primary/20'
                            }`}>
                              {lesson.completed ? (
                                <CheckCircle className="w-4 h-4 text-success" />
                              ) : (
                                <Play className="w-4 h-4 text-primary" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{lesson.lesson_title}</p>
                              <p className="text-xs text-muted-foreground">{lesson.subject}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-foreground">{lesson.progress_percent}%</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(lesson.last_accessed).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Weekly Goal */}
              <Card>
                <CardContent className="p-5">
                  <h3 className="font-semibold text-foreground mb-3">This Week's Goal</h3>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex-1">
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-primary rounded-full"
                          style={{ width: '65%' }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-foreground">65%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Complete 5 more lessons to reach your weekly goal
                  </p>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardContent className="p-5 space-y-3">
                  <h3 className="font-semibold text-foreground mb-2">Quick Actions</h3>
                  <Link to="/learn" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Browse Lessons
                    </Button>
                  </Link>
                  <Link to="/accessibility" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <GraduationCap className="w-4 h-4 mr-2" />
                      Accessibility Settings
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Encouragement */}
              <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-0">
                <CardContent className="p-5 text-center">
                  <div className="text-3xl mb-2">🌟</div>
                  <h3 className="font-semibold text-foreground mb-1">
                    {streakDays > 0 ? 'Great Progress!' : 'Let\'s Get Started!'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {streakDays > 0 
                      ? `You're on a ${streakDays}-day streak. Keep it going!`
                      : 'Start a lesson today to build your streak!'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default DashboardPage;