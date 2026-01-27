import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, Brain, Dumbbell, Heart, Target, Calendar, 
  Sparkles, Flame, Award, ArrowRight, Loader2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface StreakData {
  current_streak: number;
  longest_streak: number;
  total_sessions: number;
}

interface MoodData {
  mood_level: number;
  created_at: string;
}

interface ProgressData {
  mind_score: number;
  body_score: number;
  date: string;
}

const Progress = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [moodHistory, setMoodHistory] = useState<MoodData[]>([]);
  const [progressHistory, setProgressHistory] = useState<ProgressData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      fetchUserData();
    }
  }, [user, authLoading, navigate]);

  const fetchUserData = async () => {
    if (!user) return;
    
    try {
      // Fetch streak data
      const { data: streak } = await supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (streak) setStreakData(streak);

      // Fetch mood history (last 7 days)
      const { data: moods } = await supabase
        .from("mood_checkins")
        .select("mood_level, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(7);
      
      if (moods) setMoodHistory(moods);

      // Fetch progress history (last 7 days)
      const { data: progress } = await supabase
        .from("wellness_progress")
        .select("mind_score, body_score, date")
        .eq("user_id", user.id)
        .order("date", { ascending: true })
        .limit(7);
      
      if (progress) setProgressHistory(progress);

    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Generate weekly data from progress history or use defaults
  const weeklyData = progressHistory.length > 0 
    ? progressHistory.map(p => ({
        day: new Date(p.date).toLocaleDateString('en-US', { weekday: 'short' }),
        mind: p.mind_score,
        body: p.body_score,
      }))
    : [
        { day: "Mon", mind: 0, body: 0 },
        { day: "Tue", mind: 0, body: 0 },
        { day: "Wed", mind: 0, body: 0 },
        { day: "Thu", mind: 0, body: 0 },
        { day: "Fri", mind: 0, body: 0 },
        { day: "Sat", mind: 0, body: 0 },
        { day: "Sun", mind: 0, body: 0 },
      ];

  const averageMindScore = progressHistory.length > 0 
    ? Math.round(progressHistory.reduce((acc, p) => acc + p.mind_score, 0) / progressHistory.length)
    : 0;
  
  const averageBodyScore = progressHistory.length > 0
    ? Math.round(progressHistory.reduce((acc, p) => acc + p.body_score, 0) / progressHistory.length)
    : 0;

  const overallBalance = Math.round((averageMindScore + averageBodyScore) / 2);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/20">
        <Header />
        <main className="flex-1 pt-28 pb-12 flex items-center justify-center">
          <Card className="max-w-md mx-auto text-center p-8">
            <CardContent>
              <TrendingUp className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">Track Your Progress</h2>
              <p className="text-muted-foreground mb-6">
                Sign in to see your wellness journey, streaks, and personalized insights.
              </p>
              <Link to="/auth">
                <Button variant="accent" size="lg">
                  Sign In to Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Header />
      
      <main className="flex-1 pt-28 pb-12">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-calm/20 mb-6">
              <TrendingUp className="w-8 h-8 text-calm" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Your Balance Tracker
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See how your mind and body improve together. Your personal wellness journey.
            </p>
          </motion.div>

          {/* Streak Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-8"
          >
            <Card variant="glass" className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-wrap items-center justify-center gap-8">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Flame className="w-8 h-8 text-warmth" />
                      <span className="text-4xl font-bold text-foreground">
                        {streakData?.current_streak || 0}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">Day Streak</p>
                  </div>
                  <div className="h-12 w-px bg-border hidden sm:block" />
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Award className="w-8 h-8 text-energy" />
                      <span className="text-4xl font-bold text-foreground">
                        {streakData?.longest_streak || 0}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">Longest Streak</p>
                  </div>
                  <div className="h-12 w-px bg-border hidden sm:block" />
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Calendar className="w-8 h-8 text-calm" />
                      <span className="text-4xl font-bold text-foreground">
                        {streakData?.total_sessions || 0}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">Total Sessions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card variant="peace" className="text-center">
                <CardContent className="pt-6">
                  <Brain className="w-10 h-10 mx-auto mb-3 text-peace" />
                  <p className="text-3xl font-bold text-foreground mb-1">{averageMindScore}%</p>
                  <p className="text-sm text-muted-foreground">Mind Wellness Score</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card variant="vitality" className="text-center">
                <CardContent className="pt-6">
                  <Dumbbell className="w-10 h-10 mx-auto mb-3 text-vitality" />
                  <p className="text-3xl font-bold text-foreground mb-1">{averageBodyScore}%</p>
                  <p className="text-sm text-muted-foreground">Body Wellness Score</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card variant="calm" className="text-center">
                <CardContent className="pt-6">
                  <Heart className="w-10 h-10 mx-auto mb-3 text-calm" />
                  <p className="text-3xl font-bold text-foreground mb-1">{overallBalance}%</p>
                  <p className="text-sm text-muted-foreground">Overall Balance</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Weekly Progress Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-12"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  This Week's Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                {progressHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No data yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start using Manas and Fit to see your progress here!
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Link to="/manas">
                        <Button variant="calm">Start with Manas</Button>
                      </Link>
                      <Link to="/fit">
                        <Button variant="vitality">Start with Fit</Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-end justify-between gap-2 h-48">
                      {weeklyData.map((data, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center gap-2">
                          <div className="w-full flex gap-1 h-32 items-end">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${data.mind}%` }}
                              transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                              className="flex-1 bg-peace rounded-t-lg min-h-[4px]"
                            />
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${data.body}%` }}
                              transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                              className="flex-1 bg-vitality rounded-t-lg min-h-[4px]"
                            />
                          </div>
                          <span className="text-xs text-muted-foreground font-medium">
                            {data.day}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-center gap-6 mt-6">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-peace" />
                        <span className="text-sm text-muted-foreground">Mind</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-vitality" />
                        <span className="text-sm text-muted-foreground">Body</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-energy" />
              Continue Your Journey
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link to="/manas">
                <Card className="group hover:shadow-glow transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className="w-12 h-12 rounded-xl bg-peace/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Brain className="w-6 h-6 text-peace" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">Mind Care</h3>
                      <p className="text-sm text-muted-foreground">Breathing & meditation exercises</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </CardContent>
                </Card>
              </Link>
              <Link to="/fit">
                <Card className="group hover:shadow-glow transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className="w-12 h-12 rounded-xl bg-vitality/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Dumbbell className="w-6 h-6 text-vitality" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">Physical Wellness</h3>
                      <p className="text-sm text-muted-foreground">Workouts & nutrition plans</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </CardContent>
                </Card>
              </Link>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Progress;
