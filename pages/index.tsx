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
  const account = useAccount();
  const erc20 = useERC20();
  const erc721 = useERC721();
  const starkSigner = useStarkSigner();
  const fluenceInstance = useFluenceInstance();

  const [token, setToken] = useState(1);
  const [amountOrTokenId, setAmountOrTokenId] = useState(0);
  const [transactions, setTransactions] = useState<TransactionReceipt[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !erc20 || !erc721 || !starkSigner || !fluenceInstance) {
      return;
    }

    setLoading(true);
    const layer = [1, 1, 2][token] as 1 | 2;
    switch (token) {
      case 2:
        setTransactions([{ layer, hash: await fluenceInstance.mint(starkSigner, amountOrTokenId, erc721.address) }]);
        break;

      default:
        const { data } = await axios.post<{ transaction_hash: string }>('/api/v1/mint', {
          user: account,
          amount_or_token_id: amountOrTokenId,
          contract: [erc20, erc721][token].address,
          token,
        });
        setTransactions([{ layer, hash: data.transaction_hash }]);
        break;
    }

    setLoading(false);
  }

  return (
    <Container>
      <Head>
        <title>Mint</title>
      </Head>

      <Typography variant="h1">Mint</Typography>

      <form onSubmit={handleSubmit}>
        <FormControl
          required
          fullWidth
          margin="normal"
        >
          <InputLabel id="token">Token</InputLabel>
          <Select labelId="token" label="Token *" value={token} onChange={({ target: { value }}) => setToken(+value)}>
            <MenuItem value={0}>Testdrive / TDR (ERC20)</MenuItem>
            <MenuItem value={1}>Testdrive NFT / TDRN (ERC721)</MenuItem>
            <MenuItem value={2}>Testdrive NFT / TDRN (ERC721, Layer 2)</MenuItem>
          </Select>
        </FormControl>
        <TextField
          required
          fullWidth
          margin="normal"
          variant="outlined"
          type="number"
          label={['Amount', 'Token ID', 'Token ID'][token]}
          onChange={({ target: { value }}) => setAmountOrTokenId(+value)}
        />

        <Box my={2}>
          <Button variant="contained" type="submit" name="mint" sx={{ mr: 1 }}>Mint</Button>
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
