import React from 'react'
import '../Style/Footer.css'
import footerLogo from '../assets/nav-logo.png' 

const Footer = () => {
  return (
    <div className='footer'>
      <div className="footer-upper">
        <div className='footer-content'>
          <h3>Smart Attendance System</h3>
          <p>Streamlining attendance management for modern institutions.</p>
          <p>Contact: info@smartattendance.com</p>
          <p>Phone: +1 (555) 123-4567</p>

          <img src={footerLogo} alt="" />
        </div>
        <div className="footer-form">
          <h3>Get in Touch</h3>
          <form>
            <div>
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                className="form-input"
                placeholder="Your Name"
                required
              />
            </div>
            <div>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-input"
                placeholder="Your Email"
                required
              />
            </div>
            <div>
              <label htmlFor="query">Query</label>
              <textarea
                id="query"
                name="query"
                rows="4"
                className="form-textarea"
                placeholder="Your Message"
                required
              ></textarea>
            </div>
            <button
              type="submit"
              className="form-button"
            >
              Submit
            </button>
          </form>
        </div>
      </div>
      <div className="footer-lower">
        <p>© 2025 Smart Attendance System. All rights reserved.</p>
        <p>Developed by Sahibjot Singh</p>
      </div>
    </div>
  )
}

export default Footer