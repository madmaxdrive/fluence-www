import type { NextPage } from 'next';
import Head from 'next/head';
import {
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography
} from '@mui/material';

const Exchange: NextPage = () => {
  return (
    <Container>
      <Head>
        <title>Exchange</title>
      </Head>

      <Typography variant="h1">Exchange</Typography>
      <form>
        <TextField
          required
          fullWidth
          margin="normal"
          variant="outlined"
          label="Order #"
          value=""
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
          label="Token # (TDRN)"
          value=""
        />
        <TextField
          required
          fullWidth
          margin="normal"
          variant="outlined"
          label="Price (TDR)"
          value=""
        />

        <Box my={2}>
          <Button variant="contained" type="submit">Create order</Button>
        </Box>
      </form>

      <br />
      <form>
        <TextField
          required
          fullWidth
          margin="normal"
          variant="outlined"
          label="Order #"
          value=""
        />

        <Box my={2}>
          <Button variant="contained" type="submit" sx={{ mr: 1 }}>Fulfill Order</Button>
          <Button variant="contained" color="secondary" type="submit" sx={{ mr: 1 }}>Cancel Order</Button>
          <Button type="submit">Get Order</Button>
        </Box>
      </form>
    </Container>
  );
}

export default Exchange;
