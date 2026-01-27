import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Shield, Users, Leaf, ArrowRight } from "lucide-react";

const features = [
  {
    icon: Heart,
    title: "Holistic Approach",
    description: "Mind and body aren't separate. We help you nurture both together.",
  },
  {
    icon: Users,
    title: "Made for Youth",
    description: "Designed for students and young adults facing real-life challenges.",
  },
  {
    icon: Leaf,
    title: "Gentle & Non-Clinical",
    description: "No medical jargon or overwhelming data. Just supportive, friendly guidance.",
  },
  {
    icon: Shield,
    title: "Safe & Private",
    description: "Your data stays yours. We prioritize your privacy and trust.",
  },
];

const WhySahaaraSection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full bg-calm/10 blur-3xl"
          style={{ top: "20%", right: "-10%" }}
          animate={{ x: [0, 30, 0], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Why Sahaara Manas & Fit?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Life as a young adult is exciting but also challenging. Between classes, 
              social pressures, and figuring out who you are, it's a lot to handle.
            </p>
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
              Sahaara Manas & Fit is here as your supportive companion. We combine mental wellness 
              practices with practical fitness and nutrition, all tailored to your 
              lifestyle, budget, and real needs.
            </p>

            <Link to="/auth">
              <Button variant="accent" size="lg" className="group">
                Start Your Journey
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>

          {/* Right Content - Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="glass-card rounded-2xl p-6 hover:shadow-glow transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <IconComponent className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhySahaaraSection;
