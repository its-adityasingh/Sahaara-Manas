import { Link } from "react-router-dom";
import { Shield, Mail, Instagram, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-muted/50 border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img 
                src="/logo.png" 
                alt="Sahaara Logo" 
                className="w-10 h-10 object-contain"
              />
              <span className="text-xl font-bold text-foreground">
                Sahaara Manas & Fit
              </span>
            </Link>
            <p className="text-muted-foreground mb-4 max-w-sm">
              Your space to feel better, move better, and live better. 
              Designed with care for young minds and bodies.
            </p>
            <p className="text-sm text-primary font-medium">
              You are not alone. Support is always here.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Explore</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/manas" className="text-muted-foreground hover:text-primary transition-colors">
                  Manas – Mind Care
                </Link>
              </li>
              <li>
                <Link to="/fit" className="text-muted-foreground hover:text-primary transition-colors">
                  Fit – Body Wellness
                </Link>
              </li>
              <li>
                <Link to="/progress" className="text-muted-foreground hover:text-primary transition-colors">
                  Balance Tracker
                </Link>
              </li>
            </ul>
          </div>

          {/* Trust & Safety */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Trust & Safety</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                  About Sahaara
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Privacy & Data Safety
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2024 Sahaara. Made with 💚 for your wellbeing.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
