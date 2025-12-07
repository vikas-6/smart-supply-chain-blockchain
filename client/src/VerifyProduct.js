
import React, { useState } from 'react';
import Web3 from 'web3';
import SupplyChainABI from "./artifacts/SmartSupplyChain.json";
import './VerifyProduct.css';

function VerifyProduct() {
  const [searchId, setSearchId] = useState('');
  const [product, setProduct] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchId) return;
    
    setLoading(true);
    setError('');
    setProduct(null);
    setHistory([]);

    try {
      // Load Web3
      if (window.ethereum) {
        window.web3 = new Web3(window.ethereum);
        await window.ethereum.enable();
      } else if (window.web3) {
        window.web3 = new Web3(window.web3.currentProvider);
      } else {
        setError('Please install MetaMask to use this feature!');
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
      
      // Fetch product details using MedicineStock mapping
      const med = await supplyChain.methods.MedicineStock(searchId).call();
      
      if (!med || !med.name || med.id == 0) {
        setError(`Product ID ${searchId} not found.`);
        setLoading(false);
        return;
      }

      // Get risk score if it exists
      let riskScore = 0;
      let isFlagged = false;
      let isRecalled = false;
      
      try {
        riskScore = await supplyChain.methods.riskScores(searchId).call();
        isFlagged = await supplyChain.methods.flaggedProducts(searchId).call();
        isRecalled = await supplyChain.methods.recalledProducts(searchId).call();
      } catch (err) {
        console.log('Risk data not available:', err);
      }

      setProduct({
        id: searchId,
        name: med.name,
        description: med.description,
        riskScore: parseInt(riskScore || 0),
        isFlagged,
        isRecalled,
        stage: med.stage
      });

      // Fetch product history
      try {
        const histCount = await supplyChain.methods.getProductHistoryCount(searchId).call();
        const hist = [];
        for (let i = 0; i < histCount; i++) {
          const item = await supplyChain.methods.productHistory(searchId, i).call();
          hist.push({
            stage: getStageNameFromNumber(item.stage),
            location: item.location || 'N/A',
            timestamp: parseInt(item.timestamp) * 1000 // Convert to milliseconds
          });
        }
        setHistory(hist);
      } catch (err) {
        console.log('History not available:', err);
      }

    } catch (err) {
      console.error('Error loading product:', err);
      setError('Error loading product data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStageNameFromNumber = (stage) => {
    const stages = ['Ordered', 'Raw Material Supply', 'Manufacturing', 'Distribution', 'Retail', 'Sold'];
    return stages[parseInt(stage)] || 'Unknown';
  };

  const getStatus = () => {
    if (!product) return null;
    if (product.isRecalled) return { level: 'RECALLED', color: '#dc2626', icon: '⛔' };
    if (product.isFlagged || product.riskScore >= 70) return { level: 'HIGH RISK', color: '#ea580c', icon: '⚠️' };
    if (product.riskScore >= 40) return { level: 'MEDIUM RISK', color: '#f59e0b', icon: '⚡' };
    return { level: 'AUTHENTIC', color: '#16a34a', icon: '✓' };
  };

  const status = getStatus();

  return (
    <div className="verify-product-container card">
      <h4>🔍 Verify Product</h4>
      <p style={{fontSize: '0.9rem', color: '#666', marginBottom: '20px'}}>
        Enter a product ID to verify its authenticity and view supply chain history
      </p>
      <form className="search-form" onSubmit={handleSearch}>
        <input
          type="number"
          placeholder="Enter Product ID (e.g., 1, 2)"
          value={searchId}
          onChange={e => setSearchId(e.target.value)}
          className="search-input"
          required
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Verifying...' : 'Verify Product'}
        </button>
      </form>

      {error && (
        <div style={{padding: '15px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginTop: '20px'}}>
          {error}
        </div>
      )}

      {loading && <p style={{textAlign: 'center', padding: '20px'}}>Loading product data from blockchain...</p>}

      {product && !loading && (
        <>
          <div className="result-card card">
            <div className="status-badge" style={{ backgroundColor: status.color }}>
              <span className="badge-icon">{status.icon}</span>
              <span className="badge-text">{status.level}</span>
            </div>
            <h2>{product.name}</h2>
            <p>{product.description}</p>
            <p><strong>Risk Score:</strong> {product.riskScore}/100</p>
            <p><strong>Product ID:</strong> {product.id}</p>
            <p><strong>Current Stage:</strong> {getStageNameFromNumber(product.stage)}</p>
          </div>

          {history.length > 0 && (
            <section className="history-section">
              <h2>📦 Supply Chain History</h2>
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Stage</th>
                    <th>Location</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, idx) => (
                    <tr key={idx}>
                      <td>{h.stage}</td>
                      <td>{h.location}</td>
                      <td>{h.timestamp ? new Date(h.timestamp).toLocaleString() : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default VerifyProduct;
