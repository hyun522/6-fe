import type { Metadata } from 'next';
import '@/styles/base/common.scss';
import classNames from 'classnames/bind';
import React from 'react';
import styles from './layout.module.scss';

const cx = classNames.bind(styles);

export const metadata: Metadata = {
  title: 'Create Next App',
  description: 'Generated by create next app',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={cx('layout')}>{children}</body>
    </html>
  );
}
