
import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import Web3 from 'web3';
import SupplyChainABI from "./artifacts/SmartSupplyChain.json";
import './AntiCounterfeit.css';

function AntiCounterfeit() {
    const history = useHistory();
    const [loading, setLoading] = useState(true);
    const [supplyChain, setSupplyChain] = useState(null);
    const [flaggedProducts, setFlaggedProducts] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [riskAnalysis, setRiskAnalysis] = useState({});

    useEffect(() => {
        loadBlockchainData();
    }, []);

    const loadBlockchainData = async () => {
        setLoading(true);
        try {
            const web3 = window.web3 || new Web3(window.ethereum);
            await window.ethereum.enable();

            const networkId = await web3.eth.net.getId();
            const networkData = SupplyChainABI.networks[networkId];

            if (networkData) {
                const contract = new web3.eth.Contract(SupplyChainABI.abi, networkData.address);
                setSupplyChain(contract);

                const medCtr = await contract.methods.medicineCtr().call();
                const products = [];
                const flagged = [];

                for (let i = 1; i <= medCtr; i++) {
                    const med = await contract.methods.MedicineStock(i).call();
                    const riskScore = await contract.methods.riskScores(i).call();
                    const isFlagged = await contract.methods.flaggedProducts(i).call();
                    const isRecalled = await contract.methods.recalledProducts(i).call();

                    const productData = {
                        ...med,
                        riskScore: parseInt(riskScore),
                        isFlagged,
                        isRecalled
                    };

                    products.push(productData);

                    if (isFlagged || isRecalled) {
                        flagged.push(productData);
                    }

                    // Analyze risk if backend available
                    try {
                        const historyCount = await contract.methods.getProductHistoryCount(i).call();
                        if (historyCount > 0) {
                            const history = await contract.methods.getProductHistory(i).call();
                            analyzeProductRisk(i, history);
                        }
                    } catch (e) {
                        console.log('History not available for product', i);
                    }
                }

                setAllProducts(products);
                setFlaggedProducts(flagged);
            }
        } catch (error) {
            console.error('Error loading blockchain data:', error);
        }
        setLoading(false);
    };

    const analyzeProductRisk = async (productId, productHistory) => {
        try {
            const response = await fetch('http://localhost:5000/api/analyze-risk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, productHistory })
            });

            if (response.ok) {
                const analysis = await response.json();
                setRiskAnalysis(prev => ({ ...prev, [productId]: analysis }));

                // Update risk score on blockchain if high
                if (analysis.riskScore >= 70 && supplyChain) {
                    const accounts = await window.web3.eth.getAccounts();
                    await supplyChain.methods
                        .updateRiskScore(productId, analysis.riskScore)
                        .send({ from: accounts[0] });
                }
            }
        } catch (error) {
            console.log('Risk analysis service not available:', error.message);
        }
    };

    const getRiskLevel = (score) => {
        if (score >= 80) return { level: 'CRITICAL', color: '#dc2626', icon: '🚨' };
        if (score >= 70) return { level: 'HIGH', color: '#ea580c', icon: '⚠️' };
        if (score >= 40) return { level: 'MEDIUM', color: '#f59e0b', icon: '⚡' };
        return { level: 'LOW', color: '#16a34a', icon: '✓' };
    };

    const handleRecall = async (productId) => {
        if (!window.confirm('Are you sure you want to recall this product?')) return;

        const reason = prompt('Enter recall reason:');
        if (!reason) return;

        try {
            const accounts = await window.web3.eth.getAccounts();
            await supplyChain.methods
                .recallProduct(productId, reason)
                .send({ from: accounts[0] });

            alert('Product recalled successfully!');
            loadBlockchainData();
        } catch (error) {
            alert('Error recalling product: ' + error.message);
        }
    };

    const handleUnflag = async (productId) => {
        try {
            const accounts = await window.web3.eth.getAccounts();
            await supplyChain.methods
                .unflagProduct(productId)
                .send({ from: accounts[0] });

            alert('Product unflagged successfully!');
            loadBlockchainData();
        } catch (error) {
            alert('Error unflagging product: ' + error.message);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <h2>Loading Anti-Counterfeit Dashboard...</h2>
            </div>
        );
    }

    return (
        <div className="anti-counterfeit-container">
            <div className="header">
                <h1>🛡️ Anti-Counterfeit Intelligence Dashboard</h1>
                <button onClick={() => history.push('/')} className="btn-home">
                    HOME
                </button>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-value">{allProducts.length}</div>
                    <div className="stat-label">Total Products</div>
                </div>
                <div className="stat-card flagged">
                    <div className="stat-value">{flaggedProducts.length}</div>
                    <div className="stat-label">Flagged Products</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">
                        {flaggedProducts.filter(p => p.isRecalled).length}
                    </div>
                    <div className="stat-label">Recalled</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">
{(((allProducts.length - flaggedProducts.length) / allProducts.length) * 100).toFixed(1)}%
                    </div>
                    <div className="stat-label">Safety Rate</div>
                </div>
            </div>

            <div className="section">
                <h2>🚨 Flagged & High-Risk Products</h2>
                {flaggedProducts.length === 0 ? (
                    <div className="empty-state">
                        <p>✓ No flagged products - All clear!</p>
                    </div>
                ) : (
                    <div className="products-grid">
                        {flaggedProducts.map(product => {
                            const risk = getRiskLevel(product.riskScore);
                            const analysis = riskAnalysis[product.id];

                            return (
                                <div key={product.id} className="product-card flagged-card">
                                    <div className="product-header">
                                        <h3>{product.name}</h3>
                                        <span
                                            className="risk-badge"
                                            style={{ backgroundColor: risk.color }}
                                        >
                                            {risk.icon} {risk.level}
                                        </span>
                                    </div>

                                    <div className="product-details">
                                        <p><strong>ID:</strong> {product.id}</p>
                                        <p><strong>Description:</strong> {product.description}</p>
                                        <p><strong>Risk Score:</strong> {product.riskScore}/100</p>
                                        {product.isRecalled && (
                                            <div className="recall-badge">
                                                ⛔ RECALLED
                                            </div>
                                        )}
                                    </div>

                                    {analysis && analysis.anomalies && (
                                        <div className="anomalies">
                                            <h4>Detected Anomalies:</h4>
                                            {analysis.anomalies.map((anomaly, idx) => (
                                                <div key={idx} className="anomaly-item">
                                                    <span className="anomaly-type">{anomaly.type}</span>
                                                    <span className="anomaly-severity">{anomaly.severity}</span>
                                                    <p>{anomaly.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="product-actions">
                                        {!product.isRecalled && (
                                            <>
                                                <button
                                                    onClick={() => handleRecall(product.id)}
                                                    className="btn-recall"
                                                >
                                                    Recall Product
                                                </button>
                                                <button
                                                    onClick={() => handleUnflag(product.id)}
                                                    className="btn-unflag"
                                                >
                                                    Unflag
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="section">
                <h2>📊 All Products Overview</h2>
                <table className="products-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Risk Score</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allProducts.map(product => {
                            const risk = getRiskLevel(product.riskScore);
                            return (
                                <tr key={product.id} className={product.isFlagged ? 'flagged-row' : ''}>
                                    <td>{product.id}</td>
                                    <td>{product.name}</td>
                                    <td>{product.description}</td>
                                    <td>
                                        <span className="risk-indicator" style={{ color: risk.color }}>
                                            {risk.icon} {product.riskScore}/100
                                        </span>
                                    </td>
                                    <td>
                                        {product.isRecalled && <span className="status-badge recalled">Recalled</span>}
                                        {product.isFlagged && !product.isRecalled && (
                                            <span className="status-badge flagged">Flagged</span>
                                        )}
                                        {!product.isFlagged && !product.isRecalled && (
                                            <span className="status-badge safe">Safe</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <button onClick={loadBlockchainData} className="btn-refresh">
                🔄 Refresh Data
            </button>
        </div>
    );
}

export default AntiCounterfeit;
