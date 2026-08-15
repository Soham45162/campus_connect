const express = require("express");

const Question = require("../models/Question");
const Answer = require("../models/Answer");

const router = express.Router();


// ==========================================
// GET ALL QUESTIONS
// GET /api/questions
// ==========================================

router.get("/", async (req, res) => {

    try {

        const questions =
            await Question.find()
            .populate(
                "user",
                "fullName branch year"
            )
            .sort({
                createdAt: -1
            });


        res.json({

            success: true,

            count:
                questions.length,

            questions

        });

    }

    catch (error) {

        console.error(
            "Get questions error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to fetch questions"

        });

    }

});


// ==========================================
// GET SINGLE QUESTION
// GET /api/questions/:id
// ==========================================

router.get("/:id", async (req, res) => {

    try {

        const question =
            await Question.findById(
                req.params.id
            )
            .populate(
                "user",
                "fullName branch year"
            );


        if (!question) {

            return res.status(404).json({

                success: false,

                message:
                    "Question not found"

            });

        }


        const answers =
            await Answer.find({
                question:
                    question._id
            })
            .populate(
                "user",
                "fullName branch year"
            )
            .sort({
                createdAt: 1
            });


        question.views += 1;

        await question.save();


        res.json({

            success: true,

            question,

            answers

        });

    }

    catch (error) {

        res.status(500).json({

            success: false,

            message:
                "Failed to fetch question"

        });

    }

});


// ==========================================
// CREATE QUESTION
// POST /api/questions
// ==========================================

router.post("/", async (req, res) => {

    try {

        const {
            user,
            title,
            description,
            subject,
            image
        } = req.body;


        if (
            !user ||
            !title ||
            !description ||
            !subject
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Please provide all required fields"

            });

        }


        const question =
            await Question.create({

                user,

                title,

                description,

                subject,

                image:
                    image || ""

            });


        res.status(201).json({

            success: true,

            message:
                "Question posted successfully",

            question

        });

    }

    catch (error) {

        console.error(
            "Create question error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to post question"

        });

    }

});


// ==========================================
// ADD ANSWER
// POST /api/questions/:id/answers
// ==========================================

router.post(
    "/:id/answers",
    async (req, res) => {

        try {

            const {
                user,
                answer
            } = req.body;


            if (!user || !answer) {

                return res.status(400).json({

                    success: false,

                    message:
                        "User and answer are required"

                });

            }


            const question =
                await Question.findById(
                    req.params.id
                );


            if (!question) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Question not found"

                });

            }


            const newAnswer =
                await Answer.create({

                    question:
                        question._id,

                    user,

                    answer

                });


            const populatedAnswer =
                await Answer.findById(
                    newAnswer._id
                )
                .populate(
                    "user",
                    "fullName branch year"
                );


            res.status(201).json({

                success: true,

                message:
                    "Answer added successfully",

                answer:
                    populatedAnswer

            });

        }

        catch (error) {

            console.error(
                "Answer error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to add answer"

            });

        }

    }
);


// ==========================================
// DELETE QUESTION
// DELETE /api/questions/:id
// ==========================================

router.delete("/:id", async (req, res) => {

    try {

        const question =
            await Question.findByIdAndDelete(
                req.params.id
            );


        if (!question) {

            return res.status(404).json({

                success: false,

                message:
                    "Question not found"

            });

        }


        await Answer.deleteMany({

            question:
                question._id

        });


        res.json({

            success: true,

            message:
                "Question deleted successfully"

        });

    }

    catch (error) {

        res.status(500).json({

            success: false,

            message:
                "Failed to delete question"

        });

    }

});


module.exports = router;