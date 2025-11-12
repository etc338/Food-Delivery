import mongoose from "mongoose";

const devliveryAssignmentSchema = new mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    shopOrderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    brodcastedTo:[{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    acceptedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['assigned', 'brodcasted', 'completed'], default: 'brodcasted' },
}, {timestamps: true});

const DeliveryAssignment = mongoose.model('DeliveryAssignment', devliveryAssignmentSchema);
export default DeliveryAssignment;