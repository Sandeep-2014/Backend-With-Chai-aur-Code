import mongoose from "mongoose";

// Mini Schema
const orderItmeSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
    },
    qunatity: {
        type: Number,
        requred: true
    }
})

const orderSchema = new mongoose.Schema({
    orderPrice: {
        type: Number,
        requred: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    orderItems: {
        type: [orderItmeSchema]
    },
    address: {
        type: String,
        requred: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'CANCELLED', 'DELIVERED'],
        default: 'PENDING'
    }
}, {timestamps: true})

export const Order = mongoose.model('Order', orderSchema)