/**
 * Global Configuration for Chifa Brillo El Sol
 * 
 * Use this file to manage all global constants, brand assets, and creator information.
 * This ensures consistency across the entire application.
 */

export const CONFIG = {
  brand: {
    name: "Chifa Brillo El Sol",
    logo: "https://e.top4top.io/p_372983lw41.jpg",
    slogan: "El auténtico sabor oriental bajo el brillo del sol",
    theme: "Imperial Dark",
  },
  creator: {
    name: "Erik Misael",
    email: "qmisael386@gmail.com",
    role: "Lead Developer & Architect",
    website: "https://github.com/misael", // Placeholder
  },
  social: {
    facebook: "https://facebook.com/chifabrilloelsol",
    instagram: "https://www.instagram.com/erik_16_qm?igsh=YzNyZnptMW1tNWw=",
    whatsapp: "https://wa.me/51916738232",
    tiktok: "https://tiktok.com/@chifabrilloelsol",
  },
  contact: {
    address: "Calle Principal 123, Ciudad",
    phone: "+51 916 738 232",
    supportEmail: "qmisael386@gmail.com",
  },
  app: {
    version: "1.0.0",
    environment: "production",
  }
};

export type ConfigType = typeof CONFIG;
