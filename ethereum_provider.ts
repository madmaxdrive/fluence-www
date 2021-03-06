import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Contract, providers, utils } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';
import { Fluence, Web3StarkSigner } from '@phanalpha/fluence';
import ERC20PresetMinterPauser from './abi/ERC20PresetMinterPauser.json';
import ERC721PresetMinterPauserAutoId from './abi/ERC721PresetMinterPauserAutoId.json';

export function useEthereumProvider() {
  const [ethereum, setEthereum] = useState<Required<providers.ExternalProvider>>();
  if ('undefined' !== typeof window) {
    detectEthereumProvider().then((provider: any) => setEthereum(provider));
  }

  return ethereum;
}

export function useProvider() {
  const ethereum = useEthereumProvider();

  return useMemo(() => ethereum && new providers.Web3Provider(ethereum), [ethereum]);
}

export function useAccount() {
  const provider = useEthereumProvider();
  const [account, setAccount] = useState('');

  useEffect(() => {
    provider
      ?.request({ method: 'eth_requestAccounts' })
      ?.then((accounts: string[]) => setAccount(utils.getAddress(accounts[0])))
    ;
  }, [provider]);

  return account;
}

export function useERC20() {
  const provider = useProvider();
  const account = useAccount();

  return useMemo(() =>
    provider && account && new Contract(
      process.env.NEXT_PUBLIC_ERC20_CONTRACT_ADDRESS as string,
      ERC20PresetMinterPauser,
      provider.getSigner(account)
    ), [provider, account]);
}

export function useERC721() {
  const provider = useProvider();
  const account = useAccount();

  return useMemo(() =>
    provider && account && new Contract(
      process.env.NEXT_PUBLIC_ERC721_CONTRACT_ADDRESS as string,
      ERC721PresetMinterPauserAutoId,
      provider.getSigner(account)
    ), [provider, account]);
}

export function useFluence() {
  const provider = useProvider();
  const account = useAccount();

  return useMemo(() =>
    provider && account && Fluence.contract(
      process.env.NEXT_PUBLIC_ETHER_FLUENCE_CONTRACT_ADDRESS as string,
      provider.getSigner(account)
    ), [provider, account]);
}

export function useForwarder() {
  const provider = useProvider();
  const account = useAccount();

  return useMemo(() =>
    provider && account && Fluence.forwarder(
      process.env.NEXT_PUBLIC_ETHER_FORWARDER_CONTRACT_ADDRESS as string,
      provider.getSigner(account)
    ), [provider, account]);
}

export function useStarkSigner() {
  const provider = useProvider();
  const account = useAccount();

  return useMemo(() =>
    provider && account && new Web3StarkSigner(
      provider.getSigner(account),
      'starkex',
      'immutablex',
      'Only sign this request if you???ve initiated an action with Immutable X.'
    ), [provider, account]);
}

export function useFluenceInstance() {
  const fluence = useFluence();
  const forwarder = useForwarder();

  return useMemo(() =>
    fluence && forwarder && new Fluence(
      axios.create({ baseURL: '/api/v1' }),
      fluence,
      forwarder,
      process.env.NEXT_PUBLIC_STARK_FLUENCE_CONTRACT_ADDRESS as string), [fluence, forwarder]);
}

export interface TransactionReceipt {
  layer: 1 | 2;
  hash: string;
}
