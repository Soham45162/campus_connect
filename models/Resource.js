const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        subject: {
            type: String,
            required: true,
            trim: true
        },

        fileUrl: {
            type: String,
            required: true,
            trim: true
        },

        fileType: {
            type: String,
            enum: ["PDF", "Document", "Link", "Image", "Zip"],
            default: "PDF"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Resource", resourceSchema);
