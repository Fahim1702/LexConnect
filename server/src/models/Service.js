import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({  // defines the structure of a legal service document
    title: {
        type: String,
        required: true
    },

    category: {
        type: String,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    isActive: {
        type: Boolean,
        default: true
    }
});

const Service = mongoose.model('Service', serviceSchema);

export default Service;