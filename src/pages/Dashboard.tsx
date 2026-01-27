import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  Brain, Dumbbell, TrendingUp, Sun, Moon, CloudSun, 
  Smile, Meh, Frown, Heart, Zap, Wind, ArrowRight, Flame, Loader2, BookOpen
} from "lucide-react";

const moodOptions = [
  { icon: Smile, label: "Great", color: "text-vitality" },
  { icon: Sun, label: "Good", color: "text-energy" },
  { icon: Meh, label: "Okay", color: "text-muted-foreground" },
  { icon: CloudSun, label: "Low", color: "text-peace" },
  { icon: Frown, label: "Struggling", color: "text-warmth" },
];

const quickActions = [
  { icon: Wind, label: "Relax Now", path: "/manas", color: "peace" },
  { icon: Dumbbell, label: "Start Workout", path: "/fit", color: "vitality" },
  { icon: TrendingUp, label: "View Progress", path: "/progress", color: "calm" },
];

const Dashboard = () => {
  const { user } = useAuth();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [userName, setUserName] = useState("Friend");
  const [currentStreak, setCurrentStreak] = useState(0);
  const [todayMindScore, setTodayMindScore] = useState(0);
  const [todayBodyScore, setTodayBodyScore] = useState(0);
  const [todayMeditation, setTodayMeditation] = useState(0);
  const [todayWorkout, setTodayWorkout] = useState(0);
  const [reflections, setReflections] = useState<Array<{ prompt: string; reflection: string; created_at: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (profile?.display_name) {
        setUserName(profile.display_name);
      }

      // Fetch streak data
      const { data: streak } = await supabase
        .from("user_streaks")
        .select("current_streak")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (streak) {
        setCurrentStreak(streak.current_streak || 0);
      }

      // Fetch today's progress
      const today = new Date().toISOString().split('T')[0];
      const { data: progress } = await supabase
        .from("wellness_progress")
        .select("mind_score, body_score, meditation_minutes, workout_minutes")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle();
      
      if (progress) {
        setTodayMindScore(progress.mind_score || 0);
        setTodayBodyScore(progress.body_score || 0);
        setTodayMeditation(progress.meditation_minutes || 0);
        setTodayWorkout(progress.workout_minutes || 0);
      }

      // Fetch reflections (from mood_checkins where notes contains "Prompt:")
      const { data: moodCheckins } = await supabase
        .from("mood_checkins")
        .select("notes, created_at")
        .eq("user_id", user.id)
        .not("notes", "is", null)
        .order("created_at", { ascending: false })
        .limit(5);

      if (moodCheckins) {
        const parsedReflections = moodCheckins
          .filter(checkin => checkin.notes?.includes("Prompt:"))
          .map(checkin => {
            const notes = checkin.notes || "";
            const promptMatch = notes.match(/Prompt:\s*(.+?)(?:\n\n|$)/);
            const reflectionMatch = notes.match(/Reflection:\s*(.+)$/s);
            
            return {
              prompt: promptMatch ? promptMatch[1].trim() : "",
              reflection: reflectionMatch ? reflectionMatch[1].trim() : "",
              created_at: checkin.created_at,
            };
          })
          .filter(ref => ref.prompt && ref.reflection);
        
        setReflections(parsedReflections);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Header />
      
      <main className="flex-1 pt-28 pb-12">
        <div className="container mx-auto px-4">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                  Hello, {userName} 💚
                </h1>
                <p className="text-lg text-muted-foreground">
                  How are you feeling today? Let's check in.
                </p>
              </div>
              {currentStreak > 0 && (
                <div className="flex items-center gap-2 bg-warmth/20 px-4 py-2 rounded-xl">
                  <Flame className="w-5 h-5 text-warmth" />
                  <span className="font-bold text-foreground">{currentStreak} day streak!</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Mood Check-in */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card variant="glass" className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-warmth" />
                  Daily Check-in
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Tap how you're feeling right now – no judgment, just awareness.
                </p>
                <div className="flex flex-wrap gap-3">
                  {moodOptions.map((mood, index) => {
                    const IconComponent = mood.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedMood(index)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300 ${
                          selectedMood === index
                            ? "border-primary bg-primary/10 scale-105"
                            : "border-border hover:border-primary/50 hover:bg-muted"
                        }`}
                      >
                        <IconComponent className={`w-8 h-8 ${mood.color}`} />
                        <span className="text-sm font-medium">{mood.label}</span>
                      </button>
                    );
                  })}
                </div>
                {selectedMood !== null && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 text-sm text-primary font-medium"
                  >
                    ✓ Mood recorded. Thank you for checking in!
                  </motion.p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Mind Status */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card variant="peace" className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    Mind Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Today's Mind Score</span>
                        <span className="font-medium text-foreground">{todayMindScore}%</span>
                      </div>
                      <div className="h-2 bg-foreground/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${todayMindScore}%` }}
                          transition={{ delay: 0.5, duration: 0.8 }}
                          className="h-full bg-peace rounded-full"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Meditation Today</span>
                        <span className="font-medium text-foreground">{todayMeditation} min</span>
                      </div>
                      <div className="h-2 bg-foreground/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(todayMeditation * 2, 100)}%` }}
                          transition={{ delay: 0.6, duration: 0.8 }}
                          className="h-full bg-calm rounded-full"
                        />
                      </div>
                    </div>
                    <Link to="/manas">
                      <Button variant="outline" size="sm" className="mt-2">
                        View Mind Insights
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Body Status */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card variant="vitality" className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Body Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Today's Body Score</span>
                        <span className="font-medium text-foreground">{todayBodyScore}%</span>
                      </div>
                      <div className="h-2 bg-foreground/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${todayBodyScore}%` }}
                          transition={{ delay: 0.5, duration: 0.8 }}
                          className="h-full bg-vitality rounded-full"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Workout Today</span>
                        <span className="font-medium text-foreground">{todayWorkout} min</span>
                      </div>
                      <div className="h-2 bg-foreground/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(todayWorkout * 2, 100)}%` }}
                          transition={{ delay: 0.6, duration: 0.8 }}
                          className="h-full bg-energy rounded-full"
                        />
                      </div>
                    </div>
                    <Link to="/fit">
                      <Button variant="outline" size="sm" className="mt-2">
                        View Body Insights
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-xl font-bold text-foreground mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {quickActions.map((action, index) => {
                const IconComponent = action.icon;
                return (
                  <Link key={index} to={action.path}>
                    <Card className="group hover:shadow-glow transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                      <CardContent className="flex items-center gap-4 p-6">
                        <div className={`w-12 h-12 rounded-xl bg-${action.color}/20 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <IconComponent className={`w-6 h-6 text-${action.color}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{action.label}</h3>
                          <p className="text-sm text-muted-foreground">Tap to begin</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground ml-auto group-hover:translate-x-1 transition-transform" />
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </motion.div>

          {/* Recent Reflections */}
          {reflections.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-peace" />
                  Recent Reflections
                </h2>
                <Link to="/manas">
                  <Button variant="outline" size="sm">
                    Write More
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reflections.map((reflection, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <Card variant="glass" className="h-full">
                      <CardHeader>
                        <CardTitle className="text-base font-semibold text-foreground flex items-start gap-2">
                          <div className="w-6 h-6 rounded-full bg-peace/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <BookOpen className="w-4 h-4 text-peace" />
                          </div>
                          <span className="flex-1">{reflection.prompt}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-4">
                          {reflection.reflection}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(reflection.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
