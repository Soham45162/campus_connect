const express = require("express");

const Message = require("../models/Message");

const router = express.Router();


// ==========================================
// GET MESSAGES BETWEEN TWO USERS
// GET /api/messages/:user1/:user2
// ==========================================

router.get(
    "/:user1/:user2",
    async (req, res) => {

        try {

            const {
                user1,
                user2
            } = req.params;


            const messages =
                await Message.find({

     
     
     
                    $or: [

                        {
                            sender: user1,
                            receiver: user2
                        },

                        {
                            sender: user2,
                            receiver: user1
                        }

                    ]

                })
                .sort({
                    createdAt: 1
                });


            res.json({

                success: true,

                messages

            });

        }

        catch (error) {

            console.error(
                "Get messages error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to fetch messages"

            });

        }

    }
);


// ==========================================
// SEND MESSAGE
// POST /api/messages
// ==========================================

router.post("/", async (req, res) => {

    try {

        const {
            sender,
            receiver,
            message
        } = req.body;


        if (
            !sender ||
            !receiver ||
            !message
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Sender, receiver and message are required"

            });

        }


        const newMessage =
            await Message.create({

                sender,

                receiver,

                message

            });


        res.status(201).json({

            success: true,

            message:
                "Message sent",

            data:
                newMessage

        });

    }

    catch (error) {

        console.error(
            "Send message error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to send message"

        });

    }

});


module.exports = router;