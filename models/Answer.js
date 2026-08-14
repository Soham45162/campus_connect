const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
    {
        question: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Question",
            required: true
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        answer: {
            type: String,
            required: true
        },

        isBestAnswer: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

module.exports =
    mongoose.model("Answer", answerSchema);