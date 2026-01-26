import { Link } from "react-router-dom";
import { Heart, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img 
                src="/logo.png" 
                alt="Sahaara Gyaan Logo" 
                className="w-10 h-10 object-contain"
              />
              <span className="text-lg font-bold text-secondary-foreground leading-tight">
                Sahaara Gyaan
              </span>
            </Link>
            <p className="text-secondary-foreground/80 text-sm leading-relaxed mb-4">
              Bridging the education gap across India with inclusive, accessible, 
              and multilingual learning experiences for every student.
            </p>
            <div className="flex items-center gap-2 text-sm text-secondary-foreground/70">
              <MapPin className="w-4 h-4" />
              <span>Serving all of India</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-secondary-foreground mb-4">Learn</h4>
            <ul className="space-y-2">
              {["Adaptive Learning", "Offline Mode", "Language Options", "Study Materials"].map((item) => (
                <li key={item}>
                  <Link 
                    to="/learn" 
                    className="text-sm text-secondary-foreground/70 hover:text-secondary-foreground transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Accessibility */}
          <div>
            <h4 className="font-bold text-secondary-foreground mb-4">Accessibility</h4>
            <ul className="space-y-2">
              {[
                "Screen Reader Support",
                "High Contrast Mode",
                "Font Size Controls",
                "Assistive Tools"
              ].map((item) => (
                <li key={item}>
                  <Link 
                    to="/accessibility" 
                    className="text-sm text-secondary-foreground/70 hover:text-secondary-foreground transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h4 className="font-bold text-secondary-foreground mb-4">Support</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-secondary-foreground/70">
                <Mail className="w-4 h-4" />
                <a href="mailto:support@sahaaragyaan.org" className="hover:text-secondary-foreground transition-colors">
                  support@sahaaragyaan.org
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-secondary-foreground/70">
                <Phone className="w-4 h-4" />
                <a href="tel:1800-XXX-XXXX" className="hover:text-secondary-foreground transition-colors">
                  1800-XXX-XXXX (Toll Free)
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-secondary-foreground/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-secondary-foreground/60">
            <p>© 2026 Sahaara Gyaan. Education is a right, not a privilege.</p>
            <div className="flex items-center gap-4">
              <Link to="/privacy" className="hover:text-secondary-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-secondary-foreground transition-colors">
                Terms of Use
              </Link>
              <Link to="/accessibility" className="hover:text-secondary-foreground transition-colors">
                Accessibility Statement
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}