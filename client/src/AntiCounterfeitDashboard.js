import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import SupplyChainABI from "./artifacts/SmartSupplyChain.json";
import './AntiCounterfeitDashboard.css';

function AntiCounterfeitDashboard() {
  const [stats, setStats] = useState({ total: 0, flagged: 0, recalled: 0, safetyRate: 0 });
  const [recent, setRecent] = useState([]);
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
      const networkData = SupplyChainABI.networks[networkId];
      
      if (!networkData) {
        setError('Smart contract not deployed to detected network.');
        setLoading(false);
        return;
      }

      const supplyChain = new web3.eth.Contract(SupplyChainABI.abi, networkData.address);
      const total = await supplyChain.methods.medicineCtr().call();
      
      let flagged = 0;
      let recalled = 0;
      const recentProducts = [];

      for (let i = 1; i <= total; i++) {
        try {
          const isFlagged = await supplyChain.methods.flaggedProducts(i).call();
          const isRecalled = await supplyChain.methods.recalledProducts(i).call();
          const med = await supplyChain.methods.MedicineStock(i).call();
          const riskScore = await supplyChain.methods.riskScores(i).call();

          if (isFlagged) flagged++;
          if (isRecalled) recalled++;

          if (isFlagged || isRecalled || parseInt(riskScore) >= 40) {
            const riskLevel = isRecalled ? 'CRITICAL' : 
                            parseInt(riskScore) >= 70 ? 'HIGH' :
                            parseInt(riskScore) >= 40 ? 'MEDIUM' : 'LOW';
            const status = isRecalled ? 'Recalled' : isFlagged ? 'Flagged' : 'Under Review';
            
            recentProducts.push({
              id: i,
              name: med.name || `Product #${i}`,
              risk: riskLevel,
              status: status,
              riskScore: parseInt(riskScore)
            });
          }
        } catch (err) {
          console.log(`Error loading product ${i}:`, err);
        }
      }

      const safetyRate = total > 0 ? ((total - flagged - recalled) / total) * 100 : 0;
      setStats({ total: parseInt(total), flagged, recalled, safetyRate: safetyRate.toFixed(1) });
      setRecent(recentProducts.reverse().slice(0, 10));

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Error loading data from blockchain.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="wait">Loading dashboard from blockchain...</div>;
  }

  if (error) {
    return <div className="dashboard-card"><p className="text-danger text-center">{error}</p></div>;
  }

  const getRiskClass = (risk) => {
    switch(risk) {
      case 'LOW': return 'risk-low';
      case 'MEDIUM': return 'risk-medium';
      case 'HIGH': return 'risk-high';
      case 'CRITICAL': return 'risk-critical';
      default: return '';
    }
  };

  return (
    <div className="dashboard-card">
      <div className="dashboard-header">
        <h3>🛡️ Anti-Counterfeit Dashboard</h3>
        <p className="dashboard-subtitle">Real-time monitoring from blockchain</p>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Products</div>
        </div>
        <div className="stat-card flagged">
          <div className="stat-value">{stats.flagged}</div>
          <div className="stat-label">Flagged Products</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.recalled}</div>
          <div className="stat-label">Recalled Products</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.safetyRate}%</div>
          <div className="stat-label">Safety Rate</div>
        </div>
      </div>

      <section className="dashboard-section">
        <h3>Recent Activity</h3>
        <div className="table-responsive">
          {recent.length === 0 ? (
            <p className="text-center text-secondary p-4">✅ All products are safe! No flagged or high-risk items.</p>
          ) : (
            <table className="custom-table" style={{width: '100%'}}>
              <thead>
                <tr><th>ID</th><th>Name</th><th>Risk Level</th><th>Status</th></tr>
              </thead>
              <tbody>
                {recent.map(item => (
                  <tr key={item.id} className={item.status === 'Flagged' || item.status === 'Recalled' ? 'flagged-row' : ''}>
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                    <td>
                      <span className={`risk-badge ${getRiskClass(item.risk)}`}>
                        {item.risk}
                      </span>
                    </td>
                    <td>{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

export default AntiCounterfeitDashboard;
