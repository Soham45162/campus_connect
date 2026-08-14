const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true
        },

        studentId: {
            type: String,
            required: true,
            unique: true
        },

        branch: {
            type: String,
            default: "CSE"
        },

        year: {
            type: Number,
            default: 2
        },

        isVerified: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

module.exports =
    mongoose.model("User", userSchema);