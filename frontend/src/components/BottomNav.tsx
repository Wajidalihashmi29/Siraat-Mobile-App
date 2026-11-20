import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, BookOpen, Clock, BookHeart, Settings } from "lucide-react";
import "./BottomNav.css";

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Home", path: "/", icon: Home },
  { id: "prayer", label: "Namaz", path: "/prayer", icon: Clock },
  { id: "quran", label: "Quran", path: "/quran", icon: BookOpen },
  { id: "azkar", label: "Azkar", path: "/azkar", icon: BookHeart },
  { id: "settings", label: "Settings", path: "/settings", icon: Settings },
];

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Hide bottom nav on specific fullscreen views or auth pages if desired
  const isAuthPage = location.pathname.startsWith("/login") ||
    location.pathname.startsWith("/register") ||
    location.pathname.startsWith("/reset-password") ||
    location.pathname.startsWith("/verify-email");

  if (isAuthPage) return null;

  return (
    <nav className="bottom-nav" aria-label="Bottom Navigation">
      {NAV_ITEMS.map(({ id, label, path, icon: Icon }) => {
        const isActive = path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
        return (
          <button
            key={id}
            type="button"
            className={`bottom-nav-item ${isActive ? "active" : ""}`}
            onClick={() => navigate(path)}
            aria-label={label}
          >
            <div className="bottom-nav-icon-wrapper">
              <Icon size={20} />
            </div>
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
