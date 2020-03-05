if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY;
const helmet = require("helmet");
const express = require("express");
const app = express();
const fs = require("fs");
const stripe = require("stripe")(stripeSecretKey);
const cors = require("cors");
const { Payment } = require("./models/Payment");

app.set("view engine", "ejs");
// app.use(express.json());
app.use(express.static("public"));
app.use(helmet());
app.use(
  cors({
    origin: [/http:\/\/localhost:\d+$/],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);

app.get("/api/", (req, res) => res.send({ version: "1.0" }));

app.post("/payment", function(req, res) {
  const payload = {
    amount: req.body.amount,
    source: "tok_visa", //strictly for testing
    currency: "usd",
    customer: req.body.customer
  };
  stripe.charges
    .create(payload)
    .then(function() {
      console.log("Charge was Successful");
      res.json({ message: "Successfully paid" });
      sendtoMongo(payload);
    })
    .catch(function() {
      console.log("Charge Failed");
      res.status(500).end();
    });
});

//cus_GqThOlN7Y2HiJI
//cus_GpClkRZSrg36lY
app.get("/getCustomers", function(req, res) {
  stripe.customers
    .retrieve("cus_EcmCu9HT7EZWEH", function(err, customer) {
      // asynchronously called
      if (err) {
        console.log("getCustomers err" + err);
      }
      console.log("getCustomers was successful:" + customer);
      res.json(customer);
    })
    .catch(function() {
      console.log("getCustomers failed");
      res.status(500).end();
    });
});
app.post("/createSource", function(req, res) {
  stripe.sources.create(
    {
      type: "ach_credit_transfer",
      currency: "usd",
      owner: {
        email: req.body.email
      }
    },
    function(err, source) {
      if (err) {
        console.log("createSource failed");
        res.status(500).end();
      } else {
        console.log("createSource was successful:" + source);
        res.json(source);
      }
    }
  );
});
app.post("/paymentMethod", function(req, res) {
  stripe.paymentMethods.create(
    {
      type: "card",
      card: {
        number: req.body.number,
        exp_month: req.body.exp_month,
        exp_year: req.body.exp_year,
        cvc: req.body.cvc
      }
    },
    function(err, paymentMethod) {
      if (err) {
        console.log("createSource failed");
        res.status(500).end();
      } else {
        console.log("createSource was successful:" + paymentMethod);
        res.json(source);
      }
    }
  );
});
//secret key hyas to change...
app.post("/payouts", function(req, res) {
  var stripePayout = require("stripe")(req.body.secret_key);
  stripePayout.payouts.create(
    { amount: req.body.amount, currency: req.body.currency },
    function(err, payout) {
      if (err) {
        console.log("payouts failed");
        res.status(500).end();
      } else {
        console.log("payouts was successful:" + payouts);
        res.json(source);
      }
    }
  );
});

function sendtoMongo(payload) {
  mongoose.connect("mongodb://localhost:27017/payment", {
    useNewUrlParser: true
  });

  // get reference to database
  var db = mongoose.connection;
  db.on("error", console.error.bind(console, "connection error:"));

  db.once("open", function() {
    console.log("Connection Successful!");

    newPayment = payload;
    const payment = new Payment(newPayment);

    payment
      .save()
      .then(payment => {
        if (!payment) {
          return res.redirect("/error");
        }
        console.log("Sucesfully saved to mongoDB");
        res.redirect("/receipt/");
      })
      .catch(e => {
        console.log("Error saving to mongoDB");
        res.redirect("/error");
      });
    // save model to database
    book1.save(function(err, book) {
      if (err) return console.error(err);
      console.log(book.name + " saved to bookstore collection.");
    });
  });
}
app.listen(3000, function() {
  console.log("Billing microservice is running");
});
