export interface CartItem {
  id: number;
  userId: number | null;
  guestId: string | null;
  quantity: number;
  createdAt: string;
  user?: { id: number; email: string } | null;
  catalog?: { id: number; name: string; image: string } | null;
  size?: { id: number; size: string; price: string } | null;
}
