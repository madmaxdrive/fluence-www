import { useEffect, useMemo, useState } from 'react';
import { Contract, providers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';
import ERC20PresetMinterPauser from './abi/ERC20PresetMinterPauser.json';
import ERC721PresetMinterPauserAutoId from './abi/ERC721PresetMinterPauserAutoId.json';
import Fluence from './abi/Fluence.json';
import { StarkSigner } from "./signature";

export function useEthereumProvider() {
  const [ethereum, setEthereum] = useState<Required<providers.ExternalProvider>>();
  detectEthereumProvider().then((provider: any) => setEthereum(provider));

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
      ?.then((accounts: string[]) => setAccount(accounts[0]))
    ;
  }, [provider]);

  return account;
}

export function useERC20() {
  const provider = useProvider();
  const account = useAccount();

  return useMemo(() =>
    provider && account && new Contract(
      '0x4A26C7daCcC90434693de4b8bede3151884cab89',
      ERC20PresetMinterPauser,
      provider.getSigner(account)
    ), [provider, account]);
}

export function useERC721() {
  const provider = useProvider();
  const account = useAccount();

  return useMemo(() =>
    provider && account && new Contract(
      '0xfAfC4Ec8ca3Eb374fbde6e9851134816Aada912a',
      ERC721PresetMinterPauserAutoId,
      provider.getSigner(account)
    ), [provider, account]);
}

export function useFluence() {
  const provider = useProvider();
  const account = useAccount();

  return useMemo(() =>
    provider && account && new Contract(
      '0x13095e61fC38a06041f2502FcC85ccF4100FDeFf',
      Fluence,
      provider.getSigner(account)
    ), [provider, account]);
}

export function useStarkSigner() {
  const provider = useProvider();
  const account = useAccount();

  return useMemo(() => provider && account && new StarkSigner(account, provider), [provider, account]);
}
