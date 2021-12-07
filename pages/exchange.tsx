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
import { useERC20, useERC721, useFluenceInstance, useStarkSigner } from '../ethereum_provider';

const Exchange: NextPage = () => {
  const erc20 = useERC20();
  const erc721 = useERC721();
  const starkSigner = useStarkSigner();
  const fluenceInstance = useFluenceInstance();

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
    if (!erc20 || !erc721 || !starkSigner || !fluenceInstance) {
      return;
    }

    setLoading(true);
    const hash = await fluenceInstance.createOrder(starkSigner, orderId, !!side, erc721.address, tokenId, erc20.address, price);
    setTransactions([hash]);

    setLoading(false);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!starkSigner || !fluenceInstance) {
      return;
    }

    setLoading(true);
    switch (((e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement)?.name) {
      case 'get': {
        setOrder(await fluenceInstance.getOrder(orderId2));
        break;
      }

      case 'cancel': {
        setTransactions2([await fluenceInstance.cancelOrder(starkSigner, orderId2)]);
        break;
      }

      case 'fulfill': {
        setTransactions2([await fluenceInstance.fulfillOrder(starkSigner, orderId2)]);
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
