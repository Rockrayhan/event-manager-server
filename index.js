// const serverlessExpress = require('@vendia/serverless-express');
const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// env config
const env = require("dotenv");
env.config();
const port = process.env.PORT || 5000;
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
app.use(cors());
app.use(express.json());

const uri = process.env.DB_URI;

// const uri="mongodb+srv://khayrulalamdict:AdrN0sAmVR43ne6K@cluster0.qdsaagu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    // products
    const eventDB = client.db("eventsDB");
    const eventsCollection = eventDB.collection("eventsCollection");
    const joinedEventsCollection = eventDB.collection("joinedEventsCollection");

    // users
    const userDB = client.db("usersDB");
    const userCollection = userDB.collection("usersCollection");

    //=====  event routes =======

    // send product
    app.post("/events", async (req, res) => {
      const eventsData = req.body;
      eventsData.attendeeCount = 0;
      const result = await eventsCollection.insertOne(eventsData);
      res.send(result);
    });

    // get all data
    app.get("/events", async (req, res) => {
      try {
        const result = await eventsCollection
          .find({})
          .sort({ dateTime: -1 }) // Sort by ISO date string descending
          .toArray();

        res.send(result);
      } catch (error) {
        console.error("Failed to fetch events:", error);
        res.status(500).send({ error: "Failed to fetch events" });
      }
    });

    // get products by user email

    app.get("/myevents", async (req, res) => {
      const email = req.query.email;
      console.log("Query email:", email); // Debugging line
      if (email) {
        const productsData = eventsCollection.find({ email }); // Use the correct field name
        const result = await productsData.toArray();
        console.log("Found blogs:", result); // Debugging line
        res.send(result);
      } else {
        res.status(400).send({ message: "Email query parameter is required" });
      }
    });

    // get single data
    app.get("/events/:id", async (req, res) => {
      const id = req.params.id;
      const productsData = await eventsCollection.findOne({
        _id: new ObjectId(id),
      });
      res.send(productsData);
    });

    // update
    app.patch("/events/:id", async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;

      const result = await eventsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData }
      );
      res.send(result);
    });

    // delete
    app.delete("/events/:id", async (req, res) => {
      const id = req.params.id;
      const result = await eventsCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    // ========= user routes =========

    // add user
    app.post("/user", async (req, res) => {
      const user = req.body;
      const isUserExist = await userCollection.findOne({ email: user?.email });
      if (isUserExist?._id) {
        return res.send({
          status: "success",
          message: "Login Success",
        });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // get user
    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const result = await userCollection.findOne({ email });
      res.send(result);
    });

    console.log("Database is connected");
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
