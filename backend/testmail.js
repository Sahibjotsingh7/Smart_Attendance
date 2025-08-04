const nodemailer = require('nodemailer'); 

const  email = "smart.attendancesys8@gmail.com"
const pass  =  'wdnw odzf nual mcpd';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: email,
        pass: pass
    }
})

const sendMail = async (to, subject, text) => {
    try{
        const info = await transporter.sendMail({
        from: email,
        to: to,
        subject: subject,
        text: text
     })
      console.log('Email sent:', info.response);
      }
     catch (error) {
        console.error('Error sending email:', error);
        throw error; // Re-throw the error for further handling if needed 
    }
}
     

sendMail("sahibjot.benipal2003@gmail.com", 'Test Email', 'This is a test email from Node.js using Nodemailer.');