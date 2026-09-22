const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./db');

const passengerRoutes = require('./routes/passengerRoutes');
const cardRoutes = require('./routes/cardRoutes');
const stationRoutes = require('./routes/stationRoutes');
const transactionRoutes = require('./routes/transactionRoutes');


const app = express();


// -------------------------
// Middleware
// -------------------------

app.use(cors());

app.use(express.json());



// -------------------------
// Root route
// -------------------------

app.get('/', (req, res) => {

    res.status(200).send(
        'Metro Smart Card Backend is running'
    );
});



// -------------------------
// Health check
// -------------------------

app.get('/api/health', (req, res) => {

    res.status(200).json({
        success: true,
        message: 'Backend server is running'
    });
});



// -------------------------
// Database connection test
// -------------------------

app.get('/api/test-db', async (req, res) => {

    try {

        const [rows] = await pool.query(
            'SELECT DATABASE() AS database_name'
        );


        res.status(200).json({
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



// -------------------------
// API routes
// -------------------------

app.use(
    '/api/passengers',
    passengerRoutes
);


app.use(
    '/api/cards',
    cardRoutes
);


app.use(
    '/api/stations',
    stationRoutes
);


app.use(
    '/api/transactions',
    transactionRoutes
);



// -------------------------
// Unknown route
// -------------------------

app.use((req, res) => {

    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});



// -------------------------
// Server startup
// -------------------------

const PORT = process.env.PORT || 5000;


async function startServer() {

    try {

        // Test MySQL connection before starting server
        const connection =
            await pool.getConnection();


        console.log(
            'MySQL database connected successfully'
        );


        connection.release();


        app.listen(PORT, () => {

            console.log(
                `Server running on http://localhost:${PORT}`
            );
        });


    } catch (error) {

        console.error(
            'MySQL connection failed:',
            error.message
        );

        process.exit(1);
    }
}


startServer();