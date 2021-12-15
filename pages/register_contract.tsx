import type { NextPage } from 'next'
import Head from 'next/head'
import React, { useState } from 'react';
import axios from 'axios';
import {
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
  useFluenceInstance,
  useStarkSigner,
} from '../ethereum_provider';

const Home: NextPage = () => {
  const fluenceInstance = useFluenceInstance();

  const [contract, setContract] = useState('');
  const [minter, setMinter] = useState('');
  const [transactions, setTransactions] = useState<TransactionReceipt[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(fluenceInstance);
    if (!fluenceInstance) {
      return;
    }

    setLoading(true);
    setTransactions([{ layer: 1, hash: await fluenceInstance.registerContract(contract, minter) }]);

    setLoading(false);
  }

  return (
    <Container>
      <Head>
        <title>Register contract</title>
      </Head>

      <Typography variant="h1">Register contract</Typography>

      <form onSubmit={handleSubmit}>
        <TextField
          required
          fullWidth
          margin="normal"
          variant="outlined"
          label="Contract"
          value={contract}
          onChange={({ target: { value }}) => setContract(value)}
        />
        <TextField
          required
          fullWidth
          margin="normal"
          variant="outlined"
          label="Minter"
          value={minter}
          onChange={({ target: { value }}) => setMinter(value)}
        />

        <Box my={2}>
          <Button variant="contained" type="submit" sx={{ mr: 1 }}>Register</Button>
        </Box>
      </form>

      {transactions.map(tx => (
        <Typography variant="body2" key={tx.hash}>
          <Link href={`https://${['goerli.etherscan.io', 'goerli.voyager.online'][tx.layer - 1]}/tx/${tx.hash}`}>{tx.hash}</Link>
        </Typography>
      ))}

      <Backdrop open={loading}>
        <CircularProgress />
      </Backdrop>
    </Container>
  )
}

export default Home;
