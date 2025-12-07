import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import TrustScoreABI from "./artifacts/SmartTrustScore.json";
import './TrustScoreLeaderboard.css';

function TrustScoreLeaderboard() {
  const [participants, setParticipants] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadBlockchainData();
  }, []);

  const loadBlockchainData = async () => {
    try {
      if (window.ethereum) {
        window.web3 = new Web3(window.ethereum);
        await window.ethereum.enable();
      } else if (window.web3) {
        window.web3 = new Web3(window.web3.currentProvider);
      } else {
        setError('Please install MetaMask!');
        setLoading(false);
        return;
      }

      const web3 = window.web3;
      const networkId = await web3.eth.net.getId();
      const networkData = TrustScoreABI.networks[networkId];
      
      if (!networkData) {
        setError('TrustScore contract not deployed to detected network.');
        setLoading(false);
        return;
      }

      const trustScoreContract = new web3.eth.Contract(TrustScoreABI.abi, networkData.address);
      
      // Get all participants
      const participantList = await trustScoreContract.methods.getAllParticipants().call();
      
      const formattedParticipants = [];
      
      for (let i = 0; i < participantList.length; i++) {
        const address = participantList[i];
        const details = await trustScoreContract.methods.getParticipantDetails(address).call();
        
        formattedParticipants.push({
          id: address, 
          name: address, // Using address as name for now, or could have a mapping if name stored
          score: parseInt(details.score),
          verified: parseInt(details.successfulDeliveries),
          flags: parseInt(details.flaggedProducts),
          trustLevel: details.trustLevel
        });
      }
      
      // Sort by score descending
      formattedParticipants.sort((a, b) => b.score - a.score);
      
      setParticipants(formattedParticipants);

    } catch (err) {
      console.error('Error loading leaderboard:', err);
      setError('Error loading leaderboard data.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = participants.filter(p =>
    p.name.toLowerCase().includes(filter.toLowerCase())
  );

  const getRowClass = (index) => {
    if (index === 0) return 'top1';
    if (index === 1) return 'top2';
    if (index === 2) return 'top3';
    return '';
  };

  const getTrustBadge = (score) => {
    if (score >= 80) return { label: 'PLATINUM', color: '#e5e7eb', bg: '#374151' };
    if (score >= 60) return { label: 'GOLD', color: '#b45309', bg: '#fef3c7' };
    if (score >= 40) return { label: 'SILVER', color: '#374151', bg: '#f3f4f6' };
    return { label: 'BRONZE', color: '#78350f', bg: '#ffedd5' };
  };

  if (loading) {
    return <div className="trustscore-leaderboard card"><p style={{textAlign: 'center', padding: '20px'}}>Loading leaderboard from blockchain...</p></div>;
  }

  if (error) {
    return <div className="trustscore-leaderboard card"><p style={{textAlign: 'center', padding: '20px', color: '#dc2626'}}>{error}</p></div>;
  }

  return (
    <div className="trustscore-leaderboard card">
      <h1>🏆 TrustScore Leaderboard</h1>
      <p style={{fontSize: '0.9rem', color: '#666', marginBottom: '20px'}}>
        Ranking of supply chain participants based on their blockchain TrustScore
      </p>
      <div className="filter-section">
        <input
          type="text"
          placeholder="Search participants..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="search-input"
        />
      </div>
      
      {filtered.length === 0 ? (
        <p style={{textAlign: 'center', padding: '20px'}}>No participants found.</p>
      ) : (
        <table className="table table-sm">
          <thead>
            <tr>
              <th style={{width: '80px'}}>Rank</th>
              <th>Participant Address</th>
              <th style={{width: '120px'}}>TrustScore</th>
              <th style={{width: '120px'}}>Verified Items</th>
              <th style={{width: '100px'}}>Flags</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, idx) => {
              const badge = getTrustBadge(p.score);
              return (
                <tr key={p.id} className={getRowClass(idx)}>
                  <td style={{fontWeight: '700', fontSize: '1.1rem'}}>
                    {idx === 0 && '🥇'}
                    {idx === 1 && '🥈'}
                    {idx === 2 && '🥉'}
                    {idx > 2 && `#${idx + 1}`}
                  </td>
                  <td style={{fontWeight: '600', fontFamily: 'monospace'}}>{p.name.substring(0, 10)}...{p.name.substring(38)}</td>
                  <td>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                      <span style={{fontSize: '1.2rem', fontWeight: '700'}}>{p.score}</span>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: badge.bg,
                        color: badge.color
                      }}>
                        {badge.label}
                      </span>
                    </div>
                  </td>
                  <td>{p.verified}</td>
                  <td>
                    <span style={{
                      color: p.flags > 0 ? '#dc2626' : '#6b7280',
                      fontWeight: '600'
                    }}>
                      {p.flags}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default TrustScoreLeaderboard;
