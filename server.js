require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const connectDB = require("./backend/config/db");

const app = express();


// ==============================
// DATABASE
// ==============================

connectDB();


// ==============================
// MIDDLEWARE
// ==============================

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));


// ==============================
// FRONTEND
// ==============================

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);


// ==============================
// TEST API
// ==============================

app.get("/api/health", (req, res) => {

    res.json({
        success: true,
        message: "CampusConnect API is running"
    });

});


// ==============================
// SERVER
// ==============================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

    console.log(
        `🚀 CampusConnect running at http://localhost:${PORT}`
    );

});