import type { NextPage } from 'next'
import Head from 'next/head'
import React, { useState } from 'react';
import axios from 'axios';
import {
  Alert,
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Select,
  TextField,
  Typography
} from '@mui/material';
import { BigNumber } from 'ethers';
import { useAccount, useERC20, useERC721, useFluence, useStarkSigner } from '../ethereum_provider';
import BN from "bn.js";

const L2_CONTRACT_ADDRESS = '0x0345694ad48166e1fdf36643044f696c571a18605ba39d99ef5ee53e54357303';

const Deposit: NextPage = () => {
  const account = useAccount();
  const erc20 = useERC20();
  const erc721 = useERC721();
  const fluence = useFluence();
  const starkSigner = useStarkSigner();

  const [token, setToken] = useState(1);
  const [amountOrTokenId, setAmountOrTokenId] = useState(0);
  const [transactions, setTransactions] = useState<TransactionReceipt[]>([]);
  const [token2, setToken2] = useState(1);
  const [balance, setBalance] = useState<number>();
  const [tokenId, setTokenId] = useState(0);
  const [owner, setOwner] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !erc20 || !erc721 || !fluence || !starkSigner) {
      return;
    }

    setLoading(true);
    switch (((e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement)?.name) {
      case 'deposit': {
        const contract = [null, erc20, erc721][token];
        setTransactions((!contract ? [
          await fluence['deposit(uint256,uint256)'](
            L2_CONTRACT_ADDRESS,
            BigNumber.from(String(await starkSigner.derive_stark_key())),
            { value: amountOrTokenId, gasLimit: 180000 }),
        ] : [
          await contract.approve(fluence.address, amountOrTokenId),
          await fluence['deposit(uint256,uint256,uint256,address)'](
            L2_CONTRACT_ADDRESS,
            BigNumber.from(String(await starkSigner.derive_stark_key())),
            amountOrTokenId,
            contract.address,
            { gasLimit: 180000 }),
        ]).map(tx => ({
          layer: 1,
          hash: tx.hash,
        })));
        break;
      }

      case 'withdraw-l2': {
        const contract = ['0x0', erc20.address, erc721.address][token];
        const [stark_key, signature] = await starkSigner.sign([
          amountOrTokenId,
          new BN(contract.slice(2), 16),
          new BN(account.slice(2), 16),
        ]);
        const { data } = await axios.post<{ transaction_hash: string }>('/api/v1/withdraw', {
          user: String(await starkSigner.derive_stark_key()),
          amount_or_token_id: amountOrTokenId,
          contract: [0, erc20.address, erc721.address][token],
          address: account,
        });
        setTransactions([{ layer: 2, hash: data.transaction_hash }]);
        break;
      }

      case 'withdraw-l1':
        setTransactions([
          await fluence.withdraw(
            L2_CONTRACT_ADDRESS,
            account,
            amountOrTokenId,
            ['0x0', erc20.address, erc721.address][token],
            { gasLimit: 110000 }),
        ].map(tx => ({
          layer: 1,
          hash: tx.hash,
        })));
        break;
    }

    setLoading(false);
  };
  const handleGetBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!erc20 || !starkSigner) {
      return;
    }

    setLoading(true);
    const stark_key = await starkSigner.derive_stark_key();
    const { data } = await axios.get<{ balance: number }>('/api/v1/balance', {
      params: {
        user: String(stark_key),
        contract: [0, erc20.address][token2],
      }
    });

    setBalance(data.balance);
    setLoading(false);
  };
  const handleGetOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!erc721 || !starkSigner) {
      return;
    }

    setLoading(true);
    const { data } = await axios.get<{ owner: string }>('/api/v1/owner', {
      params: {
        token_id: tokenId,
        contract: erc721.address,
      }
    });

    setOwner(data.owner);
    setLoading(false);
  };

  return (
    <Container>
      <Head>
        <title>Deposit / Withdraw</title>
      </Head>

      <Typography variant="h1">Deposit / Withdraw</Typography>

      <form onSubmit={handleSubmit}>
        <FormControl
          required
          fullWidth
          margin="normal"
        >
          <InputLabel id="token">Token</InputLabel>
          <Select labelId="token" label="Token *" value={token} onChange={({ target: { value } }) => setToken(+value)}>
            <MenuItem value={0}>Ethereum / ETH</MenuItem>
            <MenuItem value={1}>Testdrive / TDR (ERC20)</MenuItem>
            <MenuItem value={2}>Testdrive NFT / TDRN (ERC721)</MenuItem>
          </Select>
        </FormControl>
        <TextField
          required
          fullWidth
          margin="normal"
          variant="outlined"
          type="number"
          label={['Amount', 'Amount', 'Token ID'][token]}
          onChange={({ target: { value }}) => setAmountOrTokenId(+value)}
        />

        <Box my={2}>
          <Button variant="contained" type="submit" name="deposit" sx={{ mr: 1 }}>Deposit</Button>
          <Button variant="contained" color="secondary" type="submit" name="withdraw-l2" sx={{ mr: 1 }}>Withdraw (Layer 2)</Button>
          <Button variant="contained" color="secondary" type="submit" name="withdraw-l1" sx={{ mr: 1 }}>Withdraw (Layer 1)</Button>
        </Box>
      </form>

      {transactions.map(tx => (
        <Typography variant="body2" key={tx.hash}>
          <Link href={`https://${['goerli.etherscan.io', 'voyager.online'][tx.layer - 1]}/tx/${tx.hash}`}>{tx.hash}</Link>
        </Typography>
      ))}

      <Typography variant="h2" mt={2}>Ethereum & Testdrive / TDR (ERC20)</Typography>
      <form onSubmit={handleGetBalance}>
        <FormControl
          required
          fullWidth
          margin="normal"
        >
          <InputLabel id="token">Token</InputLabel>
          <Select labelId="token" label="Token *" value={token2} onChange={({ target: { value } }) => setToken2(+value)}>
            <MenuItem value={0}>Ethereum / ETH</MenuItem>
            <MenuItem value={1}>Testdrive / TDR (ERC20)</MenuItem>
          </Select>
        </FormControl>

        <Box>
          <Button type="submit">Get balance (Layer 2)</Button>
        </Box>
      </form>
      {undefined !== balance && (
        <Alert severity="info" sx={{ my: 1 }}>{balance}</Alert>
      )}

      <Typography variant="h2" mt={2}>Testdrive NFT / TDRN (ERC721)</Typography>
      <form onSubmit={handleGetOwner}>
        <TextField
          required
          fullWidth
          margin="normal"
          variant="outlined"
          type="number"
          label="Token ID"
          onChange={({ target: { value }}) => setTokenId(+value)}
        />

        <Box>
          <Button type="submit">Get owner (Layer 2)</Button>
        </Box>
      </form>
      {owner && (
        <Alert severity="info" sx={{ my: 1 }}>{owner}</Alert>
      )}

      <Backdrop open={loading}>
        <CircularProgress />
      </Backdrop>
    </Container>
  )
}

interface TransactionReceipt {
  layer: 1 | 2;
  hash: string;
}

export default Deposit;
