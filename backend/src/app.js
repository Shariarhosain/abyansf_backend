import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import cors from 'cors';

dotenv.config();

// Import Routers
import userRouter from './routes/userRoute.js';



const app = express();
const PORT = process.env.PORT || 3000;

// --- CRITICAL CONFIGURATION CHECKS ---
let criticalConfigMissing = false;

//allow all origins for CORS
app.use(cors({
  origin: '*', // Be cautious with '*' in production
  methods: ['GET', 'POST', 'PUT', 'DELETE','PATCH'],
  credentials: true,
}));

// if (!process.env.DATABASE_URL) {
//   console.error("FATAL ERROR: DATABASE_URL is not set in .env file!");
//   criticalConfigMissing = true;
// }
// if (!process.env.SECRET_CODE) {
//   console.error("FATAL ERROR: SECRET_CODE is not set in .env file! JWT functionality will be broken.");
//   criticalConfigMissing = true;
// }
// if (criticalConfigMissing) {
//   console.error("Application cannot start due to missing critical configurations. Please check your .env file.");
//   process.exit(1); // Exit the application with an error code
// }
// // --- END CRITICAL CONFIGURATION CHECKS ---

app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded


// Routes
app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use('/api/users', userRouter);

// if other  mean which i not declare then say hi hackers
app.use((req, res) => {
 res.send('Hi Hackers, you are not allowed to access this API');
});
// --- Global Error Handling Middleware ---
// Must have 4 arguments for Express to recognize it as error handler
app.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500; // Default to 500 Internal Server Error
    err.status = err.status || 'error';

    console.error('ERROR 💥:', err); // Log the full error stack

    // Send response
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        // Optionally include stack trace in development
        // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        error: err // Include the error object itself can sometimes be useful (or strip it in prod)
    });
});
// Start the server only if all critical checks passed
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);

  // You might also want to establish and check your database connection here
  // and potentially exit if it fails, or implement a retry mechanism.
});
