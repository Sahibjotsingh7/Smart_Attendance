import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Style/Login.css';
import { HiOutlineMail } from 'react-icons/hi';
import { CiLogin } from 'react-icons/ci';
import { RiLockPasswordFill } from 'react-icons/ri';
import { toast } from 'react-toastify';

const Login = ({ setIsAuthenticated, closeModal }) => {
  const [adminData, setAdminData] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adminData),
      });
      const data = await response.json();
      if (response.ok) {
        setIsAuthenticated(true);
        localStorage.setItem('adminData', JSON.stringify(data.adminData));
        localStorage.setItem('isAdminLoggedIn', 'true');
        closeModal();
        toast.success('Login successful');
        navigate('/admin');
      } else {
        toast.error(data.error || 'Login failed');
      }
    } catch (err) {
      toast.error('Error connecting to server');
    }
  };

  return (
    <div className="login">
      <h1>Admin Login</h1>
      <form onSubmit={handleLogin}>
        <label htmlFor="email">
          <HiOutlineMail /> Email
        </label>
        <input
          type="email"
          required
          placeholder="Enter Email"
          name="email"
          onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
        />
        <label htmlFor="password">
          <RiLockPasswordFill /> Password
        </label>
        <input
          type="password"
          required
          placeholder="Enter Password"
          name="password"
          onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
        />
        <button type="submit">
          <CiLogin /> Login
        </button>
      </form>
    </div>
  );
};

export default Login;