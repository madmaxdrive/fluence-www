import type { NextPage } from 'next'
import Head from 'next/head'
import React, { useState } from 'react';
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
import {
  TransactionReceipt,
  useAccount,
  useERC20,
  useERC721,
  useFluence,
  useFluenceInstance,
  useStarkSigner
} from '../ethereum_provider';

const Deposit: NextPage = () => {
  const account = useAccount();
  const erc20 = useERC20();
  const erc721 = useERC721();
  const fluence = useFluence();
  const starkSigner = useStarkSigner();
  const fluenceInstance = useFluenceInstance();

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
    if (!account || !erc20 || !erc721 || !fluence || !starkSigner || !fluenceInstance) {
      return;
    }

    setLoading(true);
    switch (((e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement)?.name) {
      case 'deposit': {
        const hs = await fluenceInstance.deposit(starkSigner, amountOrTokenId, [undefined, erc20, erc721][token]);
        setTransactions(hs.map(hash => ({ layer: 1, hash })));
        break;
      }

      case 'withdraw-l2': {
        const hash = await fluenceInstance.withdraw(account, starkSigner, amountOrTokenId, [undefined, erc20.address, erc721.address][token]);
        setTransactions([{ layer: 2, hash }]);
        break;
      }

      case 'withdraw-l1':
        let mint = false;
        if (2 === token) {
          try {
            await erc721.ownerOf(amountOrTokenId);
            mint = true;
          } catch {
          }
        }

        const hash = await fluenceInstance.doWithdraw(account, amountOrTokenId, [undefined, erc20.address, erc721.address][token], mint);
        setTransactions([{ layer: 1, hash }]);
        break;
    }

    setLoading(false);
  };
  const handleGetBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!erc20 || !starkSigner || !fluenceInstance) {
      return;
    }

    setLoading(true);
    const balance = await fluenceInstance.getBalance(starkSigner, [undefined, erc20.address][token2]);
    setBalance(balance.toNumber());

    setLoading(false);
  };
  const handleGetOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!erc721 || !starkSigner || !fluenceInstance) {
      return;
    }

    setLoading(true);
    const owner = await fluenceInstance.getOwner(tokenId, erc721.address);
    setOwner(owner.toString());

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
          <Link href={`https://${['goerli.etherscan.io', 'goerli.voyager.online'][tx.layer - 1]}/tx/${tx.hash}`}>{tx.hash}</Link>
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

export default Deposit;
