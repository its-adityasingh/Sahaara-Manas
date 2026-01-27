import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-calm/20 via-peace/10 to-vitality/20" />
      
      {/* Animated elements */}
      <motion.div
        className="absolute w-64 h-64 rounded-full bg-calm/30 blur-3xl"
        style={{ top: "10%", left: "5%" }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 6, repeat: Infinity }}
      />
      <motion.div
        className="absolute w-48 h-48 rounded-full bg-peace/30 blur-3xl"
        style={{ bottom: "10%", right: "10%" }}
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 5, repeat: Infinity }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          {/* Icon */}
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/20 mb-8"
          >
            <Sparkles className="w-8 h-8 text-accent" />
          </motion.div>

          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Ready to take the first step?
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed">
            Join thousands of young adults who've discovered a kinder way to 
            take care of themselves. Your wellbeing journey starts here.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button variant="accent" size="xl" className="group">
                Create your wellbeing space
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" size="xl">
                Take a Quick Tour
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
