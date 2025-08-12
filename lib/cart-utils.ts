'use client';

export const resetCartIfNeeded = () => {
  if (typeof window !== 'undefined') {
    // Check if we need to reset the cart (you can add your own logic here)
    const resetFlag = sessionStorage.getItem('shouldResetCart');
    if (resetFlag === 'true') {
      // Clear the cart from localStorage
      localStorage.removeItem('cart');
      // Clear the reset flag
      sessionStorage.removeItem('shouldResetCart');
      // You might want to dispatch an event or update context here
      window.dispatchEvent(new Event('cartUpdated'));
    }
  }
};
