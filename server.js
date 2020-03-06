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
const bodyParser = require("body-parser");

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
app.use(bodyParser.json());

app.get("/", (req, res) => {
  // Display landing page.
  const path = resolve("./index.html");
  res.sendFile(path);
});

app.get("/connect/oauth", async (req, res) => {
  const { code, state } = req.query;

  // Assert the state matches the state you provided in the OAuth link (optional).
  if (!stateMatches(state)) {
    return res
      .status(403)
      .json({ error: "Incorrect state parameter: " + state });
  }

  var error;

  // Send the authorization code to Stripe's API.
  stripe.oauth
    .token({
      grant_type: "authorization_code",
      code
    })
    .then(
      response => {
        var connected_account_id = response.stripe_user_id;
        saveAccountId(connected_account_id);

        // Render some HTML or redirect to a different page.
        return res.status(200).json({ success: true });
      },
      err => {
        if (err.type === "StripeInvalidGrantError") {
          return res
            .status(400)
            .json({ error: "Invalid authorization code: " + code });
        } else {
          return res.status(500).json({ error: "An unknown error occurred." });
        }
      }
    );
});

const stateMatches = state_parameter => {
  // Load the same state value that you randomly generated for your OAuth link.
  const saved_state = "sv_53124";

  return saved_state == state_parameter;
};

const saveAccountId = id => {
  // Save the connected account ID from the response to your database.
  console.log("Connected account ID: " + id);
};

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

app.post("/createAccount", function(req, res) {
  console.log("createAccount req:" + req);
  stripe.accounts.create(
    {
      type: req.body.type,
      country: "US",
      email: req.body.email,
      requested_capabilities: ["card_payments", "transfers"]
    },
    function(err, account) {
      if (err) {
        console.log("createAccount failed");
        res.status(500).end();
      } else {
        console.log("createAccount was successful:" + account);
        res.json(account); //account.id
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
