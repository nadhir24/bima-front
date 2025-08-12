'use client';

import { useEffect } from 'react';
import { resetCartIfNeeded } from '@/lib/cart-utils';

// Client-side component untuk menginisialisasi reset cart otomatis
export default function ClientInit() {
  useEffect(() => {
    resetCartIfNeeded();
  }, []);
  
  return null;
}