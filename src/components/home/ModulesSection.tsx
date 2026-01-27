import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Dumbbell, TrendingUp, ArrowRight, Sparkles, Heart, Zap } from "lucide-react";

const modules = [
  {
    id: "manas",
    title: "Manas",
    subtitle: "Mind Care",
    description: "Emotional support, mental clarity, and stress relief through guided exercises and journaling.",
    icon: Brain,
    variant: "peace" as const,
    features: ["Daily mood check-ins", "Breathing exercises", "Guided journaling"],
    path: "/manas",
    accentIcon: Sparkles,
  },
  {
    id: "fit",
    title: "Fit",
    subtitle: "Physical Wellness",
    description: "Fitness routines and nutrition made for real student life - practical and affordable.",
    icon: Dumbbell,
    variant: "vitality" as const,
    features: ["Quick workouts", "Budget-friendly meals", "Energy boosters"],
    path: "/fit",
    accentIcon: Zap,
  },
  {
    id: "balance",
    title: "Balance Tracker",
    subtitle: "Progress & Insights",
    description: "See how your mind and body improve together with simple, encouraging insights.",
    icon: TrendingUp,
    variant: "calm" as const,
    features: ["Visual progress", "Weekly insights", "Goal tracking"],
    path: "/progress",
    accentIcon: Heart,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
    },
  },
};

const ModulesSection = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Your Wellbeing Journey
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Three interconnected modules designed to help you thrive – 
            each one supporting the others.
          </p>
        </motion.div>

        {/* Module Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
        >
          {modules.map((module) => {
            const IconComponent = module.icon;
            const AccentIcon = module.accentIcon;
            
            return (
              <motion.div key={module.id} variants={cardVariants}>
                <Card
                  variant={module.variant}
                  className="h-full group hover:shadow-glow transition-all duration-500 hover:-translate-y-2"
                >
                  <CardContent className="p-8">
                    {/* Icon */}
                    <div className="relative mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-foreground/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <IconComponent className="w-8 h-8 text-foreground" />
                      </div>
                      <motion.div
                        className="absolute -top-2 -right-2"
                        animate={{ rotate: [0, 15, -15, 0] }}
                        transition={{ duration: 4, repeat: Infinity }}
                      >
                        <AccentIcon className="w-5 h-5 text-foreground/60" />
                      </motion.div>
                    </div>

                    {/* Title */}
                    <div className="mb-4">
                      <h3 className="text-2xl font-bold text-foreground mb-1">
                        {module.title}
                      </h3>
                      <p className="text-sm font-medium text-primary">
                        {module.subtitle}
                      </p>
                    </div>

                    {/* Description */}
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      {module.description}
                    </p>

                    {/* Features */}
                    <ul className="space-y-2 mb-6">
                      {module.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-foreground/80">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <Link to={module.path}>
                      <Button variant="outline" className="w-full group/btn">
                        Explore {module.title}
                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default ModulesSection;
