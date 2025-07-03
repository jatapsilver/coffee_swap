"use client";

import { useState, useEffect } from "react";
import { formatEther, parseEther, BrowserProvider, Contract } from "ethers";
import Swal from "sweetalert2";
import { getProviderOrSigner, getTokenFarmContract } from "../../utils/ethers";

export default function Home() {
  const [account, setAccount] = useState<string>("");
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [lpBalance, setLpBalance] = useState<string>("0");
  const [stakedBalance, setStakedBalance] = useState<string>("0");
  const [pendingRewards, setPendingRewards] = useState<string>("0");
  const [inputAmount, setInputAmount] = useState<string>("");
  const [wrongNetwork, setWrongNetwork] = useState<boolean>(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isDistributing, setIsDistributing] = useState(false);

  const TOKEN_FARM_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_FARM_ADDRESS!;

  const abbreviate = (addr: string) =>
    `${addr.slice(0, 6)}…${addr.slice(addr.length - 4)}`;

  const connectWallet = async () => {
    const providerOrSigner = (await getProviderOrSigner(
      false
    )) as BrowserProvider;
    const network = await providerOrSigner.getNetwork();
    setWrongNetwork(Number(network.chainId) !== 11155111);

    if (Number(network.chainId) === 11155111) {
      const signer = (await getProviderOrSigner(
        true
      )) as import("ethers").JsonRpcSigner;
      const address = await signer.getAddress();
      setAccount(address);

      const contract = getTokenFarmContract(signer);
      const owner = await contract.owner();
      setIsOwner(owner.toLowerCase() === address.toLowerCase());

      loadBalances(signer, address);
    }
  };

  const disconnectWallet = () => {
    setAccount("");
    setIsOwner(false);
    setLpBalance("0");
    setStakedBalance("0");
    setPendingRewards("0");
    setWrongNetwork(false);
  };

  const loadBalances = async (
    signer: import("ethers").JsonRpcSigner,
    address: string
  ) => {
    const contract = getTokenFarmContract(signer);
    const lpAddress = await contract.lpToken();
    const lpContract = new Contract(
      lpAddress,
      ["function balanceOf(address) view returns (uint256)"],
      signer
    );

    const [lpBal, stakeBal, rewards] = await Promise.all([
      lpContract.balanceOf(address),
      contract.stakingBalance(address),
      contract.pendingRewards(address),
    ]);

    setLpBalance(formatEther(lpBal));
    setStakedBalance(formatEther(stakeBal));
    setPendingRewards(formatEther(rewards));
  };

  const deposit = async () => {
    if (!inputAmount) return;
    setIsDepositing(true);
    try {
      const signer = (await getProviderOrSigner(
        true
      )) as import("ethers").JsonRpcSigner;
      const contract = getTokenFarmContract(signer);
      const lpAddress = await contract.lpToken();
      const lpContract = new Contract(
        lpAddress,
        ["function approve(address,uint256)"],
        signer
      );

      const amount = parseEther(inputAmount);
      const tx1 = await lpContract.approve(TOKEN_FARM_ADDRESS, amount);
      await tx1.wait();

      const tx2 = await contract.deposit(amount);
      await tx2.wait();

      await loadBalances(signer, account);
      setInputAmount("");

      Swal.fire(
        "Depósito exitoso",
        "Tus tokens han sido depositados",
        "success"
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      Swal.fire("Error al depositar", error?.reason || error?.message, "error");
    } finally {
      setIsDepositing(false);
    }
  };

  const withdraw = async () => {
    setIsWithdrawing(true);
    try {
      const signer = (await getProviderOrSigner(
        true
      )) as import("ethers").JsonRpcSigner;
      const contract = getTokenFarmContract(signer);
      const tx = await contract.withdraw();
      await tx.wait();
      await loadBalances(signer, account);
      Swal.fire("Retiro exitoso", "Has retirado tus tokens", "success");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      Swal.fire("Error al retirar", error?.reason || error?.message, "error");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const claimRewards = async () => {
    setIsClaiming(true);
    try {
      const signer = (await getProviderOrSigner(
        true
      )) as import("ethers").JsonRpcSigner;
      const contract = getTokenFarmContract(signer);
      const tx = await contract.claimRewards();
      await tx.wait();
      await loadBalances(signer, account);
      Swal.fire(
        "Recompensas reclamadas",
        "Has recibido tus recompensas",
        "success"
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      Swal.fire("Error al reclamar", error?.reason || error?.message, "error");
    } finally {
      setIsClaiming(false);
    }
  };

  const distributeAll = async () => {
    if (!isOwner) {
      Swal.fire("Acceso denegado", "Solo el owner puede distribuir", "warning");
      return;
    }
    setIsDistributing(true);
    try {
      const signer = (await getProviderOrSigner(
        true
      )) as import("ethers").JsonRpcSigner;
      const contract = getTokenFarmContract(signer);
      const tx = await contract.distributeRewardsAll();
      await tx.wait();
      Swal.fire(
        "Recompensas distribuidas",
        "Distribución completada",
        "success"
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      Swal.fire(
        "Error al distribuir",
        error?.reason || error?.message,
        "error"
      );
    } finally {
      setIsDistributing(false);
    }
  };

  useEffect(() => {
    if (account) connectWallet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-100 to-yellow-100 flex flex-col">
      <header className="bg-yellow-900">
        <div className="max-w-4xl mx-auto py-6 px-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-amber-100">
              CoffeeSwap
            </h1>
            <p className="text-sm text-amber-200">Token Farm Dashboard</p>
          </div>
          <div className="flex items-center space-x-4">
            {account ? (
              <>
                <span className="text-amber-100 font-mono">
                  {abbreviate(account)}
                </span>
                <button
                  onClick={disconnectWallet}
                  className="px-3 py-1 bg-red-600 text-amber-100 rounded hover:bg-red-700 transition"
                >
                  Desconectar
                </button>
              </>
            ) : (
              <button
                onClick={connectWallet}
                className="px-4 py-2 bg-amber-700 text-yellow-50 rounded-lg shadow hover:bg-amber-800 transition"
              >
                Conectar Wallet
              </button>
            )}
          </div>
        </div>
      </header>

      {wrongNetwork && (
        <div className="bg-red-200 text-red-800 text-center py-2">
          🚨 Conecta tu wallet a la red Sepolia para continuar.
        </div>
      )}

      <main className="flex-grow max-w-4xl mx-auto p-4">
        {account && !wrongNetwork && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[
                { label: "LP Balance", value: `${lpBalance} LPT` },
                { label: "Staked", value: `${stakedBalance} LPT` },
                { label: "Rewards", value: `${pendingRewards} DAPP` },
              ].map((card) => (
                <div
                  key={card.label}
                  className="p-4 bg-amber-50 rounded-2xl shadow"
                >
                  <h2 className="text-sm font-medium text-yellow-800">
                    {card.label}
                  </h2>
                  <p className="mt-2 text-xl font-semibold text-yellow-900">
                    {card.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-amber-50 rounded-2xl shadow p-6 space-y-6">
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  placeholder="Cantidad a depositar"
                  className="flex-grow px-4 py-2 border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  value={inputAmount}
                  onChange={(e) => setInputAmount(e.target.value)}
                />
                <button
                  onClick={deposit}
                  disabled={isDepositing}
                  className="px-6 py-2 bg-yellow-600 text-amber-100 rounded-lg hover:bg-yellow-700 transition disabled:opacity-60"
                >
                  {isDepositing ? "Procesando..." : "Deposit"}
                </button>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
                <button
                  onClick={withdraw}
                  disabled={isWithdrawing}
                  className="flex-1 px-4 py-2 bg-red-600 text-amber-100 rounded-lg hover:bg-red-700 transition disabled:opacity-60"
                >
                  {isWithdrawing ? "Procesando..." : "Withdraw"}
                </button>
                <button
                  onClick={claimRewards}
                  disabled={isClaiming}
                  className="flex-1 px-4 py-2 bg-yellow-800 text-amber-100 rounded-lg hover:bg-yellow-900 transition disabled:opacity-60"
                >
                  {isClaiming ? "Procesando..." : "Claim Rewards"}
                </button>
                <button
                  onClick={distributeAll}
                  disabled={!isOwner || isDistributing}
                  className={`flex-1 px-4 py-2 rounded-lg text-amber-100 transition ${
                    isOwner
                      ? "bg-yellow-700 hover:bg-yellow-800"
                      : "bg-yellow-200 cursor-not-allowed text-yellow-800"
                  } disabled:opacity-60`}
                >
                  {isDistributing ? "Procesando..." : "Distribute All"}
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="bg-yellow-200 py-4">
        <div className="max-w-4xl mx-auto text-center text-sm text-yellow-900">
          CoffeeSwap &copy; {new Date().getFullYear()} • Built with ☕ and
          Solidity
        </div>
      </footer>
    </div>
  );
}
