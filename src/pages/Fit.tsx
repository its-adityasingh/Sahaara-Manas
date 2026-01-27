import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getFitnessRecommendation, getNutritionPlan } from "@/lib/perplexity";
import { 
  Dumbbell, Utensils, Zap, Clock, Target, Play, 
  ChevronRight, Flame, Apple, Coffee, Sun, Sparkles,
  ArrowRight, Calendar, Loader2, Wand2, X
} from "lucide-react";

interface UserProfile {
  concerns: string[] | null;
  activity_level: string | null;
  display_name: string | null;
}

interface Workout {
  id: string;
  title: string;
  duration: string;
  level: string;
  description: string;
  icon: React.ElementType;
  exercises: string[];
  forConcerns?: string[];
  forActivityLevel?: string[];
}

const allWorkouts: Workout[] = [
  {
    id: "morning-energy",
    title: "Morning Energy Boost",
    duration: "15 min",
    level: "Beginner",
    description: "Quick routine to start your day with energy",
    icon: Sun,
    exercises: ["Stretches", "Jumping jacks", "Squats", "Push-ups"],
    forConcerns: ["energy", "motivation"],
    forActivityLevel: ["sedentary", "light"],
  },
  {
    id: "room-workout",
    title: "Small Space Workout",
    duration: "20 min",
    level: "All levels",
    description: "Perfect for hostel rooms or small spaces",
    icon: Target,
    exercises: ["Standing exercises", "Floor work", "Core strength"],
    forActivityLevel: ["sedentary", "light", "moderate"],
  },
  {
    id: "stress-relief",
    title: "Stress Relief Movement",
    duration: "10 min",
    level: "Easy",
    description: "Gentle movement to release tension",
    icon: Zap,
    exercises: ["Neck rolls", "Shoulder shrugs", "Hip circles", "Light stretching"],
    forConcerns: ["stress", "sleep", "academics"],
    forActivityLevel: ["sedentary", "light"],
  },
  {
    id: "focus-boost",
    title: "Focus Boost Routine",
    duration: "12 min",
    level: "Easy",
    description: "Light movement to improve concentration",
    icon: Coffee,
    exercises: ["Standing stretches", "Balance poses", "Breathing movement"],
    forConcerns: ["focus", "academics"],
  },
  {
    id: "strength-basics",
    title: "Strength Basics",
    duration: "25 min",
    level: "Intermediate",
    description: "Build foundational strength with bodyweight exercises",
    icon: Dumbbell,
    exercises: ["Push-ups", "Squats", "Lunges", "Planks", "Core work"],
    forConcerns: ["fitness"],
    forActivityLevel: ["moderate", "active"],
  },
  {
    id: "evening-wind-down",
    title: "Evening Wind Down",
    duration: "15 min",
    level: "Easy",
    description: "Gentle routine to prepare for restful sleep",
    icon: Sun,
    exercises: ["Gentle yoga", "Deep stretches", "Relaxation poses"],
    forConcerns: ["sleep", "stress"],
  },
];

const mealIdeas = [
  {
    type: "Breakfast",
    icon: Coffee,
    meals: [
      { name: "Poha with vegetables", budget: "₹20-30", time: "10 min" },
      { name: "Egg bhurji with roti", budget: "₹25-35", time: "15 min" },
      { name: "Overnight oats with banana", budget: "₹30-40", time: "5 min" },
    ],
  },
  {
    type: "Lunch/Dinner",
    icon: Utensils,
    meals: [
      { name: "Dal chawal with salad", budget: "₹40-50", time: "30 min" },
      { name: "Vegetable pulao", budget: "₹35-45", time: "25 min" },
      { name: "Chole with rice", budget: "₹40-55", time: "35 min" },
    ],
  },
  {
    type: "Snacks",
    icon: Apple,
    meals: [
      { name: "Roasted chana", budget: "₹15-20", time: "Ready" },
      { name: "Fruit with peanut butter", budget: "₹30-40", time: "2 min" },
      { name: "Sprouts chaat", budget: "₹20-30", time: "10 min" },
    ],
  },
];

// Format AI recommendation text with proper line breaks and sections
const formatAIRecommendation = (text: string): string => {
  if (!text) return "";
  
  let formatted = text.trim();
  
  // Remove preamble/explanation text from Perplexity
  const preamblePatterns = [
    /^I appreciate the request[^]*?Instead, here's/gi,
    /^I need to clarify[^]*?Instead, here's/gi,
    /^I'm Perplexity[^]*?formatted properly:/gi,
    /^I cannot follow[^]*?formatted properly:/gi,
    /^Here's a personalized[^]*?formatted properly:/gi,
    /^.*?here's a personalized/gi,
  ];
  
  preamblePatterns.forEach(pattern => {
    formatted = formatted.replace(pattern, '').trim();
  });
  
  // Remove any text before common content starters (preamble removal)
  const contentStarters = [
    /<table/i,
    /Weekly Schedule/i,
    /Practice Duration/i,
    /Training Frequency/i,
    /Daily Meal Plan/i,
    /Recommended Asanas/i,
    /Breathing Techniques/i,
    /Precautions/i,
    /Exercise/i,
    /Monday/i,
    /Breakfast/i,
    /Train/i,
    /Practice/i,
  ];
  
  for (const starter of contentStarters) {
    const match = formatted.match(starter);
    if (match && match.index && match.index > 0 && match.index < 500) {
      formatted = formatted.substring(match.index).trim();
      break;
    }
  }
  
  // Remove citation numbers in brackets like [1], [2], [3], etc.
  formatted = formatted.replace(/\[\d+\]/g, '');
  
  // Remove any remaining bracket citations like [citation needed], [source], etc.
  formatted = formatted.replace(/\[[^\]]*\]/g, '');
  
  // Define section titles and their patterns (match at start of line or after newline)
  const sectionTitles: Array<{ pattern: RegExp; title: string }> = [
    { pattern: /(^|\n)(Weekly Schedule|Practice Duration)[\s:]+/gim, title: "Weekly Schedule" },
    { pattern: /(^|\n)(Recommended Asanas|Yoga Poses|Recommended Poses)[\s:]+/gim, title: "Recommended Asanas" },
    { pattern: /(^|\n)(Breathing Techniques|Breathing)[\s:]+/gim, title: "Breathing Techniques" },
    { pattern: /(^|\n)(Precautions|Safety|Important Notes)[\s:]+/gim, title: "Precautions" },
    { pattern: /(^|\n)(Training Frequency|Frequency)[\s:]+/gim, title: "Training Frequency" },
    { pattern: /(^|\n)(Exercise|Exercises)[\s:]+/gim, title: "Exercises" },
    { pattern: /(^|\n)(Progression Tips|Progression)[\s:]+/gim, title: "Progression Tips" },
    { pattern: /(^|\n)(Safety Tips)[\s:]+/gim, title: "Safety Tips" },
    { pattern: /(^|\n)(Daily Meal Plan|Meal Plan)[\s:]+/gim, title: "Daily Meal Plan" },
    { pattern: /(^|\n)(Weekly Variations|Variations)[\s:]+/gim, title: "Weekly Variations" },
    { pattern: /(^|\n)(Budget Tips|Budget)[\s:]+/gim, title: "Budget Tips" },
    { pattern: /(^|\n)(Quick Recipes|Recipes)[\s:]+/gim, title: "Quick Recipes" },
  ];
  
  // Find all section matches
  const matches: Array<{ index: number; length: number; title: string }> = [];
  
  sectionTitles.forEach(({ pattern, title }) => {
    pattern.lastIndex = 0; // Reset regex
    let match;
    while ((match = pattern.exec(formatted)) !== null) {
      matches.push({
        index: match.index + match[1].length, // Adjust for the capture group
        length: match[0].length - match[1].length,
        title: title
      });
    }
  });
  
  // Remove duplicates and sort matches by index
  const uniqueMatches = matches.filter((match, index, self) =>
    index === self.findIndex(m => m.index === match.index && m.title === match.title)
  );
  uniqueMatches.sort((a, b) => a.index - b.index);
  
  // Build formatted HTML
  if (uniqueMatches.length === 0) {
    // No sections found, just add line breaks and format
    return formatPlainText(formatted);
  }
  
  let result = '';
  let lastIndex = 0;
  
  uniqueMatches.forEach((match, i) => {
    // Add content before this section
    if (match.index > lastIndex) {
      const beforeContent = formatted.substring(lastIndex, match.index).trim();
      if (beforeContent) {
        result += formatPlainText(beforeContent) + '<br /><br />';
      }
    }
    
    // Add section heading with styling
    result += `<h3 style="font-size: 1.25rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.75rem; color: inherit; border-bottom: 2px solid rgba(148, 163, 184, 0.3); padding-bottom: 0.5rem;">${match.title}</h3>`;
    
    // Get content for this section
    const nextMatch = uniqueMatches[i + 1];
    const sectionEnd = nextMatch ? nextMatch.index : formatted.length;
    const sectionContent = formatted.substring(match.index + match.length, sectionEnd).trim();
    
    result += formatPlainText(sectionContent);
    if (i < uniqueMatches.length - 1) {
      result += '<br /><br />';
    }
    
    lastIndex = sectionEnd;
  });
  
  return result;
};

// Helper to format plain text with proper line breaks
const formatPlainText = (content: string): string => {
  if (!content) return '';
  
  // If already has HTML table tags, enhance styling and add spacing
  if (content.includes('<table')) {
    // Add attractive styling to tables by wrapping and enhancing
    let styled = content
      // Replace table tag, preserving any existing attributes
      .replace(/<table(\s[^>]*)?>/gi, (match, attrs) => {
        const existingStyle = attrs?.match(/style="([^"]*)"/i)?.[1] || '';
        return `<table${attrs?.replace(/style="[^"]*"/i, '') || ''} style="width: 100%; border-collapse: collapse; margin: 1.5rem 0; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); ${existingStyle}">`;
      })
      // Replace thead
      .replace(/<thead(\s[^>]*)?>/gi, (match, attrs) => {
        return `<thead${attrs?.replace(/style="[^"]*"/i, '') || ''} style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);">`;
      })
      // Replace th tags
      .replace(/<th(\s[^>]*)?>/gi, (match, attrs) => {
        return `<th${attrs?.replace(/style="[^"]*"/i, '') || ''} style="padding: 12px 16px; text-align: left; font-weight: 600; font-size: 0.875rem; color: rgb(99, 102, 241); border-bottom: 2px solid rgba(99, 102, 241, 0.2); background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%);">`;
      })
      // Replace td tags
      .replace(/<td(\s[^>]*)?>/gi, (match, attrs) => {
        return `<td${attrs?.replace(/style="[^"]*"/i, '') || ''} style="padding: 12px 16px; border-bottom: 1px solid rgba(0,0,0,0.05); color: rgb(55, 65, 81);">`;
      })
      // Replace tr tags for hover effect
      .replace(/<tr(\s[^>]*)?>/gi, (match, attrs) => {
        const existingClass = attrs?.match(/class="([^"]*)"/i)?.[1] || '';
        return `<tr${attrs?.replace(/style="[^"]*"/i, '') || ''} class="table-row-hover ${existingClass}" style="transition: background-color 0.2s;">`;
      })
      // Replace tbody
      .replace(/<tbody(\s[^>]*)?>/gi, (match, attrs) => {
        return `<tbody${attrs?.replace(/style="[^"]*"/i, '') || ''} style="background: white;">`;
      });
    
    // Wrap with style tag for hover effects
    if (!styled.includes('<style')) {
      styled = '<style>.table-row-hover:hover { background-color: rgba(99, 102, 241, 0.05) !important; } .table-row-hover:last-child td { border-bottom: none !important; }</style>' + styled;
    }
    
    // Add spacing after tables
    return styled.replace(/(<\/table>)/g, '$1<br /><br />');
  }
  
  // For plain text, process line breaks
  // First, normalize multiple consecutive newlines to double newlines
  let normalized = content.replace(/\n{3,}/g, '\n\n');
  
  // Split by double newlines for paragraph breaks
  const parts = normalized.split(/\n\n+/);
  
  return parts.map(part => {
    const trimmed = part.trim();
    if (!trimmed) return '';
    
    // Replace single newlines with <br />
    const withBreaks = trimmed.replace(/\n/g, '<br />');
    
    // Wrap in paragraph tag
    return `<p style="margin-bottom: 0.75rem; line-height: 1.6;">${withBreaks}</p>`;
  }).join('');
};

const Fit = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFitnessForm, setShowFitnessForm] = useState(false);
  const [showNutritionForm, setShowNutritionForm] = useState(false);
  const [fitnessLoading, setFitnessLoading] = useState(false);
  const [nutritionLoading, setNutritionLoading] = useState(false);
  const [fitnessRecommendation, setFitnessRecommendation] = useState<string | null>(null);
  const [nutritionRecommendation, setNutritionRecommendation] = useState<string | null>(null);
  const [fitnessGoal, setFitnessGoal] = useState("");
  const [nutritionGoal, setNutritionGoal] = useState("");
  const [fitnessInput, setFitnessInput] = useState("");
  const [nutritionInput, setNutritionInput] = useState("");

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from("profiles")
        .select("concerns, activity_level, display_name")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (data) setUserProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter workouts based on user profile
  const getRecommendedWorkouts = () => {
    if (!userProfile?.concerns && !userProfile?.activity_level) return [];
    
    return allWorkouts.filter(workout => {
      const matchesConcern = workout.forConcerns?.some(c => userProfile.concerns?.includes(c));
      const matchesActivity = workout.forActivityLevel?.includes(userProfile.activity_level || "");
      return matchesConcern || matchesActivity;
    });
  };

  const recommendedWorkouts = getRecommendedWorkouts();
  const otherWorkouts = recommendedWorkouts.length > 0
    ? allWorkouts.filter(w => !recommendedWorkouts.find(r => r.id === w.id))
    : allWorkouts;

  const handleGetFitnessRecommendation = async () => {
    if (!fitnessGoal.trim()) {
      return;
    }

    setFitnessLoading(true);
    setFitnessRecommendation(null);
    setShowFitnessForm(false); // Hide form while loading
    try {
      const recommendation = await getFitnessRecommendation(
        fitnessGoal,
        fitnessInput || undefined
      );
      if (recommendation && recommendation.trim()) {
        setFitnessRecommendation(formatAIRecommendation(recommendation));
        setShowFitnessForm(false);
      } else {
        setFitnessRecommendation("Chinku couldn't generate a plan right now. Please try again!");
      }
    } catch (error) {
      console.error("Error getting fitness recommendation:", error);
      setFitnessRecommendation("Chinku encountered an issue. Please try again in a moment!");
    } finally {
      setFitnessLoading(false);
    }
  };

  const handleGetNutritionPlan = async () => {
    if (!nutritionGoal.trim()) {
      return;
    }

    setNutritionLoading(true);
    setNutritionRecommendation(null);
    setShowNutritionForm(false); // Hide form while loading
    try {
      const recommendation = await getNutritionPlan(
        nutritionGoal,
        nutritionInput || undefined
      );
      if (recommendation && recommendation.trim()) {
        setNutritionRecommendation(formatAIRecommendation(recommendation));
        setShowNutritionForm(false);
      } else {
        setNutritionRecommendation("Chinku couldn't generate a plan right now. Please try again!");
      }
    } catch (error) {
      console.error("Error getting nutrition plan:", error);
      setNutritionRecommendation("Chinku encountered an issue. Please try again in a moment!");
    } finally {
      setNutritionLoading(false);
    }
  };

  const handleStartWorkout = async (workout: Workout) => {
    // Show success toast immediately
    toast({
      title: "Workout Started! 💪",
      description: `You've started "${workout.title}". Good luck with your ${workout.duration} workout!`,
    });

    // Update wellness progress (only if user is logged in)
    if (user) {
      try {
        const today = new Date().toISOString().split('T')[0];
        const durationMins = parseInt(workout.duration) || 15;
        
        const { data: existing } = await supabase
          .from("wellness_progress")
          .select("*")
          .eq("user_id", user.id)
          .eq("date", today)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("wellness_progress")
            .update({
              workout_minutes: (existing.workout_minutes || 0) + durationMins,
              body_score: Math.min((existing.body_score || 0) + 15, 100),
            })
            .eq("id", existing.id);
        } else {
          await supabase.from("wellness_progress").insert({
            user_id: user.id,
            date: today,
            workout_minutes: durationMins,
            mind_score: 0,
            body_score: 25,
          });
        }

        // Update streak
        const { data: streak } = await supabase
          .from("user_streaks")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        const todayStr = todayDate.toISOString().split('T')[0];

        if (streak) {
          const lastActivity = streak.last_activity_date ? new Date(streak.last_activity_date) : null;
          
          let newStreak = streak.current_streak || 0;
          if (lastActivity) {
            lastActivity.setHours(0, 0, 0, 0);
            const diffDays = Math.floor((todayDate.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
              newStreak = (streak.current_streak || 0) + 1;
            } else if (diffDays > 1) {
              newStreak = 1;
            } else if (diffDays === 0) {
              // Same day, don't increment streak but update session count
              newStreak = streak.current_streak || 0;
            }
          } else {
            newStreak = 1;
          }

          await supabase
            .from("user_streaks")
            .update({
              current_streak: newStreak,
              longest_streak: Math.max(newStreak, streak.longest_streak || 0),
              last_activity_date: todayStr,
              total_sessions: (streak.total_sessions || 0) + 1,
            })
            .eq("user_id", user.id);
        } else {
          // Create streak record if it doesn't exist
          await supabase.from("user_streaks").insert({
            user_id: user.id,
            current_streak: 1,
            longest_streak: 1,
            last_activity_date: todayStr,
            total_sessions: 1,
          });
        }
      } catch (error) {
        // Silently fail - workout still started, just progress tracking failed
        console.error("Error updating progress:", error);
      }
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
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-vitality/20 mb-6">
              <Dumbbell className="w-8 h-8 text-vitality" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Fit – Physical Wellness
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {userProfile?.display_name 
                ? `Hey ${userProfile.display_name}! Here are workouts aligned with your goals.`
                : "Fitness routines and nutrition made for real student life."}
            </p>
          </motion.div>

          {/* Login prompt */}
          {!user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <Card variant="glass" className="text-center p-6">
                <CardContent>
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-vitality" />
                  <h3 className="text-lg font-semibold mb-2">Get Personalized Workouts</h3>
                  <p className="text-muted-foreground mb-4">
                    Sign in to get workouts tailored to your activity level and track your progress.
                  </p>
                  <Link to="/auth">
                    <Button variant="accent">
                      Sign In
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Tabs */}
          <Tabs defaultValue="workouts" className="space-y-8">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="workouts" className="gap-2">
                <Dumbbell className="w-4 h-4" />
                Workouts
              </TabsTrigger>
              <TabsTrigger value="nutrition" className="gap-2">
                <Utensils className="w-4 h-4" />
                Nutrition
              </TabsTrigger>
            </TabsList>

            {/* Workouts Tab */}
            <TabsContent value="workouts">
              {/* AI-Powered Fitness Recommendations */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
              >
                <Card variant="glass" className="border-primary/30">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-vitality/20 flex items-center justify-center">
                          <Wand2 className="w-6 h-6 text-vitality" />
                        </div>
                        <div>
                          <CardTitle className="text-2xl">AI-Powered Fitness Plan</CardTitle>
                          <CardDescription>
                            Get personalized exercises based on your fitness goals
                          </CardDescription>
                        </div>
                      </div>
                      {!showFitnessForm && !fitnessRecommendation && (
                        <Button
                          variant="accent"
                          onClick={() => setShowFitnessForm(true)}
                        >
                          <Wand2 className="w-4 h-4 mr-2" />
                          Get Personalized Plan
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                    <CardContent>
                      {fitnessLoading && (
                        <div className="text-center py-8 space-y-4">
                          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                          <p className="text-lg font-semibold text-foreground">
                            Chinku is generating plan for you...
                          </p>
                          <p className="text-sm text-muted-foreground">
                            This may take a few moments. Please wait.
                          </p>
                        </div>
                      )}
                      
                      {showFitnessForm && !fitnessRecommendation && !fitnessLoading && (
                        <div className="space-y-4">
                        <div>
                          <Label htmlFor="fitness-goal">What is your fitness goal? *</Label>
                          <div className="grid grid-cols-2 gap-3 mt-2">
                            {["Lose Weight", "Gain Weight", "Gain Muscle", "Improve Endurance", "General Fitness", "Tone Body"].map((goal) => (
                              <Button
                                key={goal}
                                variant={fitnessGoal === goal ? "default" : "outline"}
                                onClick={() => setFitnessGoal(goal)}
                                className="w-full"
                              >
                                {goal}
                              </Button>
                            ))}
                          </div>
                          <Textarea
                            placeholder="Or describe your goal in your own words..."
                            value={fitnessGoal}
                            onChange={(e) => setFitnessGoal(e.target.value)}
                            className="mt-2"
                            rows={2}
                          />
                        </div>
                        <div>
                          <Label htmlFor="fitness-input">Any additional information? (Optional)</Label>
                          <Textarea
                            id="fitness-input"
                            placeholder="e.g., I'm a beginner, I have 30 minutes daily, I prefer home workouts..."
                            value={fitnessInput}
                            onChange={(e) => setFitnessInput(e.target.value)}
                            className="mt-2"
                            rows={3}
                          />
                        </div>
                        <div className="flex gap-3">
                          <Button
                            onClick={handleGetFitnessRecommendation}
                            disabled={fitnessLoading || !fitnessGoal.trim()}
                            className="flex-1"
                          >
                            {fitnessLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Chinku is generating plan for you...
                              </>
                            ) : (
                              <>
                                <Wand2 className="w-4 h-4 mr-2" />
                                Generate Plan
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowFitnessForm(false);
                              setFitnessGoal("");
                              setFitnessInput("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                      {fitnessRecommendation && !fitnessLoading && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">Your Personalized Fitness Plan</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setFitnessRecommendation(null);
                              setFitnessGoal("");
                              setFitnessInput("");
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <div 
                            className="text-foreground bg-muted/50 p-6 rounded-lg border border-border whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{ __html: fitnessRecommendation }}
                          />
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setFitnessRecommendation(null);
                            setShowFitnessForm(true);
                            setFitnessGoal("");
                            setFitnessInput("");
                          }}
                        >
                          Generate New Plan
                        </Button>
                      </div>
                    )}

                      {!showFitnessForm && !fitnessRecommendation && !fitnessLoading && (
                        <p className="text-muted-foreground text-center py-4">
                          Click "Get Personalized Plan" to receive AI-generated workout recommendations tailored to your goals.
                        </p>
                      )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recommended Workouts */}
              {recommendedWorkouts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-12"
                >
                  <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-energy" />
                    Recommended for You
                  </h2>
                  <p className="text-muted-foreground mb-6">Based on your profile and concerns.</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {recommendedWorkouts.map((workout, index) => {
                      const IconComponent = workout.icon;
                      return (
                        <motion.div
                          key={workout.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Card className="h-full group hover:shadow-glow transition-all duration-300 hover:-translate-y-1 border-primary/30">
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div className="w-12 h-12 rounded-xl bg-vitality/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                  <IconComponent className="w-6 h-6 text-vitality" />
                                </div>
                                <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
                                  {workout.level}
                                </span>
                              </div>
                              <CardTitle className="mt-4">{workout.title}</CardTitle>
                              <CardDescription>{workout.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {workout.duration}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Flame className="w-4 h-4" />
                                  {workout.exercises.length} exercises
                                </span>
                              </div>
                              <Button 
                                variant="vitality" 
                                className="w-full"
                                onClick={() => handleStartWorkout(workout)}
                              >
                                <Play className="w-4 h-4" />
                                Start Workout
                              </Button>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Other Workouts */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {(recommendedWorkouts.length > 0 ? otherWorkouts : allWorkouts).map((workout, index) => {
                  const IconComponent = workout.icon;
                  return (
                    <motion.div
                      key={workout.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="h-full group hover:shadow-glow transition-all duration-300 hover:-translate-y-1">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="w-12 h-12 rounded-xl bg-vitality/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <IconComponent className="w-6 h-6 text-vitality" />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
                              {workout.level}
                            </span>
                          </div>
                          <CardTitle className="mt-4">{workout.title}</CardTitle>
                          <CardDescription>{workout.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {workout.duration}
                            </span>
                            <span className="flex items-center gap-1">
                              <Flame className="w-4 h-4" />
                              {workout.exercises.length} exercises
                            </span>
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            {workout.exercises.slice(0, 3).map((exercise, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-sm">
                                <div className="w-1.5 h-1.5 rounded-full bg-vitality" />
                                <span className="text-foreground/80">{exercise}</span>
                              </div>
                            ))}
                            {workout.exercises.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                +{workout.exercises.length - 3} more
                              </span>
                            )}
                          </div>

                          <Button 
                            variant="vitality" 
                            className="w-full"
                            onClick={() => handleStartWorkout(workout)}
                          >
                            <Play className="w-4 h-4" />
                            Start Workout
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            </TabsContent>

            {/* Nutrition Tab */}
            <TabsContent value="nutrition">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* AI-Powered Nutrition Plan */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-12"
                >
                  <Card variant="glass" className="border-primary/30">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-energy/20 flex items-center justify-center">
                            <Wand2 className="w-6 h-6 text-energy" />
                          </div>
                          <div>
                            <CardTitle className="text-2xl">AI-Powered Nutrition Plan</CardTitle>
                            <CardDescription>
                              Get personalized diet charts based on your goals
                            </CardDescription>
                          </div>
                        </div>
                        {!showNutritionForm && !nutritionRecommendation && (
                          <Button
                            variant="accent"
                            onClick={() => setShowNutritionForm(true)}
                          >
                            <Wand2 className="w-4 h-4 mr-2" />
                            Get Personalized Plan
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {nutritionLoading && (
                        <div className="text-center py-8 space-y-4">
                          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                          <p className="text-lg font-semibold text-foreground">
                            Chinku is generating plan for you...
                          </p>
                          <p className="text-sm text-muted-foreground">
                            This may take a few moments. Please wait.
                          </p>
                        </div>
                      )}
                      
                      {showNutritionForm && !nutritionRecommendation && !nutritionLoading && (
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="nutrition-goal">What is your nutrition goal? *</Label>
                            <div className="grid grid-cols-2 gap-3 mt-2">
                              {["Weight Loss", "Weight Gain", "Muscle Gain", "Maintain Weight", "Improve Energy", "General Health"].map((goal) => (
                                <Button
                                  key={goal}
                                  variant={nutritionGoal === goal ? "default" : "outline"}
                                  onClick={() => setNutritionGoal(goal)}
                                  className="w-full"
                                >
                                  {goal}
                                </Button>
                              ))}
                            </div>
                            <Textarea
                              placeholder="Or describe your goal in your own words..."
                              value={nutritionGoal}
                              onChange={(e) => setNutritionGoal(e.target.value)}
                              className="mt-2"
                              rows={2}
                            />
                          </div>
                          <div>
                            <Label htmlFor="nutrition-input">Any additional information? (Optional)</Label>
                            <Textarea
                              id="nutrition-input"
                              placeholder="e.g., I'm vegetarian, I have a budget constraint, I prefer simple meals..."
                              value={nutritionInput}
                              onChange={(e) => setNutritionInput(e.target.value)}
                              className="mt-2"
                              rows={3}
                            />
                          </div>
                          <div className="flex gap-3">
                            <Button
                              onClick={handleGetNutritionPlan}
                              disabled={nutritionLoading || !nutritionGoal.trim()}
                              className="flex-1"
                            >
                              {nutritionLoading ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Chinku is generating plan for you...
                                </>
                              ) : (
                                <>
                                  <Wand2 className="w-4 h-4 mr-2" />
                                  Generate Plan
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setShowNutritionForm(false);
                                setNutritionGoal("");
                                setNutritionInput("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}

                      {nutritionRecommendation && !nutritionLoading && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Your Personalized Diet Plan</h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setNutritionRecommendation(null);
                                setNutritionGoal("");
                                setNutritionInput("");
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="prose prose-sm max-w-none dark:prose-invert">
                            <div 
                              className="text-foreground bg-muted/50 p-6 rounded-lg border border-border whitespace-pre-wrap"
                              dangerouslySetInnerHTML={{ __html: nutritionRecommendation }}
                            />
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setNutritionRecommendation(null);
                              setShowNutritionForm(true);
                              setNutritionGoal("");
                              setNutritionInput("");
                            }}
                          >
                            Generate New Plan
                          </Button>
                        </div>
                      )}

                      {!showNutritionForm && !nutritionRecommendation && !nutritionLoading && (
                        <p className="text-muted-foreground text-center py-4">
                          Click "Get Personalized Plan" to receive AI-generated diet recommendations tailored to your goals.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {mealIdeas.map((category, index) => {
                    const IconComponent = category.icon;
                    return (
                      <motion.div
                        key={category.type}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="h-full">
                          <CardHeader>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-energy/20 flex items-center justify-center">
                                <IconComponent className="w-5 h-5 text-energy" />
                              </div>
                              <CardTitle className="text-lg">{category.type}</CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {category.meals.map((meal, idx) => (
                                <div
                                  key={idx}
                                  className="p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-all cursor-pointer group"
                                >
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                                        {meal.name}
                                      </h4>
                                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                        <span>{meal.budget}</span>
                                        <span>•</span>
                                        <span>{meal.time}</span>
                                      </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>

                <Card variant="glass" className="mt-8">
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground mb-4">
                      🍽️ All meal ideas are budget-friendly and use ingredients easily available in India.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Use the AI-Powered Nutrition Plan above for personalized diet recommendations!
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Fit;
