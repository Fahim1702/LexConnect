import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dns from 'node:dns';
import Service from './models/Service.js';

// Needed on my network so Node can resolve MongoDB Atlas
dns.setServers(['1.1.1.1', '1.0.0.1']);

const app = express();    //backend application

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(cors());    //enable cross origin requests
app.use(express.json());    //Express understands json sent by frontend

app.get('/api/health', (req, res) => {    // first route
    res.json({
        success: true,
        message: 'LexConnect API is running'
    });
});

app.get('/api/services', async (req, res) => {
    try {
        const services = await Service.find();    //Read operation

        res.json({
            success: true,
            items: services
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
app.get('/api/services/:id', async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);

        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }

        res.json({
            success: true,
            item: service
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid service ID'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to fetch service'
        });
    }
});

app.post('/api/services', async (req, res) => {     // CREATE OP
    try {
        const service = await Service.create(req.body);

        res.status(201).json({
            success: true,
            item: service
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

app.put('/api/services/:id', async (req, res) => {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid service ID'
        });
    }

    try {
        // Only allow changes to the editable service fields.
        const { title, category, description, isActive } = req.body || {};
        const service = await Service.findByIdAndUpdate(
            req.params.id,
            { $set: { title, category, description, isActive } },
            { new: true, runValidators: true }
        );

        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }

        res.json({
            success: true,
            item: service
        });
    } catch (error) {
        if (error.name === 'ValidationError' || error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to update service'
        });
    }
});

app.get('/', (req, res) => {
    res.send('LexConnect backend is running');
});
async function startServer() {
    try {
        await mongoose.connect(MONGODB_URI);

        console.log('MongoDB connected');

        app.listen(PORT, () => {    // after MONGODB connects we start EXPRESS
            console.log(`Server running on http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error('Database connection failed:', error.message);
    }
}

startServer();