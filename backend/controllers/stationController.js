const pool = require('../db');



// -------------------------
// Validation helper
// -------------------------

function validateStation(data) {

    const {
        station_name,
        line_name
    } = data;


    if (!station_name || !line_name) {
        return 'Station name and line name are required';
    }


    if (station_name.trim().length === 0) {
        return 'Station name cannot be empty';
    }


    if (line_name.trim().length === 0) {
        return 'Line name cannot be empty';
    }


    if (station_name.length > 100) {
        return 'Station name cannot exceed 100 characters';
    }


    if (line_name.length > 50) {
        return 'Line name cannot exceed 50 characters';
    }


    return null;
}



// -------------------------
// Find station helper
// -------------------------

const findStationById = async (id) => {

    const [rows] = await pool.query(
        `SELECT *
         FROM Stations
         WHERE station_id = ?`,
        [id]
    );


    return rows[0] || null;
};



// -------------------------
// GET all stations
// -------------------------

const getAllStations = async (req, res) => {

    try {

        let sql = `SELECT * FROM Stations WHERE 1=1`;
        const params = [];

        // Dynamic SQL WHERE clause based on search parameters
        if (req.query.station_id) {
            sql += ` AND station_id = ?`;
            params.push(req.query.station_id);
        }
        if (req.query.station_name) {
            sql += ` AND station_name LIKE ?`;
            params.push('%' + req.query.station_name + '%');
        }
        if (req.query.line_name) {
            sql += ` AND line_name LIKE ?`;
            params.push('%' + req.query.line_name + '%');
        }

        // Apply SQL ORDER BY
        const allowedSortCols = ['station_id', 'station_name', 'line_name'];
        const sortCol = allowedSortCols.indexOf(req.query.sort_col) !== -1 ? req.query.sort_col : 'station_id';
        const sortDir = (req.query.sort_dir && req.query.sort_dir.toLowerCase() === 'desc') ? 'DESC' : 'ASC';

        sql += ` ORDER BY ${sortCol} ${sortDir}`;

        const [rows] = await pool.query(sql, params);

        res.status(200).json({
            success: true,
            data: rows
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Unable to fetch stations'
        });
    }
};



// -------------------------
// GET station by ID
// -------------------------

const getStationById = async (req, res) => {

    try {

        const { id } = req.params;


        const station =
            await findStationById(id);


        if (!station) {

            return res.status(404).json({
                success: false,
                message: 'Station not found'
            });
        }


        res.status(200).json({
            success: true,
            data: station
        });


    } catch (error) {

        console.error(error);


        res.status(500).json({
            success: false,
            message: 'Unable to fetch station'
        });
    }
};



// -------------------------
// CREATE station
// -------------------------

const createStation = async (req, res) => {

    try {

        const {
            station_id,
            station_name,
            line_name
        } = req.body;


        if (station_id !== undefined && station_id !== null && station_id !== '') {
            const stationIdNum = Number(station_id);
            if (!Number.isInteger(stationIdNum) || stationIdNum <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Station ID must be a positive integer'
                });
            }
            const existingStation = await findStationById(stationIdNum);
            if (existingStation) {
                return res.status(409).json({
                    success: false,
                    message: `Station with ID ${stationIdNum} already exists`
                });
            }
        }


        const validationError =
            validateStation(req.body);


        if (validationError) {

            return res.status(400).json({
                success: false,
                message: validationError
            });
        }


        const stationIdNum = station_id !== undefined && station_id !== null && station_id !== '' ? Number(station_id) : null;
        let result;

        if (stationIdNum !== null) {
            [result] = await pool.query(
                `INSERT INTO Stations
                (
                    station_id,
                    station_name,
                    line_name
                )
                VALUES (?, ?, ?)`,
                [
                    stationIdNum,
                    station_name.trim(),
                    line_name.trim()
                ]
            );
        } else {
            [result] = await pool.query(
                `INSERT INTO Stations
                (
                    station_name,
                    line_name
                )
                VALUES (?, ?)`,
                [
                    station_name.trim(),
                    line_name.trim()
                ]
            );
        }


        res.status(201).json({
            success: true,
            message: 'Station added successfully',
            station_id: stationIdNum || result.insertId
        });


    } catch (error) {

        console.error(error);


        res.status(500).json({
            success: false,
            message: 'Unable to add station'
        });
    }
};



// -------------------------
// UPDATE station
// -------------------------

const updateStation = async (req, res) => {

    try {

        const { id } = req.params;


        const {
            station_name,
            line_name
        } = req.body;


        const validationError =
            validateStation(req.body);


        if (validationError) {

            return res.status(400).json({
                success: false,
                message: validationError
            });
        }


        const station =
            await findStationById(id);


        if (!station) {

            return res.status(404).json({
                success: false,
                message: 'Station not found'
            });
        }


        await pool.query(
            `UPDATE Stations
             SET station_name = ?,
                 line_name = ?
             WHERE station_id = ?`,
            [
                station_name.trim(),
                line_name.trim(),
                id
            ]
        );


        res.status(200).json({
            success: true,
            message: 'Station updated successfully'
        });


    } catch (error) {

        console.error(error);


        res.status(500).json({
            success: false,
            message: 'Unable to update station'
        });
    }
};



// -------------------------
// DELETE station
// -------------------------

const deleteStation = async (req, res) => {

    try {

        const { id } = req.params;


        const [result] = await pool.query(
            `DELETE FROM Stations
             WHERE station_id = ?`,
            [id]
        );


        if (result.affectedRows === 0) {

            return res.status(404).json({
                success: false,
                message: 'Station not found'
            });
        }


        res.status(200).json({
            success: true,
            message: 'Station deleted successfully'
        });


    } catch (error) {

        console.error(error);


        if (error.code === 'ER_ROW_IS_REFERENCED_2') {

            return res.status(409).json({
                success: false,
                message:
                    'Station cannot be deleted because transactions are linked to this station'
            });
        }


        res.status(500).json({
            success: false,
            message: 'Unable to delete station'
        });
    }
};



module.exports = {
    getAllStations,
    getStationById,
    createStation,
    updateStation,
    deleteStation
};