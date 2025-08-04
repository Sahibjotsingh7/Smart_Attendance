import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Style/Navbar.css';
import navLogo from '../assets/nav-logo.png';
import Login from './Login';
import AdminTask from './AdminTask';

const Navbar = ({ setIsAuthenticated }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loggedIn = localStorage.getItem('isAdminLoggedIn') === 'true';
    const storedAdminData = localStorage.getItem('adminData');
    if (loggedIn && storedAdminData) {
      setIsAdminLoggedIn(true);
      setAdminData(JSON.parse(storedAdminData));
      setIsAuthenticated(true);
      navigate('/admin');
    }
  }, [navigate, setIsAuthenticated]);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsAdminLoggedIn(false);
    setAdminData(null);
    localStorage.removeItem('adminData');
    localStorage.removeItem('isAdminLoggedIn');
    navigate('/');
  };

  if (isAdminLoggedIn && adminData) {
    return <AdminTask adminData={adminData} handleLogout={handleLogout} />;
  }

  return (
    <div>
      <nav className="navbar">
        <img src={navLogo} alt="Logo" className="nav-logo" />
        <ul className="nav-links">
          <li><a href="/">Home</a></li>
          <li><a href="/#about">About</a></li>
          <li><a href="/#contact">Contact</a></li>
        </ul>
        <button className="admin-login-btn" onClick={toggleModal}>
          Admin Login
        </button>
      </nav>
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <button className="modal-close" onClick={toggleModal}>
              &times;
            </button>
            <Login setIsAuthenticated={setIsAuthenticated} closeModal={toggleModal} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;