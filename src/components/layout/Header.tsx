import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Manas", path: "/manas" },
    { name: "Fit", path: "/fit" },
    { name: "Progress", path: "/progress" },
  ];

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You've been successfully signed out."
    });
    navigate("/");
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="mx-4 mt-4">
        <nav className="glass-card rounded-2xl px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <img 
                src="/logo.png" 
                alt="Sahaara Logo" 
                className="w-10 h-10 object-contain shadow-soft group-hover:shadow-glow transition-shadow duration-300"
              />
              <span className="text-lg font-bold text-foreground hidden sm:block">
                Sahaara Manas & Fit
              </span>
              <span className="text-lg font-bold text-foreground sm:hidden">
                Sahaara
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              {navLinks.map((link) => (
                <Link key={link.path} to={link.path}>
                  <Button
                    variant={location.pathname === link.path ? "default" : "ghost"}
                    size="sm"
                  >
                    {link.name}
                  </Button>
                </Link>
              ))}
            </div>

            {/* CTA Button */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <Link to="/dashboard">
                    <Button variant="accent" size="default">
                      My Space
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={handleSignOut}
                    title="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <Link to="/auth">
                  <Button variant="accent" size="default">
                    Get Started
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden mt-4 pt-4 border-t border-border"
            >
              <div className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <Link key={link.path} to={link.path} onClick={() => setIsMenuOpen(false)}>
                    <Button
                      variant={location.pathname === link.path ? "default" : "ghost"}
                      className="w-full justify-start"
                    >
                      {link.name}
                    </Button>
                  </Link>
                ))}
                {user ? (
                  <>
                    <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="accent" className="w-full mt-2">
                        My Space
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        handleSignOut();
                        setIsMenuOpen(false);
                      }}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="accent" className="w-full mt-2">
                      Get Started
                    </Button>
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </nav>
      </div>
    </motion.header>
  );
};

export default Header;
