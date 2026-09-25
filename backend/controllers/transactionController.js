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
// Used for GET
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
// Check station exists
// -------------------------

const stationExists = async (
    connection,
    station_id
) => {

    const [rows] = await connection.query(
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
            message:
                'Unable to fetch transactions'
        });
    }
};



// -------------------------
// GET transaction by ID
// -------------------------

const getTransactionById = async (
    req,
    res
) => {

    try {

        const { id } = req.params;


        const transaction =
            await findTransactionById(id);


        if (!transaction) {

            return res.status(404).json({
                success: false,
                message:
                    'Transaction not found'
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
            message:
                'Unable to fetch transaction'
        });
    }
};



// -------------------------
// CREATE transaction
// Deduct fare from card
// -------------------------

const createTransaction = async (
    req,
    res
) => {

    let connection;


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


        connection =
            await pool.getConnection();


        await connection.beginTransaction();


        // Check station
        const stationFound =
            await stationExists(
                connection,
                station_id
            );


        if (!stationFound) {

            await connection.rollback();


            return res.status(404).json({
                success: false,
                message: 'Station not found'
            });
        }


        /*
            Lock the selected card.

            FOR UPDATE prevents two simultaneous
            transactions from spending the same
            card balance at the same time.
        */
        const [cardRows] =
            await connection.query(
                `SELECT
                    card_id,
                    balance
                 FROM SmartCards
                 WHERE card_id = ?
                 FOR UPDATE`,
                [card_id]
            );


        if (cardRows.length === 0) {

            await connection.rollback();


            return res.status(404).json({
                success: false,
                message:
                    'Smart card not found'
            });
        }


        const fare =
            Number(fare_amount);


        const currentBalance =
            Number(cardRows[0].balance);


        // Check sufficient balance
        if (currentBalance < fare) {

            await connection.rollback();


            return res.status(409).json({
                success: false,
                message:
                    `Insufficient balance. Current balance is ₹${currentBalance.toFixed(2)}`
            });
        }


        // Create transaction
        const [result] =
            await connection.query(
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
                    fare
                ]
            );


        // Deduct fare
        await connection.query(
            `UPDATE SmartCards
             SET balance = balance - ?
             WHERE card_id = ?`,
            [
                fare,
                card_id
            ]
        );


        // Save both operations together
        await connection.commit();


        res.status(201).json({
            success: true,
            message:
                'Transaction recorded and fare deducted successfully',
            transaction_id:
                result.insertId,
            remaining_balance:
                currentBalance - fare
        });


    } catch (error) {

        if (connection) {
            await connection.rollback();
        }


        console.error(error);


        res.status(500).json({
            success: false,
            message:
                'Unable to add transaction'
        });


    } finally {

        if (connection) {
            connection.release();
        }
    }
};



// -------------------------
// UPDATE transaction
// Adjust card balance
// -------------------------

const updateTransaction = async (
    req,
    res
) => {

    let connection;


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


        connection =
            await pool.getConnection();


        await connection.beginTransaction();


        /*
            Lock transaction because we are
            going to reverse its old fare.
        */
        const [transactionRows] =
            await connection.query(
                `SELECT
                    transaction_id,
                    card_id,
                    station_id,
                    fare_amount
                 FROM Transactions
                 WHERE transaction_id = ?
                 FOR UPDATE`,
                [id]
            );


        if (transactionRows.length === 0) {

            await connection.rollback();


            return res.status(404).json({
                success: false,
                message:
                    'Transaction not found'
            });
        }


        const stationFound =
            await stationExists(
                connection,
                station_id
            );


        if (!stationFound) {

            await connection.rollback();


            return res.status(404).json({
                success: false,
                message: 'Station not found'
            });
        }


        const oldTransaction =
            transactionRows[0];


        const oldCardId =
            Number(oldTransaction.card_id);


        const newCardId =
            Number(card_id);


        const oldFare =
            Number(oldTransaction.fare_amount);


        const newFare =
            Number(fare_amount);


        /*
            Lock both cards if card changes.

            Sorting IDs keeps lock order
            consistent and reduces deadlock risk.
        */
        const cardIds = [
            ...new Set([
                oldCardId,
                newCardId
            ])
        ].sort(
            (a, b) => a - b
        );


        const placeholders =
            cardIds
                .map(() => '?')
                .join(', ');


        const [cardRows] =
            await connection.query(
                `SELECT
                    card_id,
                    balance
                 FROM SmartCards
                 WHERE card_id IN (${placeholders})
                 ORDER BY card_id
                 FOR UPDATE`,
                cardIds
            );


        const cardMap =
            new Map(
                cardRows.map(
                    (card) => [
                        Number(card.card_id),
                        Number(card.balance)
                    ]
                )
            );


        if (!cardMap.has(newCardId)) {

            await connection.rollback();


            return res.status(404).json({
                success: false,
                message:
                    'Smart card not found'
            });
        }


        let remainingBalance;


        // -------------------------
        // Same card
        // -------------------------

        if (oldCardId === newCardId) {

            const currentBalance =
                cardMap.get(oldCardId);


            /*
                Reverse old fare first.

                Example:

                current balance = 470
                old fare = 30

                Available again = 500
            */
            const availableBalance =
                currentBalance + oldFare;


            if (availableBalance < newFare) {

                await connection.rollback();


                return res.status(409).json({
                    success: false,
                    message:
                        `Insufficient balance. Available balance after reversing old fare is ₹${availableBalance.toFixed(2)}`
                });
            }


            remainingBalance =
                availableBalance - newFare;


            await connection.query(
                `UPDATE SmartCards
                 SET balance = ?
                 WHERE card_id = ?`,
                [
                    remainingBalance,
                    oldCardId
                ]
            );
        }


        // -------------------------
        // Card changed
        // -------------------------

        else {

            const oldCardBalance =
                cardMap.get(oldCardId);


            const newCardBalance =
                cardMap.get(newCardId);


            if (newCardBalance < newFare) {

                await connection.rollback();


                return res.status(409).json({
                    success: false,
                    message:
                        `Insufficient balance on new smart card. Current balance is ₹${newCardBalance.toFixed(2)}`
                });
            }


            // Refund old card
            await connection.query(
                `UPDATE SmartCards
                 SET balance = balance + ?
                 WHERE card_id = ?`,
                [
                    oldFare,
                    oldCardId
                ]
            );


            // Charge new card
            await connection.query(
                `UPDATE SmartCards
                 SET balance = balance - ?
                 WHERE card_id = ?`,
                [
                    newFare,
                    newCardId
                ]
            );


            remainingBalance =
                newCardBalance - newFare;
        }


        // Update transaction record
        await connection.query(
            `UPDATE Transactions
             SET card_id = ?,
                 station_id = ?,
                 fare_amount = ?
             WHERE transaction_id = ?`,
            [
                newCardId,
                station_id,
                newFare,
                id
            ]
        );


        await connection.commit();


        res.status(200).json({
            success: true,
            message:
                'Transaction updated and card balance adjusted successfully',
            remaining_balance:
                remainingBalance
        });


    } catch (error) {

        if (connection) {
            await connection.rollback();
        }


        console.error(error);


        res.status(500).json({
            success: false,
            message:
                'Unable to update transaction'
        });


    } finally {

        if (connection) {
            connection.release();
        }
    }
};



// -------------------------
// DELETE transaction
// Refund fare to card
// -------------------------

const deleteTransaction = async (
    req,
    res
) => {

    let connection;


    try {

        const { id } = req.params;


        connection =
            await pool.getConnection();


        await connection.beginTransaction();


        // Lock transaction
        const [transactionRows] =
            await connection.query(
                `SELECT
                    transaction_id,
                    card_id,
                    fare_amount
                 FROM Transactions
                 WHERE transaction_id = ?
                 FOR UPDATE`,
                [id]
            );


        if (transactionRows.length === 0) {

            await connection.rollback();


            return res.status(404).json({
                success: false,
                message:
                    'Transaction not found'
            });
        }


        const transaction =
            transactionRows[0];


        const cardId =
            Number(transaction.card_id);


        const fare =
            Number(transaction.fare_amount);


        // Lock card
        const [cardRows] =
            await connection.query(
                `SELECT
                    card_id,
                    balance
                 FROM SmartCards
                 WHERE card_id = ?
                 FOR UPDATE`,
                [cardId]
            );


        if (cardRows.length === 0) {

            await connection.rollback();


            return res.status(404).json({
                success: false,
                message:
                    'Smart card not found'
            });
        }


        const currentBalance =
            Number(cardRows[0].balance);


        const refundedBalance =
            currentBalance + fare;


        // Refund fare
        await connection.query(
            `UPDATE SmartCards
             SET balance = balance + ?
             WHERE card_id = ?`,
            [
                fare,
                cardId
            ]
        );


        // Delete transaction
        await connection.query(
            `DELETE FROM Transactions
             WHERE transaction_id = ?`,
            [id]
        );


        await connection.commit();


        res.status(200).json({
            success: true,
            message:
                'Transaction deleted and fare refunded successfully',
            remaining_balance:
                refundedBalance
        });


    } catch (error) {

        if (connection) {
            await connection.rollback();
        }


        console.error(error);


        res.status(500).json({
            success: false,
            message:
                'Unable to delete transaction'
        });


    } finally {

        if (connection) {
            connection.release();
        }
    }
};



module.exports = {
    getAllTransactions,
    getTransactionById,
    createTransaction,
    updateTransaction,
    deleteTransaction
};