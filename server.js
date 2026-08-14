const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");


// ==========================================
// ENVIRONMENT VARIABLES
// ==========================================

dotenv.config();


// ==========================================
// DATABASE
// ==========================================

const connectDB = require("./backend/config/db");


// ==========================================
// ROUTES
// ==========================================

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const questionRoutes = require("./routes/questionRoutes");
const messageRoutes = require("./routes/messageRoutes");


// ==========================================
// EXPRESS APP
// ==========================================

const app = express();


// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);


// ==========================================
// STATIC FRONTEND
// ==========================================

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);


// ==========================================
// DATABASE CONNECTION
// ==========================================

connectDB();


// ==========================================
// API ROUTES
// ==========================================

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/products",
    productRoutes
);

app.use(
    "/api/questions",
    questionRoutes
);

app.use(
    "/api/messages",
    messageRoutes
);


// ==========================================
// TEST API
// ==========================================

app.get("/api/test", (req, res) => {

    res.json({
        success: true,
        message: "CampusConnect API is working 🚀"
    });

});


// ==========================================
// FRONTEND HOME PAGE
// ==========================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "index.html"
        )
    );

});


// ==========================================
// ERROR HANDLER
// ==========================================

app.use(
    (err, req, res, next) => {

        console.error(
            "❌ Server Error:",
            err
        );

        res.status(500).json({

            success: false,

            message:
                "Internal server error"

        });

    }
);


// ==========================================
// START SERVER
// ==========================================

const PORT =
    process.env.PORT || 5000;


app.listen(
    PORT,
    () => {

        console.log("");
        console.log(
            "======================================"
        );

        console.log(
            "       🎓 CAMPUS CONNECT"
        );

        console.log(
            "======================================"
        );

        console.log(
            `🚀 Server: http://localhost:${PORT}`
        );

        console.log(
            `🌐 Website: http://localhost:${PORT}`
        );

        console.log(
            `🔐 Auth: http://localhost:${PORT}/api/auth`
        );

        console.log(
            `🛒 Cart: http://localhost:${PORT}/api/products`
        );

        console.log(
            `📚 Study Buddy: http://localhost:${PORT}/api/questions`
        );

        console.log(
            `💬 Messages: http://localhost:${PORT}/api/messages`
        );

        console.log(
            "======================================"
        );

        console.log("");

    }
);