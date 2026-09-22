const pool = require('../db');


// -------------------------
// Validation helper
// -------------------------

function validatePassenger(data) {

    const {
        passenger_name,
        country_code,
        mobile_number,
        email
    } = data;


    if (!passenger_name || !country_code || !mobile_number) {
        return 'Passenger name, country code and mobile number are required';
    }


    const countryCodeRegex = /^\+[1-9][0-9]{0,3}$/;
    const mobileRegex = /^[0-9]{4,14}$/;


    if (!countryCodeRegex.test(country_code)) {
        return 'Invalid country code';
    }


    if (!mobileRegex.test(mobile_number)) {
        return 'Mobile number must contain 4 to 14 digits';
    }


    const totalDigits =
        country_code.substring(1).length +
        mobile_number.length;


    if (totalDigits > 15) {
        return 'Complete international phone number cannot exceed 15 digits';
    }


    if (email) {

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


        if (!emailRegex.test(email)) {
            return 'Invalid email address';
        }
    }


    return null;
}



// -------------------------
// Find passenger helper
// -------------------------

const findPassengerById = async (id) => {

    const [rows] = await pool.query(
        `SELECT *
         FROM Passengers
         WHERE passenger_id = ?`,
        [id]
    );


    return rows[0] || null;
};



// -------------------------
// GET all passengers
// -------------------------

const getAllPassengers = async (req, res) => {

    try {

        const [rows] = await pool.query(
            `SELECT *
             FROM Passengers
             ORDER BY passenger_id ASC`
        );


        res.status(200).json({
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
};



// -------------------------
// GET passenger by ID
// -------------------------

const getPassengerById = async (req, res) => {

    try {

        const { id } = req.params;


        const passenger =
            await findPassengerById(id);


        if (!passenger) {

            return res.status(404).json({
                success: false,
                message: 'Passenger not found'
            });
        }


        res.status(200).json({
            success: true,
            data: passenger
        });


    } catch (error) {

        console.error(error);


        res.status(500).json({
            success: false,
            message: 'Unable to fetch passenger'
        });
    }
};



// -------------------------
// CREATE passenger
// -------------------------

const createPassenger = async (req, res) => {

    try {

        const {
            passenger_name,
            country_code,
            mobile_number,
            email
        } = req.body;


        const validationError =
            validatePassenger(req.body);


        if (validationError) {

            return res.status(400).json({
                success: false,
                message: validationError
            });
        }


        const [result] = await pool.query(
            `INSERT INTO Passengers
            (
                passenger_name,
                country_code,
                mobile_number,
                email
            )
            VALUES (?, ?, ?, ?)`,
            [
                passenger_name,
                country_code,
                mobile_number,
                email || null
            ]
        );


        res.status(201).json({
            success: true,
            message: 'Passenger added successfully',
            passenger_id: result.insertId
        });


    } catch (error) {

        console.error(error);


        res.status(500).json({
            success: false,
            message: 'Unable to add passenger'
        });
    }
};



// -------------------------
// UPDATE passenger
// -------------------------

const updatePassenger = async (req, res) => {

    try {

        const { id } = req.params;


        const {
            passenger_name,
            country_code,
            mobile_number,
            email
        } = req.body;


        const validationError =
            validatePassenger(req.body);


        if (validationError) {

            return res.status(400).json({
                success: false,
                message: validationError
            });
        }


        // Check whether passenger exists
        const passenger =
            await findPassengerById(id);


        if (!passenger) {

            return res.status(404).json({
                success: false,
                message: 'Passenger not found'
            });
        }


        await pool.query(
            `UPDATE Passengers
             SET passenger_name = ?,
                 country_code = ?,
                 mobile_number = ?,
                 email = ?
             WHERE passenger_id = ?`,
            [
                passenger_name,
                country_code,
                mobile_number,
                email || null,
                id
            ]
        );


        res.status(200).json({
            success: true,
            message: 'Passenger updated successfully'
        });


    } catch (error) {

        console.error(error);


        res.status(500).json({
            success: false,
            message: 'Unable to update passenger'
        });
    }
};



// -------------------------
// DELETE passenger
// -------------------------

const deletePassenger = async (req, res) => {

    try {

        const { id } = req.params;


        const [result] = await pool.query(
            `DELETE FROM Passengers
             WHERE passenger_id = ?`,
            [id]
        );


        if (result.affectedRows === 0) {

            return res.status(404).json({
                success: false,
                message: 'Passenger not found'
            });
        }


        res.status(200).json({
            success: true,
            message: 'Passenger deleted successfully'
        });


    } catch (error) {

        console.error(error);


        if (error.code === 'ER_ROW_IS_REFERENCED_2') {

            return res.status(409).json({
                success: false,
                message:
                    'Passenger cannot be deleted because a smart card is linked to this passenger'
            });
        }


        res.status(500).json({
            success: false,
            message: 'Unable to delete passenger'
        });
    }
};



module.exports = {
    getAllPassengers,
    getPassengerById,
    createPassenger,
    updatePassenger,
    deletePassenger
};