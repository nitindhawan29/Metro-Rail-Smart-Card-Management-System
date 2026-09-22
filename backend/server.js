const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./db');

const app = express();

app.use(cors());
app.use(express.json());


// Basic server test
app.get('/', (req, res) => {
    res.send('Metro Smart Card Backend is running');
});


// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Backend server is running'
    });
});


// Database connection test
app.get('/api/test-db', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT DATABASE() AS database_name');

        res.json({
            success: true,
            message: 'Database connected successfully',
            database: rows[0].database_name
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Database connection failed'
        });
    }
});


// Read passengers directly from MySQL
app.get('/api/passengers', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM Passengers'
        );

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Unable to fetch passengers'
        });
    }
});

async function testDatabaseConnection() {
    try {
        const connection = await pool.getConnection();

        console.log('MySQL database connected successfully');

        connection.release();
    } catch (error) {
        console.error('MySQL connection failed:', error.message);
    }
}

testDatabaseConnection();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});