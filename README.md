# Smart Supply Chain Blockchain

![Architecture Diagram](client/public/architecture.png)

## Abstract
The **Smart Supply Chain Blockchain** is an enterprise-grade solution designed to revolutionize supply chain transparency and product authenticity. By leveraging the immutable nature of the Ethereum blockchain combined with off-chain Artificial Intelligence, this system addresses critical industry challenges including counterfeiting, supply chain opacity, and lack of accountability. The platform introduces novel mechanisms such as a TrustScore reputation system based on Soulbound Tokens (SBTs) and an automated AI-driven anti-counterfeit engine.

## Table of Contents
1.  [Project Overview](#project-overview)
2.  [Key Features](#key-features)
3.  [System Architecture](#system-architecture)
4.  [Technology Stack](#technology-stack)
5.  [Prerequisites](#prerequisites)
6.  [Installation and Setup](#installation-and-setup)
7.  [Usage Guide](#usage-guide)
8.  [Advanced Concepts](#advanced-concepts)
9.  [License](#license)

---

## Project Overview

Modern supply chains are often fragmented, relying on siloed databases that make end-to-end tracking difficult. This project provides a unified, decentralized ledger where every transaction from raw material acquisition to final sale is recorded. It acts as a single source of truth for manufacturers, distributors, retailers, and consumers.

Beyond simple tracking, the system proactively monitors for fraud. An integrated AI service analyzes transaction patterns in real-time to flag anomalies, such as impossible travel times between checkpoints or duplicate product identifiers, ensuring that the physical flow of goods matches the digital record.

---

## Key Features

### 1. AI-Driven Anti-Counterfeit Intelligence
The system employs a separate microservice dedicated to risk analysis.
*   **Anomaly Detection**: Algorithms monitor the time and location data between supply chain stages. If a product moves faster than physically possible or deviates from the expected route, it is flagged.
*   **Automated Risk Scoring**: Every product is assigned a dynamic risk score (0-100). High scores trigger automatic alerts and potential "recalled" status on the blockchain.
*   **Duplicate Prevention**: The system prevents cloning attacks by validating unique product hash and owner signatures at every handoff.

### 2. TrustScore Reputation System
To incentivize honest behavior, the platform implements a reputation system using non-transferable tokens.
*   **Soulbound Identity**: Participants are assigned a Soulbound Token (SBT) that cannot be moved or sold. This token represents their permanent reputation on the network.
*   **Algorithmic Updates**: The TrustScore increases with every verified, successful delivery and decreases if products handled by the entity are flagged for counterfeit or safety violations.
*   **Tiered Rankings**: Participants are categorized into Platinum, Gold, Silver, and Bronze tiers, allowing partners to choose reliable vendors based on on-chain history.

### 3. End-to-End Traceability
*   **Provenance Tracking**: A complete, immutable history of the product is maintained. Consumers can see exactly when and where the raw materials were sourced and every stop the product made along the way.
*   **Smart Recalls**: Manufacturers can issue a batch recall that instantly updates the status of all affected products on the blockchain, preventing downstream retailers from selling unsafe goods.

---

## System Architecture

The application is built on a consolidated architecture comprising three main layers:

1.  **The Blockchain Layer (Ethereum)**
    *   Hosts the **SmartSupplyChain** contract for logic and state management.
    *   Hosts the **SmartTrustScore** contract for reputation management.
    *   Serves as the immutable database for all trusted transactions.

2.  **The Application Layer (React Client)**
    *   Provides a web3-enabled interface for users.
    *   Interacts with the blockchain using the Web3.js library.
    *   Manages user roles (Admin, Supplier, Manufacturer, etc.) via wallet connections.

3.  **The Intelligence Layer (Node.js Service)**
    *   Listens for blockchain events.
    *   Performs off-chain computation for risk analysis.
    *   Feeds risk scores back into the system or alerts administrators.

---

## Technology Stack

*   **Blockchain Platform**: Ethereum
*   **Development Framework**: Truffle Suite
*   **Smart Contracts**: Solidity (version ^0.5.16)
*   **Frontend**: React.js
*   **Styling**: Custom CSS Design System (CSS3)
*   **Backend Services**: Node.js, Express.js
*   **Client Library**: Web3.js
*   **Tools**: Ganache (Local Blockchain), MetaMask (Wallet)

---

## Prerequisites

Ensure the following tools are installed on your development environment:

*   **Node.js** (v14.0.0 or higher)
*   **NPM** (v6.0.0 or higher)
*   **Git**
*   **Truffle**: Install globally using `npm install -g truffle`
*   **Ganache**: A personal blockchain for Ethereum development (GUI or CLI)
*   **MetaMask**: A browser extension for Ethereum wallet management

---

## Installation and Setup

Follow these steps to deploy the application locally.

### 1. Clone the Repository
```bash
git clone https://github.com/vikas-6/smart-supply-chain-blockchain.git
cd smart-supply-chain-blockchain
```

### 2. Install Dependencies
Install the required packages for both the root project and the client application.

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 3. Configure Local Blockchain
1.  Launch **Ganache**.
2.  Create a new workspace.
3.  Set the **Port Number** to `8545`.
4.  Set the **Network ID** to `1337`.
5.  Save and restart the workspace.

### 4. Deploy Smart Contracts
Compile and migrate the contracts to your local Ganache network.

```bash
truffle compile
truffle migrate --reset
```

### 5. Configure MetaMask
1.  Open your browser and click on the MetaMask extension.
2.  Add a new network manually:
    *   **Network Name**: Ganache Local
    *   **RPC URL**: `http://127.0.0.1:8545`
    *   **Chain ID**: `1337`
    *   **Currency Symbol**: ETH
3.  Import an account from Ganache by copying a Private Key from the Ganache GUI and pasting it into MetaMask.

### 6. Run the Application
Start the React frontend server.

```bash
cd client
npm start
```
The application will be accessible at `http://localhost:3000`.

---

## Usage Guide

### Administrator
The contract deployer acts as the Super Admin.
1.  **Assign Roles**: Navigate to the "Assign Roles" page to register new participants (RMS, Manufacturer, Distributor, Retailer). You must use their valid Ethereum addresses.

### Supply Chain Participants
1.  **Raw Material Supplier**: Creates the initial entry for a product (raw materials).
2.  **Manufacturer**: Receives raw materials and "manufactures" the final product, assigning it a unique ID.
3.  **Distributor**: Accepts the product from the manufacturer and logs the transfer.
4.  **Retailer**: Receives the product for final sale.
5.  **Sold**: The retailer marks the product as "Sold" when purchased by a consumer.

### General Public
1.  **Track**: Enter a product ID to view its current stage and possessor.
2.  **Verify**: Enter a product ID or scan its QR code to view the full history, authenticity status, and TrustScores of all participants involved in its journey.

---

## License

This project is open-source and available under the **MIT License**.

---

**Author**: Vikas Kumar
