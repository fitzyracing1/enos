import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Home, BarChart3, LogIn, LogOut, Menu, X } from "lucide-react";

export default function Layout({ children }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isHome = location.pathname === "/" || location.pathname === "/Home";
  const navLinks = [
    { label: "Home", path: "/", icon: Home },
    { label: "My Contributions", path: "/MyContributions", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled || !isHome ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-lg font-bold text-white">E</span>
              </div>
              <span className={`text-xl font-bold transition-colors ${scrolled || !isHome ? "text-gray-900" : "text-white"}`}>
                Enos
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-2">
              {navLinks.map(({ label, path }) => (
                <Link
                  key={path}
                  to={path}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    location.pathname === path
                      ? "bg-indigo-100 text-indigo-700"
                      : scrolled || !isHome
                      ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {label}
                </Link>
              ))}

              {user ? (
                <button
                  onClick={() => base44.auth.logout()}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    scrolled || !isHome ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100" : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={() => base44.auth.redirectToLogin(window.location.href)}
                  className="flex items-center gap-2 px-5 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors shadow-md"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
              )}
            </nav>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`md:hidden p-2 rounded-lg transition-colors ${scrolled || !isHome ? "text-gray-600" : "text-white"}`}
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-2 shadow-lg">
            {navLinks.map(({ label, path, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Icon className="w-5 h-5 text-indigo-600" />
                {label}
              </Link>
            ))}
            {user ? (
              <button
                onClick={() => base44.auth.logout()}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 w-full transition-colors"
              >
                <LogOut className="w-5 h-5 text-gray-400" />
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => base44.auth.redirectToLogin(window.location.href)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-600 text-white w-full font-medium"
              >
                <LogIn className="w-5 h-5" />
                Sign In
              </button>
            )}
          </div>
        )}
      </header>

      {/* Page content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-24">
        <div className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <span className="text-lg font-bold">E</span>
              </div>
              <span className="text-xl font-bold">Enos</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Building stronger communities through collective action. $1 at a time.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide text-gray-300">Links</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/MyContributions" className="hover:text-white transition-colors">My Contributions</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide text-gray-300">Contact</h4>
            <p className="text-gray-400 text-sm">hello@enos.community</p>
            <p className="text-gray-500 text-xs mt-4">
              All payments held in escrow. Full refund if 60% goal not reached.
            </p>
          </div>
        </div>
        <div className="border-t border-gray-800 px-6 py-6 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} Enos. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
