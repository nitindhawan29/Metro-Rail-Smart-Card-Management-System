const pool = require('../db');



// -------------------------
// Validation helper
// -------------------------

function validateTransaction(data) {

    const {
        card_id,
        station_id,
        fare_amount
    } = data;


    if (
        card_id === undefined ||
        card_id === null ||
        station_id === undefined ||
        station_id === null ||
        fare_amount === undefined ||
        fare_amount === null ||
        fare_amount === ''
    ) {
        return 'Card, station and fare amount are required';
    }


    const cardIdNumber = Number(card_id);
    const stationIdNumber = Number(station_id);
    const fareNumber = Number(fare_amount);


    if (
        !Number.isInteger(cardIdNumber) ||
        cardIdNumber <= 0
    ) {
        return 'Invalid card ID';
    }


    if (
        !Number.isInteger(stationIdNumber) ||
        stationIdNumber <= 0
    ) {
        return 'Invalid station ID';
    }


    if (!Number.isFinite(fareNumber)) {
        return 'Fare amount must be a valid number';
    }


    if (fareNumber < 0) {
        return 'Fare amount cannot be negative';
    }


    return null;
}



// -------------------------
// Find transaction helper
// -------------------------

const findTransactionById = async (id) => {

    const [rows] = await pool.query(
        `SELECT
            t.transaction_id,

            t.card_id,
            sc.card_number,

            p.passenger_id,
            p.passenger_name,

            t.station_id,
            s.station_name,
            s.line_name,

            t.transaction_date,
            t.fare_amount

         FROM Transactions t

         JOIN SmartCards sc
            ON t.card_id = sc.card_id

         JOIN Passengers p
            ON sc.passenger_id = p.passenger_id

         JOIN Stations s
            ON t.station_id = s.station_id

         WHERE t.transaction_id = ?`,
        [id]
    );


    return rows[0] || null;
};



// -------------------------
// Check card exists
// -------------------------

const cardExists = async (card_id) => {

    const [rows] = await pool.query(
        `SELECT card_id
         FROM SmartCards
         WHERE card_id = ?`,
        [card_id]
    );


    return rows.length > 0;
};



// -------------------------
// Check station exists
// -------------------------

const stationExists = async (station_id) => {

    const [rows] = await pool.query(
        `SELECT station_id
         FROM Stations
         WHERE station_id = ?`,
        [station_id]
    );


    return rows.length > 0;
};



// -------------------------
// GET all transactions
// -------------------------

const getAllTransactions = async (req, res) => {

    try {

        const [rows] = await pool.query(
            `SELECT
                t.transaction_id,

                t.card_id,
                sc.card_number,

                p.passenger_id,
                p.passenger_name,

                t.station_id,
                s.station_name,
                s.line_name,

                t.transaction_date,
                t.fare_amount

             FROM Transactions t

             JOIN SmartCards sc
                ON t.card_id = sc.card_id

             JOIN Passengers p
                ON sc.passenger_id = p.passenger_id

             JOIN Stations s
                ON t.station_id = s.station_id

             ORDER BY t.transaction_id ASC`
        );


        res.status(200).json({
            success: true,
            data: rows
        });


    } catch (error) {

        console.error(error);


        res.status(500).json({
            success: false,
            message: 'Unable to fetch transactions'
        });
    }
};



// -------------------------
// GET transaction by ID
// -------------------------

const getTransactionById = async (req, res) => {

    try {

        const { id } = req.params;


        const transaction =
            await findTransactionById(id);


        if (!transaction) {

            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }


        res.status(200).json({
            success: true,
            data: transaction
        });


    } catch (error) {

        console.error(error);


        res.status(500).json({
            success: false,
            message: 'Unable to fetch transaction'
        });
    }
};



// -------------------------
// CREATE transaction
// -------------------------

const createTransaction = async (req, res) => {

    try {

        const {
            card_id,
            station_id,
            fare_amount
        } = req.body;


        const validationError =
            validateTransaction(req.body);


        if (validationError) {

            return res.status(400).json({
                success: false,
                message: validationError
            });
        }


        const cardFound =
            await cardExists(card_id);


        if (!cardFound) {

            return res.status(404).json({
                success: false,
                message: 'Smart card not found'
            });
        }


        const stationFound =
            await stationExists(station_id);


        if (!stationFound) {

            return res.status(404).json({
                success: false,
                message: 'Station not found'
            });
        }


        const [result] = await pool.query(
            `INSERT INTO Transactions
            (
                card_id,
                station_id,
                fare_amount
            )
            VALUES (?, ?, ?)`,
            [
                card_id,
                station_id,
                Number(fare_amount)
            ]
        );


        res.status(201).json({
            success: true,
            message: 'Transaction added successfully',
            transaction_id: result.insertId
        });


    } catch (error) {

        console.error(error);


        if (error.code === 'ER_NO_REFERENCED_ROW_2') {

            return res.status(404).json({
                success: false,
                message:
                    'Referenced smart card or station does not exist'
            });
        }


        res.status(500).json({
            success: false,
            message: 'Unable to add transaction'
        });
    }
};



// -------------------------
// UPDATE transaction
// -------------------------

const updateTransaction = async (req, res) => {

    try {

        const { id } = req.params;


        const {
            card_id,
            station_id,
            fare_amount
        } = req.body;


        const validationError =
            validateTransaction(req.body);


        if (validationError) {

            return res.status(400).json({
                success: false,
                message: validationError
            });
        }


        const transaction =
            await findTransactionById(id);


        if (!transaction) {

            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }


        const cardFound =
            await cardExists(card_id);


        if (!cardFound) {

            return res.status(404).json({
                success: false,
                message: 'Smart card not found'
            });
        }


        const stationFound =
            await stationExists(station_id);


        if (!stationFound) {

            return res.status(404).json({
                success: false,
                message: 'Station not found'
            });
        }


        await pool.query(
            `UPDATE Transactions
             SET card_id = ?,
                 station_id = ?,
                 fare_amount = ?
             WHERE transaction_id = ?`,
            [
                card_id,
                station_id,
                Number(fare_amount),
                id
            ]
        );


        res.status(200).json({
            success: true,
            message: 'Transaction updated successfully'
        });


    } catch (error) {

        console.error(error);


        if (error.code === 'ER_NO_REFERENCED_ROW_2') {

            return res.status(404).json({
                success: false,
                message:
                    'Referenced smart card or station does not exist'
            });
        }


        res.status(500).json({
            success: false,
            message: 'Unable to update transaction'
        });
    }
};



// -------------------------
// DELETE transaction
// -------------------------

const deleteTransaction = async (req, res) => {

    try {

        const { id } = req.params;


        const [result] = await pool.query(
            `DELETE FROM Transactions
             WHERE transaction_id = ?`,
            [id]
        );


        if (result.affectedRows === 0) {

            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }


        res.status(200).json({
            success: true,
            message: 'Transaction deleted successfully'
        });


    } catch (error) {

        console.error(error);


        res.status(500).json({
            success: false,
            message: 'Unable to delete transaction'
        });
    }
};



module.exports = {
    getAllTransactions,
    getTransactionById,
    createTransaction,
    updateTransaction,
    deleteTransaction
};