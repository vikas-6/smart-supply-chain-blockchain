import React, { useState, useEffect } from 'react';
import { useHistory } from "react-router-dom";
import Web3 from "web3";
import SupplyChainABI from "./artifacts/SmartSupplyChain.json";
import { QRCodeCanvas } from 'qrcode.react';
import './Track.css';

function Track() {
    const history = useHistory();
    useEffect(() => {
        loadWeb3();
        loadBlockchaindata();
    }, []);

    const [currentaccount, setCurrentaccount] = useState("");
    const [loader, setloader] = useState(true);
    const [SupplyChain, setSupplyChain] = useState();
    const [MED, setMED] = useState({});
    const [MedStage, setMedStage] = useState([]);
    const [ID, setID] = useState("");
    const [RMS, setRMS] = useState({});
    const [MAN, setMAN] = useState({});
    const [DIS, setDIS] = useState({});
    const [RET, setRET] = useState({});
    const [trackResult, setTrackResult] = useState(null);

    const loadWeb3 = async () => {
        if (window.ethereum) {
            window.web3 = new Web3(window.ethereum);
            await window.ethereum.enable();
        } else if (window.web3) {
            window.web3 = new Web3(window.web3.currentProvider);
        } else {
            window.alert("Non-Ethereum browser detected. Consider using MetaMask!");
        }
    };

    const loadBlockchaindata = async () => {
        setloader(true);
        const web3 = window.web3;
        const accounts = await web3.eth.getAccounts();
        setCurrentaccount(accounts[0]);
        const networkId = await web3.eth.net.getId();
        const networkData = SupplyChainABI.networks[networkId];
        if (networkData) {
            const supplychain = new web3.eth.Contract(SupplyChainABI.abi, networkData.address);
            setSupplyChain(supplychain);
            
            const medCtr = await supplychain.methods.medicineCtr().call();
            const med = {};
            const medStage = [];
            for (let i = 0; i < medCtr; i++) {
                med[i + 1] = await supplychain.methods.MedicineStock(i + 1).call();
                medStage[i + 1] = await supplychain.methods.showStage(i + 1).call();
            }
            setMED(med);
            setMedStage(medStage);

            const rmsCtr = await supplychain.methods.rmsCtr().call();
            const rms = {};
            for (let i = 0; i < rmsCtr; i++) {
                rms[i + 1] = await supplychain.methods.RMS(i + 1).call();
            }
            setRMS(rms);

            const manCtr = await supplychain.methods.manCtr().call();
            const man = {};
            for (let i = 0; i < manCtr; i++) {
                man[i + 1] = await supplychain.methods.MAN(i + 1).call();
            }
            setMAN(man);

            const disCtr = await supplychain.methods.disCtr().call();
            const dis = {};
            for (let i = 0; i < disCtr; i++) {
                dis[i + 1] = await supplychain.methods.DIS(i + 1).call();
            }
            setDIS(dis);

            const retCtr = await supplychain.methods.retCtr().call();
            const ret = {};
            for (let i = 0; i < retCtr; i++) {
                ret[i + 1] = await supplychain.methods.RET(i + 1).call();
            }
            setRET(ret);
            setloader(false);
        } else {
            window.alert('The smart contract is not deployed to current network');
        }
    };

    const handlerChangeID = (event) => {
        setID(event.target.value);
    };

    const handlerSubmit = async (event) => {
        event.preventDefault();
        var ctr = await SupplyChain.methods.medicineCtr().call();
        if (!((ID > 0) && (ID <= ctr))) {
            alert("Invalid Medicine ID!!!");
        } else {
            setTrackResult(MED[ID]);
        }
    };

    if (loader) {
        return <div className="wait">Loading...</div>;
    }

    const steps = [
        { label: 'Ordered', stage: 0 },
        { label: 'Raw Material', stage: 1, data: trackResult && RMS[trackResult.RMSid] },
        { label: 'Manufacturer', stage: 2, data: trackResult && MAN[trackResult.MANid] },
        { label: 'Distributor', stage: 3, data: trackResult && DIS[trackResult.DISid] },
        { label: 'Retailer', stage: 4, data: trackResult && RET[trackResult.RETid] },
        { label: 'Sold', stage: 5 }
    ];

    const currentStage = trackResult ? parseInt(trackResult.stage) : -1;

    return (
        <div className="track-container">
            <div className="track-search-card">
                <div className="track-header">
                    <div>
                        <h4>Track Medicine</h4>
                        <small className="text-secondary">Current Account: {currentaccount}</small>
                    </div>
                    <button onClick={() => history.push('/')} className="btn btn-outline btn-sm">Home</button>
                </div>

                <form onSubmit={handlerSubmit} className="track-form">
                    <input className="form-control track-input" type="text" onChange={handlerChangeID} placeholder="Enter Medicine ID" required />
                    <button className="btn btn-primary">Track</button>
                </form>

                <h5 className="mb-4">Available Medicines</h5>
                <div className="table-responsive">
                    <table className="custom-table" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Description</th>
                                <th>Current Stage</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.keys(MED).map((key) => (
                                <tr key={key}>
                                    <td>{MED[key].id}</td>
                                    <td>{MED[key].name}</td>
                                    <td>{MED[key].description}</td>
                                    <td>{MedStage[key]}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {trackResult && (
                <div className="track-result-card">
                    <div className="mb-6">
                        <h3>Medicine: {trackResult.name}</h3>
                        <p className="text-secondary">{trackResult.description}</p>
                        <p><strong>ID:</strong> {trackResult.id}</p>
                    </div>

                    <div className="track-timeline">
                        <div className="track-line"></div>
                        {steps.map((step, index) => (
                            <div key={index} className={`timeline-step ${index <= currentStage ? 'active' : ''}`}>
                                <div className="step-icon">
                                    {index <= currentStage ? '✓' : index}
                                </div>
                                <div className="step-label">{step.label}</div>
                                {step.data && (
                                    <div className="step-detail">
                                        <div>{step.data.name}</div>
                                        <div>{step.data.place}</div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="qr-section">
                        <h5 className="mb-4">QR Code</h5>
                        <QRCodeCanvas value={JSON.stringify({ 
                            id: trackResult.id, 
                            name: trackResult.name, 
                            stage: MedStage[trackResult.id] 
                        })} />
                    </div>
                </div>
            )}
        </div>
    );
}

export default Track;
