const dotenv = require('dotenv');
require('dotenv').config();  // Move this line to the very top
dotenv.config({ path: './config/config.env' }); // Load environment variables from .env file
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors'); // Import cors
const User = require('./models/User'); // User model
// server/server.js
const connectDB = require('./config/db');
const path = require('path'); // Import path module for serving static files
const app = express(); 
dotenv.config({ path: './config/config.env' });

// Connect Database
connectDB();

// Init Middleware
app.use(express.json({ extended: false }));
app.use(cors());

// Define Routes
app.use('/api/users', require('./routes/users')); // Authentication routes (now in users.js)
app.use('/api/patients', require('./routes/patients')); // Patient-specific routes (including file uploads)
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/appointments', require('./routes/appointments')); // Your existing appointments routes
app.use('/api/medical-history', require('./routes/medicalHistory')); // Your existing medical history routes

// Serve static files from the 'uploads' directory
// This allows clients to download uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
require('dotenv').config(); // Load environment variables from .env file

// Import routes
const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');
const medicalHistoryRoutes = require('./routes/medicalHistory'); // New


// Middleware
app.use(express.json()); // Body parser for JSON
app.use(cors()); // Enable CORS for all routes

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Use Routes
app.use('/api/auth', authRoutes); // Authentication routes (handles /api/auth/register/patient, /api/auth/register/doctor, /api/auth/login)
app.use('/api/appointments', appointmentRoutes); // Appointment booking and doctor specific routes
app.use('/api/medical-history', medicalHistoryRoutes); // New Medical History routes

// Basic protected route example (requires a token and specific role)
const { auth, authorizeRoles } = require('./middleware/auth'); // Import auth middleware
app.get('/api/protected/patient', auth, authorizeRoles('patient'), (req, res) => {
  res.json({ message: `Welcome patient with ID: ${req.user.id}, you are authorized!` });
});

app.get('/api/protected/doctor', auth, authorizeRoles('doctor'), (req, res) => {
  res.json({ message: `Welcome doctor with ID: ${req.user.id}, you are authorized!` });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Register Route
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      email,
      password: hashedPassword,
    });

    await user.save();

    // Create and sign JWT
    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' }, // Token expires in 1 hour
      (err, token) => {
        if (err) throw err;
        res.status(201).json({ message: 'User registered successfully', token });
      }
    );

  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Login Route
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    // Create and sign JWT
    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' }, // Token expires in 1 hour
      (err, token) => {
        if (err) throw err;
        res.json({ message: 'Logged in successfully', token });
      }
    );

  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Basic protected route example (requires a token)
// You would use this for routes that require the user to be logged in
app.get('/api/protected', async (req, res) => {
  // A middleware to verify JWT would go here before this route handler
  // For simplicity, we'll assume a token is present for now, but you need
  // to implement an actual auth middleware for production.
  try {
      const token = req.header('x-auth-token'); // Assuming token is sent in x-auth-token header

      if (!token) {
          return res.status(401).json({ msg: 'No token, authorization denied' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // In a real app, you'd fetch the user from DB using decoded.user.id
      res.json({ msg: `Welcome user with ID: ${decoded.user.id}, you are authorized!` });
  } catch (error) {
      res.status(401).json({ msg: 'Token is not valid' });
  }
});


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));