import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Navbar from './Components/Navbar';
import Home from './Components/Home';
import Attendance from './Components/Attendance';
import About from './Components/About';
import Footer from './Components/Footer';
import AdminTask from './Components/AdminTask';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminData, setAdminData] = useState(null);

  // Check localStorage for admin login status on mount
  useEffect(() => {
    const loggedIn = localStorage.getItem('isAdminLoggedIn') === 'true';
    const storedAdminData = localStorage.getItem('adminData');
    if (loggedIn && storedAdminData) {
      setIsAuthenticated(true);
      setAdminData(JSON.parse(storedAdminData));
    }
  }, []);

  // Handle logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminData(null);
    localStorage.removeItem('adminData');
    localStorage.removeItem('isAdminLoggedIn');
  };

  return (
    <Router>
      <>
        <ToastContainer position="top-right" autoClose={3000} />
        {/* Render Navbar only if not authenticated */}
        {!isAuthenticated && <Navbar setIsAuthenticated={setIsAuthenticated} />}
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <AdminTask adminData={adminData} handleLogout={handleLogout} />
              ) : (
                <>
                  <Home />
                  <Attendance />
                  <About />
                  <Footer />
                </>
              )
            }
          />
          <Route
            path="/admin"
            element={
              isAuthenticated ? (
                <AdminTask adminData={adminData} handleLogout={handleLogout} />
              ) : (
                <Navigate to="/" />
              )
            }
          />
        </Routes>
      </>
    </Router>
  );
}

export default App;