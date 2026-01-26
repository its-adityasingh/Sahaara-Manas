import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  BookOpen, 
  Wifi, 
  WifiOff, 
  Accessibility, 
  Languages, 
  Users, 
  Heart,
  Sparkles,
  ArrowRight,
  Volume2,
  Eye,
  Mic,
  Download,
  RefreshCw,
  GraduationCap,
  Star,
  Globe
} from "lucide-react";
import { Link } from "react-router-dom";

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-cool">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 animate-fade-in">
              <Heart className="w-4 h-4 fill-primary/30" />
              <span>Education is a right, not a privilege</span>
            </div>

            {/* Main heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
              Every child deserves{" "}
              <span className="text-gradient-primary">quality education</span>
            </h1>

            {/* Subheading */}
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto lg:mx-0 mb-8 opacity-0 animate-fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
              Sahaara Gyaan brings learning to your doorstep at your pace, 
              and designed for every ability. Whether you're in a bustling city or a remote village, 
              whether you see, hear, or learn differently, you belong here.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 md:gap-10 mb-10 opacity-0 animate-fade-in-up" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Languages className="w-5 h-5 text-primary" />
                <span className="font-semibold">12+ Languages</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-5 h-5 text-secondary" />
                <span className="font-semibold">100K+ Students</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <WifiOff className="w-5 h-5 text-accent" />
                <span className="font-semibold">Works Offline</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
              <Link to="/login">
                <Button variant="hero" className="group">
                  Start Learning Free
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/learn">
                <Button variant="heroOutline">
                  Explore Courses
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <p className="mt-8 text-sm text-muted-foreground opacity-0 animate-fade-in-up" style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}>
              Trusted by schools across 15 states • Accessibility certified • Free for all
            </p>
          </div>

          {/* Right Column - Image */}
          <div className="hidden lg:block relative opacity-0 animate-fade-in-up" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-2xl" />
              <div className="relative rounded-3xl overflow-hidden shadow-float border border-border/50">
                <img 
                  src="students-studying.jpg" 
                  alt="Students studying" 
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    // Fallback to placeholder if image doesn't exist
                    (e.target as HTMLImageElement).src = '/public/students-studying.jpg';
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FeaturesSection() {
  const features = [
    {
      icon: BookOpen,
      title: "Adaptive Learning",
      description: "Our intelligent learning system adapts to your unique learning style and pace. Content automatically adjusts difficulty levels, provides personalized recommendations, and tracks your progress to ensure optimal learning outcomes. Whether you're a visual learner, auditory learner, or prefer hands-on activities, the system tailors the content delivery to match your preferences.",
      color: "text-primary",
      bgColor: "bg-primary/10",
      link: "/learn"
    },
    {
      icon: Languages,
      title: "Your Language, Your Way",
      description: "Learn comfortably in your native language with support for 12+ Indian languages including Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Odia, Punjabi, Assamese, and Urdu. Switch between languages seamlessly at any time, with all content, instructions, and assessments available in your preferred language. Perfect for students who learn better in their mother tongue.",
      color: "text-secondary",
      bgColor: "bg-secondary/10",
      link: "/learn"
    },
    {
      icon: WifiOff,
      title: "Offline Learning",
      description: "Continue learning even without internet connectivity. Download entire courses, lessons, videos, and study materials to your device for offline access. Perfect for students in rural areas with unreliable internet. Your progress syncs automatically when you're back online, ensuring you never lose your learning data. Study anytime, anywhere, regardless of connectivity.",
      color: "text-accent",
      bgColor: "bg-accent/10",
      link: "/offline"
    },
    {
      icon: Accessibility,
      title: "Accessible for All",
      description: "Built with universal design principles, our platform supports students with diverse needs. Features include screen reader compatibility, text-to-speech, speech-to-text, high contrast modes, adjustable font sizes, dyslexia-friendly fonts, keyboard navigation, and simplified layouts. We ensure that children with visual, hearing, motor, or cognitive differences can access quality education without barriers.",
      color: "text-info",
      bgColor: "bg-info/10",
      link: "/accessibility"
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            <span>Built for Real Students</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Learning that meets you where you are
          </h2>
          <p className="text-muted-foreground text-lg">
            Every feature is designed with empathy — for the student in a remote village, 
            the child with a disability, the first-generation learner finding their path.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Link to={feature.link} key={feature.title}>
                <Card 
                  variant="feature" 
                  className="h-full cursor-pointer group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-8">
                    <div className={`w-14 h-14 ${feature.bgColor} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-7 h-7 ${feature.color}`} />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Learn more</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function AccessibilityHighlight() {
  const tools = [
    { icon: Volume2, label: "Text-to-Speech", description: "Listen to any lesson" },
    { icon: Mic, label: "Speech-to-Text", description: "Speak your answers" },
    { icon: Eye, label: "High Contrast", description: "Better visibility" },
    { icon: GraduationCap, label: "Simple Layouts", description: "Clear & focused" },
  ];

  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-secondary/5 to-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-info/10 text-info text-sm font-medium mb-4">
              <Accessibility className="w-4 h-4" />
              <span>Inclusive by Design</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Education should never have barriers
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              We believe every child can learn — we just need to meet them where they are. 
              Sahaara Gyaan is built from the ground up for students with visual, hearing, 
              motor, or cognitive differences.
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              {tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <div key={tool.label} className="flex items-start gap-3 p-4 rounded-xl bg-card shadow-soft border border-border/50">
                    <div className="w-10 h-10 bg-info/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-info" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{tool.label}</p>
                      <p className="text-xs text-muted-foreground">{tool.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <Link to="/accessibility">
              <Button variant="trust" className="group">
                Explore Accessibility Features
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          <div className="relative">
            <div className="aspect-square max-w-md mx-auto relative">
              {/* Decorative circles */}
              <div className="absolute inset-0 bg-gradient-to-br from-info/20 to-secondary/20 rounded-full blur-2xl" />
              <div className="absolute inset-8 bg-card rounded-3xl shadow-float border border-border/50 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-24 h-24 mx-auto mb-6 bg-info/10 rounded-full flex items-center justify-center">
                    <Heart className="w-12 h-12 text-info fill-info/20" />
                  </div>
                  <p className="text-2xl font-bold text-foreground mb-2">You belong here</p>
                  <p className="text-muted-foreground">
                    Learning is possible for you
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function OfflineSection() {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          <div className="order-2 lg:order-1 relative">
            <div className="aspect-[4/3] max-w-md mx-auto relative">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-primary/20 rounded-3xl blur-2xl" />
              <div className="absolute inset-0 bg-card rounded-3xl shadow-float border border-border/50 p-8 flex flex-col justify-center">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center">
                    <WifiOff className="w-8 h-8 text-accent" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Offline Mode</p>
                    <p className="text-sm text-success">Active & Ready</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                    <Download className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium">Mathematics Class 8</span>
                    <span className="ml-auto text-xs text-success">Downloaded</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                    <Download className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium">Science Class 8</span>
                    <span className="ml-auto text-xs text-success">Downloaded</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                    <RefreshCw className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">English Class 8</span>
                    <span className="ml-auto text-xs text-muted-foreground">Pending</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
              <Wifi className="w-4 h-4" />
              <span>Rural-First Design</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Learning doesn't stop when the internet does
            </h2>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              In many parts of India, reliable internet is still a dream. That's why Sahaara Gyaan 
              works offline — download your lessons when connected, and learn anywhere, anytime.
            </p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Star className="w-3 h-3 text-success" />
                </div>
                <span className="text-muted-foreground">Download entire courses for offline access</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Star className="w-3 h-3 text-success" />
                </div>
                <span className="text-muted-foreground">Smart sync when you're back online</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Star className="w-3 h-3 text-success" />
                </div>
                <span className="text-muted-foreground">Progress saves automatically</span>
              </li>
            </ul>

            <Link to="/offline">
              <Button variant="accent" className="group">
                See How It Works
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CTASection() {
  return (
    <section className="py-20 md:py-28 bg-gradient-primary text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMiIvPjwvZz48L3N2Zz4=')] opacity-30" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/20 text-primary-foreground text-sm font-medium mb-6">
            <Globe className="w-4 h-4" />
            <span>Join the movement</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Ready to start your learning journey?
          </h2>
          
          <p className="text-lg md:text-xl opacity-90 mb-10 leading-relaxed">
            It doesn't matter where you come from or how you learn. 
            Sahaara Gyaan is here to support you every step of the way.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login">
              <Button 
                size="xl" 
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
              >
                Create Free Account
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button 
                size="xl" 
                variant="ghost" 
                className="text-primary-foreground border-2 border-primary-foreground/30 hover:bg-primary-foreground/10 hover:border-primary-foreground/50"
              >
                View Demo Dashboard
              </Button>
            </Link>
          </div>
          
          <p className="mt-8 text-sm opacity-70">
            No credit card required • Free forever for students
          </p>
        </div>
      </div>
    </section>
  );
}