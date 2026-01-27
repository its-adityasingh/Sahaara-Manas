import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Heart, ArrowRight, ArrowLeft, User, Brain, Dumbbell, 
  Moon, Zap, Coffee, BookOpen, Users, Frown
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface OnboardingFlowProps {
  userId: string;
  onComplete: () => void;
}

const concerns = [
  { id: "stress", label: "Stress & Anxiety", icon: Brain },
  { id: "sleep", label: "Sleep Issues", icon: Moon },
  { id: "energy", label: "Low Energy", icon: Zap },
  { id: "focus", label: "Focus Problems", icon: Coffee },
  { id: "motivation", label: "Lack of Motivation", icon: Frown },
  { id: "loneliness", label: "Loneliness", icon: Users },
  { id: "academics", label: "Academic Pressure", icon: BookOpen },
  { id: "fitness", label: "Physical Fitness", icon: Dumbbell },
];

const activityLevels = [
  { id: "sedentary", label: "Sedentary", description: "Little to no exercise" },
  { id: "light", label: "Light", description: "Light exercise 1-2 days/week" },
  { id: "moderate", label: "Moderate", description: "Moderate exercise 3-5 days/week" },
  { id: "active", label: "Active", description: "Hard exercise 6-7 days/week" },
];

const OnboardingFlow = ({ userId, onComplete }: OnboardingFlowProps) => {
  const [step, setStep] = useState(1);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [activityLevel, setActivityLevel] = useState("moderate");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const totalSteps = 4;

  const toggleConcern = (concernId: string) => {
    setSelectedConcerns(prev => 
      prev.includes(concernId) 
        ? prev.filter(c => c !== concernId)
        : [...prev, concernId]
    );
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          age: parseInt(age) || null,
          gender,
          concerns: selectedConcerns,
          activity_level: activityLevel,
          onboarding_completed: true,
        })
        .eq("user_id", userId);

      if (error) throw error;

      // Create initial streak record
      await supabase.from("user_streaks").insert({
        user_id: userId,
        current_streak: 0,
        longest_streak: 0,
        total_sessions: 0,
      });

      toast({
        title: "Welcome to Sahaara!",
        description: "Your personalized wellness journey begins now.",
      });
      
      onComplete();
    } catch (error) {
      console.error("Onboarding error:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return age.length > 0;
      case 2: return gender.length > 0;
      case 3: return selectedConcerns.length > 0;
      case 4: return activityLevel.length > 0;
      default: return true;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 wave-bg" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg relative z-10"
      >
        <Card variant="glass" className="backdrop-blur-xl">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-calm to-peace flex items-center justify-center shadow-glow">
                <Heart className="w-7 h-7 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">
              Let's personalize your journey
            </CardTitle>
            <CardDescription>
              Step {step} of {totalSteps}
            </CardDescription>
            
            {/* Progress bar */}
            <div className="flex gap-2 mt-4">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i < step ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </CardHeader>

          <CardContent>
            <AnimatePresence mode="wait">
              {/* Step 1: Age */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <User className="w-12 h-12 mx-auto mb-4 text-calm" />
                    <h3 className="text-lg font-semibold mb-2">How old are you?</h3>
                    <p className="text-sm text-muted-foreground">
                      This helps us tailor content for your age group.
                    </p>
                  </div>
                  <div className="max-w-[200px] mx-auto">
                    <Label htmlFor="age" className="sr-only">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      min="13"
                      max="100"
                      placeholder="Enter your age"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="text-center text-lg h-14 rounded-xl"
                    />
                  </div>
                </motion.div>
              )}

              {/* Step 2: Gender */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">What's your gender?</h3>
                    <p className="text-sm text-muted-foreground">
                      This helps personalize fitness and wellness recommendations.
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {["Male", "Female", "Other"].map((g) => (
                      <button
                        key={g}
                        onClick={() => setGender(g.toLowerCase())}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          gender === g.toLowerCase()
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <span className="font-medium">{g}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 3: Concerns */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <Brain className="w-12 h-12 mx-auto mb-4 text-peace" />
                    <h3 className="text-lg font-semibold mb-2">What are you dealing with?</h3>
                    <p className="text-sm text-muted-foreground">
                      Select all that apply. We'll create a plan for you.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {concerns.map((concern) => {
                      const IconComponent = concern.icon;
                      const isSelected = selectedConcerns.includes(concern.id);
                      return (
                        <button
                          key={concern.id}
                          onClick={() => toggleConcern(concern.id)}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                            isSelected
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <IconComponent className={`w-5 h-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                          <span className="text-sm font-medium">{concern.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Step 4: Activity Level */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <Dumbbell className="w-12 h-12 mx-auto mb-4 text-vitality" />
                    <h3 className="text-lg font-semibold mb-2">Your current activity level?</h3>
                    <p className="text-sm text-muted-foreground">
                      Be honest – we'll meet you where you are.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {activityLevels.map((level) => (
                      <button
                        key={level.id}
                        onClick={() => setActivityLevel(level.id)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                          activityLevel === level.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="text-left">
                          <p className="font-medium">{level.label}</p>
                          <p className="text-sm text-muted-foreground">{level.description}</p>
                        </div>
                        {activityLevel === level.id && (
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex gap-3 mt-8">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              )}
              
              {step < totalSteps ? (
                <Button
                  variant="accent"
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                  className="flex-1"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  variant="accent"
                  onClick={handleComplete}
                  disabled={!canProceed() || isLoading}
                  className="flex-1"
                >
                  {isLoading ? "Setting up..." : "Start My Journey"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default OnboardingFlow;
