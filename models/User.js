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
            trim: true,
            default: ""
        },

        branch: {
            type: String,
            trim: true,
            default: ""
        },

        year: {
            type: String,
            trim: true,
            default: ""
        },

        isVerified: {
            type: Boolean,
            default: true
        },

        isActive: {
            type: Boolean,
            default: true
        },

        bio: {
            type: String,
            trim: true,
            default: ""
        },

        skills: {
            type: [String],
            default: []
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);