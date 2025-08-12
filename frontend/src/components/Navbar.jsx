// frontend/src/components/Navbar.js
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, isAdmin } = useContext(AuthContext);

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="logo">IoT Dashboard</Link>
        
        {user ? (
          <div className="nav-right">
            <span>Welcome, {user.username}</span>
            {isAdmin() && (
              <Link to="/admin/devices">Device Management</Link>
            )}
            <button onClick={logout}>Logout</button>
          </div>
        ) : (
          <div className="auth-links">
            <Link to="/login">Login</Link>
            <span> | </span>
            <Link to="/register">Register</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;