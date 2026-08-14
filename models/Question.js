const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        title: {
            type: String,
            required: true
        },

        description: {
            type: String,
            required: true
        },

        subject: {
            type: String,
            required: true
        },

        image: {
            type: String,
            default: ""
        },

        views: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

module.exports =
    mongoose.model("Question", questionSchema);