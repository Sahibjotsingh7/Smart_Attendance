import React from 'react'
import '../Style/About.css'
import { SiTicktick } from "react-icons/si";
import vectorImage from '../assets/zp-empower-workforce.png' 

const About = () => {
  return (
    <div className='about'>
         <div className='about-text'>
            <h1>Empower Your Workforce</h1>
            <p>Our attendance system is designed to simplify the process of tracking employee attendance, ensuring accuracy and efficiency. With features like facial recognition and real-time updates, managing attendance has never been easier.</p>
             <ul>
                <li><SiTicktick className='icon'/>Facial Recognition Available</li>
                <li><SiTicktick className='icon'/>Effortless Attendance Tracking</li>
                <li><SiTicktick className='icon'/>Real-time Updates</li>
                <li><SiTicktick className='icon'/>User-friendly Interface</li>
                <li><SiTicktick className='icon'/>Secure and Reliable</li>
             </ul>
         </div>
         <div className="aboutvector">
            <img src={vectorImage} alt="About Vector" />
         </div>
    </div>
  )
}

export default About