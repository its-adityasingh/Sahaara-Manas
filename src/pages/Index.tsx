import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import ModulesSection from "@/components/home/ModulesSection";
import WhySahaaraSection from "@/components/home/WhySahaaraSection";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <ModulesSection />
        <WhySahaaraSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
