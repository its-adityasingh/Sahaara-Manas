import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import BreathingExercise from "@/components/manas/BreathingExercise";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getYogaRecommendation } from "@/lib/perplexity";
import { 
  Brain, Wind, BookOpen, Heart, Sparkles, Play, 
  Clock, Moon, Sun, Waves, ChevronRight, Calendar, ArrowRight, Loader2, Wand2, X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Exercise {
  id: string;
  title: string;
  duration: number;
  durationLabel: string;
  description: string;
  icon: React.ElementType;
  color: string;
  pattern: {
    inhale: number;
    hold1: number;
    exhale: number;
    hold2: number;
  };
  soundUrl?: string;
  forConcerns?: string[];
}

const allExercises: Exercise[] = [
  {
    id: "box-breathing",
    title: "Box Breathing",
    duration: 180,
    durationLabel: "3 min",
    description: "Equal inhale, hold, exhale, and rest. Perfect for focus.",
    icon: Wind,
    color: "calm",
    pattern: { inhale: 4, hold1: 4, exhale: 4, hold2: 4 },
    forConcerns: ["stress", "focus", "academics"],
  },
  {
    id: "relaxing-breath",
    title: "4-7-8 Relaxing Breath",
    duration: 300,
    durationLabel: "5 min",
    description: "A calming technique to reduce anxiety and help you sleep.",
    icon: Moon,
    color: "peace",
    pattern: { inhale: 4, hold1: 7, exhale: 8, hold2: 2 },
    forConcerns: ["sleep", "stress"],
  },
  {
    id: "energizing",
    title: "Energizing Breath",
    duration: 120,
    durationLabel: "2 min",
    description: "Quick energizing breaths to boost alertness and energy.",
    icon: Sun,
    color: "vitality",
    pattern: { inhale: 2, hold1: 1, exhale: 2, hold2: 1 },
    forConcerns: ["energy", "motivation"],
  },
  {
    id: "deep-calm",
    title: "Deep Calm",
    duration: 600,
    durationLabel: "10 min",
    description: "Extended slow breathing for deep relaxation and meditation.",
    icon: Waves,
    color: "peace",
    pattern: { inhale: 5, hold1: 3, exhale: 7, hold2: 3 },
    forConcerns: ["stress", "sleep", "loneliness"],
  },
  {
    id: "stress-relief",
    title: "Stress Relief",
    duration: 300,
    durationLabel: "5 min",
    description: "Longer exhales to activate your body's relaxation response.",
    icon: Heart,
    color: "warmth",
    pattern: { inhale: 4, hold1: 2, exhale: 6, hold2: 2 },
    forConcerns: ["stress", "academics"],
  },
  {
    id: "grounding",
    title: "Grounding Breath",
    duration: 180,
    durationLabel: "3 min",
    description: "Connect with your body and feel more present.",
    icon: Sparkles,
    color: "calm",
    pattern: { inhale: 4, hold1: 4, exhale: 4, hold2: 4 },
    forConcerns: ["loneliness", "stress"],
  }
];

const journalPrompts = [
  "What made you smile today?",
  "What's one thing you're grateful for?",
  "How did you handle a challenge recently?",
  "What's something kind you did for yourself?",
  "What would make tomorrow a great day?",
  "What's one thing you learned about yourself this week?"
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

interface UserProfile {
  concerns: string[] | null;
  display_name: string | null;
}

const Manas = () => {
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAIForm, setShowAIForm] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);
  const [userFeelings, setUserFeelings] = useState("");
  const [userGoals, setUserGoals] = useState("");
  const [userInput, setUserInput] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [reflectionText, setReflectionText] = useState("");
  const [reflectionDialogOpen, setReflectionDialogOpen] = useState(false);
  const [savingReflection, setSavingReflection] = useState(false);

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
        .select("concerns, display_name")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (data) setUserProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter exercises based on user concerns, or show all if no profile
  const recommendedExercises = userProfile?.concerns && userProfile.concerns.length > 0
    ? allExercises.filter(ex => 
        ex.forConcerns?.some(c => userProfile.concerns?.includes(c))
      )
    : [];

  const otherExercises = userProfile?.concerns && userProfile.concerns.length > 0
    ? allExercises.filter(ex => 
        !ex.forConcerns?.some(c => userProfile.concerns?.includes(c))
      )
    : allExercises;

  const handleGetAIRecommendation = async () => {
    if (!userFeelings.trim() || !userGoals.trim()) {
      return;
    }

    setAiLoading(true);
    setAiRecommendation(null);
    setShowAIForm(false); // Hide form while loading
    try {
      const recommendation = await getYogaRecommendation(
        userInput || "No specific input provided",
        userFeelings,
        userGoals
      );
      if (recommendation && recommendation.trim()) {
        setAiRecommendation(formatAIRecommendation(recommendation));
        setShowAIForm(false);
      } else {
        setAiRecommendation("Chinku couldn't generate a plan right now. Please try again!");
      }
    } catch (error) {
      console.error("Error getting AI recommendation:", error);
      setAiRecommendation("Chinku encountered an issue. Please try again in a moment!");
    } finally {
      setAiLoading(false);
    }
  };

  const handlePromptClick = (prompt: string) => {
    setSelectedPrompt(prompt);
    setReflectionText("");
    setReflectionDialogOpen(true);
  };

  const handleSaveReflection = async () => {
    if (!user || !selectedPrompt || !reflectionText.trim()) {
      return;
    }

    setSavingReflection(true);
    try {
      // Save reflection to mood_checkins table using the notes field
      const { error } = await supabase.from("mood_checkins").insert({
        user_id: user.id,
        mood_level: 3, // Default neutral mood since it's a reflection
        notes: `Prompt: ${selectedPrompt}\n\nReflection: ${reflectionText.trim()}`,
      });

      if (error) throw error;

      // Close dialog and reset
      setReflectionDialogOpen(false);
      setSelectedPrompt(null);
      setReflectionText("");
      
      // Show success toast
      toast({
        title: "Reflection saved!",
        description: "Your reflection has been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving reflection:", error);
      toast({
        title: "Error",
        description: "Failed to save reflection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingReflection(false);
    }
  };

  const handleStartExercise = async (exercise: Exercise) => {
    setActiveExercise(exercise);
    
    // Update wellness progress
    if (user) {
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      const todayStr = todayDate.toISOString().split('T')[0];
      
      // Check if today's progress exists
      const { data: existing } = await supabase
        .from("wellness_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", todayStr)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("wellness_progress")
          .update({
            meditation_minutes: (existing.meditation_minutes || 0) + Math.floor(exercise.duration / 60),
            mind_score: Math.min((existing.mind_score || 0) + 10, 100),
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("wellness_progress").insert({
          user_id: user.id,
          date: todayStr,
          meditation_minutes: Math.floor(exercise.duration / 60),
          mind_score: 20,
          body_score: 0,
        });
      }

      // Update streak
      const { data: streak } = await supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

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
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-peace/20 mb-6">
              <Brain className="w-8 h-8 text-peace" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Manas – Mind Care
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {userProfile?.display_name 
                ? `Welcome back, ${userProfile.display_name}! Here are exercises tailored for you.`
                : "A gentle space for emotional support, mental clarity, and stress relief."}
            </p>
          </motion.div>

          {/* Login prompt for non-authenticated users */}
          {!user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <Card variant="glass" className="text-center p-6">
                <CardContent>
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-calm" />
                  <h3 className="text-lg font-semibold mb-2">Get Personalized Recommendations</h3>
                  <p className="text-muted-foreground mb-4">
                    Sign in to get exercises tailored to your specific needs and track your progress.
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

          {/* Active Exercise */}
          {activeExercise && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-12"
            >
              <BreathingExercise
                title={activeExercise.title}
                duration={activeExercise.duration}
                pattern={activeExercise.pattern}
                soundUrl={activeExercise.soundUrl}
                onClose={() => setActiveExercise(null)}
              />
            </motion.div>
          )}

          {/* AI-Powered Yoga Recommendations */}
          {!activeExercise && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
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
                        <CardTitle className="text-2xl">AI-Powered Yoga Plan</CardTitle>
                        <CardDescription>
                          Get a personalized yoga timetable and patterns based on how you're feeling
                        </CardDescription>
                      </div>
                    </div>
                    {!showAIForm && !aiRecommendation && (
                      <Button
                        variant="accent"
                        onClick={() => setShowAIForm(true)}
                      >
                        <Wand2 className="w-4 h-4 mr-2" />
                        Get Personalized Plan
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {aiLoading && (
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
                  
                  {showAIForm && !aiRecommendation && !aiLoading && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="feelings">How are you feeling today? *</Label>
                        <Textarea
                          id="feelings"
                          placeholder="e.g., I'm feeling stressed about exams, anxious about the future..."
                          value={userFeelings}
                          onChange={(e) => setUserFeelings(e.target.value)}
                          className="mt-2"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="goals">What do you want to achieve with yoga? *</Label>
                        <Textarea
                          id="goals"
                          placeholder="e.g., Reduce stress, improve focus, better sleep, increase flexibility..."
                          value={userGoals}
                          onChange={(e) => setUserGoals(e.target.value)}
                          className="mt-2"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="input">Any additional information? (Optional)</Label>
                        <Textarea
                          id="input"
                          placeholder="e.g., I have limited time in the morning, prefer gentle practices..."
                          value={userInput}
                          onChange={(e) => setUserInput(e.target.value)}
                          className="mt-2"
                          rows={2}
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={handleGetAIRecommendation}
                          disabled={aiLoading || !userFeelings.trim() || !userGoals.trim()}
                          className="flex-1"
                        >
                          {aiLoading ? (
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
                            setShowAIForm(false);
                            setUserFeelings("");
                            setUserGoals("");
                            setUserInput("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {aiRecommendation && !aiLoading && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Your Personalized Yoga Plan</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setAiRecommendation(null);
                            setUserFeelings("");
                            setUserGoals("");
                            setUserInput("");
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <div 
                          className="text-foreground bg-muted/50 p-6 rounded-lg border border-border whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{ __html: aiRecommendation }}
                        />
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setAiRecommendation(null);
                          setShowAIForm(true);
                          setUserFeelings("");
                          setUserGoals("");
                          setUserInput("");
                        }}
                      >
                        Generate New Plan
                      </Button>
                    </div>
                  )}

                    {!showAIForm && !aiRecommendation && !aiLoading && (
                      <p className="text-muted-foreground text-center py-4">
                        Click "Get Personalized Plan" to receive AI-generated yoga recommendations tailored to your needs.
                      </p>
                    )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Recommended Exercises (for logged in users with profile) */}
          {!activeExercise && recommendedExercises.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-12"
            >
              <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-energy" />
                Recommended for You
              </h2>
              <p className="text-muted-foreground mb-6">Based on your concerns, we think these will help.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendedExercises.map((exercise, index) => {
                  const IconComponent = exercise.icon;
                  return (
                    <motion.div
                      key={exercise.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="h-full group hover:shadow-glow transition-all duration-300 hover:-translate-y-1 border-primary/30">
                        <CardHeader>
                          <div className={`w-12 h-12 rounded-xl bg-${exercise.color}/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                            <IconComponent className={`w-6 h-6 text-${exercise.color}`} />
                          </div>
                          <CardTitle className="text-lg">{exercise.title}</CardTitle>
                          <CardDescription>{exercise.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              {exercise.durationLabel}
                            </div>
                            <Button
                              variant="calm"
                              size="sm"
                              onClick={() => handleStartExercise(exercise)}
                            >
                              <Play className="w-4 h-4" />
                              Start
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* All Exercises */}
          {!activeExercise && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-12"
            >
              <h2 className="text-2xl font-bold text-foreground mb-6">
                {recommendedExercises.length > 0 ? "More Exercises" : "Breathing & Meditation Exercises"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherExercises.map((exercise, index) => {
                  const IconComponent = exercise.icon;
                  return (
                    <motion.div
                      key={exercise.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="h-full group hover:shadow-glow transition-all duration-300 hover:-translate-y-1">
                        <CardHeader>
                          <div className={`w-12 h-12 rounded-xl bg-${exercise.color}/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                            <IconComponent className={`w-6 h-6 text-${exercise.color}`} />
                          </div>
                          <CardTitle className="text-lg">{exercise.title}</CardTitle>
                          <CardDescription>{exercise.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              {exercise.durationLabel}
                            </div>
                            <Button
                              variant="calm"
                              size="sm"
                              onClick={() => handleStartExercise(exercise)}
                            >
                              <Play className="w-4 h-4" />
                              Start
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Journaling Section */}
          {!activeExercise && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-peace" />
                Reflection Prompts
              </h2>
              <Card variant="glass">
                <CardContent className="p-6">
                  <p className="text-muted-foreground mb-6">
                    Take a moment to reflect. Choose a prompt that speaks to you today.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {journalPrompts.map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => handlePromptClick(prompt)}
                        className="text-left p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all duration-300 group cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-peace/20 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-peace/40 transition-colors">
                            <ChevronRight className="w-4 h-4 text-peace" />
                          </div>
                          <span className="text-foreground">{prompt}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  {!user && (
                    <p className="text-sm text-muted-foreground mt-4 text-center">
                      <Link to="/auth" className="text-primary hover:underline">
                        Sign in
                      </Link> to save your reflections
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />

      {/* Reflection Dialog */}
      <Dialog open={reflectionDialogOpen} onOpenChange={setReflectionDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-peace" />
              Your Reflection
            </DialogTitle>
            <DialogDescription>
              {selectedPrompt}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reflection">Write your thoughts</Label>
              <Textarea
                id="reflection"
                placeholder="Take your time to reflect and write from the heart..."
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                className="min-h-[200px]"
                rows={8}
              />
            </div>
            {!user && (
              <p className="text-sm text-muted-foreground">
                <Link to="/auth" className="text-primary hover:underline">
                  Sign in
                </Link> to save your reflection
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReflectionDialogOpen(false);
                setSelectedPrompt(null);
                setReflectionText("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveReflection}
              disabled={!user || !reflectionText.trim() || savingReflection}
              variant="calm"
            >
              {savingReflection ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Reflection"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Manas;
