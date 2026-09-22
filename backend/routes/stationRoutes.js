const express = require('express');

const {
    getAllStations,
    getStationById,
    createStation,
    updateStation,
    deleteStation
} = require('../controllers/stationController');


const router = express.Router();


router.get('/', getAllStations);

router.get('/:id', getStationById);

router.post('/', createStation);

router.put('/:id', updateStation);

router.delete('/:id', deleteStation);


module.exports = router;