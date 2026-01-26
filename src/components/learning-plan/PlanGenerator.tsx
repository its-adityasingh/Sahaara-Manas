import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Brain, 
  Loader2, 
  Sparkles,
  BookOpen,
  Target,
  Calendar,
  CheckCircle,
  ArrowRight,
  ExternalLink,
  Youtube,
  FileText,
  Clock
} from "lucide-react";
import { generateLearningPlan, type LearningPlanResponse } from "@/lib/perplexity";
import { toast } from "@/hooks/use-toast";
import { getPlaylistUrl } from "@/lib/youtube-playlists";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// Format plan text for better display
function formatPlanText(text: string): string {
  if (!text) return '';
  
  let formatted = text;
  
  // First, handle tables (markdown tables)
  formatted = formatted.replace(/\|(.+)\|/g, (match, content) => {
    // Check if this is a table row
    if (content.includes('---')) {
      return '<tr class="border-b border-border"><td colspan="100%" class="py-1"></td></tr>';
    }
    const cells = content.split('|').map(cell => cell.trim()).filter(cell => cell);
    if (cells.length > 1) {
      return `<tr>${cells.map(cell => `<td class="px-3 py-2 border border-border">${cell.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</td>`).join('')}</tr>`;
    }
    return match;
  });
  
  // Wrap consecutive table rows in a table
  formatted = formatted.replace(/(<tr[^>]*>.*?<\/tr>\s*)+/g, (match) => {
    return `<div class="overflow-x-auto my-4"><table class="min-w-full border-collapse border border-border">${match}</table></div>`;
  });
  
  // Split into lines for better processing
  const lines = formatted.split('\n');
  const processedLines: string[] = [];
  let inList = false;
  let listItems: string[] = [];
  let inTable = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines (will be handled later)
    if (!line) {
      if (inList && listItems.length > 0) {
        processedLines.push(`<ul class="list-disc list-inside space-y-1 my-3 ml-4">${listItems.join('')}</ul>`);
        listItems = [];
        inList = false;
      }
      continue;
    }
    
    // Check if line is part of a table (already processed)
    if (line.includes('<tr') || line.includes('</tr>') || line.includes('<table')) {
      processedLines.push(line);
      continue;
    }
    
    // Headers
    if (line.startsWith('### ')) {
      if (inList && listItems.length > 0) {
        processedLines.push(`<ul class="list-disc list-inside space-y-1 my-3 ml-4">${listItems.join('')}</ul>`);
        listItems = [];
        inList = false;
      }
      processedLines.push(`<h3 class="text-lg font-bold text-foreground mt-6 mb-3">${line.substring(4)}</h3>`);
    } else if (line.startsWith('## ')) {
      if (inList && listItems.length > 0) {
        processedLines.push(`<ul class="list-disc list-inside space-y-1 my-3 ml-4">${listItems.join('')}</ul>`);
        listItems = [];
        inList = false;
      }
      processedLines.push(`<h2 class="text-xl font-bold text-foreground mt-6 mb-4">${line.substring(3)}</h2>`);
    } else if (line.startsWith('# ')) {
      if (inList && listItems.length > 0) {
        processedLines.push(`<ul class="list-disc list-inside space-y-1 my-3 ml-4">${listItems.join('')}</ul>`);
        listItems = [];
        inList = false;
      }
      processedLines.push(`<h1 class="text-2xl font-bold text-foreground mt-6 mb-4">${line.substring(2)}</h1>`);
    } 
    // Bullet points
    else if (line.match(/^[-*•]\s/)) {
      inList = true;
      let content = line.replace(/^[-*•]\s+/, '');
      // Handle markdown links first
      content = content.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, (match, text, url) => {
        const validUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
        return `<a href="${validUrl}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline underline decoration-primary/50 hover:decoration-primary cursor-pointer">${text}</a>`;
      });
      // Handle direct URLs
      const words = content.split(/(\s+)/);
      const processedWords = words.map(word => {
        if (word.match(/^https?:\/\/[^\s\)<]+$/) && !word.includes('<a')) {
          return `<a href="${word}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline underline decoration-primary/50 hover:decoration-primary break-all cursor-pointer">${word}</a>`;
        }
        return word;
      });
      content = processedWords.join('');
      // Handle bold text
      content = content.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>');
      listItems.push(`<li class="mb-1">${content}</li>`);
    }
    // Numbered lists
    else if (line.match(/^\d+\.\s/)) {
      inList = true;
      let content = line.replace(/^\d+\.\s+/, '');
      // Handle markdown links first
      content = content.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, (match, text, url) => {
        const validUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
        return `<a href="${validUrl}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline underline decoration-primary/50 hover:decoration-primary cursor-pointer">${text}</a>`;
      });
      // Handle direct URLs
      const words = content.split(/(\s+)/);
      const processedWords = words.map(word => {
        if (word.match(/^https?:\/\/[^\s\)<]+$/) && !word.includes('<a')) {
          return `<a href="${word}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline underline decoration-primary/50 hover:decoration-primary break-all cursor-pointer">${word}</a>`;
        }
        return word;
      });
      content = processedWords.join('');
      content = content.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>');
      listItems.push(`<li class="mb-1">${content}</li>`);
    }
    // Regular paragraphs
    else {
      if (inList && listItems.length > 0) {
        processedLines.push(`<ul class="list-disc list-inside space-y-1 my-3 ml-4">${listItems.join('')}</ul>`);
        listItems = [];
        inList = false;
      }
      let content = line;
      // Handle markdown links first
      content = content.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, (match, text, url) => {
        const validUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
        return `<a href="${validUrl}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline underline decoration-primary/50 hover:decoration-primary cursor-pointer">${text}</a>`;
      });
      // Handle direct URLs (split by spaces and process each word)
      const words = content.split(/(\s+)/);
      const processedWords = words.map(word => {
        // Check if word is a URL and not already a link
        if (word.match(/^https?:\/\/[^\s\)<]+$/) && !word.includes('<a')) {
          return `<a href="${word}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline underline decoration-primary/50 hover:decoration-primary break-all cursor-pointer">${word}</a>`;
        }
        return word;
      });
      content = processedWords.join('');
      // Handle bold text
      content = content.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>');
      // Handle italic text (simple approach - avoid if it looks like it's already in a tag)
      if (!content.includes('<a') && !content.includes('**')) {
        content = content.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');
      }
      processedLines.push(`<p class="mb-3 leading-relaxed">${content}</p>`);
    }
  }
  
  // Close any remaining list
  if (inList && listItems.length > 0) {
    processedLines.push(`<ul class="list-disc list-inside space-y-1 my-3 ml-4">${listItems.join('')}</ul>`);
  }
  
  return processedLines.join('');
}

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

const allSubjects = [
  "Mathematics",
  "Science",
  "English",
  "Hindi",
  "Social Science",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "Economics",
  "History",
  "Geography",
  "Political Science",
];

interface PlanGeneratorProps {
  onPlanGenerated?: (plan: LearningPlanResponse) => void;
  initialClass?: string;
  selectedLanguage?: string;
}

export function PlanGenerator({ onPlanGenerated, initialClass, selectedLanguage = 'en' }: PlanGeneratorProps) {
  const [selectedClass, setSelectedClass] = useState(initialClass || "");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [expectedMarks, setExpectedMarks] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<LearningPlanResponse | null>(null);
  const planContentRef = useRef<HTMLDivElement>(null);

  // Load saved plan from localStorage on mount
  useEffect(() => {
    try {
      const savedPlanData = localStorage.getItem('learningPlan');
      if (savedPlanData) {
        const parsed = JSON.parse(savedPlanData);
        // Only load if it matches the current class
        const currentClass = initialClass || selectedClass;
        if (parsed.selectedClass === currentClass && parsed.plan) {
          setGeneratedPlan(parsed.plan);
          setSelectedSubjects(parsed.selectedSubjects || []);
          setExpectedMarks(parsed.expectedMarks || {});
          // Notify parent component
          if (onPlanGenerated) {
            onPlanGenerated(parsed.plan);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load plan from localStorage:', error);
    }
  }, [initialClass, selectedClass, onPlanGenerated]);

  // Attach click handlers to links after plan is rendered
  useEffect(() => {
    if (generatedPlan && planContentRef.current) {
      const links = planContentRef.current.querySelectorAll('a');
      links.forEach(link => {
        // Remove any existing listeners by cloning
        const newLink = link.cloneNode(true) as HTMLAnchorElement;
        link.parentNode?.replaceChild(newLink, link);
        
        // Add click handler
        newLink.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const href = newLink.getAttribute('href');
          if (href) {
            const validUrl = href.startsWith('http://') || href.startsWith('https://') 
              ? href 
              : `https://${href}`;
            window.open(validUrl, '_blank', 'noopener,noreferrer');
          }
        });
      });
    }
  }, [generatedPlan]);

  const handleSubjectToggle = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject]
    );
  };

  const handleMarksChange = (subject: string, value: string) => {
    // Only allow numbers 0-100
    const numValue = value.replace(/[^0-9]/g, "");
    if (numValue === "" || (parseInt(numValue) >= 0 && parseInt(numValue) <= 100)) {
      setExpectedMarks((prev) => ({
        ...prev,
        [subject]: numValue,
      }));
    }
  };

  const handleGenerate = async () => {
    if (!selectedClass) {
      toast({
        title: "Class Required",
        description: "Please select your class to generate a learning plan.",
        variant: "destructive",
      });
      return;
    }

    if (selectedSubjects.length === 0) {
      toast({
        title: "Subjects Required",
        description: "Please select at least one subject.",
        variant: "destructive",
      });
      return;
    }

    // Validate marks for all selected subjects
    const marks: Record<string, number> = {};
    let allMarksEntered = true;

    for (const subject of selectedSubjects) {
      const marksValue = expectedMarks[subject];
      if (!marksValue || marksValue === "") {
        allMarksEntered = false;
        toast({
          title: "Marks Required",
          description: `Please enter expected marks for ${subject}.`,
          variant: "destructive",
        });
        return;
      }
      marks[subject] = parseInt(marksValue);
    }

    setIsGenerating(true);
    try {
      const plan = await generateLearningPlan({
        class: selectedClass,
        subjects: selectedSubjects,
        expectedMarks: marks,
        language: selectedLanguage,
      });

      setGeneratedPlan(plan);
      
      // Save to localStorage
      try {
        const planData = {
          plan,
          selectedClass,
          selectedSubjects,
          expectedMarks,
          generatedAt: new Date().toISOString(),
        };
        localStorage.setItem('learningPlan', JSON.stringify(planData));
      } catch (error) {
        console.error('Failed to save plan to localStorage:', error);
      }
      
      if (onPlanGenerated) {
        onPlanGenerated(plan);
      }

      toast({
        title: "Plan Generated!",
        description: "Your personalized learning plan is ready and saved.",
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error generating plan:", error);
      }
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate learning plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (generatedPlan) {
    return (
      <div className="space-y-6">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle>Your Personalized Learning Plan</CardTitle>
                <CardDescription>
                  Generated for Class {selectedClass} • {selectedSubjects.length} {selectedSubjects.length === 1 ? 'subject' : 'subjects'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="detailed">Detailed Plan</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Target Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {generatedPlan.modules.map((module, idx) => (
                    <div key={idx} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">{module.subject}</span>
                        <Badge variant="secondary">Target: {expectedMarks[module.subject]}%</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                        <Clock className="w-4 h-4" />
                        <span>{module.studyHours}</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {module.topics.length} topics to cover
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subjects" className="space-y-4">
            <div className="grid gap-4">
              {generatedPlan.modules.map((module, idx) => {
                const playlistUrl = getPlaylistUrl(selectedClass, module.subject);
                return (
                  <Card key={idx}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{module.subject}</CardTitle>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {expectedMarks[module.subject]}%
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Topics */}
                      <div>
                        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          Topics to Cover ({module.topics.length})
                        </h4>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {module.topics.map((topic, topicIdx) => {
                            const topicName = typeof topic === 'string' ? topic : topic.name;
                            const videoUrl = typeof topic === 'object' ? topic.videoUrl : undefined;
                            return (
                              <div key={topicIdx} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                                <span className="text-sm flex-1">{topicName}</span>
                                {videoUrl && (
                                  <a
                                    href={videoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                    title="Watch video"
                                  >
                                    <Youtube className="w-4 h-4" />
                                  </a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Study Hours & Schedule */}
                      <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t">
                        <div>
                          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Study Hours
                          </h4>
                          <p className="text-sm text-muted-foreground">{module.studyHours}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Weekly Schedule
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {module.weeklySchedule.map((day, dayIdx) => (
                              <Badge key={dayIdx} variant="secondary" className="text-xs">
                                {day}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Resources */}
                      <div className="pt-2 border-t">
                        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Learning Resources
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {module.resources.map((resource, resIdx) => {
                            // YouTube Playlist - already clickable
                            if (resource === 'YouTube Playlist' && playlistUrl) {
                              return (
                                <a
                                  key={resIdx}
                                  href={playlistUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm cursor-pointer"
                                >
                                  <Youtube className="w-4 h-4" />
                                  YouTube Playlist
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              );
                            }
                            
                            // NCERT Textbook - link to NCERT download page
                            if (resource === 'NCERT Textbook' || resource.includes('NCERT')) {
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
                              const subjectCode = subjectMap[module.subject] || module.subject.toLowerCase();
                              const ncertUrl = `https://ncert.nic.in/textbook.php?subject=${subjectCode}&class=${selectedClass}`;
                              
                              return (
                                <a
                                  key={resIdx}
                                  href={ncertUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm cursor-pointer"
                                >
                                  <BookOpen className="w-4 h-4" />
                                  {resource}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              );
                            }
                            
                            // Practice Worksheets - link to search or general resources
                            if (resource === 'Practice Worksheets' || resource.includes('Worksheet')) {
                              const worksheetSearchUrl = `https://www.google.com/search?q=NCERT+Class+${selectedClass}+${module.subject}+practice+worksheets+PDF`;
                              return (
                                <a
                                  key={resIdx}
                                  href={worksheetSearchUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm cursor-pointer"
                                >
                                  <FileText className="w-4 h-4" />
                                  {resource}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              );
                            }
                            
                            // Study Notes - link to search
                            if (resource === 'Study Notes' || resource.includes('Notes')) {
                              const notesSearchUrl = `https://www.google.com/search?q=NCERT+Class+${selectedClass}+${module.subject}+study+notes+PDF`;
                              return (
                                <a
                                  key={resIdx}
                                  href={notesSearchUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm cursor-pointer"
                                >
                                  <FileText className="w-4 h-4" />
                                  {resource}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              );
                            }
                            
                            // YouTube Videos - link to search
                            if (resource === 'YouTube Videos' || resource.includes('YouTube')) {
                              const youtubeSearchUrl = `https://www.youtube.com/results?search_query=NCERT+Class+${selectedClass}+${module.subject}`;
                              return (
                                <a
                                  key={resIdx}
                                  href={youtubeSearchUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm cursor-pointer"
                                >
                                  <Youtube className="w-4 h-4" />
                                  {resource}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              );
                            }
                            
                            // Default: make it clickable with a search link
                            const searchUrl = `https://www.google.com/search?q=NCERT+Class+${selectedClass}+${module.subject}+${encodeURIComponent(resource)}`;
                            return (
                              <a
                                key={resIdx}
                                href={searchUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm cursor-pointer"
                              >
                                <FileText className="w-4 h-4" />
                                {resource}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="detailed">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Complete Detailed Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <div 
                    ref={planContentRef}
                    className="text-foreground leading-relaxed space-y-4 whitespace-pre-wrap [&_a]:text-primary [&_a]:hover:underline [&_a]:cursor-pointer [&_a]:break-all [&_a]:pointer-events-auto [&_a]:underline [&_a]:decoration-primary/50 hover:[&_a]:decoration-primary [&_a]:z-10 [&_a]:relative"
                    dangerouslySetInnerHTML={{ 
                      __html: formatPlanText(generatedPlan.plan) 
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Button
          variant="outline"
          onClick={() => {
            setGeneratedPlan(null);
            setSelectedSubjects([]);
            setExpectedMarks({});
            // Clear saved plan from localStorage
            try {
              localStorage.removeItem('learningPlan');
            } catch (error) {
              console.error('Failed to clear plan from localStorage:', error);
            }
          }}
          className="w-full"
        >
          Generate New Plan
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle>AI-Powered Learning Plan Generator</CardTitle>
            <CardDescription>
              Get a personalized study plan based on your class, subjects, and target marks
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Class Selection */}
        <div className="space-y-2">
          <Label htmlFor="class">Select Your Class *</Label>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {classes.map((cls) => (
              <button
                key={cls.value}
                type="button"
                onClick={() => setSelectedClass(cls.value)}
                className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                  selectedClass === cls.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {cls.label}
              </button>
            ))}
          </div>
        </div>

        {/* Subject Selection */}
        <div className="space-y-3">
          <Label>Select Subjects *</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {allSubjects.map((subject) => (
              <div
                key={subject}
                className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  id={subject}
                  checked={selectedSubjects.includes(subject)}
                  onCheckedChange={() => handleSubjectToggle(subject)}
                />
                <label
                  htmlFor={subject}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                >
                  {subject}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Expected Marks */}
        {selectedSubjects.length > 0 && (
          <div className="space-y-3">
            <Label>Enter Expected Marks (Percentage) *</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedSubjects.map((subject) => (
                <div key={subject} className="space-y-2">
                  <Label htmlFor={`marks-${subject}`} className="text-sm">
                    {subject}
                  </Label>
                  <div className="relative">
                    <Input
                      id={`marks-${subject}`}
                      type="text"
                      placeholder="e.g., 85"
                      value={expectedMarks[subject] || ""}
                      onChange={(e) => handleMarksChange(subject, e.target.value)}
                      className="pr-8"
                      maxLength={3}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      %
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !selectedClass || selectedSubjects.length === 0}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating Your Plan...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Personalized Plan
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Our AI will create a customized learning plan tailored to your goals
        </p>
      </CardContent>
    </Card>
  );
}

