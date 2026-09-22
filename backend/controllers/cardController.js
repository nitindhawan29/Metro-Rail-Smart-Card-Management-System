const pool = require('../db');



// -------------------------
// Validation helper
// -------------------------

function validateCard(data) {

    const {
        passenger_id,
        card_number,
        balance
    } = data;


    if (!passenger_id || !card_number) {
        return 'Passenger and card number are required';
    }


    // Passenger ID must be a positive integer
    const passengerIdNumber = Number(passenger_id);

    if (
        !Number.isInteger(passengerIdNumber) ||
        passengerIdNumber <= 0
    ) {
        return 'Invalid passenger ID';
    }


    // Card number format: METRO + exactly 4 digits
    const cardNumberRegex =
        /^METRO[0-9]{4}$/;


    if (!cardNumberRegex.test(card_number)) {
        return 'Card number must be METRO followed by exactly 4 digits';
    }


    // Balance is optional, but if provided,
    // it must be a valid non-negative number
    if (
        balance !== undefined &&
        balance !== null &&
        balance !== ''
    ) {

        const balanceNumber = Number(balance);


        if (!Number.isFinite(balanceNumber)) {
            return 'Balance must be a valid number';
        }


        if (balanceNumber < 0) {
            return 'Balance cannot be negative';
        }
    }


    return null;
}



// -------------------------
// Find card helper
// -------------------------

const findCardById = async (id) => {

    const [rows] = await pool.query(
        `SELECT
            sc.card_id,
            sc.passenger_id,
            p.passenger_name,
            sc.card_number,
            sc.balance
         FROM SmartCards sc
         JOIN Passengers p
            ON sc.passenger_id = p.passenger_id
         WHERE sc.card_id = ?`,
        [id]
    );


    return rows[0] || null;
};



// -------------------------
// Check passenger exists
// -------------------------

const passengerExists = async (passenger_id) => {

    const [rows] = await pool.query(
        `SELECT passenger_id
         FROM Passengers
         WHERE passenger_id = ?`,
        [passenger_id]
    );


    return rows.length > 0;
};



// -------------------------
// GET all cards
// -------------------------

const getAllCards = async (req, res) => {

    try {

        const [rows] = await pool.query(
            `SELECT
                sc.card_id,
                sc.passenger_id,
                p.passenger_name,
                sc.card_number,
                sc.balance
             FROM SmartCards sc
             JOIN Passengers p
                ON sc.passenger_id = p.passenger_id
             ORDER BY sc.card_id ASC`
        );


        res.status(200).json({
            success: true,
            data: rows
        });


    } catch (error) {

        console.error(error);


        res.status(500).json({
            success: false,
            message: 'Unable to fetch smart cards'
        });
    }
};



// -------------------------
// GET card by ID
// -------------------------

const getCardById = async (req, res) => {

    try {

        const { id } = req.params;


        const card =
            await findCardById(id);


        if (!card) {

            return res.status(404).json({
                success: false,
                message: 'Smart card not found'
            });
        }


        res.status(200).json({
            success: true,
            data: card
        });


    } catch (error) {

        console.error(error);


        res.status(500).json({
            success: false,
            message: 'Unable to fetch smart card'
        });
    }
};



// -------------------------
// CREATE smart card
// -------------------------

const createCard = async (req, res) => {

    try {

        const {
            passenger_id,
            card_number,
            balance
        } = req.body;


        const validationError =
            validateCard(req.body);


        if (validationError) {

            return res.status(400).json({
                success: false,
                message: validationError
            });
        }


        const exists =
            await passengerExists(passenger_id);


        if (!exists) {

            return res.status(404).json({
                success: false,
                message: 'Passenger not found'
            });
        }


        // If balance is not provided,
        // initial balance will be 0
        const initialBalance =
            balance === undefined ||
            balance === null ||
            balance === ''
                ? 0
                : Number(balance);


        const [result] = await pool.query(
            `INSERT INTO SmartCards
            (
                passenger_id,
                card_number,
                balance
            )
            VALUES (?, ?, ?)`,
            [
                passenger_id,
                card_number,
                initialBalance
            ]
        );


        res.status(201).json({
            success: true,
            message: 'Smart card added successfully',
            card_id: result.insertId
        });


    } catch (error) {

        console.error(error);


        // Duplicate card number
        if (error.code === 'ER_DUP_ENTRY') {

            return res.status(409).json({
                success: false,
                message: 'Card number already exists'
            });
        }


        // Foreign key protection
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {

            return res.status(404).json({
                success: false,
                message: 'Passenger not found'
            });
        }


        res.status(500).json({
            success: false,
            message: 'Unable to add smart card'
        });
    }
};



// -------------------------
// UPDATE smart card
// -------------------------

const updateCard = async (req, res) => {

    try {

        const { id } = req.params;


        const {
            passenger_id,
            card_number,
            balance
        } = req.body;


        const validationError =
            validateCard(req.body);


        if (validationError) {

            return res.status(400).json({
                success: false,
                message: validationError
            });
        }


        // Check whether card exists
        const card =
            await findCardById(id);


        if (!card) {

            return res.status(404).json({
                success: false,
                message: 'Smart card not found'
            });
        }


        // Check whether new passenger exists
        const exists =
            await passengerExists(passenger_id);


        if (!exists) {

            return res.status(404).json({
                success: false,
                message: 'Passenger not found'
            });
        }


        /*
            If balance is not sent during update,
            preserve the current balance instead of
            accidentally resetting it to 0.
        */
        const updatedBalance =
            balance === undefined ||
            balance === null ||
            balance === ''
                ? card.balance
                : Number(balance);


        await pool.query(
            `UPDATE SmartCards
             SET passenger_id = ?,
                 card_number = ?,
                 balance = ?
             WHERE card_id = ?`,
            [
                passenger_id,
                card_number,
                updatedBalance,
                id
            ]
        );


        res.status(200).json({
            success: true,
            message: 'Smart card updated successfully'
        });


    } catch (error) {

        console.error(error);


        if (error.code === 'ER_DUP_ENTRY') {

            return res.status(409).json({
                success: false,
                message: 'Card number already exists'
            });
        }


        if (error.code === 'ER_NO_REFERENCED_ROW_2') {

            return res.status(404).json({
                success: false,
                message: 'Passenger not found'
            });
        }


        res.status(500).json({
            success: false,
            message: 'Unable to update smart card'
        });
    }
};



// -------------------------
// DELETE smart card
// -------------------------

const deleteCard = async (req, res) => {

    try {

        const { id } = req.params;


        const [result] = await pool.query(
            `DELETE FROM SmartCards
             WHERE card_id = ?`,
            [id]
        );


        if (result.affectedRows === 0) {

            return res.status(404).json({
                success: false,
                message: 'Smart card not found'
            });
        }


        res.status(200).json({
            success: true,
            message: 'Smart card deleted successfully'
        });


    } catch (error) {

        console.error(error);


        // Card has transactions linked to it
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {

            return res.status(409).json({
                success: false,
                message:
                    'Smart card cannot be deleted because transactions are linked to this card'
            });
        }


        res.status(500).json({
            success: false,
            message: 'Unable to delete smart card'
        });
    }
};



module.exports = {
    getAllCards,
    getCardById,
    createCard,
    updateCard,
    deleteCard
};