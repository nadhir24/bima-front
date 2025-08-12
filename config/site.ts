export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Rano Cake",
  description: "Make beautiful Cake Everyday.",
  navItems: [
    {
      label: "Beranda",
      href: "/",
    },
    {
      label: "Katalog",
      href: "/katalog",
    },
    {
      label: "Invoice",
      href: "/invoice",
    },
    {
      label: "Tentang kami",
      href: "/tentangkami",
    },
  ],
  navMenuItems: [
    {
      label: "My Dasboard",
      href: "/dashboard",
    },
    {
      label: "Katalog",
      href: "/katalog",
    },
    {
      label: "Invoice",
      href: "/invoice",
    },
    {
      label: "tentang kami",
      href: "/tentangkami",
    },
  ],
  
  links: {
    google: "https://maps.app.goo.gl/uehWLXqC3s1z1Djw9",
    whatsapp: "https://wa.me/08151831185",
  },
};
