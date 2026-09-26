import { useAuth } from "../context/AuthContext.jsx";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: "🏠" },
  { key: "new-query", label: "New Query", icon: "🎙️" },
  { key: "history", label: "Query History", icon: "🕒" },
  { key: "database", label: "Database", icon: "🗄️" },
  { key: "analytics", label: "Analytics", icon: "📊" },
  { key: "settings", label: "Settings", icon: "⚙️" },
  { key: "help", label: "Help", icon: "❓" },
];

const Sidebar = ({
  active,
  onNavigate,
  darkMode,
  onToggleDarkMode,
  open,
  onToggleSidebar,
}) => {
  const { user } = useAuth();

  // Format user's name:
  // aman gupta  → Aman Gupta
  // AMAN GUPTA  → Aman Gupta
  // aMaN gUpTa  → Aman Gupta
  const formatName = (name) => {
    return name
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .map(
        (word) =>
          word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join(" ");
  };

  // Get logged-in user's name
  const userName = formatName(user?.name || "User");

  // Generate initials automatically
  const getInitials = (name) => {
    return name
      .trim()
      .split(/\s+/)
      .map((word) => word.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const userInitials = getInitials(userName);

  return (
    <aside className={`sidebar ${open ? "" : "sidebar-collapsed"}`}>

      {/* Brand */}
      <div className="sidebar-brand">
        <span className="brand-icon">🎙️</span>

        <div>
          <div className="brand-title">VoiceSQL AI</div>

          <div className="brand-subtitle">
            Talk · Query · Get Results
          </div>
        </div>

        <button
          className="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          aria-label="Close sidebar"
          title="Close sidebar"
        >
          ☰
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            className={`nav-item ${
              active === item.key ? "active" : ""
            }`}
            onClick={() => onNavigate(item.key)}
          >
            <span className="nav-icon">
              {item.icon}
            </span>

            {item.label}
          </button>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">

        {/* Logged-in User */}
        <div className="user-chip">

          <div className="user-avatar">
            {userInitials}
          </div>

          <div>
            <div className="user-name">
              {userName}
            </div>

            <div className="user-role"></div>
          </div>

        </div>

        {/* Dark Mode */}
        <div className="dark-toggle-row">

          <span>🌙 Dark Mode</span>

          <label className="switch">

            <input
              type="checkbox"
              checked={darkMode}
              onChange={onToggleDarkMode}
            />

            <span className="slider"></span>

          </label>

        </div>

      </div>

    </aside>
  );
};

export default Sidebar;