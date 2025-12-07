// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
pragma experimental ABIEncoderV2;

contract SmartSupplyChain {
    address public Owner;

    constructor() public {
        Owner = msg.sender;
    }

    modifier onlyByOwner() {
        require(msg.sender == Owner);
        _;
    }

    enum STAGE {
        Init,
        RawMaterialSupply,
        Manufacture,
        Distribution,
        Retail,
        sold
    }

    struct ProductEvent {
        uint256 timestamp;
        string location;
        STAGE stage;
        address actor;
    }

    uint256 public medicineCtr = 0;
    uint256 public rmsCtr = 0;
    uint256 public manCtr = 0;
    uint256 public disCtr = 0;
    uint256 public retCtr = 0;

    struct medicine {
        uint256 id;
        string name;
        string description;
        uint256 RMSid;
        uint256 MANid;
        uint256 DISid;
        uint256 RETid;
        STAGE stage;
    }

    mapping(uint256 => medicine) public MedicineStock;
    mapping(uint256 => ProductEvent[]) public productHistory;
    mapping(uint256 => uint256) public riskScores;
    mapping(uint256 => bool) public flaggedProducts;
    mapping(uint256 => bool) public recalledProducts;
    mapping(uint256 => string) public recallReasons;

    event StageChanged(uint256 indexed medicineId, STAGE stage, address actor, uint256 timestamp);
    event ProductFlagged(uint256 indexed medicineId, uint256 riskScore, string reason);
    event ProductRecall(uint256 indexed medicineId, string reason, uint256 timestamp);


    function showStage(uint256 _medicineID)
        public
        view
        returns (string memory)
    {
        require(medicineCtr > 0);
        if (MedicineStock[_medicineID].stage == STAGE.Init)
            return "Medicine Ordered";
        else if (MedicineStock[_medicineID].stage == STAGE.RawMaterialSupply)
            return "Raw Material Supply Stage";
        else if (MedicineStock[_medicineID].stage == STAGE.Manufacture)
            return "Manufacturing Stage";
        else if (MedicineStock[_medicineID].stage == STAGE.Distribution)
            return "Distribution Stage";
        else if (MedicineStock[_medicineID].stage == STAGE.Retail)
            return "Retail Stage";
        else if (MedicineStock[_medicineID].stage == STAGE.sold)
            return "Medicine Sold";
    }

    struct rawMaterialSupplier {
        address addr;
        uint256 id;
        string name;
        string place;
    }

    mapping(uint256 => rawMaterialSupplier) public RMS;

    struct manufacturer {
        address addr;
        uint256 id;
        string name;
        string place;
    }

    mapping(uint256 => manufacturer) public MAN;

    struct distributor {
        address addr;
        uint256 id;
        string name;
        string place;
    }

    mapping(uint256 => distributor) public DIS;

    struct retailer {
        address addr;
        uint256 id;
        string name;
        string place;
    }

    mapping(uint256 => retailer) public RET;

    function addRMS(
        address _address,
        string memory _name,
        string memory _place
    ) public onlyByOwner() {
        rmsCtr++;
        RMS[rmsCtr] = rawMaterialSupplier(_address, rmsCtr, _name, _place);
    }

    function addManufacturer(
        address _address,
        string memory _name,
        string memory _place
    ) public onlyByOwner() {
        manCtr++;
        MAN[manCtr] = manufacturer(_address, manCtr, _name, _place);
    }

    function addDistributor(
        address _address,
        string memory _name,
        string memory _place
    ) public onlyByOwner() {
        disCtr++;
        DIS[disCtr] = distributor(_address, disCtr, _name, _place);
    }

    function addRetailer(
        address _address,
        string memory _name,
        string memory _place
    ) public onlyByOwner() {
        retCtr++;
        RET[retCtr] = retailer(_address, retCtr, _name, _place);
    }

    function RMSsupply(uint256 _medicineID) public {
        require(_medicineID > 0 && _medicineID <= medicineCtr);
        require(!recalledProducts[_medicineID], "Product is recalled");
        uint256 _id = findRMS(msg.sender);
        require(_id > 0);
        require(MedicineStock[_medicineID].stage == STAGE.Init);
        MedicineStock[_medicineID].RMSid = _id;
        MedicineStock[_medicineID].stage = STAGE.RawMaterialSupply;
        
        recordEvent(_medicineID, RMS[_id].place, STAGE.RawMaterialSupply, msg.sender);
    }

    function findRMS(address _address) private view returns (uint256) {
        require(rmsCtr > 0);
        for (uint256 i = 1; i <= rmsCtr; i++) {
            if (RMS[i].addr == _address) return RMS[i].id;
        }
        return 0;
    }

    function Manufacturing(uint256 _medicineID) public {
        require(_medicineID > 0 && _medicineID <= medicineCtr);
        require(!recalledProducts[_medicineID], "Product is recalled");
        uint256 _id = findMAN(msg.sender);
        require(_id > 0);
        require(MedicineStock[_medicineID].stage == STAGE.RawMaterialSupply);
        MedicineStock[_medicineID].MANid = _id;
        MedicineStock[_medicineID].stage = STAGE.Manufacture;
        
        recordEvent(_medicineID, MAN[_id].place, STAGE.Manufacture, msg.sender);
    }

    function findMAN(address _address) private view returns (uint256) {
        require(manCtr > 0);
        for (uint256 i = 1; i <= manCtr; i++) {
            if (MAN[i].addr == _address) return MAN[i].id;
        }
        return 0;
    }

    function Distribute(uint256 _medicineID) public {
        require(_medicineID > 0 && _medicineID <= medicineCtr);
        require(!recalledProducts[_medicineID], "Product is recalled");
        uint256 _id = findDIS(msg.sender);
        require(_id > 0);
        require(MedicineStock[_medicineID].stage == STAGE.Manufacture);
        MedicineStock[_medicineID].DISid = _id;
        MedicineStock[_medicineID].stage = STAGE.Distribution;
        
        recordEvent(_medicineID, DIS[_id].place, STAGE.Distribution, msg.sender);
    }

    function findDIS(address _address) private view returns (uint256) {
        require(disCtr > 0);
        for (uint256 i = 1; i <= disCtr; i++) {
            if (DIS[i].addr == _address) return DIS[i].id;
        }
        return 0;
    }

    function Retail(uint256 _medicineID) public {
        require(_medicineID > 0 && _medicineID <= medicineCtr);
        require(!recalledProducts[_medicineID], "Product is recalled");
        uint256 _id = findRET(msg.sender);
        require(_id > 0);
        require(MedicineStock[_medicineID].stage == STAGE.Distribution);
        MedicineStock[_medicineID].RETid = _id;
        MedicineStock[_medicineID].stage = STAGE.Retail;
        
        recordEvent(_medicineID, RET[_id].place, STAGE.Retail, msg.sender);
    }

    function findRET(address _address) private view returns (uint256) {
        require(retCtr > 0);
        for (uint256 i = 1; i <= retCtr; i++) {
            if (RET[i].addr == _address) return RET[i].id;
        }
        return 0;
    }

    function sold(uint256 _medicineID) public {
        require(_medicineID > 0 && _medicineID <= medicineCtr);
        require(!recalledProducts[_medicineID], "Product is recalled - cannot sell");
        uint256 _id = findRET(msg.sender);
        require(_id > 0);
        require(_id == MedicineStock[_medicineID].RETid);
        require(MedicineStock[_medicineID].stage == STAGE.Retail);
        MedicineStock[_medicineID].stage = STAGE.sold;
        
        recordEvent(_medicineID, RET[_id].place, STAGE.sold, msg.sender);
    }

    function addMedicine(string memory _name, string memory _description)
        public
        onlyByOwner()
    {
        require((rmsCtr > 0) && (manCtr > 0) && (disCtr > 0) && (retCtr > 0));
        medicineCtr++;
        MedicineStock[medicineCtr] = medicine(
            medicineCtr,
            _name,
            _description,
            0,
            0,
            0,
            0,
            STAGE.Init
        );
        riskScores[medicineCtr] = 0;
        recordEvent(medicineCtr, "System", STAGE.Init, msg.sender);
    }

    function recordEvent(
        uint256 _medicineID,
        string memory _location,
        STAGE _stage,
        address _actor
    ) private {
        productHistory[_medicineID].push(ProductEvent({
            timestamp: block.timestamp,
            location: _location,
            stage: _stage,
            actor: _actor
        }));
        emit StageChanged(_medicineID, _stage, _actor, block.timestamp);
    }

    function updateRiskScore(uint256 _medicineID, uint256 _score) public onlyByOwner() {
        require(_medicineID > 0 && _medicineID <= medicineCtr, "Invalid medicine ID");
        riskScores[_medicineID] = _score;
        
        if (_score >= 70) {
            flaggedProducts[_medicineID] = true;
            emit ProductFlagged(_medicineID, _score, "High risk detected");
        }
    }


    function flagProduct(uint256 _medicineID, string memory _reason) public onlyByOwner() {
        require(_medicineID > 0 && _medicineID <= medicineCtr, "Invalid medicine ID");
        flaggedProducts[_medicineID] = true;
        emit ProductFlagged(_medicineID, riskScores[_medicineID], _reason);
    }

    function unflagProduct(uint256 _medicineID) public onlyByOwner() {
        require(_medicineID > 0 && _medicineID <= medicineCtr, "Invalid medicine ID");
        flaggedProducts[_medicineID] = false;
    }

    function recallProduct(uint256 _medicineID, string memory _reason) public onlyByOwner() {
        require(_medicineID > 0 && _medicineID <= medicineCtr, "Invalid medicine ID");
        recalledProducts[_medicineID] = true;
        recallReasons[_medicineID] = _reason;
        emit ProductRecall(_medicineID, _reason, block.timestamp);
    }

    function getProductHistory(uint256 _medicineID) public view returns (ProductEvent[] memory) {
        return productHistory[_medicineID];
    }

    function getProductHistoryCount(uint256 _medicineID) public view returns (uint256) {
        return productHistory[_medicineID].length;
    }

    function isProductSafe(uint256 _medicineID) public view returns (bool) {
        return !flaggedProducts[_medicineID] && !recalledProducts[_medicineID] && riskScores[_medicineID] < 70;
    }

    // Helper getter functions for UI
    function getProductName(uint256 _medicineID) public view returns (string memory) {
        require(_medicineID > 0 && _medicineID <= medicineCtr, "Invalid medicine ID");
        return MedicineStock[_medicineID].name;
    }

    function getProductDescription(uint256 _medicineID) public view returns (string memory) {
        require(_medicineID > 0 && _medicineID <= medicineCtr, "Invalid medicine ID");
        return MedicineStock[_medicineID].description;
    }

    function getRiskScore(uint256 _medicineID) public view returns (uint256) {
        require(_medicineID > 0 && _medicineID <= medicineCtr, "Invalid medicine ID");
        return riskScores[_medicineID];
    }

    function isProductFlagged(uint256 _medicineID) public view returns (bool) {
        require(_medicineID > 0 && _medicineID <= medicineCtr, "Invalid medicine ID");
        return flaggedProducts[_medicineID];
    }

    function isProductRecalled(uint256 _medicineID) public view returns (bool) {
        require(_medicineID > 0 && _medicineID <= medicineCtr, "Invalid medicine ID");
        return recalledProducts[_medicineID];
    }

    function getProductCount() public view returns (uint256) {
        return medicineCtr;
    }

    function getFlaggedProductCount() public view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 1; i <= medicineCtr; i++) {
            if (flaggedProducts[i]) count++;
        }
        return count;
    }

    function getRecalledProductCount() public view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 1; i <= medicineCtr; i++) {
            if (recalledProducts[i]) count++;
        }
        return count;
    }
}
