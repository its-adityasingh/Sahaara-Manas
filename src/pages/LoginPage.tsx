import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  User, 
  Mail, 
  Lock, 
  ArrowRight,
  GraduationCap,
  Users,
  BookOpen,
  Eye,
  EyeOff,
  Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import { z } from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type UserType = "student" | "parent" | "educator";
type AuthMode = "login" | "signup";

// Validation schemas
const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");
const nameSchema = z.string().min(2, "Name must be at least 2 characters");

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

const LoginPage = () => {
  const { user, signUp, signIn, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [userType, setUserType] = useState<UserType>("student");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    class: "",
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  // Check Supabase configuration on mount
  useEffect(() => {
    if (!isSupabaseConfigured) {
      toast({
        title: "Configuration Required",
        description: "Please configure Supabase in your .env file to use authentication features.",
        variant: "destructive",
      });
    }
  }, []);

  const userTypes = [
    { 
      type: "student" as UserType, 
      icon: GraduationCap, 
      label: "Student", 
    },
    { 
      type: "parent" as UserType, 
      icon: Users, 
      label: "Parent", 
    },
    { 
      type: "educator" as UserType, 
      icon: BookOpen, 
      label: "Educator", 
    },
  ];

  const validateForm = () => {
    const newErrors = { name: "", email: "", password: "", class: "" };
    let isValid = true;

    // Validate email
    const emailResult = emailSchema.safeParse(formData.email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
      isValid = false;
    }

    // Validate password
    const passwordResult = passwordSchema.safeParse(formData.password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
      isValid = false;
    }

    // Validate name and class (signup only)
    if (authMode === "signup") {
      const nameResult = nameSchema.safeParse(formData.name);
      if (!nameResult.success) {
        newErrors.name = nameResult.error.errors[0].message;
        isValid = false;
      }

      if (userType === "student" && !selectedClass) {
        newErrors.class = "Please select your class";
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      if (authMode === "signup") {
        const { error } = await signUp(formData.email, formData.password, {
          full_name: formData.name,
          user_type: userType,
          grade_level: userType === "student" ? selectedClass : null,
          preferred_language: "en", // Default to English, can be changed later
        });

        if (error) {
          let errorMessage = error.message;
          let errorTitle = "Sign up failed";
          
          if (error.message.includes("Unable to connect") || error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
            errorTitle = "Connection Error";
            errorMessage = "Unable to connect to the server. Please check:\n1. Your internet connection\n2. Supabase environment variables are set in .env file\n3. Supabase project is active";
            toast({
              title: errorTitle,
              description: errorMessage,
              variant: "destructive",
            });
          } else if (error.message.includes("already registered") || error.message.includes("already exists") || error.message.includes("User already registered")) {
            errorMessage = "This email is already registered. Please log in instead.";
            toast({
              title: "Account exists",
              description: errorMessage,
              variant: "destructive",
            });
          } else if (error.message.includes("Password")) {
            errorMessage = "Password must be at least 6 characters long.";
            toast({
              title: errorTitle,
              description: errorMessage,
              variant: "destructive",
            });
          } else if (error.message.includes("email")) {
            errorMessage = "Please enter a valid email address.";
            toast({
              title: errorTitle,
              description: errorMessage,
              variant: "destructive",
            });
          } else {
            toast({
              title: errorTitle,
              description: errorMessage,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Welcome to Sahaara Gyaan!",
            description: "Your account has been created successfully. You can now log in.",
          });
          // Switch to login mode after successful signup
          setAuthMode("login");
          setFormData({ name: "", email: formData.email, password: "" });
        }
      } else {
        const { error } = await signIn(formData.email, formData.password);

        if (error) {
          let errorMessage = error.message;
          let errorTitle = "Login failed";
          
          if (error.message.includes("Unable to connect") || error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
            errorTitle = "Connection Error";
            errorMessage = "Unable to connect to the server. Please check:\n1. Your internet connection\n2. Supabase environment variables are set in .env file\n3. Supabase project is active";
            toast({
              title: errorTitle,
              description: errorMessage,
              variant: "destructive",
            });
          } else if (error.message.includes("Invalid login credentials") || error.message.includes("Invalid") || error.message.includes("credentials")) {
            errorMessage = "Invalid email or password. Please try again.";
            toast({
              title: errorTitle,
              description: errorMessage,
              variant: "destructive",
            });
          } else if (error.message.includes("Email not confirmed")) {
            errorMessage = "Please check your email and confirm your account before logging in.";
            toast({
              title: "Email not confirmed",
              description: errorMessage,
              variant: "destructive",
            });
          } else {
            toast({
              title: errorTitle,
              description: errorMessage,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Welcome back!",
            description: "You've successfully logged in.",
          });
          navigate('/dashboard');
        }
      }
    } catch (err) {
      toast({
        title: authMode === "signup" ? "Sign up failed" : "Login failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="min-h-[calc(100vh-5rem)] flex items-center py-12 bg-gradient-cool">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <Link to="/" className="inline-flex items-center gap-2 mb-6">
                <img 
                  src="/logo.png" 
                  alt="Sahaara Gyaan Logo" 
                  className="w-12 h-12 object-contain"
                />
              </Link>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {authMode === "login" ? "Welcome back!" : "Join Sahaara Gyaan"}
              </h1>
              <p className="text-muted-foreground">
                {authMode === "login" 
                  ? "Continue your learning journey" 
                  : "Start your free learning journey today"}
              </p>
            </div>

            <Card variant="glass" className="shadow-float">
              <CardContent className="p-6">
                {!isSupabaseConfigured && (
                  <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm text-destructive font-medium mb-2">
                      ⚠️ Supabase Not Configured
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Please create a <code className="px-1 py-0.5 bg-muted rounded">.env</code> file in the project root with:
                    </p>
                    <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                      VITE_SUPABASE_URL=your_supabase_url{'\n'}VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
                    </pre>
                    <p className="text-xs text-muted-foreground mt-2">
                      Then restart your development server.
                    </p>
                  </div>
                )}
                {/* Auth Mode Toggle */}
                <div className="flex rounded-xl bg-muted p-1 mb-6">
                  <button
                    onClick={() => setAuthMode("login")}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                      authMode === "login" 
                        ? "bg-background shadow-soft text-foreground" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => setAuthMode("signup")}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                      authMode === "signup" 
                        ? "bg-background shadow-soft text-foreground" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Sign Up
                  </button>
                </div>

                {/* User Type Selection (Signup only) */}
                {authMode === "signup" && (
                  <div className="mb-6">
                    <Label className="text-sm font-medium text-foreground mb-3 block">
                      I am a...
                    </Label>
                    <div className="grid grid-cols-3 gap-3">
                      {userTypes.map(({ type, icon: Icon, label }) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setUserType(type)}
                          className={`p-4 rounded-xl border-2 transition-all text-center ${
                            userType === type
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <Icon className={`w-6 h-6 mx-auto mb-2 ${
                            userType === type ? "text-primary" : "text-muted-foreground"
                          }`} />
                          <p className={`text-sm font-medium ${
                            userType === type ? "text-foreground" : "text-muted-foreground"
                          }`}>
                            {label}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {authMode === "signup" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            id="name"
                            type="text"
                            placeholder="Enter your name"
                            className={`pl-10 h-12 ${errors.name ? 'border-destructive' : ''}`}
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          />
                        </div>
                        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                      </div>

                      {/* Class Selection for Students */}
                      {userType === "student" && (
                        <div className="space-y-2">
                          <Label htmlFor="class">Select Your Class</Label>
                          <Select value={selectedClass} onValueChange={setSelectedClass}>
                            <SelectTrigger className={`h-12 ${errors.class ? 'border-destructive' : ''}`}>
                              <SelectValue placeholder="Choose your class" />
                            </SelectTrigger>
                            <SelectContent>
                              {classes.map((c) => (
                                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.class && <p className="text-sm text-destructive">{errors.class}</p>}
                        </div>
                      )}
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        className={`pl-10 h-12 ${errors.email ? 'border-destructive' : ''}`}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      {authMode === "login" && (
                        <button type="button" className="text-sm text-primary hover:underline">
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className={`pl-10 pr-10 h-12 ${errors.password ? 'border-destructive' : ''}`}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>

                  <Button variant="primary" className="w-full h-12" type="submit" disabled={loading}>
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        {authMode === "login" ? "Log In" : "Create Account"}
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </form>

                {/* Terms */}
                {authMode === "signup" && (
                  <p className="text-xs text-muted-foreground text-center mt-6">
                    By creating an account, you agree to our{" "}
                    <a href="#" className="text-primary hover:underline">Terms of Service</a>
                    {" "}and{" "}
                    <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Bottom message */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              {authMode === "login" 
                ? "Don't have an account? " 
                : "Already have an account? "}
              <button 
                onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
                className="text-primary font-medium hover:underline"
              >
                {authMode === "login" ? "Sign up free" : "Log in"}
              </button>
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default LoginPage;