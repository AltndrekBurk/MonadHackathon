import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { NETWORK } from '../config';

export function useMetaMask() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';

  // Connect to MetaMask
  const connect = async () => {
    if (!isMetaMaskInstalled) {
      setError('Please install MetaMask');
      return false;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      // Get provider and signer
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const web3Signer = await web3Provider.getSigner();
      const network = await web3Provider.getNetwork();

      setAccount(accounts[0]);
      setProvider(web3Provider);
      setSigner(web3Signer);
      setChainId(Number(network.chainId));

      // Check if correct network
      if (Number(network.chainId) !== NETWORK.CHAIN_ID) {
        await switchNetwork();
      }

      console.log('✅ Connected to MetaMask:', accounts[0]);
      return true;
    } catch (err) {
      console.error('Failed to connect:', err);
      setError(err.message);
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  // Switch to Monad Testnet
  const switchNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: NETWORK.CHAIN_ID_HEX }],
      });
    } catch (switchError) {
      // Network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: NETWORK.CHAIN_ID_HEX,
              chainName: NETWORK.NAME,
              rpcUrls: [NETWORK.RPC_URL],
              blockExplorerUrls: [NETWORK.EXPLORER_URL],
              nativeCurrency: NETWORK.CURRENCY
            }]
          });
        } catch (addError) {
          console.error('Failed to add network:', addError);
          setError('Failed to add Monad Testnet');
        }
      } else {
        console.error('Failed to switch network:', switchError);
        setError('Please switch to Monad Testnet manually');
      }
    }
  };

  // Disconnect
  const disconnect = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
  };

  // Listen for account changes
  useEffect(() => {
    if (!isMetaMaskInstalled) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (accounts[0] !== account) {
        setAccount(accounts[0]);
      }
    };

    const handleChainChanged = (chainIdHex) => {
      const newChainId = parseInt(chainIdHex, 16);
      setChainId(newChainId);
      
      if (newChainId !== NETWORK.CHAIN_ID) {
        setError('Please switch to Monad Testnet');
      } else {
        setError(null);
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [account, isMetaMaskInstalled]);

  // Auto-connect if previously connected
  useEffect(() => {
    if (isMetaMaskInstalled && !account) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then(accounts => {
          if (accounts.length > 0) {
            connect();
          }
        })
        .catch(console.error);
    }
  }, []);

  return {
    account,
    provider,
    signer,
    chainId,
    isConnecting,
    isConnected: !!account,
    isCorrectNetwork: chainId === NETWORK.CHAIN_ID,
    error,
    connect,
    disconnect,
    switchNetwork,
    isMetaMaskInstalled
  };
}

