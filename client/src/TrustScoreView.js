import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import Web3 from 'web3';
import TrustScoreABI from "./artifacts/SmartTrustScore.json";
import SupplyChainABI from "./artifacts/SmartSupplyChain.json";
import './TrustScore.css';

function TrustScoreView() {
    const history = useHistory();
    const [loading, setLoading] = useState(true);
    const [participants, setParticipants] = useState([]);
    const [trustScoreContract, setTrustScoreContract] = useState(null);
    const [supplyChainContract, setSupplyChainContract] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const web3 = window.web3 || new Web3(window.ethereum);
            await window.ethereum.enable();

            const networkId = await web3.eth.net.getId();
            
            // Load TrustScore contract
            const trustScoreData = TrustScoreABI.networks[networkId];
            const supplyChainData = SupplyChainABI.networks[networkId];

            if (trustScoreData && supplyChainData) {
                const trustScore = new web3.eth.Contract(TrustScoreABI.abi, trustScoreData.address);
                const supplyChain = new web3.eth.Contract(SupplyChainABI.abi, supplyChainData.address);
                
                setTrustScoreContract(trustScore);
                setSupplyChainContract(supplyChain);

                const participantAddresses = [];
                
                // Get all suppliers
                const rmsCtr = await supplyChain.methods.rmsCtr().call();
                for (let i = 1; i <= rmsCtr; i++) {
                    const rms = await supplyChain.methods.RMS(i).call();
                    participantAddresses.push({ address: rms.addr, name: rms.name, type: 'Supplier' });
                }

                // Get all manufacturers
                const manCtr = await supplyChain.methods.manCtr().call();
                for (let i = 1; i <= manCtr; i++) {
                    const man = await supplyChain.methods.MAN(i).call();
                    participantAddresses.push({ address: man.addr, name: man.name, type: 'Manufacturer' });
                }

                // Get all distributors
                const disCtr = await supplyChain.methods.disCtr().call();
                for (let i = 1; i <= disCtr; i++) {
                    const dis = await supplyChain.methods.DIS(i).call();
                    participantAddresses.push({ address: dis.addr, name: dis.name, type: 'Distributor' });
                }

                // Get all retailers
                const retCtr = await supplyChain.methods.retCtr().call();
                for (let i = 1; i <= retCtr; i++) {
                    const ret = await supplyChain.methods.RET(i).call();
                    participantAddresses.push({ address: ret.addr, name: ret.name, type: 'Retailer' });
                }

                // Get TrustScore details for each
                const participantsWithScores = [];
                for (const p of participantAddresses) {
                    try {
                        const exists = await trustScore.methods.participantExists(p.address).call();
                        if (exists) {
                            const details = await trustScore.methods.getParticipantDetails(p.address).call();
                            participantsWithScores.push({
                                ...p,
                                score: parseInt(details.score),
                                successfulDeliveries: parseInt(details.successfulDeliveries),
                                failedDeliveries: parseInt(details.failedDeliveries),
                                flaggedProducts: parseInt(details.flaggedProducts),
                                trustLevel: details.trustLevel
                            });
                        } else {
                            // Participant doesn't have score yet
                            participantsWithScores.push({
                                ...p,
                                score: 50,
                                successfulDeliveries: 0,
                                failedDeliveries: 0,
                                flaggedProducts: 0,
                                trustLevel: 'Silver'
                            });
                        }
                    } catch (e) {
                        console.log('Error loading score for', p.address);
                        participantsWithScores.push({
                            ...p,
                            score: 50,
                            successfulDeliveries: 0,
                            failedDeliveries: 0,
                            flaggedProducts: 0,
                            trustLevel: 'Silver'
                        });
                    }
                }

                // Sort by score
                participantsWithScores.sort((a, b) => b.score - a.score);
                setParticipants(participantsWithScores);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
        setLoading(false);
    };

    const getTrustBadge = (level) => {
        const badges = {
            'Platinum': { icon: '⭐', color: '#9333ea', gradient: 'linear-gradient(135deg, #9333ea, #c084fc)' },
            'Gold': { icon: '🥇', color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
            'Silver': { icon: '🥈', color: '#6b7280', gradient: 'linear-gradient(135deg, #6b7280, #9ca3af)' },
            'Bronze': { icon: '🥉', color: '#92400e', gradient: 'linear-gradient(135deg, #92400e, #d97706)' }
        };
        return badges[level] || badges['Silver'];
    };

    if (loading) {
        return (
            <div className="trustscore-container">
                <h2>Loading TrustScore data...</h2>
            </div>
        );
    }

    return (
        <div className="trustscore-container">
            <div className="header">
                <h1>TrustScore Leaderboard</h1>
                <button onClick={() => history.push('/')} className="btn-home">
                    HOME
                </button>
            </div>

            <div className="leaderboard-intro">
                <p>
                    TrustScore NFTs represent the reputation of supply chain participants.
                    Scores are dynamically calculated based on successful deliveries, risk factors, and performance.
                </p>
            </div>

            <div className="leaderboard">
                {participants.map((participant, index) => {
                    const badge = getTrustBadge(participant.trustLevel);
                    const rank = index + 1;

                    return (
                        <div key={participant.address} className="participant-card">
                            <div className="card-rank">#{rank}</div>
                            
                            <div 
                                className="trust-badge-large" 
                                style={{ background: badge.gradient }}
                            >
                                <div className="badge-icon-large">{badge.icon}</div>
                                <div className="badge-level">{participant.trustLevel}</div>
                            </div>

                            <div className="participant-info">
                                <h3>{participant.name}</h3>
                                <div className="participant-type">{participant.type}</div>
                                <div className="participant-address">
                                    {participant.address.substring(0, 8)}...{participant.address.substring(participant.address.length - 6)}
                                </div>
                            </div>

                            <div className="score-display">
                                <div className="score-number">{participant.score}</div>
                                <div className="score-label">/100</div>
                            </div>

                            <div className="stats-row">
                                <div className="stat">
                                    <div className="stat-value">✓ {participant.successfulDeliveries}</div>
                                    <div className="stat-label">Successful</div>
                                </div>
                                <div className="stat">
                                    <div className="stat-value">✗ {participant.failedDeliveries}</div>
                                    <div className="stat-label">Failed</div>
                                </div>
                                <div className="stat">
                                    <div className="stat-value">⚠ {participant.flaggedProducts}</div>
                                    <div className="stat-label">Flagged</div>
                                </div>
                            </div>

                            <div className="progress-bar">
                                <div 
                                    className="progress-fill" 
                                    style={{ 
                                        width: `${participant.score}%`,
                                        background: badge.color
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {participants.length === 0 && (
                <div className="empty-state">
                    <p>No participants with TrustScores yet.</p>
                    <p>Register participants in the supply chain to see their reputation scores.</p>
                </div>
            )}

            <div className="legend">
                <h3>TrustScore Tiers</h3>
                <div className="legend-grid">
                    <div className="legend-item">
                        <span className="legend-badge" style={{ background: '#9333ea' }}>⭐</span>
                        <span>Platinum (80-100)</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-badge" style={{ background: '#f59e0b' }}>🥇</span>
                        <span>Gold (60-79)</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-badge" style={{ background: '#6b7280' }}>🥈</span>
                        <span>Silver (40-59)</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-badge" style={{ background: '#92400e' }}>🥉</span>
                        <span>Bronze (0-39)</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TrustScoreView;
