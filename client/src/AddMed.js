import React, { useState, useEffect } from 'react';
import { useHistory } from "react-router-dom";
import Web3 from "web3";
import SupplyChainABI from "./artifacts/SmartSupplyChain.json";
import './AddMed.css';

function AddMed() {
    const history = useHistory();
    useEffect(() => {
        loadWeb3();
        loadBlockchaindata();
    }, []);

    const [currentaccount, setCurrentaccount] = useState("");
    const [loader, setloader] = useState(true);
    const [SupplyChain, setSupplyChain] = useState();
    const [MED, setMED] = useState({});
    const [MedName, setMedName] = useState("");
    const [MedDes, setMedDes] = useState("");
    const [MedStage, setMedStage] = useState([]);

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
            window.alert('The smart contract is not deployed to current network');
        }
    };

    const redirect_to_home = () => {
        history.push('/');
    };

    const handlerChangeNameMED = (event) => {
        setMedName(event.target.value);
    };

    const handlerChangeDesMED = (event) => {
        setMedDes(event.target.value);
    };

    const handlerSubmitMED = async (event) => {
        event.preventDefault();
        try {
            const reciept = await SupplyChain.methods.addMedicine(MedName, MedDes).send({ from: currentaccount });
            if (reciept) {
                loadBlockchaindata();
            }
        } catch (err) {
            alert("An error occurred!!!");
        }
    };

    if (loader) {
        return <div className="wait">Loading...</div>;
    }

    return (
        <div className="container">
            <div className="addmed-card">
                <div className="addmed-header">
                    <div>
                        <h4>Order Materials</h4>
                        <small className="text-secondary">Current Account: {currentaccount}</small>
                    </div>
                    <button onClick={redirect_to_home} className="btn btn-outline btn-sm">Home</button>
                </div>

                <form onSubmit={handlerSubmitMED} className="addmed-form">
                    <div className="mb-4">
                        <label className="text-secondary" style={{fontSize: '0.875rem'}}>Material Name</label>
                        <input className="form-control" type="text" onChange={handlerChangeNameMED} placeholder="e.g., Paracetamol" required />
                    </div>
                    <div className="mb-4">
                        <label className="text-secondary" style={{fontSize: '0.875rem'}}>Description</label>
                        <input className="form-control" type="text" onChange={handlerChangeDesMED} placeholder="Batch #, Type, etc." required />
                    </div>
                    <button className="btn btn-primary" type="submit">Order Material</button>
                </form>

                <h5 className="mb-4">Ordered Materials</h5>
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
        </div>
    );
}

export default AddMed;
