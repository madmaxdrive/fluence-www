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

const ERC20_ADDRESS = '0x4A26C7daCcC90434693de4b8bede3151884cab89';
const FLUENCE_ADDRESS = '0x13095e61fC38a06041f2502FcC85ccF4100FDeFf';
const starkEC = new EC(new curves.PresetCurve({
  type: 'short',
  prime: null,
  p: '800000000000011000000000000000000000000000000000000000000000001',
  a: '1',
  b: '6f21413efbe40de150e596d72f7a8c5609ad26c15c915c1f4cdfcb99cee9e89',
  n: '800000000000010ffffffffffffffffb781126dcae7b2321e66a241adc64d2f',
  hash: undefined,
  gRed: false,
  g: [
    '1ef15c18599971b7beced415a40f0c7deacfd9b0d1819e03d723d8bc943cfca',
    '5668060aa49730b7be4801df46ec62de53ecd11abe43a32873000c36e8dc1f',
  ],
}));
const SECP256K1_N = BigNumber.from('0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141');
const EC_ORDER = BigNumber.from(String(starkEC.n));

const Deposit: NextPage = () => {
  const [provider, setProvider] = useState<providers.Web3Provider>();
  const [erc20Contract, setErc20Contract] = useState<Contract>();
  const [fluenceContract, setFluenceContract] = useState<Contract>();
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState<BigNumber>(BigNumber.from(0));
  const [amount, setAmount] = useState<BigNumber>(BigNumber.from(0));
  const [transactions, setTransactions] = useState<providers.TransactionResponse[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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

    function derive_path(account: string, index: number = 1) {
      const purpose = 2645;
      const m = BigNumber.from(1).shl(31).sub(1);
      const layer = BigNumber.from(utils.sha256(utils.toUtf8Bytes('starkex'))).and(m);
      const application = BigNumber.from(utils.sha256(utils.toUtf8Bytes('immutablex'))).and(m);
      const address = BigNumber.from(account);
      const address1 = address.and(m);
      const address2 = address.shr(31).and(m);

      return `m/${purpose}'/${layer}'/${application}'/${address1}'/${address2}'/${index}`;
    }

    function derive_private_key(account: string, seed: string) {
      const hd = utils.HDNode.fromSeed(seed);
      const derived = hd.derivePath(derive_path(account, 1)).privateKey;

      const n = SECP256K1_N.sub(SECP256K1_N.mod(EC_ORDER));
      for (let i = 0; ; i++) {
        const k = BigNumber.from(utils.sha256(utils.hexConcat([derived, i])));
        if (k.lt(n)) {
          return k.mod(EC_ORDER);
        }
      }
    }

    setLoading(true);
    const atx = await erc20Contract.approve(FLUENCE_ADDRESS, amount);
    setTransactions([atx]);
    const signature_str = await provider.getSigner(account).signMessage('Only sign this request if you’ve initiated an action with Immutable X.');
    const signature = utils.splitSignature(signature_str);
    const private_key = derive_private_key(account, signature.s);
    console.log(private_key.toHexString());
    const key_pair = starkEC.keyFromPrivate(private_key.toHexString().slice(2));
    const stark_key = key_pair.getPublic().getX();
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
        <title>Deposit / Withdraw</title>
      </Head>

      <Typography variant="h1">Deposit / Withdraw</Typography>
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
          type="number"
          label="Amount / Token ID"
          value={amount.toString()}
          onChange={handleChangeAmount}
        />

        <Box my={2}>
          <Button variant="contained" type="submit" sx={{ mr: 1 }} disabled={loading} onClick={deposit}>Deposit</Button>
          <Button variant="contained" color="secondary" type="submit" disabled={loading} onClick={deposit}>Withdraw</Button>
        </Box>
      </form>
      {transactions.map(tx => (
        <Typography variant="body2" key={tx.hash}>
          <Link href={`https://goerli.etherscan.io/tx/${tx.hash}`} target="_blank">{tx.hash}</Link>
        </Typography>
      ))}
    </Container>
  )
}

export default Deposit;
