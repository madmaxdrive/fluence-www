import type { NextPage } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import axios from 'axios';
import BN from 'bn.js';
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
import { useERC20, useERC721, useStarkSigner } from '../ethereum_provider';

const Exchange: NextPage = () => {
  const erc20 = useERC20();
  const erc721 = useERC721();
  const starkSigner = useStarkSigner();

  const [orderId, setOrderId] = useState(0);
  const [side, setSide] = useState(0);
  const [tokenId, setTokenId] = useState(0);
  const [price, setPrice] = useState(0);
  const [transactions, setTransactions] = useState<string[]>([]);
  const [orderId2, setOrderId2] = useState(0);
  const [order, setOrder] = useState<LimitOrder>();
  const [transactions2, setTransactions2] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!erc20 || !erc721 || !starkSigner) {
      return;
    }

    setLoading(true);
    const [stark_key, signature] = await starkSigner.sign([
      orderId,
      side,
      new BN(erc721.address.slice(2), 16),
      tokenId,
      new BN(erc20.address.slice(2), 16),
      price,
    ]);
    const { data } = await axios.put<{ transaction_hash: string }>(`/api/v1/orders/${orderId}?signature=${signature.r},${signature.s}`, {
      user: String(stark_key),
      bid: side,
      base_contract: erc721.address,
      base_token_id: tokenId,
      quote_contract: erc20.address,
      quote_amount: price,
    });

    setTransactions([data.transaction_hash]);
    setLoading(false);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!starkSigner) {
      return;
    }

    setLoading(true);
    switch (((e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement)?.name) {
      case 'get': {
        const { data } = await axios.get<LimitOrder>(`/api/v1/orders/${orderId2}`);
        setOrder(data);
        break;
      }

      case 'cancel': {
        const [_, signature] = await starkSigner.sign([orderId2]);
        const { data } = await axios.delete<{ transaction_hash: string }>(`/api/v1/orders/${orderId2}?signature=${signature.r},${signature.s}`);
        setTransactions2([data.transaction_hash]);
        break;
      }

      case 'fulfill': {
        const [stark_key, signature] = await starkSigner.sign([orderId2]);
        const { data } = await axios.post<{ transaction_hash: string }>(`/api/v1/orders/${orderId2}?signature=${signature.r},${signature.s}`, {
          user: String(stark_key),
        });
        setTransactions2([data.transaction_hash]);
        break;
      }
    }

    setLoading(false);
  };

  return (
    <Container>
      <Head>
        <title>Exchange</title>
      </Head>

      <Typography variant="h1">Exchange</Typography>
      <form onSubmit={handleCreateOrder}>
        <TextField
          required
          fullWidth
          margin="normal"
          variant="outlined"
          type="number"
          label="Order #"
          onChange={({ target: { value }}) => setOrderId(+value)}
        />
        <FormControl
          required
          fullWidth
          margin="normal"
        >
          <InputLabel id="side">Side</InputLabel>
          <Select
            labelId="side"
            label="Side *"
            value={side}
            onChange={({ target: { value }}) => setSide(+value)}
          >
            <MenuItem value={0}>Ask</MenuItem>
            <MenuItem value={1}>Bid</MenuItem>
          </Select>
        </FormControl>
        <TextField
          required
          fullWidth
          margin="normal"
          variant="outlined"
          type="number"
          label="Token # (TDRN)"
          onChange={({ target: { value }}) => setTokenId(+value)}
        />
        <TextField
          required
          fullWidth
          margin="normal"
          variant="outlined"
          label="Price (TDR)"
          onChange={({ target: { value }}) => setPrice(+value)}
        />

        <Box my={2}>
          <Button variant="contained" type="submit">Create order</Button>
        </Box>
      </form>

      {transactions.map(tx => (
        <Typography variant="body2" key={tx}>
          <Link href={`https://voyager.online/tx/${tx}`}>{tx}</Link>
        </Typography>
      ))}

      <br />
      <form onSubmit={handleSubmit}>
        <TextField
          required
          fullWidth
          margin="normal"
          variant="outlined"
          label="Order #"
          onChange={({ target: { value }}) => setOrderId2(+value)}
        />

        <Box my={2}>
          <Button variant="contained" type="submit" name="fulfill" sx={{ mr: 1 }}>Fulfill Order</Button>
          <Button variant="contained" color="secondary" type="submit" name="cancel" sx={{ mr: 1 }}>Cancel Order</Button>
          <Button type="submit" name="get">Get Order</Button>
        </Box>
      </form>

      {transactions2.map(tx => (
        <Typography variant="body2" key={tx}>
          <Link href={`https://voyager.online/tx/${tx}`}>{tx}</Link>
        </Typography>
      ))}

      {order && (
        <Typography variant="body2">
          <b>{['Ask', 'Bid'][order.bid]}</b> {order.quote_amount} TDR for #{order.base_token_id} TDRN,{' '}
          <b>{['NEW', 'FULFILLED', 'CANCELLED'][order.state]}</b>.
        </Typography>
      )}

      <Backdrop open={loading}>
        <CircularProgress />
      </Backdrop>
    </Container>
  );
}

interface LimitOrder {
  readonly user: string;
  readonly bid: 0 | 1;
  readonly base_contract: string;
  readonly base_token_id: number;
  readonly quote_contract: string;
  readonly quote_amount: number;
  readonly state: number;
}

export default Exchange;
