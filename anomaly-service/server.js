const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const riskAnalyzer = require('./riskAnalyzer');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'anomaly-detection' });
});

// Analyze risk for a product
app.post('/api/analyze-risk', async (req, res) => {
    try {
        const { productId, productHistory } = req.body;

        if (!productId || !productHistory) {
            return res.status(400).json({ 
                error: 'Missing required fields: productId, productHistory' 
            });
        }

        const riskAnalysis = await riskAnalyzer.analyzeProduct(productId, productHistory);
        
        res.json(riskAnalysis);
    } catch (error) {
        console.error('Risk analysis error:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
});

// Get all flagged products
app.get('/api/flagged-products', (req, res) => {
    try {
        const flaggedProducts = riskAnalyzer.getFlaggedProducts();
        res.json({ flaggedProducts });
    } catch (error) {
        console.error('Error fetching flagged products:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get supplier analytics
app.get('/api/supplier-analytics/:address', (req, res) => {
    try {
        const { address } = req.params;
        const analytics = riskAnalyzer.getSupplierAnalytics(address);
        res.json(analytics);
    } catch (error) {
        console.error('Error fetching supplier analytics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Clear flagged products cache (for testing)
app.post('/api/clear-cache', (req, res) => {
    try {
        riskAnalyzer.clearCache();
        res.json({ message: 'Cache cleared successfully' });
    } catch (error) {
        console.error('Error clearing cache:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Anomaly Detection Service running on port ${PORT}`);
    console.log(`📊 Risk threshold: ${process.env.RISK_THRESHOLD || 70}`);
    console.log(`⏰ Time gap warning: ${process.env.TIME_GAP_WARNING || 86400}s`);
});
