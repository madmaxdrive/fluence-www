import type { NextPage } from 'next'
import Head from 'next/head'
import React, { useEffect, useState } from 'react';
import { curves, ec as EC } from 'elliptic';
import { BigNumber, Contract, providers, utils } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider'
import {
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Select,
  TextField,
  Typography
} from '@mui/material';
import ERC20PresetMinterPauser from '../abi/ERC20PresetMinterPauser.json';
import Fluence from '../abi/Fluence.json';
import { derive_private_key, pedersen_hash, private_to_stark_key, sign } from '../signature';

const ERC20_ADDRESS = '0x4A26C7daCcC90434693de4b8bede3151884cab89';
const FLUENCE_ADDRESS = '0x13095e61fC38a06041f2502FcC85ccF4100FDeFf';

const Home: NextPage = () => {
  const [provider, setProvider] = useState<providers.Web3Provider>();
  const [erc20Contract, setErc20Contract] = useState<Contract>();
  const [fluenceContract, setFluenceContract] = useState<Contract>();
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState<BigNumber>(BigNumber.from(0));
  const [amount, setAmount] = useState<BigNumber>(BigNumber.from(0));
  const [transactions, setTransactions] = useState<providers.TransactionResponse[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log(sign(BigNumber.from(1234567), pedersen_hash([13])));
    detectEthereumProvider().then(async (ethereum: any) => {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);

      const provider = new providers.Web3Provider(ethereum);
      const signer = provider.getSigner(accounts[0]);
      const erc20 = new Contract(ERC20_ADDRESS, ERC20PresetMinterPauser, signer);
      const fluence = new Contract(FLUENCE_ADDRESS, Fluence, signer);

      setProvider(provider);
      setErc20Contract(erc20);
      setFluenceContract(fluence);
    });
  }, []);

  const handleGetBalance = async () => {
    if (!provider || !erc20Contract || !fluenceContract || !account) {
      throw new Error();
    }

    setLoading(true);
    const balance = await erc20Contract.balanceOf(account);

    setBalance(balance);
    setAmount(balance);
    setLoading(false);
  };

  const handleChangeAmount = ({ target: { value } }: React.ChangeEvent<HTMLInputElement>) =>
    setAmount(BigNumber.from('' !== value ? value : 0));

  const deposit = async () => {
    if (!provider || !erc20Contract || !fluenceContract || !account) {
      throw new Error();
    }

    setLoading(true);
    const atx = await erc20Contract.approve(FLUENCE_ADDRESS, amount);
    setTransactions([atx]);
    const signature_str = await provider.getSigner(account).signMessage('Only sign this request if you’ve initiated an action with Immutable X.');
    const signature = utils.splitSignature(signature_str);
    const private_key = derive_private_key(account, signature.s);
    console.log(private_key.toHexString());
    const stark_key = private_to_stark_key(private_key);
    console.log(stark_key.toString('hex'));
    const dtx = await fluenceContract.deposit(
      '0x491d5830e5ad80fd57ce1bd26e255136eddda102faf0f935620807521557e54',
      BigNumber.from(String(stark_key)),
      amount,
      ERC20_ADDRESS,
      { gasLimit: 150000 });
    setTransactions([atx, dtx]);
    setLoading(false);
  };

  if (!provider || !erc20Contract || !account) {
    return (
      <Typography variant="body1">Detecting Ethereum provider...</Typography>
    );
  }

  return (
    <Container>
      <Head>
        <title>Mint</title>
      </Head>

      <Typography variant="h1">Mint</Typography>
      <Typography variant="subtitle1">{account}</Typography>

      <form>
        <FormControl
          required
          fullWidth
          margin="normal"
        >
          <InputLabel id="token">Token</InputLabel>
          <Select labelId="token" label="Token *">
            <MenuItem value={0}>Testdrive / TDR (ERC20)</MenuItem>
            <MenuItem value={1}>Testdrive NFT / TDRN (ERC721)</MenuItem>
          </Select>
        </FormControl>
        <TextField
          fullWidth
          margin="normal"
          variant="outlined"
          label="Amount / Token ID"
          value={balance.toString()}
          InputProps={{ readOnly: true }}
        />

        <Box my={2}>
          <Button variant="contained" type="submit" sx={{ mr: 1 }}>Mint</Button>
          <Button type="submit" disabled={loading} onClick={handleGetBalance}>Get balance</Button>
        </Box>
      </form>
    </Container>
  )
}

export default Home;
