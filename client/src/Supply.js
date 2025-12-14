import React, { useState, useEffect } from 'react';
import { useHistory } from "react-router-dom";
import Web3 from "web3";
import SupplyChainABI from "./artifacts/SmartSupplyChain.json";
import './Supply.css';

function Supply() {
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

    const loadWeb3 = async () => {
        if (window.ethereum) {
            window.web3 = new Web3(window.ethereum);
            await window.ethereum.enable();
        } else if (window.web3) {
            window.web3 = new Web3(window.web3.currentProvider);
        } else {
            window.alert("Non-Ethereum browser detected. You should consider trying MetaMask!");
        }
    };

    const loadBlockchaindata = async () => {
        setloader(true);
        const web3 = window.web3;
        const accounts = await web3.eth.getAccounts();
        const account = accounts[0];
        setCurrentaccount(account);
        const networkId = await web3.eth.net.getId();
        const networkData = SupplyChainABI.networks[networkId];
        if (networkData) {
            const supplychain = new web3.eth.Contract(SupplyChainABI.abi, networkData.address);
            setSupplyChain(supplychain);
            const medCtr = await supplychain.methods.medicineCtr().call();
            const med = {};
            const medStage = [];
            for (let i = 0; i < medCtr; i++) {
                med[i] = await supplychain.methods.MedicineStock(i + 1).call();
                medStage[i] = await supplychain.methods.showStage(i + 1).call();
            }
            setMED(med);
            setMedStage(medStage);
            setloader(false);
        } else {
            window.alert('The smart contract is not deployed to the current network');
        }
    };

    const redirect_to_home = () => {
        history.push('/');
    };

    const handlerChangeID = (event) => {
        setID(event.target.value);
    };

    const handlerSubmitRMSsupply = async (event) => {
        event.preventDefault();
        try {
            const receipt = await SupplyChain.methods.RMSsupply(ID).send({ from: currentaccount });
            if (receipt) loadBlockchaindata();
        } catch (err) {
            alert("An error occurred!!!");
        }
    };

    const handlerSubmitManufacturing = async (event) => {
        event.preventDefault();
        try {
            const receipt = await SupplyChain.methods.Manufacturing(ID).send({ from: currentaccount });
            if (receipt) loadBlockchaindata();
        } catch (err) {
            alert("An error occurred!!!");
        }
    };

    const handlerSubmitDistribute = async (event) => {
        event.preventDefault();
        try {
            const receipt = await SupplyChain.methods.Distribute(ID).send({ from: currentaccount });
            if (receipt) loadBlockchaindata();
        } catch (err) {
            alert("An error occurred!!!");
        }
    };

    const handlerSubmitRetail = async (event) => {
        event.preventDefault();
        try {
            const receipt = await SupplyChain.methods.Retail(ID).send({ from: currentaccount });
            if (receipt) loadBlockchaindata();
        } catch (err) {
            alert("An error occurred!!!");
        }
    };

    const handlerSubmitSold = async (event) => {
        event.preventDefault();
        try {
            const receipt = await SupplyChain.methods.sold(ID).send({ from: currentaccount });
            if (receipt) loadBlockchaindata();
        } catch (err) {
            alert("An error occurred!!!");
        }
    };

    if (loader) {
        return <div className="wait">Loading...</div>;
    }

    return (
        <div className="container">
            <div className="supply-card">
                <div className="supply-header">
                    <div>
                        <h4>Supply Chain Flow</h4>
                        <small className="text-secondary">Current Account: {currentaccount}</small>
                    </div>
                    <button onClick={redirect_to_home} className="btn btn-outline btn-sm">Home</button>
                </div>

                <div className="supply-flow-text">
                    <strong>Flow:</strong> Order → Raw Material → Manufacturer → Distributor → Retailer → Consumer
                </div>

                <div className="table-responsive mb-5">
                    <table className="custom-table" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th>Medicine ID</th>
                                <th>Name</th>
                                <th>Description</th>
                                <th>Current Processing Stage</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.keys(MED).map(key => (
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

                <div className="supply-step-card">
                    <h5 className="supply-step-title">Step 1: Supply Raw Materials</h5>
                    <form onSubmit={handlerSubmitRMSsupply} className="supply-form">
                        <input className="form-control supply-input" type="text" onChange={handlerChangeID} placeholder="Enter Medicine ID" required />
                        <button className="btn btn-primary supply-btn">Supply</button>
                    </form>
                </div>

                <div className="supply-step-card">
                    <h5 className="supply-step-title">Step 2: Manufacture</h5>
                    <form onSubmit={handlerSubmitManufacturing} className="supply-form">
                        <input className="form-control supply-input" type="text" onChange={handlerChangeID} placeholder="Enter Medicine ID" required />
                        <button className="btn btn-primary supply-btn">Manufacture</button>
                    </form>
                </div>

                <div className="supply-step-card">
                    <h5 className="supply-step-title">Step 3: Distribute</h5>
                    <form onSubmit={handlerSubmitDistribute} className="supply-form">
                        <input className="form-control supply-input" type="text" onChange={handlerChangeID} placeholder="Enter Medicine ID" required />
                        <button className="btn btn-primary supply-btn">Distribute</button>
                    </form>
                </div>

                <div className="supply-step-card">
                    <h5 className="supply-step-title">Step 4: Retail</h5>
                    <form onSubmit={handlerSubmitRetail} className="supply-form">
                        <input className="form-control supply-input" type="text" onChange={handlerChangeID} placeholder="Enter Medicine ID" required />
                        <button className="btn btn-primary supply-btn">Retail</button>
                    </form>
                </div>

                <div className="supply-step-card">
                    <h5 className="supply-step-title">Step 5: Mark as Sold</h5>
                    <form onSubmit={handlerSubmitSold} className="supply-form">
                        <input className="form-control supply-input" type="text" onChange={handlerChangeID} placeholder="Enter Medicine ID" required />
                        <button className="btn btn-primary supply-btn">Sold</button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Supply;
