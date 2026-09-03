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