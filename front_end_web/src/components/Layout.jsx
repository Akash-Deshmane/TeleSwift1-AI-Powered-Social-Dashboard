import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, Bookmark, BarChart2, User, LogOut } from 'lucide-react';
import axios from 'axios';
import { Config } from '../config';
import { useState } from 'react';

export default function Layout() {
  const navigate = useNavigate();
  const phone = localStorage.getItem('phone_stored');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await axios.post(`${Config.apiBaseUrl}/auth/logout/${phone}`);
    } catch (e) {
      console.error(e);
    } finally {
      localStorage.removeItem('phone_stored');
      navigate('/login', { replace: true });
    }
  };

  const navItems = [
    { path: '/feed', icon: Home, label: 'Feed' },
    { path: '/history', icon: Bookmark, label: 'History' },
    { path: '/analytics', icon: BarChart2, label: 'Analytics' },
    { path: '/profile', icon: User, label: 'Profile' }
  ];

  return (
    <div className="layout-container">
      <nav className="sidebar glass-panel">
        <div className="sidebar-header">
          <h2 className="title" style={{ fontSize: '1.5rem', margin: 0 }}>TeleSwift</h2>
        </div>
        
        <div className="nav-links">
          {navItems.map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div className="sidebar-footer">
          <button onClick={handleLogout} disabled={isLoggingOut} className="nav-item logout-btn">
            <LogOut size={20} />
            <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
          </button>
        </div>
      </nav>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
