const {mongoose} = require('../config/mongoose');

const paymentSchema = new mongoose.Schema({
    source: {
        type: String, 
        required: true,
    },
    amount: {
        type: String, 
        required: true,
    },
    currency: {
        type: String, 
        required: true,
    },
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = {Payment}