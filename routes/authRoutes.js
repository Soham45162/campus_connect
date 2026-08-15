const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const router = express.Router();


// ======================================================
// REGISTER
// ======================================================

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


        if (
            !fullName ||
            !email ||
            !password
        ) {

            return res.status(400).json({
                message:
                    "Full name, email and password are required."
            });

        }


        const existingUser =
            await User.findOne({
                email: email.toLowerCase()
            });


        if (existingUser) {

            return res.status(409).json({
                message:
                    "An account with this email already exists."
            });

        }


        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );


        const user =
            await User.create({

                fullName,

                email:
                    email.toLowerCase(),

                password:
                    hashedPassword,

                studentId:
                    studentId || "",

                branch:
                    branch || "",

                year:
                    year || ""

            });


        res.status(201).json({

            message:
                "Registration successful.",

            user: {

                id:
                    user._id,

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
            "REGISTER ERROR:",
            error
        );

        res.status(500).json({
            message:
                "Registration failed."
        });

    }

});


// ======================================================
// LOGIN
// ======================================================

router.post("/login", async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;


        if (!email || !password) {

            return res.status(400).json({
                message:
                    "Email and password are required."
            });

        }


        // Find user
        const user =
            await User.findOne({
                email:
                    email.toLowerCase()
            });


        if (!user) {

            return res.status(401).json({
                message:
                    "Invalid email or password."
            });

        }


        // Check active account
        if (!user.isActive) {

            return res.status(403).json({
                message:
                    "Your account is inactive."
            });

        }


        // Compare password
        const passwordCorrect =
            await bcrypt.compare(
                password,
                user.password
            );


        if (!passwordCorrect) {

            return res.status(401).json({
                message:
                    "Invalid email or password."
            });

        }


        // ==================================================
        // CREATE JWT
        // ==================================================

        const token =
            jwt.sign(

                {
                    userId:
                        user._id.toString(),

                    email:
                        user.email,

                    fullName:
                        user.fullName

                },

                process.env.JWT_SECRET,

                {
                    expiresIn: "7d"
                }

            );


        // ==================================================
        // RESPONSE
        // ==================================================

        res.status(200).json({

            success: true,

            message:
                "Login successful.",

            token,

            user: {

                id:
                    user._id,

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
            "LOGIN ERROR:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Server error during login."

        });

    }

});


module.exports = router;