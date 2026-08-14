const express = require("express");

const Product = require("../models/product");

const router = express.Router();


// ==========================================
// GET ALL PRODUCTS
// GET /api/products
// ==========================================

router.get("/", async (req, res) => {

    try {

        const products =
            await Product.find({
                status: "available"
            })
            .populate(
                "seller",
                "fullName email branch year"
            )
            .sort({
                createdAt: -1
            });


        res.json({

            success: true,

            count:
                products.length,

            products

        });

    }

    catch (error) {

        console.error(
            "Get products error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to fetch products"

        });

    }

});


// ==========================================
// GET SINGLE PRODUCT
// GET /api/products/:id
// ==========================================

router.get("/:id", async (req, res) => {

    try {

        const product =
            await Product.findById(
                req.params.id
            )
            .populate(
                "seller",
                "fullName email branch year"
            );


        if (!product) {

            return res.status(404).json({

                success: false,

                message:
                    "Product not found"

            });

        }


        res.json({

            success: true,

            product

        });

    }

    catch (error) {

        res.status(500).json({

            success: false,

            message:
                "Failed to fetch product"

        });

    }

});


// ==========================================
// CREATE PRODUCT
// POST /api/products
// ==========================================

router.post("/", async (req, res) => {

    try {

        const {
            seller,
            name,
            description,
            category,
            price,
            condition,
            image,
            location
        } = req.body;


        if (
            !seller ||
            !name ||
            !description ||
            !category ||
            price === undefined
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Please provide all required fields"

            });

        }


        const product =
            await Product.create({

                seller,

                name,

                description,

                category,

                price,

                condition:
                    condition || "Good",

                image:
                    image || "",

                location:
                    location || ""

            });


        res.status(201).json({

            success: true,

            message:
                "Product listed successfully",

            product

        });

    }

    catch (error) {

        console.error(
            "Create product error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to create product"

        });

    }

});


// ==========================================
// UPDATE PRODUCT
// PUT /api/products/:id
// ==========================================

router.put("/:id", async (req, res) => {

    try {

        const product =
            await Product.findByIdAndUpdate(

                req.params.id,

                req.body,

                {
                    new: true,
                    runValidators: true
                }

            );


        if (!product) {

            return res.status(404).json({

                success: false,

                message:
                    "Product not found"

            });

        }


        res.json({

            success: true,

            message:
                "Product updated successfully",

            product

        });

    }

    catch (error) {

        res.status(500).json({

            success: false,

            message:
                "Failed to update product"

        });

    }

});


// ==========================================
// MARK PRODUCT AS SOLD
// PATCH /api/products/:id/sold
// ==========================================

router.patch("/:id/sold", async (req, res) => {

    try {

        const product =
            await Product.findByIdAndUpdate(

                req.params.id,

                {
                    status: "sold"
                },

                {
                    new: true
                }

            );


        if (!product) {

            return res.status(404).json({

                success: false,

                message:
                    "Product not found"

            });

        }


        res.json({

            success: true,

            message:
                "Product marked as sold",

            product

        });

    }

    catch (error) {

        res.status(500).json({

            success: false,

            message:
                "Failed to update product"

        });

    }

});


module.exports = router;