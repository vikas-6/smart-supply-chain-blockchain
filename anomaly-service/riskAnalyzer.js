const RISK_THRESHOLD = parseInt(process.env.RISK_THRESHOLD) || 70;
const TIME_GAP_WARNING = parseInt(process.env.TIME_GAP_WARNING) || 86400; // 24 hours in seconds
const LOCATION_DATABASE = {
    // Simulated location validation (in production, use real GPS/geocoding)
    'Mumbai': { region: 'West India', valid: true },
    'Delhi': { region: 'North India', valid: true },
    'Bangalore': { region: 'South India', valid: true },
    'Chennai': { region: 'South India', valid: true },
    'Kolkata': { region: 'East India', valid: true },
    'Hyderabad': { region: 'South India', valid: true },
    'Pune': { region: 'West India', valid: true },
    'System': { region: 'System', valid: true }
};

// In-memory storage for flagged products and analytics
const flaggedProducts = new Map();
const supplierAnalytics = new Map();

class RiskAnalyzer {
    /**
     * Analyze a product's risk based on its history
     */
    async analyzeProduct(productId, productHistory) {
        const anomalies = [];
        let riskScore = 0;

        // 1. Time Gap Analysis
        const timeGapResult = this.analyzeTimeGaps(productHistory);
        if (timeGapResult.anomalyDetected) {
            anomalies.push(timeGapResult);
            riskScore += 25;
        }

        // 2. Location Validation
        const locationResult = this.validateLocations(productHistory);
        if (locationResult.anomalyDetected) {
            anomalies.push(locationResult);
            riskScore += 20;
        }

        // 3. Data Completeness
        const completenessResult = this.checkDataCompleteness(productHistory);
        if (completenessResult.anomalyDetected) {
            anomalies.push(completenessResult);
            riskScore += 15;
        }

        // 4. Duplicate Detection
        const duplicateResult = this.checkDuplicates(productHistory);
        if (duplicateResult.anomalyDetected) {
            anomalies.push(duplicateResult);
            riskScore += 30;
        }

        // 5. Suspicious Actor Behavior
        const actorResult = this.analyzeSuspiciousActors(productHistory);
        if (actorResult.anomalyDetected) {
            anomalies.push(actorResult);
            riskScore += 10;
        }

        // Cap risk score at 100
        riskScore = Math.min(riskScore, 100);

        const isFlagged = riskScore >= RISK_THRESHOLD;

        const result = {
            productId,
            riskScore,
            isFlagged,
            anomalies,
            recommendation: this.getRecommendation(riskScore),
            timestamp: new Date().toISOString()
        };

        // Store flagged products
        if (isFlagged) {
            flaggedProducts.set(productId, result);
        }

        // Update supplier analytics
        this.updateSupplierAnalytics(productHistory, isFlagged);

        return result;
    }

    /**
     * Analyze time gaps between stage transitions
     */
    analyzeTimeGaps(history) {
        if (history.length < 2) {
            return { anomalyDetected: false };
        }

        const suspiciousGaps = [];

        for (let i = 1; i < history.length; i++) {
            const timeDiff = history[i].timestamp - history[i - 1].timestamp;
            
            // Too fast (less than 1 hour)
            if (timeDiff < 3600) {
                suspiciousGaps.push({
                    from: this.getStageName(history[i - 1].stage),
                    to: this.getStageName(history[i].stage),
                    duration: `${Math.floor(timeDiff / 60)} minutes`,
                    issue: 'Impossibly fast transition'
                });
            }
            
            // Too slow (more than configured warning time)
            if (timeDiff > TIME_GAP_WARNING) {
                suspiciousGaps.push({
                    from: this.getStageName(history[i - 1].stage),
                    to: this.getStageName(history[i].stage),
                    duration: `${Math.floor(timeDiff / 86400)} days`,
                    issue: 'Unusually long delay'
                });
            }
        }

        return {
            anomalyDetected: suspiciousGaps.length > 0,
            type: 'TIME_GAP_ANOMALY',
            severity: suspiciousGaps.length > 2 ? 'HIGH' : 'MEDIUM',
            details: suspiciousGaps,
            description: 'Suspicious time gaps detected between stages'
        };
    }

    /**
     * Validate locations make geographical sense
     */
    validateLocations(history) {
        const invalidLocations = [];

        for (const event of history) {
            if (!LOCATION_DATABASE[event.location]) {
                invalidLocations.push({
                    location: event.location,
                    stage: this.getStageName(event.stage),
                    issue: 'Unknown or unverified location'
                });
            }
        }

        return {
            anomalyDetected: invalidLocations.length > 0,
            type: 'LOCATION_ANOMALY',
            severity: 'MEDIUM',
            details: invalidLocations,
            description: 'Invalid or unverified locations detected'
        };
    }

    /**
     * Check if all required data is present
     */
    checkDataCompleteness(history) {
        const missingData = [];

        for (const event of history) {
            if (!event.timestamp || !event.location || event.stage === undefined) {
                missingData.push({
                    stage: this.getStageName(event.stage),
                    issue: 'Missing required data fields'
                });
            }
        }

        return {
            anomalyDetected: missingData.length > 0,
            type: 'DATA_COMPLETENESS_ANOMALY',
            severity: 'LOW',
            details: missingData,
            description: 'Incomplete data detected in product history'
        };
    }

    /**
     * Check for duplicate events
     */
    checkDuplicates(history) {
        const seen = new Set();
        const duplicates = [];

        for (const event of history) {
            const key = `${event.stage}-${event.timestamp}-${event.actor}`;
            if (seen.has(key)) {
                duplicates.push({
                    stage: this.getStageName(event.stage),
                    timestamp: new Date(event.timestamp * 1000).toISOString(),
                    issue: 'Duplicate event detected'
                });
            }
            seen.add(key);
        }

        return {
            anomalyDetected: duplicates.length > 0,
            type: 'DUPLICATE_ANOMALY',
            severity: 'HIGH',
            details: duplicates,
            description: 'Duplicate product events detected - possible counterfeit'
        };
    }

    /**
     * Analyze actor behavior patterns
     */
    analyzeSuspiciousActors(history) {
        // Check if the same actor appears in multiple incompatible roles
        const actorStages = new Map();

        for (const event of history) {
            if (!actorStages.has(event.actor)) {
                actorStages.set(event.actor, []);
            }
            actorStages.get(event.actor).push(event.stage);
        }

        const suspiciousActors = [];
        for (const [actor, stages] of actorStages.entries()) {
            if (stages.length > 2) {
                suspiciousActors.push({
                    actor,
                    stages: stages.map(s => this.getStageName(s)),
                    issue: 'Same actor in multiple stages (possible fraud)'
                });
            }
        }

        return {
            anomalyDetected: suspiciousActors.length > 0,
            type: 'ACTOR_BEHAVIOR_ANOMALY',
            severity: 'MEDIUM',
            details: suspiciousActors,
            description: 'Suspicious actor behavior patterns detected'
        };
    }

    /**
     * Update supplier analytics
     */
    updateSupplierAnalytics(history, isFlagged) {
        for (const event of history) {
            if (!supplierAnalytics.has(event.actor)) {
                supplierAnalytics.set(event.actor, {
                    address: event.actor,
                    totalProducts: 0,
                    flaggedProducts: 0,
                    stages: []
                });
            }

            const analytics = supplierAnalytics.get(event.actor);
            analytics.totalProducts++;
            if (isFlagged) {
                analytics.flaggedProducts++;
            }
            if (!analytics.stages.includes(event.stage)) {
                analytics.stages.push(event.stage);
            }
        }
    }

    /**
     * Get recommendation based on risk score
     */
    getRecommendation(riskScore) {
        if (riskScore >= 80) {
            return 'IMMEDIATE ACTION REQUIRED: Product should be recalled and investigated';
        } else if (riskScore >= 70) {
            return 'HIGH RISK: Flag product and investigate before allowing sale';
        } else if (riskScore >= 40) {
            return 'MEDIUM RISK: Monitor closely and verify with participants';
        } else {
            return 'LOW RISK: Product appears authentic';
        }
    }

    /**
     * Get human-readable stage name
     */
    getStageName(stage) {
        const stages = ['Init', 'RawMaterialSupply', 'Manufacture', 'Distribution', 'Retail', 'Sold'];
        return stages[stage] || 'Unknown';
    }

    /**
     * Get all flagged products
     */
    getFlaggedProducts() {
        return Array.from(flaggedProducts.values());
    }

    /**
     * Get analytics for a specific supplier
     */
    getSupplierAnalytics(address) {
        return supplierAnalytics.get(address) || {
            address,
            totalProducts: 0,
            flaggedProducts: 0,
            stages: []
        };
    }

    /**
     * Clear cache (for testing)
     */
    clearCache() {
        flaggedProducts.clear();
        supplierAnalytics.clear();
    }
}

module.exports = new RiskAnalyzer();
