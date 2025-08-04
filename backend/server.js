const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const ExcelJS = require('exceljs');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'your_jwt_secret_key';
const ADMIN_CREDENTIALS = {
  email: 'admin.attendance@gmail.com',
  password: 'secure123@PASS'
};
const EMAIL_USER = "smart.attendancesys8@gmail.com"
const EMAIL_PASS = "jzzn xrbv eldr keop"
const FACE_API_KEY = '3he5tvG6zwO_04evLbtOvgrFuz5IOu7B'
const FACE_API_SECRET = 'wzHfVDbQE7n_O1wFezt8Lwot68NALy6_'
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/employeeimages', express.static(path.join(__dirname, 'employeeimages')));

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    console.log(`Received file: ${file.fieldname}, mimetype: ${file.mimetype}`);
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG or PNG images are allowed'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit per file
});

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

// Helper function to send email
const sendEmail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: EMAIL_USER,
      to,
      subject,
      text
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

// Helper function to read JSON files
const readJsonFile = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    if (!data.trim()) {
      return [];
    }
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
};

// Helper function to write JSON files
const writeJsonFile = async (filePath, data) => {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing to ${filePath}:`, error);
  }
};

// Helper function to log route activity
const logActivity = async (route, data) => {
  const logFile = 'log.json';
  const logs = await readJsonFile(logFile);
  logs.push({
    timestamp: new Date().toISOString(),
    route,
    data
  });
  await writeJsonFile(logFile, logs);
};

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Helper function to compare faces using Face++
const compareFaces = async (image1Buffer, image2Buffer, image1Name = 'image1.jpg', image2Name = 'image2.jpg') => {
  const form = new FormData();
  form.append('api_key', FACE_API_KEY);
  form.append('api_secret', FACE_API_SECRET);
  form.append('image_file1', image1Buffer, { filename: image1Name });
  form.append('image_file2', image2Buffer, { filename: image2Name });
  try {
    const start = Date.now();
    const response = await axios.post('https://api-us.faceplusplus.com/facepp/v3/compare', form, {
      headers: form.getHeaders(),
      timeout: 10000 // 10-second timeout
    });
    console.log(`Face++ API response received in ${Date.now() - start}ms`);
    return response.data;
  } catch (error) {
    console.error('Error in Face++ comparison:', error.response?.data || error.message);
    throw error;
  }
};

// Route 1: Admin Login
app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }

  if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
    const adminData = {
      name: 'Admin User',
      email: ADMIN_CREDENTIALS.email
    };
    const token = jwt.sign(adminData, JWT_SECRET, { expiresIn: '12h' });
    adminData.token = token;
    await logActivity('/api/admin/login', { email, status: 'success' });
    res.status(200).json({ message: 'Login successful', adminData });
  } else {
    await logActivity('/api/admin/login', { email, status: 'failed' });
    res.status(401).json({ error: 'Invalid email or password' });
  }
});

// Route 2: Check-in/Check-out with face recognition
app.post('/api/attendance', upload.single('image'), async (req, res) => {
  console.log('Received /api/attendance request:', new Date().toISOString());
  const { taskType } = req.body;
  if (!taskType || !req.file) {
    console.log('Missing taskType or image');
    return res.status(400).json({ error: 'Missing taskType or image' });
  }
  if (!['checkin', 'checkout'].includes(taskType)) {
    console.log('Invalid task type');
    return res.status(400).json({ error: 'Invalid task type' });
  }

  const inputImageBuffer = req.file.buffer;
  console.log(`Input image size: ${inputImageBuffer.length} bytes`);

  // Read JSON files
  console.log('Reading JSON files...');
  const startJson = Date.now();
  const todayData = await readJsonFile('todaydata.json');
  const users = await readJsonFile('user.json');
  console.log(`JSON files read in ${Date.now() - startJson}ms`);

  // Compare input image against all employee images
  console.log('Comparing faces against employee images...');
  let bestMatch = null;
  let highestConfidence = 0;
  let matchedEmployee = null;

  try {
    const employeeImagesPath = path.join(__dirname, 'employeeimages');
    const imageFiles = await fs.readdir(employeeImagesPath);
    const jpegFiles = imageFiles.filter(file => file.endsWith('.jpg') || file.endsWith('.jpeg'));

    for (const imageFile of jpegFiles) {
      const employeeImagePath = path.join(employeeImagesPath, imageFile);
      const employeeImageBuffer = await fs.readFile(employeeImagePath);
      console.log(`Comparing with ${imageFile}, size: ${employeeImageBuffer.length} bytes`);

      const response = await compareFaces(inputImageBuffer, employeeImageBuffer, 'input.jpg', imageFile);
      const { confidence, thresholds } = response;

      if (!confidence) {
        console.log(`No faces detected in ${imageFile} or input image`);
        continue;
      }

      if (confidence > highestConfidence && confidence > thresholds['1e-5']) {
        highestConfidence = confidence;
        bestMatch = { imageFile, confidence };
        const userId = imageFile.replace(/\.(jpg|jpeg)$/, '');
        matchedEmployee = users.find(u => u.id === userId);
      }
    }
  } catch (error) {
    console.error('Error comparing faces:', error.response?.data || error.message);
    return res.status(500).json({ error: `Face comparison failed: ${error.response?.data?.error_message || error.message}` });
  }

  if (!bestMatch || !matchedEmployee) {
    console.log('Employee not recognized');
    return res.status(404).json({ error: 'Employee not recognized' });
  }

  console.log(`Best match: ${bestMatch.imageFile}, Confidence: ${bestMatch.confidence.toFixed(2)}%`);

  // Process check-in or check-out
  if (taskType === 'checkin') {
    console.log('Processing check-in...');
    const existingRecord = todayData.find(record => record.employeeId === matchedEmployee.id && record.checkInTime && !record.checkOutTime);
    if (existingRecord) {
      console.log('Employee already checked in');
      return res.status(400).json({ error: 'Employee already checked in' });
    }

    const checkInTime = new Date().toISOString();
    todayData.push({
      employeeId: matchedEmployee.id,
      name: matchedEmployee.name,
      email: matchedEmployee.email,
      checkInTime,
      checkOutTime: null,
      workingHours: null
    });
    await writeJsonFile('todaydata.json', todayData);
    await logActivity('/api/attendance', { employeeId: matchedEmployee.id, taskType, checkInTime });
    
  } else {
    console.log('Processing check-out...');
    const record = todayData.find(r => r.employeeId === matchedEmployee.id && r.checkInTime && !r.checkOutTime);
    if (!record) {
      console.log('No active check-in found');
      return res.status(400).json({ error: 'No active check-in found for checkout' });
    }

    const checkOutTime = new Date().toISOString();
    const checkInDate = new Date(record.checkInTime);
    const checkOutDate = new Date(checkOutTime);
    const workingHours = ((checkOutDate - checkInDate) / (1000 * 60 * 60)).toFixed(2);

    record.checkOutTime = checkOutTime;
    record.workingHours = workingHours;
    await writeJsonFile('todaydata.json', todayData);
    await logActivity('/api/attendance', { employeeId: matchedEmployee.id, taskType, checkOutTime, workingHours });
    console.log('Check-out successful');
    res.status(200).json({ 
      message: 'Check-out successful', 
      checkOutTime, 
      workingHours, 
      employee: matchedEmployee.name, 
      confidence: `${bestMatch.confidence.toFixed(2)}%`
    });
  }
});

// Route 3: Get today's attendance records (protected)
app.get('/api/attendance/today', verifyToken, async (req, res) => {
  const todayData = await readJsonFile('todaydata.json');
  await logActivity('/api/attendance/today', { recordCount: todayData.length });
  res.status(200).json(todayData);
});

// Route 4: Register new employee (protected)
app.post('/api/employee/register', verifyToken, upload.single('image'), async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email || !req.file) {
    return res.status(400).json({ error: 'Missing name, email, or image' });
  }

  const users = await readJsonFile('user.json');
  const id = uuidv4();
  const imageName = `${id}.jpg`;
  const imagePath = path.join(__dirname, 'employeeimages', imageName);

  // Save image
  try {
    await fs.writeFile(imagePath, req.file.buffer);
    console.log(`Image saved: ${imagePath}`);
  } catch (error) {
    console.error('Error saving image:', error);
    return res.status(500).json({ error: 'Failed to save image' });
  }

  // Verify face presence using Face++
  try {
    const form = new FormData();
    form.append('api_key', FACE_API_KEY);
    form.append('api_secret', FACE_API_SECRET);
    form.append('image_file', req.file.buffer, { filename: imageName });
    const response = await axios.post('https://api-us.faceplusplus.com/facepp/v3/detect', form, {
      headers: form.getHeaders(),
      timeout: 10000
    });
    if (!response.data.faces || response.data.faces.length === 0) {
      return res.status(400).json({ error: 'No face detected in the provided image' });
    }
  } catch (error) {
    console.error('Error detecting face:', error.response?.data || error.message);
    return res.status(500).json({ error: `Face detection failed: ${error.response?.data?.error_message || error.message}` });
  }

  users.push({
    id,
    name,
    email,
    imageUrl: `/employeeimages/${imageName}`
  });
  await writeJsonFile('user.json', users);
  await logActivity('/api/employee/register', { id, name, email, imageUrl: `/employeeimages/${imageName}` });
  res.status(200).json({ message: 'Employee registered successfully', name });
});

// Route 5: Generate Excel spreadsheet (protected)
app.get('/api/attendance/spreadsheet', verifyToken, async (req, res) => {
  const todayData = await readJsonFile('todaydata.json');
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Attendance');

  worksheet.columns = [
    { header: 'ID', key: 'employeeId', width: 36 },
    { header: 'Name', key: 'name', width: 20 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Check-In', key: 'checkInTime', width: 25 },
    { header: 'Check-Out', key: 'checkOutTime', width: 25 },
    { header: 'Working Hours', key: 'workingHours', width: 15 }
  ];

  todayData.forEach(record => {
    worksheet.addRow(record);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=attendance_${new Date().toISOString().split('T')[0]}.xlsx`);
  await logActivity('/api/attendance/spreadsheet', { recordCount: todayData.length });
  res.send(buffer);
});



// Default route
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server started at http://localhost:${PORT}`);
});