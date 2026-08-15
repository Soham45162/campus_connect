const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const authMiddleware = require("../middlewares/authMiddleware");

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


// ======================================================
// GET PROFILE
// ======================================================
router.get("/profile", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select("-password");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }
        res.json({ success: true, user });
    } catch (error) {
        console.error("GET PROFILE ERROR:", error);
        res.status(500).json({ success: false, message: "Failed to fetch profile." });
    }
});


// ======================================================
// UPDATE PROFILE
// ======================================================
router.put("/profile", authMiddleware, async (req, res) => {
    try {
        const { fullName, studentId, branch, year, bio, skills } = req.body;
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        if (fullName) user.fullName = fullName;
        if (studentId !== undefined) user.studentId = studentId;
        if (branch !== undefined) user.branch = branch;
        if (year !== undefined) user.year = year;
        if (bio !== undefined) user.bio = bio;
        if (skills !== undefined) user.skills = skills;

        await user.save();

        res.json({
            success: true,
            message: "Profile updated successfully.",
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                studentId: user.studentId,
                branch: user.branch,
                year: user.year,
                bio: user.bio,
                skills: user.skills
            }
        });
    } catch (error) {
        console.error("UPDATE PROFILE ERROR:", error);
        res.status(500).json({ success: false, message: "Failed to update profile." });
    }
});


// ======================================================
// GET BUDDIES
// ======================================================
router.get("/buddies", authMiddleware, async (req, res) => {
    try {
        // Find all active users except the current user
        const buddies = await User.find({
            _id: { $ne: req.user.userId },
            isActive: true
        }).select("-password");

        res.json({
            success: true,
            buddies
        });
    } catch (error) {
        console.error("GET BUDDIES ERROR:", error);
        res.status(500).json({ success: false, message: "Failed to fetch buddies." });
    }
});


module.exports = router;