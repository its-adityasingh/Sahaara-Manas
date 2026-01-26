import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Play, 
  ArrowLeft, 
  CheckCircle, 
  Clock,
  BookOpen,
  Loader2
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { getPlaylistEmbedUrl, getPlaylistId } from "@/lib/youtube-playlists";
import { sanitizeUrlParam, sanitizeLessonId } from "@/lib/validation";

const VideoPlayerPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  // Sanitize URL parameters to prevent XSS attacks
  const videoUrl = sanitizeUrlParam(searchParams.get('url')) || '';
  const subject = sanitizeUrlParam(searchParams.get('subject')) || '';
  const classLevel = sanitizeUrlParam(searchParams.get('class')) || '';
  const topic = sanitizeUrlParam(searchParams.get('topic')) || '';
  
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [watchingTime, setWatchingTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Extract YouTube video ID or playlist ID from URL
  const getYouTubeVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = videoUrl ? getYouTubeVideoId(videoUrl) : null;
  const playlistId = videoUrl ? getPlaylistId(videoUrl) : null;
  
  // Use playlist embed URL if playlist exists, otherwise use video embed
  const embedUrl = videoUrl ? getPlaylistEmbedUrl(videoUrl) : '';

  useEffect(() => {
    if (!videoUrl || !subject || !topic) {
      setLoading(false);
      if (!videoUrl) {
        toast({
          title: "Video URL Missing",
          description: "The video URL is missing or invalid. Please go back and try again.",
          variant: "destructive",
        });
      }
      return;
    }
    
    if (!embedUrl) {
      setLoading(false);
      toast({
        title: "Invalid Video URL",
        description: "The video URL format is invalid. Please check the URL and try again.",
        variant: "destructive",
      });
      return;
    }
    
    if (user && embedUrl && subject && topic) {
      loadProgress().then(() => {
        // Save initial progress when video starts (even if 0%) - this triggers dashboard update
        saveProgress(0, false, 0);
      });
    } else {
      setLoading(false);
    }
  }, [user, embedUrl, subject, topic, videoUrl]);

  const loadProgress = async () => {
    if (!user) return;
    
    try {
      // Generate a lesson_id from subject and topic (sanitized)
      const lessonId = sanitizeLessonId(subject, topic);
      
      const { data } = await supabase
        .from('learning_progress')
        .select('progress_percent, completed')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (data) {
        setProgress(data.progress_percent || 0);
        setIsCompleted(data.completed || false);
        // Estimate watching time from progress (assuming 10 min video)
        setWatchingTime(Math.round((data.progress_percent || 0) * 6));
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error loading progress:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const saveProgress = async (percent: number, completed: boolean, time: number) => {
    if (!user || !subject || !topic) return;

    try {
      // Generate a lesson_id from subject and topic (sanitized)
      const lessonId = sanitizeLessonId(subject, topic);
      
      const progressData = {
        user_id: user.id,
        lesson_id: lessonId,
        subject: subject,
        lesson_title: topic,
        progress_percent: percent,
        completed: completed,
        last_accessed: new Date().toISOString(),
      };
      
      if (import.meta.env.DEV) {
        console.log('Saving progress to database:', progressData);
      }
      
      // The unique constraint is on (user_id, subject, lesson_id)
      // So we need to specify all three columns for onConflict
      const { data: upsertData, error } = await supabase
        .from('learning_progress')
        .upsert(progressData, {
          onConflict: 'user_id,subject,lesson_id'
        })
        .select();

      if (error) {
        if (import.meta.env.DEV) {
          console.error('Error saving progress:', error);
        }
        throw error;
      }
      
      if (import.meta.env.DEV) {
        console.log('Progress saved successfully:', upsertData);
      }
      
      // Verify the data was saved by fetching it back
      if (import.meta.env.DEV) {
        const { data: verifyData } = await supabase
          .from('learning_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('lesson_id', lessonId)
          .maybeSingle();
        
        console.log('Verified saved progress:', verifyData);
      }
      
      // Trigger a refresh of dashboard data by dispatching a custom event with detail
      const event = new CustomEvent('progressUpdated', {
        detail: { 
          userId: user.id, 
          subject, 
          topic, 
          progress_percent: percent, 
          completed,
          timestamp: Date.now()
        }
      });
      window.dispatchEvent(event);
      
      // Also use localStorage as a backup mechanism for cross-tab updates
      const updateData = {
        userId: user.id,
        timestamp: Date.now(),
        subject,
        topic,
        progress_percent: percent,
        completed
      };
      localStorage.setItem('progressUpdated', JSON.stringify(updateData));
      
      // Force a page visibility check to trigger update (some browsers need this)
      if (document.hidden) {
        // If page is hidden, dispatch another event after a short delay
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('progressUpdated', {
            detail: updateData
          }));
        }, 100);
      }
      
      if (import.meta.env.DEV) {
        console.log('Progress saved and events dispatched:', { percent, completed, subject, topic, updateData });
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error saving progress:', error);
      }
    }
  };

  useEffect(() => {
    if (!embedUrl || !user) return;

    // Track progress every 10 seconds
    progressIntervalRef.current = setInterval(() => {
      setWatchingTime(prev => {
        const newTime = prev + 10;
        const estimatedVideoDuration = 600; // 10 minutes default
        const newProgress = Math.min(100, Math.round((newTime / estimatedVideoDuration) * 100));
        
        setProgress(newProgress);
        
        if (newProgress >= 100 && !isCompleted) {
          setIsCompleted(true);
          toast({
            title: "Lesson Completed!",
            description: "Great job completing this lesson.",
          });
        }
        
        saveProgress(newProgress, newProgress >= 100, newTime);
        return newTime;
      });
    }, 10000);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [embedUrl, isCompleted, user]);

  const handleMarkComplete = async () => {
    if (!user || !subject || !topic) {
      toast({
        title: "Error",
        description: "Missing user information. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCompleted(true);
      setProgress(100);
      setWatchingTime(600); // Set to estimated duration
      
      // Save progress and wait for it to complete
      await saveProgress(100, true, 600);
      
      // Wait a moment to ensure database write is complete
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Force a dashboard update by dispatching multiple events
      const updateData = {
        userId: user.id,
        subject,
        topic,
        progress_percent: 100,
        completed: true,
        timestamp: Date.now(),
        forceUpdate: true
      };
      
      // Dispatch custom event
      const event = new CustomEvent('progressUpdated', {
        detail: updateData,
        bubbles: true,
        cancelable: true
      });
      window.dispatchEvent(event);
      
      // Update localStorage immediately with unique timestamp
      localStorage.setItem('progressUpdated', JSON.stringify(updateData));
      
      // Dispatch another event after a short delay to ensure it's caught
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('progressUpdated', {
          detail: { ...updateData, timestamp: Date.now() },
          bubbles: true
        }));
      }, 500);
      
      if (import.meta.env.DEV) {
        console.log('Mark complete: Progress saved and events dispatched', updateData);
      }
      
      toast({
        title: "Marked as Complete ✓",
        description: "Your progress has been saved. The dashboard will update automatically.",
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error marking as complete:', error);
      }
      toast({
        title: "Error",
        description: "Failed to mark as complete. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!embedUrl || !videoUrl) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">Invalid video URL</p>
              <Button onClick={() => navigate('/learn')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Learning
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-[calc(100vh-5rem)] py-6 bg-background">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/learn')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Learning Plan
            </Button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-1">{topic}</h1>
                <p className="text-muted-foreground">
                  {subject} • Class {classLevel}
                </p>
              </div>
              {isCompleted && (
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Completed</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Video Player */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-0">
                  <div className="aspect-video bg-black rounded-t-lg overflow-hidden">
                    <iframe
                      ref={iframeRef}
                      src={embedUrl}
                      title={topic}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
                  {playlistId && (
                    <div className="p-4 bg-muted/50 border-t">
                      <p className="text-sm text-muted-foreground">
                        📺 Playing from {subject} playlist for Class {classLevel}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Progress Section */}
              <Card className="mt-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Your Progress</CardTitle>
                    <span className="text-sm text-muted-foreground">{progress}%</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <Progress value={progress} className="mb-4" />
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Watched: {Math.floor(watchingTime / 60)}m {watchingTime % 60}s</span>
                    </div>
                    {!isCompleted && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleMarkComplete}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark as Complete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    Lesson Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Subject</p>
                    <p className="font-medium">{subject}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Class</p>
                    <p className="font-medium">Class {classLevel}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Topic</p>
                    <p className="font-medium">{topic}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate('/learn')}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Plan
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate('/dashboard')}
                  >
                    View Dashboard
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default VideoPlayerPage;

