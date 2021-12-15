import React, { PropsWithChildren } from 'react'
import NextLink from 'next/link';
import { Link, Typography } from '@mui/material'
import { useAccount } from '../ethereum_provider';
import layout from '../styles/layout.module.css';

export default function Layout({ children }: PropsWithChildren<{}>) {
  const account = useAccount();

  return (
    <div className={layout.wrap}>
      <main className={layout.main}>
        {children}
      </main>
      <footer className={layout.footer}>
        <NextLink href="/">
          <Link mx={.5}>Mint</Link>
        </NextLink>
        <NextLink href="/deposit">
          <Link mx={.5}>Deposit / Withdraw</Link>
        </NextLink>
        <NextLink href="/exchange">
          <Link mx={.5}>Exchange</Link>
        </NextLink>
        <NextLink href="/register_contract">
          <Link mx={.5}>Register contract</Link>
        </NextLink>
        <Typography variant="body2">{account}</Typography>
      </footer>
    </div>
  );
}
