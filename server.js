const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json());

// SMS API Configuration
const SMS_API_KEY = 'Rkg7M6FcneYUE0g1AUsy';
const SMS_API_URL = 'https://sms.staticking.com/index.php/smsapi/httpapi/';
const SENDER_ID = 'TLODGE';
const TEMPLATE_ID = '1007533043212447410'; // OTP Template
const ROUTE = 'TA'; // Transactional Route

// Store OTPs temporarily (in production, use Redis or database)
const otpStorage = new Map();

// Generate random 4-digit OTP
function generateOTP() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

// Mock Data for Hotels
const mockHotels = [
    {
        id: 1,
        name: 'RROOMS Eco Hotel Yamuna Palace',
        city: 'Karol Bagh',
        ratting: '4.2',
        ratting_count: 1847,
        room_price: '3838',
        offer_price: '2875',
        stars: 4,
        images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&h=200&fit=crop']
    },
    {
        id: 2,
        name: 'RROOMS Eco Hotel Awadh Airport',
        city: 'Transport Nagar',
        ratting: '4.1',
        ratting_count: 1203,
        room_price: '5092',
        offer_price: '3819',
        stars: 3,
        images: ['https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=200&fit=crop']
    },
    {
        id: 3,
        name: 'RROOMS Premium Stay',
        city: 'Hazratganj',
        ratting: '4.5',
        ratting_count: 892,
        room_price: '4500',
        offer_price: '3375',
        stars: 5,
        images: ['https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=300&h=200&fit=crop']
    }
];

// Mock Data for Bookings
const mockBookings = [
    {
        id: 1,
        hotel_name: 'RROOMS Eco Hotel Yamuna Palace',
        check_in: '2024-01-15',
        check_out: '2024-01-17',
        status: 'confirmed',
        total_amount: 5000,
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&h=200&fit=crop'
    },
    {
        id: 2,
        hotel_name: 'RROOMS Premium Stay',
        check_in: '2024-02-10',
        check_out: '2024-02-12',
        status: 'pending',
        total_amount: 3500,
        image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=300&h=200&fit=crop'
    }
];

// Mock Data for Cities
const mockCities = [
    {
        id: 1,
        city: 'Meerut',
        image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=150&h=150&fit=crop',
        is_on_home_page: 1
    },
    {
        id: 2,
        city: 'Lucknow',
        image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=150&h=150&fit=crop',
        is_on_home_page: 1
    },
    {
        id: 3,
        city: 'Agra',
        image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=150&h=150&fit=crop',
        is_on_home_page: 1
    },
    {
        id: 4,
        city: 'Bareilly',
        image: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=150&h=150&fit=crop',
        is_on_home_page: 1
    },
    {
        id: 5,
        city: 'Moradabad',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=150&h=150&fit=crop',
        is_on_home_page: 1
    }
];

// GET /api/v1/bookings - Get user bookings
app.get('/api/v1/bookings', (req, res) => {
    setTimeout(() => {
        res.json({
            success: true,
            data: mockBookings
        });
    }, 500);
});

// GET /api/v1/cities - Get all cities
app.get('/api/v1/cities', (req, res) => {
    setTimeout(() => {
        res.json({
            success: true,
            data: mockCities
        });
    }, 500);
});

// GET /api/v1/hotels - Get all hotels
app.get('/api/v1/hotels', (req, res) => {
    // Simulate network delay
    setTimeout(() => {
        res.json({
            success: true,
            data: mockHotels
        });
    }, 500);
});

// GET /api/v1/hotel_details - Get hotel details
app.get('/api/v1/hotel_details', (req, res) => {
    const { hotel_id } = req.query;
    const hotel = mockHotels.find(h => h.id == hotel_id);

    if (hotel) {
        res.json({
            success: true,
            data: hotel
        });
    } else {
        res.status(404).json({
            success: false,
            message: 'Hotel not found'
        });
    }
});

// POST /api/send-otp - Send OTP to phone number
app.post('/api/send-otp', async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required'
            });
        }

        // Generate OTP
        const otp = generateOTP();

        // Format message with OTP (replaces {#var#} in template)
        const message = `Dear User, ${otp} is your one-time password (OTP) for logging into TLU. Please enter OTP to proceed.`;

        // Prepare API URL with all required parameters
        const params = new URLSearchParams({
            secret: SMS_API_KEY,
            sender: SENDER_ID,
            tempid: TEMPLATE_ID,
            receiver: phoneNumber.replace('+', '').replace(/^0+/, ''), // Remove + and leading zeros
            route: ROUTE,
            msgtype: '1',
            sms: message,
        });

        // Call SMS API
        console.log('📞 Sending SMS to:', phoneNumber);
        console.log('🔐 OTP:', otp);

        const response = await fetch(`${SMS_API_URL}?${params.toString()}`);
        const responseText = await response.text();

        console.log('📡 API Response:', responseText);

        if (response.ok || responseText.includes('success')) {
            // Store OTP with expiration (5 minutes)
            otpStorage.set(phoneNumber, {
                otp: otp,
                expiresAt: Date.now() + 5 * 60 * 1000
            });

            console.log('✅ OTP stored for:', phoneNumber);

            return res.json({
                success: true,
                message: `OTP sent to ${phoneNumber}`
            });
        } else {
            console.error('❌ SMS API Error:', responseText);
            return res.status(500).json({
                success: false,
                message: `SMS API Error: ${responseText}`
            });
        }
    } catch (error) {
        console.error('❌ Send OTP Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to send OTP'
        });
    }
});

// POST /api/verify-otp - Verify OTP
app.post('/api/verify-otp', (req, res) => {
    try {
        const { phoneNumber, otp } = req.body;

        if (!phoneNumber || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and OTP are required'
            });
        }

        // Get stored OTP
        const stored = otpStorage.get(phoneNumber);

        if (!stored) {
            return res.status(400).json({
                success: false,
                message: 'No OTP found for this number'
            });
        }

        // Check if expired
        if (Date.now() > stored.expiresAt) {
            otpStorage.delete(phoneNumber);
            return res.status(400).json({
                success: false,
                message: 'OTP expired. Please request a new one.'
            });
        }

        // Verify OTP
        if (stored.otp === otp) {
            otpStorage.delete(phoneNumber); // Clear after verification
            return res.json({
                success: true,
                message: 'OTP verified successfully'
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP'
            });
        }
    } catch (error) {
        console.error('Verify OTP Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to verify OTP'
        });
    }
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'Running',
        message: 'RROOMS Backend API',
        endpoints: {
            sendOTP: 'POST /api/send-otp',
            verifyOTP: 'POST /api/verify-otp',
            health: 'GET /health'
        }
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Backend server running' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`📱 SMS API integrated and ready!`);
});
