import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  BookOpen, 
  Languages, 
  Brain, 
  ArrowRight,
  Play,
  Sparkles,
  GraduationCap,
  Search,
  Youtube,
  Download,
  Volume2,
  Loader2,
  FileText
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlanGenerator } from "@/components/learning-plan/PlanGenerator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPlaylistUrl } from "@/lib/youtube-playlists";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const classes = [
  { value: "1", label: "Class 1" },
  { value: "2", label: "Class 2" },
  { value: "3", label: "Class 3" },
  { value: "4", label: "Class 4" },
  { value: "5", label: "Class 5" },
  { value: "6", label: "Class 6" },
  { value: "7", label: "Class 7" },
  { value: "8", label: "Class 8" },
  { value: "9", label: "Class 9" },
  { value: "10", label: "Class 10" },
  { value: "11", label: "Class 11" },
  { value: "12", label: "Class 12" },
];

const languages = [
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "bn", name: "Bengali" },
  { code: "mr", name: "Marathi" },
  { code: "gu", name: "Gujarati" },
  { code: "kn", name: "Kannada" },
];

// AI-generated learning plan placeholder - will be replaced with API
interface LearningModule {
  id: string;
  subject: string;
  icon: string;
  topics: Array<string | { name: string; videoUrl?: string }>;
  estimatedTime: string;
  videoUrls?: string[];
  topicVideoMap?: Map<string, string>; // Map topic name to video URL
}

const LearnPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [learningPlan, setLearningPlan] = useState<LearningModule[]>([]);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [selectedSubjectForPlan, setSelectedSubjectForPlan] = useState<string | null>(null);
  const [detailedPlanText, setDetailedPlanText] = useState<string>("");
  const [textToSpeechEnabled, setTextToSpeechEnabled] = useState(false);

  // Fetch user's class from profile and preferences - this is set once during signup
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('grade_level, preferred_language')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile) {
        if (profile.grade_level) {
          setSelectedClass(profile.grade_level);
        } else {
          // If no class is set, redirect to profile settings or show message
          toast({
            title: "Class Not Set",
            description: "Please set your class in your profile settings.",
            variant: "destructive",
          });
        }
        if (profile.preferred_language) {
          setSelectedLanguage(profile.preferred_language);
        }
      }

      // Fetch user preferences for text-to-speech
      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('text_to_speech')
        .eq('user_id', user.id)
        .maybeSingle();

      if (preferences) {
        setTextToSpeechEnabled(preferences.text_to_speech || false);
      } else {
        // If no preferences exist, default to false
        setTextToSpeechEnabled(false);
      }

      setProfileLoaded(true);
    };

    fetchUserProfile();
  }, [user]);

  // Listen for preference changes from Accessibility page
  useEffect(() => {
    if (!user) return;

    const handlePreferenceChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.text_to_speech !== undefined) {
        setTextToSpeechEnabled(customEvent.detail.text_to_speech);
      }
    };

    // Listen for custom events
    window.addEventListener('preferenceChanged', handlePreferenceChange);

    // Also check localStorage
    const checkLocalStorage = () => {
      const ttsEnabled = localStorage.getItem('textToSpeechEnabled');
      if (ttsEnabled !== null) {
        setTextToSpeechEnabled(ttsEnabled === 'true');
      }
    };

    // Check localStorage on mount and when storage changes
    checkLocalStorage();
    window.addEventListener('storage', checkLocalStorage);

    // Periodically check database (every 3 seconds) as fallback
    const checkPreferences = async () => {
      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('text_to_speech')
        .eq('user_id', user.id)
        .maybeSingle();

      if (preferences && preferences.text_to_speech !== undefined) {
        setTextToSpeechEnabled(preferences.text_to_speech);
      }
    };

    const interval = setInterval(checkPreferences, 3000);

    return () => {
      window.removeEventListener('preferenceChanged', handlePreferenceChange);
      window.removeEventListener('storage', checkLocalStorage);
      clearInterval(interval);
    };
  }, [user]);

  // Load saved plan from localStorage when class is selected
  useEffect(() => {
    if (selectedClass && profileLoaded) {
      loadSavedPlan();
    }
  }, [selectedClass, profileLoaded]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      speechSynthesis.cancel();
    };
  }, []);

  const loadSavedPlan = () => {
    try {
      const savedPlanData = localStorage.getItem('learningPlan');
      if (savedPlanData) {
        const parsed = JSON.parse(savedPlanData);
        
        if (import.meta.env.DEV) {
          console.log('Loading saved plan:', { 
            savedClass: parsed.selectedClass, 
            currentClass: selectedClass,
            hasPlan: !!parsed.plan,
            modulesCount: parsed.plan?.modules?.length 
          });
        }
        
        // Only load if it matches the current class
        if (parsed.selectedClass === selectedClass && parsed.plan && parsed.plan.modules) {
          // Convert the saved plan to the format expected by the page
          const modules: LearningModule[] = parsed.plan.modules.map((m: any, idx: number) => {
            const topicVideoMap = new Map<string, string>();
            const topics: Array<string | { name: string; videoUrl?: string }> = [];
            const videoUrls: string[] = [];
            
            // Handle topics - they should be stored as objects with name and videoUrl
            if (m.topics && Array.isArray(m.topics)) {
              m.topics.forEach((t: any) => {
                // Handle both string and object topic formats
                let topicName: string;
                let videoUrl: string | undefined;
                
                if (typeof t === 'string') {
                  topicName = t;
                  videoUrl = undefined;
                } else if (t && typeof t === 'object') {
                  topicName = t.name || String(t) || 'Topic';
                  videoUrl = t.videoUrl;
                } else {
                  topicName = String(t) || 'Topic';
                  videoUrl = undefined;
                }
                
                // Only add valid topic names
                if (topicName && topicName.trim().length > 0) {
                  const trimmedName = topicName.trim();
                  
                  // Store video URL if available
                  if (videoUrl && (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be'))) {
                    topicVideoMap.set(trimmedName, videoUrl);
                    if (!videoUrls.includes(videoUrl)) {
                      videoUrls.push(videoUrl);
                    }
                  }
                  
                  // Store topic with video URL info
                  if (videoUrl) {
                    topics.push({ name: trimmedName, videoUrl });
                  } else {
                    topics.push(trimmedName);
                  }
                }
              });
            }
            
            return {
              id: String(idx + 1),
              subject: m.subject,
              icon: getSubjectIcon(m.subject),
              topics: topics,
              estimatedTime: m.studyHours || '2-3 hours/week',
              videoUrls: videoUrls,
              topicVideoMap: topicVideoMap,
            };
          });
          
          if (import.meta.env.DEV) {
            console.log('Loaded modules:', modules.map(m => ({
              subject: m.subject,
              topicsCount: m.topics.length,
              videoUrlsCount: m.videoUrls.length,
              topicVideoMapSize: m.topicVideoMap.size
            })));
          }
          
          setLearningPlan(modules);
          setIsGeneratingPlan(false);
          return;
        } else {
          if (import.meta.env.DEV) {
            console.log('Plan not loaded - class mismatch or missing plan data');
          }
        }
      }
    } catch (error) {
      console.error('Failed to load saved plan:', error);
      setIsGeneratingPlan(false);
    }
    
    // If no saved plan, generate a default mock plan
    generateLearningPlan();
  };

  const generateLearningPlan = async () => {
    setIsGeneratingPlan(true);
    
    // Placeholder AI-generated plan - will integrate Perplexity API later
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockPlan: LearningModule[] = [
      {
        id: "1",
        subject: "Mathematics",
        icon: "📐",
        topics: getTopicsForClass(selectedClass, "maths"),
        estimatedTime: "45 min/day"
      },
      {
        id: "2",
        subject: "Science",
        icon: "🔬",
        topics: getTopicsForClass(selectedClass, "science"),
        estimatedTime: "40 min/day"
      },
      {
        id: "3",
        subject: "English",
        icon: "📚",
        topics: getTopicsForClass(selectedClass, "english"),
        estimatedTime: "30 min/day"
      },
      {
        id: "4",
        subject: "Social Science",
        icon: "🌍",
        topics: getTopicsForClass(selectedClass, "social"),
        estimatedTime: "35 min/day"
      },
    ];
    
    setLearningPlan(mockPlan);
    setIsGeneratingPlan(false);
  };

  // Format plan text for display (similar to PlanGenerator)
  const formatPlanTextForDisplay = (text: string): string => {
    if (!text) return '';
    
    let formatted = text;
    
    // Handle markdown links
    formatted = formatted.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, (match, text, url) => {
      const validUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
      return `<a href="${validUrl}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline underline decoration-primary/50 hover:decoration-primary cursor-pointer">${text}</a>`;
    });
    
    // Handle direct URLs
    const urlPattern = /(https?:\/\/[^\s\)<]+)/g;
    formatted = formatted.replace(urlPattern, (url) => {
      if (!url.includes('<a')) {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline underline decoration-primary/50 hover:decoration-primary break-all cursor-pointer">${url}</a>`;
      }
      return url;
    });
    
    // Handle headers
    formatted = formatted.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-foreground mt-6 mb-3">$1</h3>');
    formatted = formatted.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-foreground mt-6 mb-4">$1</h2>');
    formatted = formatted.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-foreground mt-6 mb-4">$1</h1>');
    
    // Handle bold text
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>');
    
    // Handle bullet points
    formatted = formatted.replace(/^[-*•]\s+(.*)$/gim, '<li class="mb-1">$1</li>');
    formatted = formatted.replace(/(<li class="mb-1">.*<\/li>\n?)+/g, '<ul class="list-disc list-inside space-y-1 my-3 ml-4">$&</ul>');
    
    // Handle numbered lists
    formatted = formatted.replace(/^\d+\.\s+(.*)$/gim, '<li class="mb-1">$1</li>');
    
    // Handle paragraphs - split by double newlines
    const paragraphs = formatted.split(/\n\n+/);
    const processedParagraphs = paragraphs.map(para => {
      const trimmed = para.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<li')) {
        return trimmed;
      }
      return `<p class="mb-3 leading-relaxed">${trimmed}</p>`;
    });
    
    return processedParagraphs.join('\n\n');
  };

  const getSubjectIcon = (subject: string): string => {
    const icons: Record<string, string> = {
      "Mathematics": "📐",
      "Science": "🔬",
      "English": "📚",
      "Hindi": "📖",
      "Social Science": "🌍",
      "Physics": "⚛️",
      "Chemistry": "🧪",
      "Biology": "🧬",
      "Computer Science": "💻",
      "Economics": "💰",
      "History": "📜",
      "Geography": "🗺️",
      "Political Science": "🏛️",
    };
    return icons[subject] || "📚";
  };

  const getTopicsForClass = (classNum: string, subject: string): string[] => {
    const num = parseInt(classNum);
    
    if (subject === "maths") {
      if (num <= 5) return ["Numbers & Operations", "Basic Geometry", "Measurements", "Patterns"];
      if (num <= 8) return ["Algebra Basics", "Geometry", "Fractions & Decimals", "Data Handling"];
      if (num <= 10) return ["Quadratic Equations", "Trigonometry", "Statistics", "Coordinate Geometry"];
      return ["Calculus", "Probability", "Matrices", "Complex Numbers"];
    }
    
    if (subject === "science") {
      if (num <= 5) return ["Living Things", "Plants & Animals", "Our Body", "Environment"];
      if (num <= 8) return ["Physics Basics", "Chemistry Intro", "Biology", "Natural Resources"];
      if (num <= 10) return ["Motion & Force", "Chemical Reactions", "Life Processes", "Electricity"];
      return ["Physics", "Chemistry", "Biology (separate streams)"];
    }
    
    if (subject === "english") {
      if (num <= 5) return ["Reading Comprehension", "Vocabulary", "Grammar Basics", "Creative Writing"];
      if (num <= 8) return ["Literature", "Grammar", "Essay Writing", "Poetry"];
      if (num <= 10) return ["Prose & Poetry", "Writing Skills", "Grammar Mastery", "Communication"];
      return ["Literature Analysis", "Advanced Writing", "Language Skills"];
    }
    
    if (num <= 5) return ["Our Neighbourhood", "Our Country", "History Stories", "Maps"];
    if (num <= 8) return ["Ancient History", "Geography", "Civics", "Economics Intro"];
    if (num <= 10) return ["Indian History", "World Geography", "Political Science", "Economics"];
    return ["Indian History", "World History", "Political Science", "Economics"];
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery + " class " + selectedClass + " " + selectedLanguage + " NCERT")}`;
      window.open(youtubeSearchUrl, '_blank');
    }
  };

  const handleTextToSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = selectedLanguage === 'hi' ? 'hi-IN' : 'en-US';
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      speechSynthesis.speak(utterance);
    }
  };

  // Handle text-to-speech on hover with debounce
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpokenTextRef = useRef<string>('');

  const handleHoverTextToSpeech = (text: string) => {
    // Only work if text-to-speech is enabled
    if (!textToSpeechEnabled) {
      return;
    }

    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    // Don't speak if it's the same text that's already being spoken
    if (lastSpokenTextRef.current === text && isSpeaking) {
      return;
    }

    // Debounce hover to avoid too many speech calls
    hoverTimeoutRef.current = setTimeout(() => {
      if (text && text.trim()) {
        lastSpokenTextRef.current = text;
        handleTextToSpeech(text);
      }
    }, 300); // 300ms delay before speaking
  };

  const handleHoverStop = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    // Optionally stop speech on mouse leave
    // speechSynthesis.cancel();
  };

  const handleDownloadCurriculum = (subject: string) => {
    // Map subject names to NCERT subject codes
    const subjectMap: Record<string, string> = {
      'Mathematics': 'maths',
      'Science': 'science',
      'English': 'english',
      'Hindi': 'hindi',
      'Social Science': 'social',
      'Physics': 'physics',
      'Chemistry': 'chemistry',
      'Biology': 'biology',
      'Computer Science': 'computer',
      'Economics': 'economics',
      'History': 'history',
      'Geography': 'geography',
      'Political Science': 'political',
    };
    
    const subjectCode = subjectMap[subject] || subject.toLowerCase();
    const downloadUrl = `https://ncert.nic.in/textbook.php?subject=${subjectCode}&class=${selectedClass}`;
    window.open(downloadUrl, '_blank');
  };

  // Not logged in state
  if (!user) {
    return (
      <Layout>
        <section className="py-16 md:py-24 bg-gradient-cool">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <GraduationCap className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Start Your Learning Journey
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Sign up to get a personalized learning plan based on your class and preferences. 
                Our AI will create a customized curriculum just for you.
              </p>
              <Link to="/login">
                <Button variant="primary" size="lg">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </Layout>
    );
  }


  return (
    <Layout>
      {/* Header with Settings */}
      <section className="py-8 bg-gradient-cool border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                Your Learning Plan
              </h1>
              <p className="text-muted-foreground">
                {selectedClass ? `Personalized for Class ${selectedClass}` : 'Please select your class'} • {languages.find(l => l.code === selectedLanguage)?.name}
              </p>
            </div>

            {/* Settings in right corner */}
            <Card className="bg-card/80 backdrop-blur-sm border border-border/50">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Languages className="w-4 h-4" />
                </div>
                {selectedClass && (
                  <div className="text-sm text-muted-foreground px-2">
                    Class {selectedClass}
                  </div>
                )}
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger className="w-28 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* AI Learning Plan Generator */}
      <section className="py-10 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">AI-Powered Learning Plan</h2>
                <p className="text-sm text-muted-foreground">Get a personalized study plan based on your goals</p>
              </div>
            </div>

            <Tabs defaultValue="generator" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="generator">Generate New Plan</TabsTrigger>
                <TabsTrigger value="current">Current Plan</TabsTrigger>
              </TabsList>
              
              <TabsContent value="generator">
                <PlanGenerator 
                  initialClass={selectedClass}
                  selectedLanguage={selectedLanguage}
                  onPlanGenerated={(plan) => {
                    // Convert the generated plan to the format expected by the page
                    const modules: LearningModule[] = plan.modules.map((m, idx) => {
                      // Create a map of topic names to video URLs
                      const topicVideoMap = new Map<string, string>();
                      const topics: Array<string | { name: string; videoUrl?: string }> = [];
                      const videoUrls: string[] = [];
                      
                      // Get playlist URL for this subject as fallback
                      const subjectPlaylistUrl = getPlaylistUrl(selectedClass, m.subject);
                      
                      m.topics.forEach((t, topicIdx) => {
                        const topicName = typeof t === 'string' ? t : t.name;
                        let videoUrl = typeof t === 'object' && t.videoUrl ? t.videoUrl : undefined;
                        
                        // If no video URL for this topic, use playlist URL as fallback
                        if (!videoUrl && subjectPlaylistUrl && topicIdx === 0) {
                          videoUrl = subjectPlaylistUrl;
                        }
                        
                        // If videoUrl is a search URL, we'll handle it differently
                        if (videoUrl && videoUrl.includes('youtube.com/results')) {
                          // Store it but mark it as a search URL
                          topicVideoMap.set(topicName, videoUrl);
                        } else if (videoUrl && (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be'))) {
                          topicVideoMap.set(topicName, videoUrl);
                          if (!videoUrls.includes(videoUrl)) {
                            videoUrls.push(videoUrl);
                          }
                        }
                        
                        // Store topic with video URL info for localStorage
                        if (videoUrl && (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be'))) {
                          topics.push({ name: topicName, videoUrl: videoUrl });
                        } else {
                          topics.push(topicName);
                        }
                      });
                      
                      // Ensure we have at least the playlist URL in videoUrls
                      if (subjectPlaylistUrl && !videoUrls.includes(subjectPlaylistUrl)) {
                        videoUrls.push(subjectPlaylistUrl);
                      }
                      
                      return {
                        id: String(idx + 1),
                        subject: m.subject,
                        icon: getSubjectIcon(m.subject),
                        topics: topics,
                        estimatedTime: m.studyHours || '2-3 hours/week',
                        videoUrls: videoUrls,
                        topicVideoMap: topicVideoMap,
                      };
                    });
                    setLearningPlan(modules);
                    
                    // Also save the enhanced plan data to localStorage with video URLs preserved
                    try {
                      const planData = {
                        plan: {
                          ...plan,
                          modules: plan.modules.map((m, idx) => ({
                            ...m,
                            topics: m.topics.map(t => ({
                              name: typeof t === 'string' ? t : t.name,
                              videoUrl: typeof t === 'object' ? t.videoUrl : undefined
                            }))
                          }))
                        },
                        selectedClass,
                        selectedSubjects: plan.modules.map(m => m.subject),
                        expectedMarks: {},
                        generatedAt: new Date().toISOString(),
                      };
                      localStorage.setItem('learningPlan', JSON.stringify(planData));
                    } catch (error) {
                      console.error('Failed to save enhanced plan:', error);
                    }
                  }}
                />
              </TabsContent>
              
              <TabsContent value="current">
                {isGeneratingPlan ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">Loading your learning plan...</p>
                  </div>
                ) : learningPlan.length > 0 ? (
                  <>
                    <div className="flex items-center gap-3 mb-6">
                      <div>
                        <h3 
                          className="text-lg font-bold text-foreground cursor-pointer hover:text-primary transition-colors"
                          onMouseEnter={() => handleHoverTextToSpeech("Your Subjects")}
                          onMouseLeave={handleHoverStop}
                        >
                          Your Subjects
                        </h3>
                        <p 
                          className="text-sm text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                          onMouseEnter={() => handleHoverTextToSpeech(`AI-recommended curriculum for Class ${selectedClass}`)}
                          onMouseLeave={handleHoverStop}
                        >
                          AI-recommended curriculum for Class {selectedClass}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleTextToSpeech(`Here is your learning plan for class ${selectedClass}`)}
                        className={`ml-auto ${isSpeaking ? "text-primary" : ""}`}
                      >
                        <Volume2 className="w-4 h-4 mr-1" />
                        Read Aloud
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {learningPlan.map((module) => (
                        <Card key={module.id} className="overflow-hidden hover:shadow-soft transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-3xl">{module.icon}</span>
                                <div>
                                  <CardTitle 
                                    className="text-lg cursor-pointer hover:text-primary transition-colors"
                                    onMouseEnter={() => handleHoverTextToSpeech(`${module.subject}. ${module.estimatedTime}`)}
                                    onMouseLeave={handleHoverStop}
                                  >
                                    {module.subject}
                                  </CardTitle>
                                  <CardDescription 
                                    className="cursor-pointer hover:text-primary transition-colors"
                                    onMouseEnter={() => handleHoverTextToSpeech(module.estimatedTime)}
                                    onMouseLeave={handleHoverStop}
                                  >
                                    {module.estimatedTime}
                                  </CardDescription>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDownloadCurriculum(module.subject)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2 mb-4">
                              {module.topics.map((topic, idx) => {
                                const topicName = typeof topic === 'string' 
                                  ? topic 
                                  : (typeof topic === 'object' && topic !== null && 'name' in topic 
                                      ? topic.name 
                                      : String(topic));
                                const hasVideo = typeof topic === 'object' && topic !== null && 'videoUrl' in topic && topic.videoUrl;
                                return (
                                  <div key={idx} className="flex items-center gap-2 text-sm">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    <span 
                                      className="text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                                      onMouseEnter={() => handleHoverTextToSpeech(topicName)}
                                      onMouseLeave={handleHoverStop}
                                    >
                                      {topicName}
                                    </span>
                                    {hasVideo && (
                                      <Youtube className="w-3 h-3 text-primary" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            <Button 
                              variant="primary" 
                              className="w-full" 
                              size="sm"
                              onClick={() => {
                                try {
                                  // Load the detailed plan for this subject
                                  const savedPlanData = localStorage.getItem('learningPlan');
                                  if (savedPlanData) {
                                    const parsed = JSON.parse(savedPlanData);
                                    if (parsed.plan && parsed.plan.plan) {
                                      // Find the subject-specific section in the plan
                                      const planText = parsed.plan.plan;
                                      const subjectName = module.subject;
                                      
                                      // Extract subject-specific section from the plan
                                      const subjectPatterns = [
                                        new RegExp(`(?:^|\\n)##\\s+${subjectName}[^]*?(?=\\n##|$)`, 'i'),
                                        new RegExp(`(?:^|\\n)###\\s+${subjectName}[^]*?(?=\\n##|\\n###|$)`, 'i'),
                                        new RegExp(`(?:^|\\n)\\*\\*${subjectName}\\*\\*[^]*?(?=\\n\\*\\*|\\n##|$)`, 'i'),
                                      ];
                                      
                                      let subjectSection = '';
                                      for (const pattern of subjectPatterns) {
                                        const match = planText.match(pattern);
                                        if (match && match[0]) {
                                          subjectSection = match[0];
                                          break;
                                        }
                                      }
                                      
                                      // If subject section found, use it; otherwise use full plan
                                      const displayText = subjectSection || planText;
                                      setDetailedPlanText(displayText);
                                      setSelectedSubjectForPlan(subjectName);
                                    } else {
                                      // Fallback: show a message that plan is not available
                                      toast({
                                        title: "Plan Not Available",
                                        description: "Detailed plan is not available. Please generate a new plan.",
                                        variant: "destructive",
                                      });
                                    }
                                  } else {
                                    toast({
                                      title: "Plan Not Found",
                                      description: "No saved plan found. Please generate a new plan first.",
                                      variant: "destructive",
                                    });
                                  }
                                } catch (error) {
                                  console.error('Error loading detailed plan:', error);
                                  toast({
                                    title: "Error",
                                    description: error instanceof Error ? error.message : "An error occurred while loading the plan. Please try again.",
                                    variant: "destructive",
                                  });
                                }
                              }}
                              onMouseEnter={() => handleHoverTextToSpeech("Show Detailed Plan")}
                              onMouseLeave={handleHoverStop}
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              Show Detailed Plan
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Brain className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">No Learning Plan Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Generate a personalized learning plan to get started
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      {/* Detailed Plan Dialog */}
      <Dialog open={selectedSubjectForPlan !== null} onOpenChange={(open) => {
        if (!open) {
          setSelectedSubjectForPlan(null);
          setDetailedPlanText("");
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle 
              className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
              onMouseEnter={() => handleHoverTextToSpeech(`Detailed Learning Plan for ${selectedSubjectForPlan}`)}
              onMouseLeave={handleHoverStop}
            >
              <BookOpen className="w-5 h-5 text-primary" />
              Detailed Learning Plan - {selectedSubjectForPlan}
            </DialogTitle>
            <DialogDescription
              className="cursor-pointer hover:text-primary transition-colors"
              onMouseEnter={() => handleHoverTextToSpeech(`Complete study plan for ${selectedSubjectForPlan} Class ${selectedClass}`)}
              onMouseLeave={handleHoverStop}
            >
              Complete study plan for {selectedSubjectForPlan} • Class {selectedClass}
            </DialogDescription>
          </DialogHeader>
          <div className="prose prose-sm max-w-none dark:prose-invert mt-4">
            <div 
              className="text-foreground leading-relaxed space-y-4 whitespace-pre-wrap [&_a]:text-primary [&_a]:hover:underline [&_a]:cursor-pointer [&_a]:break-all [&_a]:pointer-events-auto [&_a]:underline [&_a]:decoration-primary/50 hover:[&_a]:decoration-primary [&_p]:cursor-pointer [&_p]:hover:text-primary [&_li]:cursor-pointer [&_li]:hover:text-primary [&_h1]:cursor-pointer [&_h1]:hover:text-primary [&_h2]:cursor-pointer [&_h2]:hover:text-primary [&_h3]:cursor-pointer [&_h3]:hover:text-primary"
              dangerouslySetInnerHTML={{ 
                __html: formatPlanTextForDisplay(detailedPlanText) 
              }}
              onClick={(e) => {
                let target = e.target as HTMLElement;
                while (target && target.tagName !== 'A' && target.parentElement) {
                  target = target.parentElement;
                }
                if (target && target.tagName === 'A') {
                  e.preventDefault();
                  e.stopPropagation();
                  const href = target.getAttribute('href');
                  if (href) {
                    const validUrl = href.startsWith('http://') || href.startsWith('https://') 
                      ? href 
                      : `https://${href}`;
                    window.open(validUrl, '_blank', 'noopener,noreferrer');
                  }
                }
              }}
              onMouseOver={(e) => {
                // Get text content from hovered element
                const target = e.target as HTMLElement;
                // Skip if it's a link (links have their own behavior)
                if (target.tagName === 'A') return;
                
                // Get text content, excluding nested elements
                let text = '';
                if (target.childNodes.length === 0 || target.textContent) {
                  text = target.textContent || target.innerText || '';
                } else {
                  // For elements with children, get direct text only
                  text = Array.from(target.childNodes)
                    .filter(node => node.nodeType === Node.TEXT_NODE)
                    .map(node => node.textContent)
                    .join(' ')
                    .trim();
                }
                
                // Only speak if there's meaningful text (more than a few characters)
                if (text && text.length > 3 && text.length < 200) {
                  handleHoverTextToSpeech(text);
                }
              }}
              onMouseOut={handleHoverStop}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Download Resources */}
      <section className="py-10 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
              <Download className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h2 
                className="text-xl font-bold text-foreground cursor-pointer hover:text-primary transition-colors"
                onMouseEnter={() => handleHoverTextToSpeech("Download Resources")}
                onMouseLeave={handleHoverStop}
              >
                Download Resources
              </h2>
              <p 
                className="text-sm text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                onMouseEnter={() => handleHoverTextToSpeech(`NCERT and State Board materials for Class ${selectedClass}`)}
                onMouseLeave={handleHoverStop}
              >
                NCERT & State Board materials for Class {selectedClass}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {learningPlan.map((module) => (
              <Card key={module.id} className="hover:shadow-soft transition-shadow cursor-pointer" onClick={() => handleDownloadCurriculum(module.subject)}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center text-xl">
                    {module.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p 
                      className="font-medium text-foreground text-sm truncate cursor-pointer hover:text-primary transition-colors"
                      onMouseEnter={() => handleHoverTextToSpeech(`${module.subject} Class ${selectedClass}`)}
                      onMouseLeave={handleHoverStop}
                    >
                      {module.subject} - Class {selectedClass}
                    </p>
                    <p 
                      className="text-xs text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                      onMouseEnter={() => handleHoverTextToSpeech("NCERT Textbook")}
                      onMouseLeave={handleHoverStop}
                    >
                      NCERT Textbook
                    </p>
                  </div>
                  <Download className="w-4 h-4 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-10 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-3">
              <Sparkles className="w-4 h-4" />
              <span>Smart Features</span>
            </div>
            <h2 className="text-xl font-bold text-foreground">
              Complete lessons and track your progress
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <Card className="text-center p-4">
              <div className="w-12 h-12 mx-auto mb-3 bg-primary/10 rounded-full flex items-center justify-center">
                <Volume2 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-1">Text-to-Speech</h3>
              <p className="text-xs text-muted-foreground">Listen to lessons in your language</p>
            </Card>

            <Card className="text-center p-4">
              <div className="w-12 h-12 mx-auto mb-3 bg-secondary/10 rounded-full flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-1">Progress Tracking</h3>
              <p className="text-xs text-muted-foreground">Track your learning journey</p>
            </Card>

            <Card className="text-center p-4">
              <div className="w-12 h-12 mx-auto mb-3 bg-accent/10 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-1">AI Recommendations</h3>
              <p className="text-xs text-muted-foreground">Personalized learning path</p>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default LearnPage;