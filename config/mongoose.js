const mongoose = require ('mongoose');

mongoose.connect('mongodb://localhost:27017/payment',{useNewUrlParser:true});

module.exports = {mongoose}