if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
  }
  
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  const stripePublicKey = process.env.STRIPE_PUBLIC_KEY
  const helmet = require('helmet')
  const express = require('express');
  const app = express();
  const fs = require('fs');
  const stripe = require('stripe')(stripeSecretKey);
  const cors = require('cors');
  const {Payment} = require('./models/Payment')

  app.set('view engine', 'ejs');
  // app.use(express.json());
  app.use(express.static('public'));
  app.use(helmet());
  app.use(cors({
    origin: [/http:\/\/localhost:\d+$/],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }));


app.get('/api/', (req, res) => res.send({ version: '1.0' }))

app.post('/payment', function(req, res) {
      const payload = {
        amount: "500",
        source: 'tok_visa',
        currency: 'usd'
      }
      stripe.charges.create(
        payload
      ).then(function() {
        console.log('Charge was Successful')
        res.json({ message: 'Successfully paid' })
        sendtoMongo(payload);
      }).catch(function() {
        console.log('Charge Failed')
        res.status(500).end()
      })
  })

function sendtoMongo(payload){
  mongoose.connect('mongodb://localhost:27017/payment',{useNewUrlParser:true});

  // get reference to database
  var db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));

  db.once('open', function() {
  console.log("Connection Successful!");


  newPayment = payload
  const payment = new Payment(newPayment)

  payment.save().then((payment)=>{
      if(!payment){
          return res.redirect('/error');
      }
      console.log("Sucesfully saved to mongoDB");
      res.redirect('/receipt/');
  }).catch((e)=>{
    console.log("Error saving to mongoDB");
      res.redirect('/error');
  })
  // save model to database
  book1.save(function (err, book) {
    if (err) return console.error(err);
    console.log(book.name + " saved to bookstore collection.");
  });
    
});
}
  app.listen(3000, function(){
    console.log("Billing microservice is running");    
  });