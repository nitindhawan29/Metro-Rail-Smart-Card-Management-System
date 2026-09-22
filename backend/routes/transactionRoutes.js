const express = require('express');

const {
    getAllTransactions,
    getTransactionById,
    createTransaction,
    updateTransaction,
    deleteTransaction
} = require('../controllers/transactionController');


const router = express.Router();


router.get('/', getAllTransactions);

router.get('/:id', getTransactionById);

router.post('/', createTransaction);

router.put('/:id', updateTransaction);

router.delete('/:id', deleteTransaction);


module.exports = router;