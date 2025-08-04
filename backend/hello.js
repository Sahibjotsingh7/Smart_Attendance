app.post('/api/employee/register', verifyToken, upload.single('image'), async (req, res) => {
  const { name, email } = req.body;
  const requestId = uuidv4(); // Unique ID for this request
  console.log(`Processing registration request ${requestId} for email: ${email}`);

  if (!name || !email || !req.file) {
    console.log(`Request ${requestId} failed: Missing name, email, or image`);
    return res.status(400).json({ error: 'Missing name, email, or image' });
  }

  // Check for duplicate request in cache
  const cacheKey = `register:${email}`;
  if (requestCache.has(cacheKey)) {
    console.log(`Request ${requestId} blocked: Duplicate request for ${email}`);
    return res.status(429).json({ error: 'Duplicate registration request in progress' });
  }
  requestCache.set(cacheKey, Date.now());
  setTimeout(() => requestCache.delete(cacheKey), 5000); // Clear cache after 5 seconds

  try {
    const users = await readJsonFile('user.json');
    // Check for duplicate email
    if (users.some(u => u.email === email)) {
      console.log(`Request ${requestId} failed: Email ${email} already exists`);
      requestCache.delete(cacheKey);
      return res.status(400).json({ error: 'Employee with this email already exists' });
    }

    const id = uuidv4();
    const imageName = `${id}.jpg`;
    const imagePath = path.join(__dirname, 'employeeimages', imageName);

    // Save image
    try {
      await fs.writeFile(imagePath, req.file.buffer);
      console.log(`Request ${requestId}: Image saved at ${imagePath}`);
    } catch (error) {
      console.error(`Request ${requestId}: Error saving image:`, error);
      requestCache.delete(cacheKey);
      return res.status(500).json({ error: `Failed to save image: ${error.message}` });
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
        console.log(`Request ${requestId}: No face detected in image`);
        requestCache.delete(cacheKey);
        return res.status(400).json({ error: 'No face detected in the provided image' });
      }
      console.log(`Request ${requestId}: Face detection successful`);
    } catch (error) {
      console.error(`Request ${requestId}: Face detection error:`, error.response?.data || error.message);
      requestCache.delete(cacheKey);
      return res.status(500).json({ error: `Face detection failed: ${error.response?.data?.error_message || error.message}` });
    }

    // Add new employee
    const newEmployee = {
      id,
      name,
      email,
      imageUrl: `/employeeimages/${imageName}`
    };
    users.push(newEmployee);
    try {
      await writeJsonFile('user.json', users);
      console.log(`Request ${requestId}: Employee ${email} added to user.json`);
    } catch (error) {
      console.error(`Request ${requestId}: Error writing to user.json:`, error);
      requestCache.delete(cacheKey);
      return res.status(500).json({ error: `Failed to save employee data: ${error.message}` });
    }

    // Log activity
    try {
      //await logActivity('/api/employee/register', { id, name, email, imageUrl: `/employeeimages/${imageName}` });
      console.log(`Request ${requestId}: Activity logged`);
    } catch (error) {
      console.warn(`Request ${requestId}: Failed to log activity:`, error);
    }

    // Send registration email
    const emailResult = await sendEmail(
      email,
      'Welcome to Smart Attendance System',
      `Hello ${name},\nYour ID: ${id}\n\nYou have been successfully registered in the Smart Attendance System.\n\nBest regards,\nSmart Attendance Team`
    );

    requestCache.delete(cacheKey);

    if (!emailResult.success) {
      console.warn(`Request ${requestId}: Failed to send registration email to ${email}: ${emailResult.error}`);
      return res.status(200).json({
        message: 'Employee registered successfully, but email could not be sent',
        id,
        emailError: emailResult.error
      });
    }

    console.log(`Request ${requestId}: Registration completed successfully for ${email}`);
    res.status(200).json({ message: 'Employee registered successfully', id });
  } catch (error) {
    console.error(`Request ${requestId}: Registration error:`, error);
    requestCache.delete(cacheKey);
    res.status(500).json({ error: `Server error during registration: ${error.message}` });
  }
});