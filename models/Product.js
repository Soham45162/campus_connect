const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        seller: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        name: {
            type: String,
            required: true
        },

        description: {
            type: String,
            required: true
        },

        category: {
            type: String,
            required: true
        },

        price: {
            type: Number,
            required: true
        },

        condition: {
            type: String,
            enum: [
                "Like New",
                "Good",
                "Used"
            ],
            default: "Good"
        },

        image: {
            type: String,
            default: ""
        },

        location: {
            type: String,
            default: ""
        },

        status: {
            type: String,
            enum: [
                "available",
                "sold"
            ],
            default: "available"
        }
    },
    {
        timestamps: true
    }
);

module.exports =
    mongoose.model("Product", productSchema);