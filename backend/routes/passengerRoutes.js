const express = require('express');

const {
    getAllPassengers,
    getPassengerById,
    createPassenger,
    updatePassenger,
    deletePassenger
} = require('../controllers/passengerController');

const router = express.Router();

router.get('/', getAllPassengers);

router.get('/:id', getPassengerById);

router.post('/', createPassenger);

router.put('/:id', updatePassenger);

router.delete('/:id', deletePassenger);

module.exports = router;