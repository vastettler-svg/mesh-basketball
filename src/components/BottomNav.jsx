import { NavLink } from "react-router-dom";
import {
  House,
  Trophy,
  CalendarDays,
  Menu,
} from "lucide-react";

function ScoreboardIcon({ size = 22, strokeWidth = 2.1 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2.75" y="5.25" width="18.5" height="13.5" rx="2.25" />
      <path d="M12 5.25v13.5" />
      <path d="M7.4 10.1 8.8 9.2v5.6" />
      <path d="M15.1 10.1c.35-.6.9-.9 1.55-.9.95 0 1.65.62 1.65 1.48 0 .72-.38 1.18-1.08 1.78l-2.12 1.84h3.2" />
    </svg>
  );
}

function CoachHeadsetIcon({ size = 22, strokeWidth = 2.1 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4.5 13v-2a7.5 7.5 0 0 1 15 0v2" />
      <path d="M4.5 12.5H6a1.5 1.5 0 0 1 1.5 1.5v3A1.5 1.5 0 0 1 6 18.5H5.5a1 1 0 0 1-1-1v-5z" />
      <path d="M19.5 12.5H18A1.5 1.5 0 0 0 16.5 14v3A1.5 1.5 0 0 0 18 18.5h.5a1 1 0 0 0 1-1v-5z" />
      <path d="M19.5 17.25v.5A2.25 2.25 0 0 1 17.25 20H14.5" />
      <path d="M14.5 20h-2" />
    </svg>
  );
}

const navigationItems = [
  {
    label: "Home",
    path: "/",
    icon: House,
    end: true,
  },
  {
    label: "Scores",
    path: "/scores",
    icon: ScoreboardIcon,
  },
  {
    label: "Standings",
    path: "/standings",
    icon: Trophy,
  },
  {
    label: "Events",
    path: "/events",
    icon: CalendarDays,
  },
  {
    label: "Stats",
    path: "/stats",
    icon: CoachHeadsetIcon,
  },
  {
    label: "More",
    path: "/more",
    icon: Menu,
  },
];

function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      <div className="bottom-nav-inner">
        {navigationItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `bottom-nav-link${isActive ? " active" : ""}`
              }
            >
              <span className="bottom-nav-icon">
                <Icon size={22} strokeWidth={2.1} />
              </span>

              <span className="bottom-nav-label">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
