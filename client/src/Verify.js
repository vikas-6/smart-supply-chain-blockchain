
import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import Web3 from 'web3';
import SupplyChainABI from "./artifacts/SmartSupplyChain.json";
import './Verify.css';

function Verify() {
    const { productId } = useParams();
    const history = useHistory();
    const [loading, setLoading] = useState(true);
    const [product, setProduct] = useState(null);
    const [productHistory, setProductHistory] = useState([]);
    const [rms, setRMS] = useState(null);
    const [man, setMAN] = useState(null);
    const [dis, setDIS] = useState(null);
    const [ret, setRET] = useState(null);
    const [riskScore, setRiskScore] = useState(0);
    const [isFlagged, setIsFlagged] = useState(false);
    const [isRecalled, setIsRecalled] = useState(false);
    const [recallReason, setRecallReason] = useState('');
    const [searchId, setSearchId] = useState('');

    useEffect(() => {
        if (productId) {
            loadProductData(productId);
        } else {
            setLoading(false);
        }
    }, [productId]);

    const loadProductData = async (id) => {
        setLoading(true);
        try {
            const web3 = new Web3('http://127.0.0.1:8545'); // Read-only, no MetaMask needed
            const networkId = await web3.eth.net.getId();
            const networkData = SupplyChainABI.networks[networkId];

            if (networkData) {
                const contract = new web3.eth.Contract(SupplyChainABI.abi, networkData.address);

                const med = await contract.methods.MedicineStock(id).call();
                setProduct(med);

                const risk = await contract.methods.riskScores(id).call();
                setRiskScore(parseInt(risk));

                const flagged = await contract.methods.flaggedProducts(id).call();
                setIsFlagged(flagged);

                const recalled = await contract.methods.recalledProducts(id).call();
                setIsRecalled(recalled);

                if (recalled) {
                    const reason = await contract.methods.recallReasons(id).call();
                    setRecallReason(reason);
                }

                // Load history
                try {
                    const history = await contract.methods.getProductHistory(id).call();
                    setProductHistory(history);
                } catch (e) {
                    console.log('History not available');
                }

                // Load participants
                if (med.RMSid > 0) {
                    const rmsData = await contract.methods.RMS(med.RMSid).call();
                    setRMS(rmsData);
                }
                if (med.MANid > 0) {
                    const manData = await contract.methods.MAN(med.MANid).call();
                    setMAN(manData);
                }
                if (med.DISid > 0) {
                    const disData = await contract.methods.DIS(med.DISid).call();
                    setDIS(disData);
                }
                if (med.RETid > 0) {
                    const retData = await contract.methods.RET(med.RETid).call();
                    setRET(retData);
                }
            }
        } catch (error) {
            console.error('Error loading product:', error);
            alert('Product not found or network error');
        }
        setLoading(false);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchId) {
            history.push(`/verify/${searchId}`);
            window.location.reload(); // Force reload with new ID
        }
    };

    const getAuthenticityStatus = () => {
        if (isRecalled) {
            return { level: 'RECALLED', color: '#7f1d1d', icon: '⛔' };
        }
        if (isFlagged || riskScore >= 70) {
            return { level: 'SUSPICIOUS', color: '#dc2626', icon: '⚠️' };
        }
        if (riskScore >= 40) {
            return { level: 'CAUTION', color: '#f59e0b', icon: '⚡' };
        }
        return { level: 'AUTHENTIC', color: '#16a34a', icon: '✓' };
    };

    const getStageName = (stage) => {
        const stages = ['Ordered', 'Raw Material Supply', 'Manufacturing', 'Distribution', 'Retail', 'Sold'];
        return stages[parseInt(stage)] || 'Unknown';
    };

    const formatTimestamp = (timestamp) => {
        return new Date(parseInt(timestamp) * 1000).toLocaleString();
    };

    if (loading) {
        return (
            <div className="verify-container">
                <h2>Loading product information...</h2>
            </div>
        );
    }

    if (!productId || !product) {
        return (
            <div className="verify-container">
                <div className="verify-header">
                    <h3>Verify Product Authenticity</h3>
<p className="subtitle">Scan QR code or enter product ID to verify</p>
                </div>

                <div className="search-section">
                    <form onSubmit={handleSearch}>
                        <input
                            type="number"
                            placeholder="Enter Product ID"
                            value={searchId}
                            onChange={(e) => setSearchId(e.target.value)}
                            className="search-input"
                            required
                        />
                        <button type="submit" className="search-btn">Verify</button>
                    </form>
                    <p className="help-text">
                        Don't have a product ID? Scan the QR code on your product packaging
                    </p>
                </div>

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">🔐</div>
                        <h3>Blockchain Verified</h3>
                        <p>Every product tracked on immutable blockchain</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🛡️</div>
                        <h3>Anti-Counterfeit</h3>
                        <p>AI-powered fraud detection</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">📍</div>
                        <h3>Full Traceability</h3>
                        <p>Complete supply chain journey</p>
                    </div>
                </div>

                <button onClick={() => history.push('/')} className="btn-secondary">
                    Back to Home
                </button>
            </div>
        );
    }

    const authStatus = getAuthenticityStatus();

    return (
        <div className="verify-container">
            {isRecalled && (
                <div className="recall-alert">
                    <h2>⛔ PRODUCT RECALLED - DO NOT CONSUME</h2>
                    <p><strong>Reason:</strong> {recallReason}</p>
                    <p>Please return this product immediately or contact the manufacturer.</p>
                </div>
            )}

            <div className="product-hero" style={{ borderColor: authStatus.color }}>
                <div className="authenticity-badge" style={{ backgroundColor: authStatus.color }}>
                    <span className="badge-icon">{authStatus.icon}</span>
                    <span className="badge-text">{authStatus.level}</span>
                </div>

                <h1>{product.name}</h1>
                <p className="product-description">{product.description}</p>
                <div className="product-id">Product ID: #{product.id}</div>

                {!isRecalled && (
                    <div className="risk-meter">
                        <div className="meter-label">Authenticity Score</div>
                        <div className="meter-bar">
                            <div
                                className="meter-fill"
                                style={{
                                    width: `${100 - riskScore}%`,
                                    backgroundColor: authStatus.color
                                }}
                            />
                        </div>
                        <div className="meter-value">{100 - riskScore}/100</div>
                    </div>
                )}
            </div>

            <div className="journey-section">
                <h2>📦 Product Journey</h2>
                <div className="timeline">
                    {productHistory.map((event, index) => (
                        <div key={index} className="timeline-item">
                            <div className="timeline-marker" />
                            <div className="timeline-content">
                                <div className="timeline-stage">{getStageName(event.stage)}</div>
                                <div className="timeline-location">📍 {event.location}</div>
                                <div className="timeline-date">{formatTimestamp(event.timestamp)}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="participants-section">
                <h2>👥 Supply Chain Participants</h2>
                <div className="participants-grid">
                    {rms && (
                        <div className="participant-card">
                            <div className="participant-role">Raw Material Supplier</div>
                            <div className="participant-name">{rms.name}</div>
                            <div className="participant-place">📍 {rms.place}</div>
                        </div>
                    )}
                    {man && (
                        <div className="participant-card">
                            <div className="participant-role">Manufacturer</div>
                            <div className="participant-name">{man.name}</div>
                            <div className="participant-place">📍 {man.place}</div>
                        </div>
                    )}
                    {dis && (
                        <div className="participant-card">
                            <div className="participant-role">Distributor</div>
                            <div className="participant-name">{dis.name}</div>
                            <div className="participant-place">📍 {dis.place}</div>
                        </div>
                    )}
                    {ret && (
                        <div className="participant-card">
                            <div className="participant-role">Retailer</div>
                            <div className="participant-name">{ret.name}</div>
                            <div className="participant-place">📍 {ret.place}</div>
                        </div>
                    )}
                </div>
            </div>

            {(isFlagged || riskScore >= 40) && !isRecalled && (
                <div className="warning-section">
                    <h3>⚠️ Important Notice</h3>
                    <p>
                        This product has been flagged for additional verification.
                        Please check with the retailer before use.
                    </p>
                    {isFlagged && (
                        <p className="warning-detail">
                            Risk Score: {riskScore}/100 - Anomalies detected in supply chain
                        </p>
                    )}
                </div>
            )}

            <div className="actions">
                <button onClick={() => window.print()} className="btn-primary">
                    🖨️ Print Certificate
                </button>
                <button onClick={() => history.push('/verify')} className="btn-secondary">
                    Verify Another Product
                </button>
                <button onClick={() => history.push('/')} className="btn-secondary">
                    Back to Home
                </button>
            </div>
        </div>
    );
}

export default Verify;
