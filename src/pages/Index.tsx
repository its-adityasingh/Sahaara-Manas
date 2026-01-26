import { Layout } from "@/components/layout/Layout";
import { 
  HeroSection, 
  FeaturesSection
} from "@/components/home/HomeSections";

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <FeaturesSection />
    </Layout>
  );
};

export default Index;
