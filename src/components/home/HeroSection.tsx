import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";
import fitnessYoga from "@/assets/fitness-yoga.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-24">
      {/* Background gradient */}
      <div className="absolute inset-0 wave-bg" />
      
      {/* Floating Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-96 h-96 rounded-full bg-calm/20 blur-3xl"
          style={{ top: "20%", left: "5%" }}
          animate={{ y: [0, -30, 0], x: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-64 h-64 rounded-full bg-peace/20 blur-3xl"
          style={{ bottom: "20%", left: "20%" }}
          animate={{ y: [0, 40, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left - Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-left"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-card/80 backdrop-blur-lg border border-border/50 rounded-full px-4 py-2 mb-8"
            >
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-muted-foreground">
                Your wellness companion
              </span>
            </motion.div>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground mb-6 leading-tight">
              Your space to{" "}
              <span className="gradient-text">feel better</span>,{" "}
              move better, and{" "}
              <span className="gradient-text">live better</span>
            </h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-lg md:text-xl text-muted-foreground max-w-xl mb-10"
            >
              A warm, supportive space designed for young adults to nurture both 
              mind and body. No judgments, just gentle guidance.
            </motion.p>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Link to="/auth">
                <Button variant="accent" size="xl" className="group">
                  Create your wellbeing space
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Right - Image */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            <div className="relative">
              {/* Decorative circles */}
              <motion.div
                className="absolute -top-8 -left-8 w-64 h-64 rounded-full border-2 border-calm/30"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute -bottom-8 -right-8 w-70 h-70 rounded-full border-2 border-peace/30"
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              />
              
              {/* Main image - SIZE CONTROLLED HERE: w-full controls width, scale controls size */}
              <div className="relative z-10 rounded-3xl overflow-hidden shadow-glow transform scale-105" style={{ width: '90%' }}>
                <img 
                  src={fitnessYoga} 
                  alt="Person doing yoga in a peaceful setting" 
                  className="w-full h-auto object-cover object-left"
                />
                {/* OPACITY CONTROLLED HERE: from-background/20 means 20% opacity, change to /10 for less opacity, /40 for more */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
