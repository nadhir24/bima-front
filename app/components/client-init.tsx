'use client';

import { useEffect } from 'react';
import { resetCartIfNeeded } from '../_app';

// Client-side component untuk menginisialisasi reset cart otomatis
export default function ClientInit() {
  useEffect(() => {
    resetCartIfNeeded();
  }, []);
  
  return null;
} 