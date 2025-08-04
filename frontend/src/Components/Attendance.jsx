import React, { useState, useEffect, useRef } from 'react';
import vector1 from '../assets/2462340.jpg';
import vector2 from '../assets/56401.jpg';
import '../Style/Attendance.css';
import { toast } from 'react-toastify';

const Attendance = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskType, setTaskType] = useState('');
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const openModal = async (type) => {
    setTaskType(type);
    setIsModalOpen(true);
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

  const closeModal = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsModalOpen(false);
    setTaskType('');
  };

  const handleAttendance = async () => {
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

    // Convert canvas to Blob for file upload
    try {
      const blob = await new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9);
      });

      // Create FormData for multipart/form-data request
      const formData = new FormData();
      formData.append('taskType', taskType);
      formData.append('image', blob, 'captured.jpg');

      console.log('Sending attendance request with taskType:', taskType);
      console.log('Image size:', blob.size, 'bytes');

      const response = await fetch('http://localhost:3000/api/attendance', {
        method: 'POST',
        body: formData,
        // Note: Do NOT set Content-Type header manually; fetch sets multipart/form-data automatically
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(`${taskType} successful: ${data.employee} (${data.confidence})`);
        console.log('Attendance response:', data);
        closeModal();
      } else {
        toast.error(data.error || 'Attendance marking failed');
        console.error('Attendance error:', data.error);
      }
    } catch (err) {
      toast.error('Error connecting to server');
      console.error('Error in handleAttendance:', err);
    }
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="attendance">
      <h1 style={{ fontSize: '4rem', padding: '30px 0px' }}>Mark Your Attendance Effortlessly</h1>
      <div className="inner-attendance">
        <div className="checkin" onClick={() => openModal('checkin')}>
          <img src={vector1} alt="Check In" />
          <h1>Check In</h1>
        </div>
        <div className="checkout" onClick={() => openModal('checkout')}>
          <img src={vector2} alt="Check Out" />
          <h1>Check Out</h1>
        </div>
      </div>

      {isModalOpen && (
        <div
          className="modal"
          style={{
            position: 'fixed',
            top: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              textAlign: 'center',
              maxWidth: '500px',
              width: '90%',
            }}
          >
            <h2>{taskType === 'checkin' ? 'Check In' : 'Check Out'}</h2>
            <video ref={videoRef} autoPlay style={{ width: '100%', maxHeight: '300px' }} />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <div style={{ marginTop: '20px' }}>
              <button
                onClick={handleAttendance}
                style={{
                  background: '#4CAF50',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '4px',
                  marginRight: '10px',
                  cursor: 'pointer',
                }}
              >
                {taskType === 'checkin' ? 'Confirm Check In' : 'Confirm Check Out'}
              </button>
              <button
                onClick={closeModal}
                style={{
                  background: '#f44336',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;