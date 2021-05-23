// importing
import express from "express";
import mongoose from "mongoose";
import Pusher from "pusher";
import cors from "cors";

import Messages from "./dbMessages.js";
// app config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
  appId: "1208377",
  key: "b31ee3db9979b5907531",
  secret: "35d7ff98f2b8c5538fb2",
  cluster: "ap2",
  useTLS: true,
});

// middlewares
app.use(express.json());
app.use(cors());

// app.use((req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader("Access-Control-Allow-Headers", "*");
//   next();
// });

// DB config
const connection_url =
  "mongodb+srv://admin:jx42UAiAACf0ZQWW@cluster0.t8yvz.mongodb.net/whatsappdb?retryWrites=true&w=majority";

mongoose.connect(connection_url, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// ?????
const db = mongoose.connection;

db.once("open", () => {
  console.log("DB is Connected");

  const msgCollection = db.collection("messagecontents");
  const changeStream = msgCollection.watch();

  changeStream.on("change", (change) => {
    console.log("A Change Occurred", change);

    if (change.operationType === "insert") {
      const messageDetails = change.fullDocument;
      pusher.trigger("messages", "inserted", {
        name: messageDetails.name,
        message: messageDetails.message,
        timestamp: messageDetails.timestamp,
        recieved: messageDetails.recieved,
      });
    } else {
      console.log("Error triggering Pusher");
    }
  });
});

// api routes
app.get("/", (req, res) => res.status(200).send("Hello World"));

app.get("/messages/sync", (req, res) => {
  Messages.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

app.post("/messages/new", (req, res) => {
  const dbMessage = req.body;

  Messages.create(dbMessage, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});

// listener
app.listen(port, () => console.log(`Listening on localhost: ${port}`));
