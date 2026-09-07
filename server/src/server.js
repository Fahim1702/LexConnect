import './config/env.js';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import Service from './models/Service.js';
import ConsultationRequest from './models/ConsultationRequest.js';
import Lawyer from './models/Lawyer.js';
import publicRoutes from './routes/publicRoutes.js';
import { connectDatabase } from './config/db.js';
import { notFound, errorHandler } from './middleware/errors.js';

const app = express();    //backend application

const PORT = process.env.PORT || 5000;
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((origin) => origin.trim());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());    //Express understands json sent by frontend
app.use('/api/public', publicRoutes);

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

app.delete('/api/services/:id', async (req, res) => {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid service ID'
        });
    }

    try {
        // Delete the service whose _id matches the URL parameter.
        const service = await Service.findByIdAndDelete(req.params.id);

        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }

        res.json({
            success: true,
            message: 'Service deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete service'
        });
    }
});

app.post('/api/consultations', async (req, res) => {
    // Read only the fields a client can supply when submitting a request.
    const { guestName, guestEmail, guestPhone, service, subject, details, preferredDate, preferredLawyer } = req.body || {};

    if (!mongoose.isObjectIdOrHexString(service)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid service ID'
        });
    }

    try {
        const selectedService = await Service.findById(service);

        if (!selectedService) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }

        if (!selectedService.isActive) {
            return res.status(400).json({
                success: false,
                message: 'This service is not currently available'
            });
        }

        if (preferredLawyer !== undefined && preferredLawyer !== '' && preferredLawyer !== null) {
            if (!mongoose.isObjectIdOrHexString(preferredLawyer)) {
                return res.status(400).json({ success: false, message: 'Invalid preferred lawyer ID' });
            }
            const lawyer = await Lawyer.findOne({ _id: preferredLawyer, isActive: true });
            if (!lawyer) {
                return res.status(400).json({ success: false, message: 'The preferred lawyer is not available' });
            }
        }

        const request = await ConsultationRequest.create({
            guestName,
            guestEmail,
            guestPhone,
            service,
            subject,
            details,
            preferredLawyer: preferredLawyer || undefined,
            preferredDate: preferredDate === '' ? undefined : preferredDate
        });

        res.status(201).json({
            success: true,
            message: 'Consultation request submitted.',
            request
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
            message: 'Failed to create consultation request'
        });
    }
});

app.get('/api/consultations', async (req, res) => {
    try {
        // Show the newest requests first, with the selected service's details.
        const requests = await ConsultationRequest.find()
            .populate('service', 'title category')
            .sort({ createdAt: -1, _id: -1 });

        res.json({
            success: true,
            items: requests
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch consultation requests'
        });
    }
});

app.get('/api/consultations/:id', async (req, res) => {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid consultation ID'
        });
    }

    try {
        const request = await ConsultationRequest.findById(req.params.id)
            .populate('service', 'title category');

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Consultation request not found'
            });
        }

        res.json({
            success: true,
            item: request
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch consultation request'
        });
    }
});

app.put('/api/consultations/:id', async (req, res) => {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid consultation ID'
        });
    }

    const { status } = req.body || {};

    if (typeof status !== 'string' || !status.trim()) {
        return res.status(400).json({
            success: false,
            message: 'Status is required and must be a non-empty string'
        });
    }

    try {
        // Only status can change here; the schema checks its allowed values.
        const request = await ConsultationRequest.findByIdAndUpdate(
            req.params.id,
            { $set: { status } },
            { new: true, runValidators: true }
        ).populate('service', 'title category');

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Consultation request not found'
            });
        }

        res.json({
            success: true,
            item: request
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
            message: 'Failed to update consultation request'
        });
    }
});

app.get('/', (req, res) => {
    res.send('LexConnect backend is running');
});

app.use(notFound);
app.use(errorHandler);

async function startServer() {
    try {
        await connectDatabase();

        const server = app.listen(PORT, () => {    // after MONGODB connects we start EXPRESS
            console.log(`Server running on http://localhost:${PORT}`);
        });
        server.on('error', async (error) => {
            console.error(error.code === 'EADDRINUSE'
                ? `Port ${PORT} is already in use. Stop the other API or change PORT and VITE_API_URL together.`
                : 'Could not start the API listener. Check PORT and local network permissions.');
            await mongoose.disconnect();
            process.exitCode = 1;
        });

    } catch (error) {
        console.error('Database connection failed. Check MONGODB_URI in server/.env, your MongoDB server or Atlas network access, and DNS_SERVERS.');
        await mongoose.disconnect();
        process.exitCode = 1;
    }
}

// Importing the app for tests does not start a server or connect to MongoDB.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    startServer();
}

export default app;
