const sqlite3 = require("sqlite3").verbose();
const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
const http = require("http");
const hostname = "localhost";
const port = process.env.PORT || 8080;

const app = express();
const server = http.createServer(app);

// Lager database fil
const db = new sqlite3.Database("./database/pets.db");

app.use(bodyParser.urlencoded({ extended: false }));
app.use("./public/css/", express.static("style.css"));
app.use(express.static(path.join(__dirname, "./public")));
app.use(bodyParser.json());
app.use(morgan("dev"));

fs.readFile(__dirname + "/public/css/style.css", (err) => {
  if (err) {
    console.log(err);
  }
});

// db.run(
//   "CREATE TABLE IF NOT EXISTS pets(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, age INTEGER, species TEXT, owner TEXT)"
// );

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "./public/index.html"));
});

// ADD
app.post("/add", (req, res) => {
  db.serialize(() => {
    db.run(
      "INSERT INTO pets (name, age, species, owner) VALUES (?,?,?,?)",
      [req.body.name, req.body.age, req.body.species, req.body.owner],
      (err) => {
        if (err) {
          return console.log(err.message);
        }
        console.log("New pet has been added", req.body.name);
        res.send(`New pet added: ${req.body.name}`);
        return res.json();
      }
    );
  });
});

// VIEW
app.post("/view", (req, res) => {
  let data = [];
  db.serialize(() => {
    db.each(
      "SELECT * FROM pets WHERE name = ? OR species = ?;",
      [req.body.name, req.body.species],
      (err, row) => {
        if (err) {
          res.send("Error ocourred while displaying");
          return res.json(err);
        }
        data.push(row);
        console.log(data);
      },
      () => {
        res.send(data);
      }
    );
  });
});

// SHOW ALL PETS
app.get("/show", (req, res) => {
  let data = [];
  db.serialize(() => {
    db.each(
      "SELECT * FROM pets;",
      (err, row) => {
        console.log(row.name);
        data.push(row);
      },
      () => {
        res.send(data);
      }
    );
  });
});

// UPDATE
app.post("/update", (req, res) => {
  db.serialize(() => {
    db.run(
      "UPDATE pets SET owner = ? WHERE name = ?",
      [req.body.owner, req.body.name],
      (err) => {
        if (err) {
          res.send("Error occur while updating");
          return console.error(err.message);
        }
        res.send("Update successfull");
        console.log("Update successfull");
        // res.end();
      }
    );
  });
});

// DELETE BY NAME
app.post("/delete", (req, res) => {
  db.serialize(() => {
    db.run("DELETE FROM pets WHERE name = ?", req.body.name, (err) => {
      if (err) {
        res.send("Error occurred while deleting");
        return console.error(err.message);
      }

      res.send("Pet deleted");
      console.log("Pet deleted");
    });
  });
});

// CLOSING DATABASE CONNECTIONS
app.get("/close", (req, res) => {
  db.close((err) => {
    if (err) {
      res.send("Error when closing the database");
      return console.error(err.message);
    }
    console.log("Closing the database connection.");
    res.send("Database connection successfully closed");
  });
});

server.listen(port, hostname, () => {
  console.log(`server is running at http://${hostname}:${port}`);
});
