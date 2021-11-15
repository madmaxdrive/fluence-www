import React, { PropsWithChildren } from 'react'
import NextLink from 'next/link';
import { Link } from '@mui/material'
import layout from '../styles/layout.module.css';

export default function Layout({ children }: PropsWithChildren<{}>) {
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
      </footer>
    </div>
  );
}
