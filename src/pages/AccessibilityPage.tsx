import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Accessibility, 
  Volume2, 
  Mic, 
  Type,
  ArrowRight,
  CheckCircle,
  Settings,
  Heart,
  X
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const AccessibilityPage = () => {
  const { user } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [fontSize, setFontSize] = useState(100);
  const [textToSpeechEnabled, setTextToSpeechEnabled] = useState(false);
  const [dyslexiaMode, setDyslexiaMode] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Load user preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return;

      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('text_to_speech, dyslexia_font, font_size')
        .eq('user_id', user.id)
        .maybeSingle();

      if (preferences) {
        setTextToSpeechEnabled(preferences.text_to_speech || false);
        setDyslexiaMode(preferences.dyslexia_font || false);
        if (preferences.font_size) {
          setFontSize(preferences.font_size);
        }
      }
    };

    loadPreferences();
  }, [user]);

  // Save preferences to database
  const savePreferences = async (updates: { text_to_speech?: boolean; dyslexia_font?: boolean; font_size?: number }) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          ...updates,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving preferences:', error);
      } else {
        // Dispatch event for other pages to listen
        window.dispatchEvent(new CustomEvent('preferenceChanged', {
          detail: updates
        }));
        // Also update localStorage
        if (updates.text_to_speech !== undefined) {
          localStorage.setItem('textToSpeechEnabled', String(updates.text_to_speech));
        }
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  // Apply dyslexia mode font
  useEffect(() => {
    if (dyslexiaMode) {
      document.body.style.fontFamily = "'OpenDyslexic', 'Comic Sans MS', cursive, sans-serif";
      document.body.style.letterSpacing = "0.05em";
      document.body.style.lineHeight = "1.8";
    } else {
      document.body.style.fontFamily = "";
      document.body.style.letterSpacing = "";
      document.body.style.lineHeight = "";
    }

    return () => {
      document.body.style.fontFamily = "";
      document.body.style.letterSpacing = "";
      document.body.style.lineHeight = "";
    };
  }, [dyslexiaMode]);

  // Apply font size
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}%`;
    
    // Save font size to database when it changes (debounced)
    if (user) {
      const timeoutId = setTimeout(() => {
        savePreferences({ font_size: fontSize });
      }, 500); // Debounce by 500ms
      return () => {
        clearTimeout(timeoutId);
        document.documentElement.style.fontSize = "";
      };
    }
    
    return () => {
      document.documentElement.style.fontSize = "";
    };
  }, [fontSize, user]);

  const handleTextToSpeech = (text: string) => {
    if (!textToSpeechEnabled) return;
    
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      speechSynthesis.speak(utterance);
    }
  };


  const accessibilityFeatures = [
    {
      id: "text-to-speech",
      icon: Volume2,
      title: "Text to Speech",
      description: "Listen to any content read aloud. Click on text to hear it spoken. Adjustable speed and voice options.",
      isEnabled: textToSpeechEnabled,
      onToggle: () => setTextToSpeechEnabled(!textToSpeechEnabled),
    },
    {
      id: "dyslexia-mode",
      icon: Type,
      title: "Dyslexia-Friendly Mode",
      description: "Special fonts and spacing designed for students with dyslexia. Makes reading easier and more comfortable.",
      isEnabled: dyslexiaMode,
      onToggle: () => setDyslexiaMode(!dyslexiaMode),
    },
  ];

  return (
    <Layout>
      {/* Hero */}
      <section className="py-16 md:py-24 bg-gradient-cool">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Accessibility className="w-4 h-4" />
              <span>Inclusive by Design</span>
            </div>
            <h1 
              className="text-4xl md:text-5xl font-bold text-foreground mb-6 cursor-pointer"
              onClick={() => handleTextToSpeech("Learning without barriers")}
            >
              Learning <span className="text-gradient-primary">without barriers</span>
            </h1>
            <p 
              className="text-lg text-muted-foreground mb-8 cursor-pointer"
              onClick={() => handleTextToSpeech("We believe every child can learn. They just need tools that meet them where they are. Sahaara Gyaan is built from the ground up for students with visual, hearing, motor, or cognitive differences.")}
            >
              We believe every child can learn — they just need tools that meet them where they are. 
              Sahaara Gyaan is built from the ground up for students with visual, hearing, motor, or cognitive differences.
            </p>
          </div>
        </div>
      </section>

      {/* Main Accessibility Features */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Accessibility className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Accessibility Features</h2>
                <p className="text-muted-foreground">Enable features that help you learn better</p>
              </div>
            </div>

            <div className="grid gap-6">
              {accessibilityFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card 
                    key={feature.id} 
                    className={`transition-all ${feature.isEnabled ? 'ring-2 ring-primary bg-primary/5' : ''}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          feature.isEnabled ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        }`}>
                          <Icon className="w-7 h-7" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-lg text-foreground">{feature.title}</h3>
                            <button
                              onClick={feature.onToggle}
                              className={`w-14 h-7 rounded-full transition-colors relative ${
                                feature.isEnabled ? 'bg-primary' : 'bg-muted'
                              }`}
                            >
                              <div className={`absolute top-1 w-5 h-5 bg-background rounded-full shadow transition-transform ${
                                feature.isEnabled ? 'translate-x-8' : 'translate-x-1'
                              }`} />
                            </button>
                          </div>
                          <p 
                            className="text-muted-foreground cursor-pointer"
                            onClick={() => handleTextToSpeech(feature.description)}
                          >
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Commitment Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="overflow-hidden">
              <div className="grid md:grid-cols-2">
                <CardContent className="p-8 md:p-10">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                    <Heart className="w-7 h-7 text-primary fill-primary/20" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">
                    Our Accessibility Promise
                  </h2>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    We're committed to making education accessible to every child in India. 
                    This isn't a feature list — it's a promise to continuously improve and 
                    listen to the needs of students with disabilities.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">WCAG 2.1 AA compliant</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">Regular accessibility audits</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">Feedback from disability communities</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">Continuous improvement process</span>
                    </li>
                  </ul>
                </CardContent>
                <div className="bg-gradient-primary p-8 md:p-10 flex items-center justify-center">
                  <div className="text-center text-primary-foreground">
                    <p className="text-3xl md:text-4xl font-bold mb-4">
                      "You belong here"
                    </p>
                    <p className="text-lg opacity-90">
                      Learning is possible for you
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Help Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Need help with accessibility?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Our support team is trained to help students with different needs. 
            Reach out anytime — we're here for you.
          </p>
          <Button variant="primary" size="lg">
            Contact Accessibility Support
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* Floating Settings Button - Bottom Right */}
      <button
        onClick={() => setIsSettingsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
        aria-label="Open Accessibility Settings"
      >
        <Settings className="w-6 h-6" />
      </button>

      {/* Settings Panel */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsSettingsOpen(false)} />
          <Card className="relative z-10 w-full max-w-sm shadow-2xl animate-in slide-in-from-right">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-foreground">Accessibility Settings</h3>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Font Size */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Type className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Text Size</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{fontSize}%</span>
                  </div>
                  <input
                    type="range"
                    min="80"
                    max="150"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>

                {/* Text to Speech */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className={`w-4 h-4 ${textToSpeechEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-sm font-medium">Text to Speech</span>
                  </div>
                  <button
                    onClick={() => {
                      const newValue = !textToSpeechEnabled;
                      setTextToSpeechEnabled(newValue);
                      savePreferences({ text_to_speech: newValue });
                    }}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      textToSpeechEnabled ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-background rounded-full shadow transition-transform ${
                      textToSpeechEnabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                {/* Dyslexia Mode */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Type className={`w-4 h-4 ${dyslexiaMode ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-sm font-medium">Dyslexia-Friendly</span>
                  </div>
                  <button
                    onClick={() => {
                      const newValue = !dyslexiaMode;
                      setDyslexiaMode(newValue);
                      savePreferences({ dyslexia_font: newValue });
                    }}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      dyslexiaMode ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-background rounded-full shadow transition-transform ${
                      dyslexiaMode ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-6">
                These settings are applied instantly. API integration coming soon for enhanced features.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </Layout>
  );
};

export default AccessibilityPage;