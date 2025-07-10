// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "./DappToken.sol";
import "./LPToken.sol";

/**
 * @title Proportional Token Farm (CoffeeSwap TokenFarm)
 * @notice Una granja de staking donde las recompensas (DAPP) se distribuyen proporcionalmente al total stakeado.
 * @notice By Javier Plata, EthKipu 2025
 */
contract TokenFarm {

    string public name = "CoffeeSwap Token Farm";
    address public owner;                
    DAppToken public dappToken;           
    LPToken public lpToken;               

    uint256 public constant REWARD_PER_BLOCK = 1e18; // 1 DAPP por bloque total
    uint256 public totalStakingBalance;              // Suma de todos los stakes

    address[] public stakers;             // Lista de todos los que han stakeado alguna vez

  
    mapping(address => uint256) public stakingBalance;  // Cuántos LP tiene stakeados
    mapping(address => uint256) public checkpoints;     // Último bloque en que se calculó reward
    mapping(address => uint256) public pendingRewards;  // Recompensas acumuladas
    mapping(address => bool)    public hasStaked;       // Si alguna vez hizo stake
    mapping(address => bool)    public isStaking;       // Si actualmente tiene stake > 0

   
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event RewardsDistributed(address indexed by, uint256 timestamp);


    modifier onlyOwner() {
        require(msg.sender == owner, "Solo owner");
        _;
    }

    modifier onlyStaking(address user) {
        require(isStaking[user], "No estas stakeando");
        _;
    }

 
    constructor(DAppToken _dappToken, LPToken _lpToken) {
        dappToken = _dappToken;
        lpToken   = _lpToken;
        owner     = msg.sender;
    }


    function deposit(uint256 _amount) external {
        require(_amount > 0, "Monto debe ser > 0");

        // 1) Tranfiere LPT desde el usuario al contrato
        lpToken.transferFrom(msg.sender, address(this), _amount);

        // 2) Antes de actualizar su balance, calculamos y almacenamos rewards pendientes
        distributeRewards(msg.sender);

        // 3) Actualizamos balances
        stakingBalance[msg.sender] += _amount;
        totalStakingBalance           += _amount;

        // 4) Si es la primera vez:
        if (!hasStaked[msg.sender]) {
            stakers.push(msg.sender);
            hasStaked[msg.sender] = true;
        }
        isStaking[msg.sender] = true;

        // 5) Si nunca tuvo checkpoint, inicializamos a bloque actual
        if (checkpoints[msg.sender] == 0) {
            checkpoints[msg.sender] = block.number;
        }

        emit Deposited(msg.sender, _amount);
    }


    function withdraw() external onlyStaking(msg.sender) {
        uint256 balance = stakingBalance[msg.sender];
        require(balance > 0, "Sin balance");

        // 1) Recalcular rewards pendientes antes de resetear
        distributeRewards(msg.sender);

        // 2) Resetear usuario
        stakingBalance[msg.sender] = 0;
        totalStakingBalance       -= balance;
        isStaking[msg.sender]      = false;

        // 3) Devolver LPT al usuario
        lpToken.transfer(msg.sender, balance);

        emit Withdrawn(msg.sender, balance);
    }


    function claimRewards() external {
        uint256 reward = pendingRewards[msg.sender];
        require(reward > 0, "No hay recompensas");

        // Resetear contador antes de mint
        pendingRewards[msg.sender] = 0;

        // Mint y envía DAPP al usuario
        dappToken.mint(msg.sender, reward);

        emit RewardsClaimed(msg.sender, reward);
    }


    function distributeRewardsAll() external onlyOwner {
        for (uint i = 0; i < stakers.length; i++) {
            address user = stakers[i];
            if (isStaking[user]) {
                distributeRewards(user);
            }
        }
        emit RewardsDistributed(msg.sender, block.timestamp);
    }

    function distributeRewards(address beneficiary) private {
        uint256 lastCheckpoint = checkpoints[beneficiary];
        // Solo si hay stake total y han pasado bloques
        if (totalStakingBalance > 0 && block.number > lastCheckpoint) {
            uint256 blocksPassed = block.number - lastCheckpoint;
            // participación proporcional: stake del user / total stake
            uint256 share = (stakingBalance[beneficiary] * 1e18) / totalStakingBalance;
            // reward = REWARD_PER_BLOCK * blocksPassed * share
            uint256 reward = (REWARD_PER_BLOCK * blocksPassed * share) / 1e18;
            pendingRewards[beneficiary] += reward;
        }
        // Actualiza checkpoint siempre al bloque actual
        checkpoints[beneficiary] = block.number;
    }
}
