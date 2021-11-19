import type { NextPage } from 'next'
import Head from 'next/head'
import React, { useEffect, useState } from 'react';
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

const Home: NextPage = () => {
  return (
    <Container>
      <Head>
        <title>Mint</title>
      </Head>

      <Typography variant="h1">Mint</Typography>

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
        />

        <Box my={2}>
          <Button variant="contained" type="submit" name="mint" sx={{ mr: 1 }}>Mint</Button>
          <Button type="submit" name="query">Get balance</Button>
        </Box>
      </form>
    </Container>
  )
}

export default Home;
