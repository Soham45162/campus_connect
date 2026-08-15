const express = require("express");
const Resource = require("../models/Resource");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// ==========================================
// GET ALL RESOURCES
// GET /api/resources
// ==========================================
router.get("/", authMiddleware, async (req, res) => {
    try {
        const resources = await Resource.find()
            .populate("user", "fullName branch year")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: resources.length,
            resources
        });
    } catch (error) {
        console.error("GET RESOURCES ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch study resources."
        });
    }
});

// ==========================================
// CREATE A RESOURCE
// POST /api/resources
// ==========================================
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { title, description, subject, fileUrl, fileType } = req.body;

        if (!title || !description || !subject || !fileUrl) {
            return res.status(400).json({
                success: false,
                message: "Please provide title, description, subject, and file URL."
            });
        }

        const resource = await Resource.create({
            user: req.user.userId,
            title,
            description,
            subject,
            fileUrl,
            fileType: fileType || "PDF"
        });

        res.status(201).json({
            success: true,
            message: "Study resource shared successfully.",
            resource
        });
    } catch (error) {
        console.error("CREATE RESOURCE ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Failed to share study resource."
        });
    }
});

// ==========================================
// DELETE A RESOURCE
// DELETE /api/resources/:id
// ==========================================
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);

        if (!resource) {
            return res.status(404).json({
                success: false,
                message: "Resource not found."
            });
        }

        // Check ownership
        if (resource.user.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this resource."
            });
        }

        await Resource.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: "Resource deleted successfully."
        });
    } catch (error) {
        console.error("DELETE RESOURCE ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete resource."
        });
    }
});

module.exports = router;
