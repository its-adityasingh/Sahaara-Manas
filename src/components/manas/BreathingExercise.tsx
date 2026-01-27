import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, Volume2, VolumeX, X } from "lucide-react";

interface BreathingPattern {
  inhale: number;
  hold1: number;
  exhale: number;
  hold2: number;
}

interface BreathingExerciseProps {
  title: string;
  duration: number; // in seconds
  pattern: BreathingPattern;
  soundUrl?: string;
  onClose: () => void;
}

const BreathingExercise = ({ 
  title, 
  duration, 
  pattern, 
  soundUrl,
  onClose 
}: BreathingExerciseProps) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [phase, setPhase] = useState<"inhale" | "hold" | "exhale" | "rest">("inhale");
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cycleRef = useRef<number | null>(null);

  const totalCycle = pattern.inhale + pattern.hold1 + pattern.exhale + pattern.hold2;

  useEffect(() => {
    if (soundUrl) {
      audioRef.current = new Audio(soundUrl);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3;
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [soundUrl]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying && !isMuted) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, isMuted]);

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsPlaying(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) {
      if (cycleRef.current) {
        clearTimeout(cycleRef.current);
      }
      return;
    }

    const runCycle = () => {
      setPhase("inhale");
      
      cycleRef.current = window.setTimeout(() => {
        setPhase("hold");
        
        cycleRef.current = window.setTimeout(() => {
          setPhase("exhale");
          
          cycleRef.current = window.setTimeout(() => {
            setPhase("rest");
            
            cycleRef.current = window.setTimeout(() => {
              if (timeLeft > 0) {
                runCycle();
              }
            }, pattern.hold2 * 1000);
          }, pattern.exhale * 1000);
        }, pattern.hold1 * 1000);
      }, pattern.inhale * 1000);
    };

    runCycle();

    return () => {
      if (cycleRef.current) {
        clearTimeout(cycleRef.current);
      }
    };
  }, [isPlaying, pattern]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getPhaseText = () => {
    switch (phase) {
      case "inhale": return "Breathe In";
      case "hold": return "Hold";
      case "exhale": return "Breathe Out";
      case "rest": return "Rest";
    }
  };

  const getScale = () => {
    switch (phase) {
      case "inhale": return 1.4;
      case "hold": return 1.4;
      case "exhale": return 1;
      case "rest": return 1;
    }
  };

  return (
    <Card variant="peace" className="max-w-lg mx-auto text-center py-8 relative overflow-hidden">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full hover:bg-foreground/10 transition-colors"
      >
        <X className="w-5 h-5 text-muted-foreground" />
      </button>
      
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-foreground mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground">{formatTime(timeLeft)} remaining</p>
        </div>

        {/* Breathing Circle */}
        <div className="relative w-48 h-48 mx-auto">
          {/* Outer glow */}
          <motion.div
            className="absolute inset-0 rounded-full bg-peace/20"
            animate={{ 
              scale: getScale(),
              opacity: phase === "inhale" || phase === "hold" ? 0.6 : 0.3
            }}
            transition={{ 
              duration: phase === "inhale" ? pattern.inhale : 
                       phase === "exhale" ? pattern.exhale : 0.3,
              ease: "easeInOut" 
            }}
          />
          
          {/* Middle ring */}
          <motion.div
            className="absolute inset-4 rounded-full bg-peace/40"
            animate={{ 
              scale: getScale() * 0.9,
            }}
            transition={{ 
              duration: phase === "inhale" ? pattern.inhale : 
                       phase === "exhale" ? pattern.exhale : 0.3,
              ease: "easeInOut",
              delay: 0.1
            }}
          />
          
          {/* Center circle */}
          <motion.div
            className="absolute inset-8 rounded-full bg-peace flex items-center justify-center"
            animate={{ 
              scale: getScale() * 0.8,
            }}
            transition={{ 
              duration: phase === "inhale" ? pattern.inhale : 
                       phase === "exhale" ? pattern.exhale : 0.3,
              ease: "easeInOut",
              delay: 0.15
            }}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={phase}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-lg font-bold text-primary-foreground text-center px-2"
              >
                {getPhaseText()}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        </div>

        <p className="text-muted-foreground text-sm">
          Follow the circle. Breathe in as it expands, out as it contracts.
        </p>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
            className="rounded-full"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          
          <Button
            variant="calm"
            size="lg"
            onClick={() => setIsPlaying(!isPlaying)}
            className="rounded-full px-8"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Resume
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-full"
          >
            End
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BreathingExercise;
