import React, { useState, useEffect } from 'react';
import Web3 from "web3";
import SupplyChainABI from "./artifacts/SmartSupplyChain.json";
import { useHistory } from "react-router-dom";
import './AssignRoles.css';

function AssignRoles() {
    const history = useHistory();

    const [currentAccount, setCurrentAccount] = useState("");
    const [loading, setLoading] = useState(true);
    const [supplyChain, setSupplyChain] = useState(null);
    const [roles, setRoles] = useState({
        rms: [],
        man: [],
        dis: [],
        ret: [],
    });

    const [newRole, setNewRole] = useState({
        address: "",
        name: "",
        place: "",
        type: "rms",
    });

    useEffect(() => {
        loadWeb3();
        loadBlockchainData();
    }, []);

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

    const loadBlockchainData = async () => {
        setLoading(true);
        const web3 = window.web3;
        const accounts = await web3.eth.getAccounts();
        setCurrentAccount(accounts[0]);
        const networkId = await web3.eth.net.getId();
        const networkData = SupplyChainABI.networks[networkId];

        if (networkData) {
            const contract = new web3.eth.Contract(SupplyChainABI.abi, networkData.address);
            setSupplyChain(contract);

            const rmsCount = await contract.methods.rmsCtr().call();
            const manCount = await contract.methods.manCtr().call();
            const disCount = await contract.methods.disCtr().call();
            const retCount = await contract.methods.retCtr().call();

            const rms = await Promise.all(Array(parseInt(rmsCount)).fill().map((_, i) => contract.methods.RMS(i + 1).call()));
            const man = await Promise.all(Array(parseInt(manCount)).fill().map((_, i) => contract.methods.MAN(i + 1).call()));
            const dis = await Promise.all(Array(parseInt(disCount)).fill().map((_, i) => contract.methods.DIS(i + 1).call()));
            const ret = await Promise.all(Array(parseInt(retCount)).fill().map((_, i) => contract.methods.RET(i + 1).call()));

            setRoles({ rms, man, dis, ret });
            setLoading(false);
        } else {
            window.alert('The smart contract is not deployed to the current network');
        }
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setNewRole((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    const handleRoleSubmit = async (event) => {
        event.preventDefault();
        const { address, name, place, type } = newRole;
        try {
            let receipt;
            switch (type) {
                case "rms":
                    receipt = await supplyChain.methods.addRMS(address, name, place).send({ from: currentAccount });
                    break;
                case "man":
                    receipt = await supplyChain.methods.addManufacturer(address, name, place).send({ from: currentAccount });
                    break;
                case "dis":
                    receipt = await supplyChain.methods.addDistributor(address, name, place).send({ from: currentAccount });
                    break;
                case "ret":
                    receipt = await supplyChain.methods.addRetailer(address, name, place).send({ from: currentAccount });
                    break;
                default:
                    alert("Invalid role type selected");
                    return;
            }
            if (receipt) {
                loadBlockchainData();
            }
        } catch (err) {
            alert("An error occurred!");
        }
    };

    if (loading) {
        return <div className="wait">Loading...</div>;
    }

    return (
        <div className="container">
            <div className="roles-card">
                <div className="roles-header">
                    <div>
                        <h4 className="roles-title">Assign Roles</h4>
                        <small className="text-secondary">Current Account: {currentAccount}</small>
                    </div>
                    <button onClick={() => history.push('/')} className="btn btn-outline btn-sm">Home</button>
                </div>

                <form onSubmit={handleRoleSubmit} className="roles-form">
                    <div className="mb-4">
                        <label className="text-secondary" style={{fontSize: '0.875rem'}}>Role Type</label>
                        <select
                            className="form-control"
                            name="type"
                            onChange={handleInputChange}
                            value={newRole.type}
                            required
                        >
                            <option value="rms">Raw Material Supplier</option>
                            <option value="man">Manufacturer</option>
                            <option value="dis">Distributor</option>
                            <option value="ret">Retailer</option>
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="text-secondary" style={{fontSize: '0.875rem'}}>Ethereum Address</label>
                        <input
                            className="form-control"
                            type="text"
                            name="address"
                            placeholder="0x..."
                            onChange={handleInputChange}
                            value={newRole.address}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="text-secondary" style={{fontSize: '0.875rem'}}>Name</label>
                        <input
                            className="form-control"
                            type="text"
                            name="name"
                            placeholder="Company Name"
                            onChange={handleInputChange}
                            value={newRole.name}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="text-secondary" style={{fontSize: '0.875rem'}}>Location</label>
                        <input
                            className="form-control"
                            type="text"
                            name="place"
                            placeholder="City, Country"
                            onChange={handleInputChange}
                            value={newRole.place}
                            required
                        />
                    </div>
                    <button className="btn btn-primary" type="submit">Register Role</button>
                </form>

                <div className="roles-table-container">
                    {["rms", "man", "dis", "ret"].map((roleType) => (
                        <div key={roleType} className="mb-4">
                            <h5 className="roles-table-title">
                                {roleType === 'rms' && 'Raw Material Suppliers'}
                                {roleType === 'man' && 'Manufacturers'}
                                {roleType === 'dis' && 'Distributors'}
                                {roleType === 'ret' && 'Retailers'}
                            </h5>
                            <table className="custom-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Name</th>
                                        <th>Place</th>
                                        <th>Ethereum Address</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {roles[roleType].length > 0 ? (
                                        roles[roleType].map((role, index) => (
                                            <tr key={index}>
                                                <td>{role.id}</td>
                                                <td>{role.name}</td>
                                                <td>{role.place}</td>
                                                <td>{role.addr}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="text-center">No {roleType.toUpperCase()} registered yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default AssignRoles;
