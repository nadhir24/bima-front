import { useEffect } from 'react';
import "@/styles/globals.css"; // ini harus ada
// Reset cart function untuk mengatasi masalah guest session
export const resetCartIfNeeded = () => {
  // Cek apakah ini pertama kali halaman dimuat
  if (!sessionStorage.getItem('app_initialized')) {
    console.log('Initializing app and resetting cart state');
    
    // Tandai bahwa halaman sudah dimuat
    sessionStorage.setItem('app_initialized', 'true');
    
    // Reset localStorage cart-related data
    localStorage.removeItem('session_restored');
    localStorage.setItem('cart_items', JSON.stringify([]));
    localStorage.setItem('cart_count', '0');
    localStorage.setItem('cart_total', '0');
    
    // Trigger event untuk memaksa komponen memperbarui
    window.dispatchEvent(new Event("FORCE_CART_RESET"));
  }
}; 