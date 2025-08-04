import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import '../Style/AdminTask.css';

const AdminTask = ({ adminData, handleLogout }) => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [employeeData, setEmployeeData] = useState({ name: '', email: '', image: null });
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Fetch today's attendance records
  const fetchAttendanceRecords = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/attendance/today', {
        headers: {
          'Authorization': `Bearer ${adminData.token}`,
        },
      });
      if (response.status === 401) {
        toast.error('Session expired. Please log in again.');
        handleLogout();
        return;
      }
      const data = await response.json();
      setAttendanceRecords(data);
    } catch (err) {
      toast.error('Error fetching attendance records');
      console.error('Error fetching attendance records:', err);
    }
  };

  // Start camera for employee registration
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      toast.error('Error accessing camera');
      console.error('Error accessing camera:', err);
    }
  };

  // Capture image for employee registration
  const captureImage = () => {
    if (!canvasRef.current || !videoRef.current) {
      toast.error('Camera not initialized');
      console.error('Camera not initialized: canvas or video ref missing');
      return;
    }
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        setEmployeeData({ ...employeeData, image: blob });
      },
      'image/jpeg',
      0.9
    );
  };

  // Register new employee
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!employeeData.name || !employeeData.email || !employeeData.image) {
      toast.error('Please provide name, email, and capture an image');
      console.error('Missing fields:', {
        name: employeeData.name,
        email: employeeData.email,
        image: employeeData.image ? 'Present' : 'Missing',
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', employeeData.name);
      formData.append('email', employeeData.email);
      formData.append('image', employeeData.image, 'employee.jpg');

      console.log('Sending registration request:', {
        name: employeeData.name,
        email: employeeData.email,
        imageSize: employeeData.image.size,
      });

      const response = await fetch('http://localhost:3000/api/employee/register', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminData.token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(`Employee registered successfully: Name: ${data.name}`);
        console.log('Registration response:', data);
        setEmployeeData({ name: '', email: '', image: null });
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
      } else {
        toast.error(data.error || 'Registration failed');
        console.error('Registration error:', data.error);
      }
    } catch (err) {
      toast.error('Error connecting to server');
      console.error('Error in handleRegister:', err);
    }
  };

  // Generate spreadsheet
  const handleGenerateSpreadsheet = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/attendance/spreadsheet', {
        headers: {
          'Authorization': `Bearer ${adminData.token}`,
        },
      });
      if (response.status === 401) {
        toast.error('Session expired. Please log in again.');
        handleLogout();
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Spreadsheet downloaded successfully');
    } catch (err) {
      toast.error('Error generating spreadsheet');
      console.error('Error generating spreadsheet:', err);
    }
  };

  useEffect(() => {
    fetchAttendanceRecords();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="admin-task" style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '2.5rem' }}>Welcome, {adminData.name}!</h1>
        <button
          onClick={handleLogout}
          style={{
            background: '#f44336',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Logout
        </button>
      </div>

      {/* Today's Attendance Records */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '20px' }}>Today's Attendance Records</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <thead>
            <tr style={{ background: '#f4f4f4' }}>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>ID</th>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>Name</th>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>Email</th>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>Check-In</th>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>Check-Out</th>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>Working Hours</th>
            </tr>
          </thead>
          <tbody>
            {attendanceRecords.map((record, index) => (
              <tr key={index}>
                <td style={{ border: '1px solid #ddd', padding: '12px' }}>{record.employeeId}</td>
                <td style={{ border: '1px solid #ddd', padding: '12px' }}>{record.name}</td>
                <td style={{ border: '1px solid #ddd', padding: '12px' }}>{record.email || '-'}</td>
                <td style={{ border: '1px solid #ddd', padding: '12px' }}>{record.checkInTime || '-'}</td>
                <td style={{ border: '1px solid #ddd', padding: '12px' }}>{record.checkOutTime || '-'}</td>
                <td style={{ border: '1px solid #ddd', padding: '12px' }}>{record.workingHours || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          onClick={handleGenerateSpreadsheet}
          style={{
            background: '#4CAF50',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Generate Spreadsheet
        </button>
      </section>

      {/* Register New Employee */}
      <section>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '20px' }}>Register New Employee</h2>
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input
            type="text"
            placeholder="Employee Name"
            value={employeeData.name}
            onChange={(e) => setEmployeeData({ ...employeeData, name: e.target.value })}
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
          <input
            type="email"
            placeholder="Employee Email"
            value={employeeData.email}
            onChange={(e) => setEmployeeData({ ...employeeData, email: e.target.value })}
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
          <div>
            <video ref={videoRef} autoPlay style={{ width: '100%', maxHeight: '300px', display: stream ? 'block' : 'none' }} />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            {employeeData.image && (
              <img
                src={URL.createObjectURL(employeeData.image)}
                alt="Captured"
                style={{ width: '100%', maxHeight: '300px', marginTop: '10px' }}
              />
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={startCamera}
              style={{
                background: '#2196F3',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Start Camera
            </button>
            <button
              type="button"
              onClick={captureImage}
              style={{
                background: '#2196F3',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Capture Image
            </button>
            <button
              type="submit"
              style={{
                background: '#4CAF50',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Register Employee
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default AdminTask;