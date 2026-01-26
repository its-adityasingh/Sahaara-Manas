import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  WifiOff, 
  Wifi, 
  Download, 
  CheckCircle, 
  Clock, 
  HardDrive,
  RefreshCw,
  ArrowRight,
  Smartphone,
  Cloud,
  Zap,
  MapPin
} from "lucide-react";
import { useState } from "react";

const downloadableContent = [
  {
    id: 1,
    title: "Mathematics Class 8",
    titleHi: "गणित कक्षा 8",
    lessons: 24,
    size: "45 MB",
    status: "downloaded",
    lastSync: "2 hours ago",
  },
  {
    id: 2,
    title: "Science Class 8",
    titleHi: "विज्ञान कक्षा 8",
    lessons: 32,
    size: "68 MB",
    status: "downloaded",
    lastSync: "2 hours ago",
  },
  {
    id: 3,
    title: "English Class 8",
    titleHi: "अंग्रेज़ी कक्षा 8",
    lessons: 28,
    size: "52 MB",
    status: "downloading",
    progress: 65,
  },
  {
    id: 4,
    title: "Hindi Class 8",
    titleHi: "हिंदी कक्षा 8",
    lessons: 20,
    size: "38 MB",
    status: "available",
  },
  {
    id: 5,
    title: "Social Science Class 8",
    titleHi: "सामाजिक विज्ञान कक्षा 8",
    lessons: 36,
    size: "72 MB",
    status: "available",
  },
];

const OfflinePage = () => {
  const [isOnline, setIsOnline] = useState(true);

  return (
    <Layout>
      {/* Hero */}
      <section className="py-16 md:py-24 bg-gradient-sunrise">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
              <WifiOff className="w-4 h-4" />
              <span>Offline Mode</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Learn <span className="text-gradient-warm">anywhere</span>, even without internet
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Download your lessons when you have connectivity. Study at home, in the field, 
              or anywhere you go — your education doesn't depend on a signal.
            </p>
          </div>
        </div>
      </section>

      {/* Connection Status */}
      <section className="py-8 bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isOnline ? 'bg-success/10' : 'bg-accent/10'}`}>
                {isOnline ? (
                  <Wifi className="w-6 h-6 text-success" />
                ) : (
                  <WifiOff className="w-6 h-6 text-accent" />
                )}
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {isOnline ? 'You are online' : 'You are offline'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isOnline ? 'You can download new content' : 'Using downloaded content only'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-xl">
                <HardDrive className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">163 MB used</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsOnline(!isOnline)}
                className="text-muted-foreground"
              >
                {isOnline ? 'Simulate Offline' : 'Go Online'}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Downloads */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Download className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Your Downloads</h2>
                <p className="text-muted-foreground">Manage offline content</p>
              </div>
            </div>

            <div className="space-y-4">
              {downloadableContent.map((content) => (
                <Card key={content.id} variant="warm" className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          content.status === 'downloaded' ? 'bg-success/10' :
                          content.status === 'downloading' ? 'bg-primary/10' : 'bg-muted'
                        }`}>
                          {content.status === 'downloaded' ? (
                            <CheckCircle className="w-6 h-6 text-success" />
                          ) : content.status === 'downloading' ? (
                            <RefreshCw className="w-6 h-6 text-primary animate-spin" />
                          ) : (
                            <Cloud className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground">{content.title}</h3>
                          <p className="text-sm text-muted-foreground">{content.titleHi}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span>{content.lessons} lessons</span>
                            <span>•</span>
                            <span>{content.size}</span>
                            {content.lastSync && (
                              <>
                                <span>•</span>
                                <span>Synced {content.lastSync}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 md:flex-shrink-0">
                        {content.status === 'downloaded' && (
                          <>
                            <Button variant="primary" size="sm">
                              Open
                            </Button>
                            <Button variant="ghost" size="sm">
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {content.status === 'downloading' && (
                          <div className="flex items-center gap-3">
                            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary rounded-full transition-all duration-300"
                                style={{ width: `${content.progress}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{content.progress}%</span>
                          </div>
                        )}
                        {content.status === 'available' && (
                          <Button variant="outline" size="sm" disabled={!isOnline}>
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>

                    {content.status === 'downloading' && (
                      <div className="h-1 bg-muted">
                        <div 
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${content.progress}%` }}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">How offline learning works</h2>
              <p className="text-muted-foreground">Simple steps to learn without internet</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center relative">
                  <Wifi className="w-10 h-10 text-primary" />
                  <div className="absolute -right-1 -bottom-1 w-8 h-8 bg-background rounded-full flex items-center justify-center shadow-soft">
                    <span className="text-sm font-bold text-primary">1</span>
                  </div>
                </div>
                <h3 className="font-bold text-foreground mb-2">Connect</h3>
                <p className="text-sm text-muted-foreground">
                  When you have internet, open Sahaara–Gyaan and go to Downloads
                </p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-secondary/10 rounded-full flex items-center justify-center relative">
                  <Download className="w-10 h-10 text-secondary" />
                  <div className="absolute -right-1 -bottom-1 w-8 h-8 bg-background rounded-full flex items-center justify-center shadow-soft">
                    <span className="text-sm font-bold text-secondary">2</span>
                  </div>
                </div>
                <h3 className="font-bold text-foreground mb-2">Download</h3>
                <p className="text-sm text-muted-foreground">
                  Select the subjects and lessons you want to access offline
                </p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-teal/10 rounded-full flex items-center justify-center relative">
                  <Smartphone className="w-10 h-10 text-teal" />
                  <div className="absolute -right-1 -bottom-1 w-8 h-8 bg-background rounded-full flex items-center justify-center shadow-soft">
                    <span className="text-sm font-bold text-teal">3</span>
                  </div>
                </div>
                <h3 className="font-bold text-foreground mb-2">Learn Anywhere</h3>
                <p className="text-sm text-muted-foreground">
                  Access your lessons anytime, anywhere — no internet needed
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              <Card variant="highlight">
                <CardHeader>
                  <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center mb-4">
                    <Zap className="w-6 h-6 text-success" />
                  </div>
                  <CardTitle>Smart Sync</CardTitle>
                  <CardDescription>
                    When you're back online, your progress automatically syncs. 
                    Track your progress offline, and it'll be saved when connected.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card variant="highlight">
                <CardHeader>
                  <div className="w-12 h-12 bg-info/10 rounded-xl flex items-center justify-center mb-4">
                    <MapPin className="w-6 h-6 text-info" />
                  </div>
                  <CardTitle>Made for Rural India</CardTitle>
                  <CardDescription>
                    We know that internet access can be unreliable. That's why offline 
                    mode is a core feature, not an afterthought.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default OfflinePage;
