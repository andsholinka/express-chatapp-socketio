import Conversation from "../models/conversation.model.js"
import Message from "../models/message.model.js"
import {
    getReceiverSocketId,
    io
} from "../socket/socket.js";

export const sendMessage = async (req, res) => {
    try {
        const {
            message
        } = req.body

        const {
            id: receiverId
        } = req.params

        const senderId = req.user.id

        let conversation = await Conversation.findOne({
            participants: {
                $all: [senderId, receiverId]
            }
        })

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId],
            })
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            message
        })

        if (newMessage) {
            conversation.messages.push(newMessage.id)
        }

        await Promise.all([conversation.save(), newMessage.save()])

        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.status(200).json({
            status: res.statusCode,
            message: "Message sent successfully",
            data: {
                id: newMessage.id,
                senderId,
                receiverId,
                message
            }
        })

    } catch (error) {
        res.status(500).json({
            status: res.statusCode,
            message: "Internal server error"
        })
    }
}

export const getMessages = async (req, res) => {
    try {
        const {
            id: userToChatId
        } = req.params

        const senderId = req.user.id

        const conversation = await Conversation.findOne({
            participants: {
                $all: [senderId, userToChatId]
            }
        }).populate("messages")

        if (!conversation) {
            return res.status(200).json({
                status: res.statusCode,
                message: "Conversation not found",
                data: []
            })
        }

        const messages = conversation.messages;

        res.status(200).json({
            status: res.statusCode,
            message: "Messages fetched successfully",
            data: messages
        })

    } catch (error) {
        res.status(500).json({
            status: res.statusCode,
            message: "Internal server error"
        })
    }
}