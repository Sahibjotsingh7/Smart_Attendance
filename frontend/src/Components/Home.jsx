import React from 'react'
import { useState ,useEffect } from 'react'
import '../Style/Home.css'

import vectorImage1 from '../assets/3914790.jpg'
import vectorImage2 from '../assets/3915977.jpg'
const Home = () => {
   const [time, setTime] = useState(new Date().toLocaleTimeString('en-US', { hour12: true }));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', { hour12: true }));
    }, 1000);

    return () => clearInterval(timer);
  }, []); 

  const formattedTime = time.replace('am', 'AM').replace('pm', 'PM');

  return (
    <div className='home'>
       <div className='inner'>
            <div className="text">
                <h1>Streamline Attendance Effortlessly</h1>
                <p>Experience the future of attendance management with our innovative system. Say goodbye to manual processes and hello to efficiency.</p>
                <div className="time">
                     <span>{time}</span> 
                </div>
            </div>
            <div className="vector">
                <img src={vectorImage1} alt="Vector 1" />
            </div>
       </div>
    </div>
  )
}

export default Home
