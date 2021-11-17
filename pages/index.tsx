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
