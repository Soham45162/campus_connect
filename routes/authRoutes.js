const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user");

const router = express.Router();


// ==========================================
// REGISTER
// POST /api/auth/register
// ==========================================

router.post("/register", async (req, res) => {

    try {

        const {
            fullName,
            email,
            password,
            studentId,
            branch,
            year
        } = req.body;


        // Check required fields
        if (
            !fullName ||
            !email ||
            !password ||
            !studentId
        ) {
            return res.status(400).json({
                success: false,
                message: "Please fill all required fields"
            });
        }


        // Check existing email
        const existingUser =
            await User.findOne({
                email
            });


        if (existingUser) {

            return res.status(400).json({
                success: false,
                message: "Email already registered"
            });

        }


        // Check existing student ID
        const existingStudent =
            await User.findOne({
                studentId
            });


        if (existingStudent) {

            return res.status(400).json({
                success: false,
                message: "Student ID already registered"
            });

        }


        // Hash password
        const hashedPassword =
            await bcrypt.hash(password, 10);


        // Create user
        const user =
            await User.create({

                fullName,

                email,

                password: hashedPassword,

                studentId,

                branch:
                    branch || "CSE",

                year:
                    year || 2

            });


        res.status(201).json({

            success: true,

            message:
                "Registration successful",

            user: {

                id: user._id,

                fullName: user.fullName,

                email: user.email,

                studentId: user.studentId,

                branch: user.branch,

                year: user.year

            }

        });

    }

    catch (error) {

        console.error(
            "Register error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Server error during registration"

        });

    }

});


// ==========================================
// LOGIN
// POST /api/auth/login
// ==========================================

router.post("/login", async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;


        if (!email || !password) {

            return res.status(400).json({

                success: false,

                message:
                    "Email and password are required"

            });

        }


        // Find user
        const user =
            await User.findOne({
                email
            });


        if (!user) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid email or password"

            });

        }


        // Compare password
        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );


        if (!passwordMatch) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid email or password"

            });

        }


        // Create JWT
        const token =
            jwt.sign(

                {
                    userId: user._id
                },

                process.env.JWT_SECRET,

                {
                    expiresIn: "7d"
                }

            );


        res.json({

            success: true,

            message:
                "Login successful",

            token,

            user: {

                id: user._id,

                fullName:
                    user.fullName,

                email:
                    user.email,

                studentId:
                    user.studentId,

                branch:
                    user.branch,

                year:
                    user.year

            }

        });

    }

    catch (error) {

        console.error(
            "Login error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Server error during login"

        });

    }

});


module.exports = router;