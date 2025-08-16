// Paymob Configuration
// This file contains the configuration for Paymob payment gateway
// For production, these values should be set as environment variables

export const PAYMOB_CONFIG = {
  // API Key (Base64 encoded)
  API_KEY: 'ZXlKaGJHY2lPaUpJVXpVeE1pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SmpiR0Z6Y3lJNklrMWxjbU5vWVc1MElpd2ljSEp2Wm1sc1pWOXdheUk2TVRBMk9EVXlPU3dpYm1GdFpTSTZJbWx1YVhScFlXd2lmUS5CYjFqTWpHY3pMaWdPSTg1d3ZReEZBZEhENkt6aXZlNU94d0tLX0JKQ19rNWhtWF8tNlF6ZURlV2NpOEdod0MwUzhhSEtqXzlsWmthNnpiN1h6alVWUQ==',
  
  // Sandbox/Test Mode Integration IDs
  // These are test integration IDs - replace with live ones for production
  INTEGRATION_IDS: {
    CARD: 860769,      // Visa, MasterCard, Meeza
    FAWRY: 860770      // Fawry cash payment
  },
  
  // Base URLs
  BASE_URL: 'https://accept.paymob.com/api',
  ENDPOINTS: {
    AUTH: '/auth/tokens',
    ORDERS: '/ecommerce/orders',
    PAYMENT_KEYS: '/acceptance/payment_keys',
    FAWRY_PAYMENT: '/acceptance/payments/pay?source=accept_fawry',
    CARD_PAYMENT: '/acceptance/iframes/860769'
  },
  
  // Currency and Country
  CURRENCY: 'EGP',
  COUNTRY: 'EG',
  
  // Default Billing Address (for testing)
  DEFAULT_BILLING: {
    city: 'Cairo',
    country: 'EG',
    state: 'Cairo',
    postal_code: '00000'
  },
  
  // Environment
  ENVIRONMENT: 'sandbox' as 'sandbox' | 'production',
  
  // HMAC Secret for webhook verification (set this in Supabase environment variables)
  HMAC_SECRET: process.env.PAYMOB_HMAC_SECRET || 'test_hmac_secret'
};

// Helper function to get integration ID based on payment method
export const getIntegrationId = (paymentMethod: 'card' | 'fawry'): number => {
  return paymentMethod === 'fawry' 
    ? PAYMOB_CONFIG.INTEGRATION_IDS.FAWRY 
    : PAYMOB_CONFIG.INTEGRATION_IDS.CARD;
};

// Helper function to get payment URL based on payment method
export const getPaymentUrl = (paymentMethod: 'card' | 'fawry', paymentToken: string): string => {
  if (paymentMethod === 'fawry') {
    return `${PAYMOB_CONFIG.BASE_URL}${PAYMOB_CONFIG.ENDPOINTS.FAWRY_PAYMENT}&payment_token=${paymentToken}`;
  } else {
    return `${PAYMOB_CONFIG.BASE_URL}${PAYMOB_CONFIG.ENDPOINTS.CARD_PAYMENT}?payment_token=${paymentToken}`;
  }
};

// Helper function to check if we're in sandbox mode
export const isSandboxMode = (): boolean => {
  return PAYMOB_CONFIG.ENVIRONMENT === 'sandbox';
};

// Helper function to get environment-specific settings
export const getEnvironmentConfig = () => {
  if (isSandboxMode()) {
    return {
      apiKey: PAYMOB_CONFIG.API_KEY,
      integrationIds: PAYMOB_CONFIG.INTEGRATION_IDS,
      baseUrl: PAYMOB_CONFIG.BASE_URL,
      isTestMode: true
    };
  } else {
    // Production mode - use environment variables
    return {
      apiKey: process.env.PAYMOB_API_KEY || PAYMOB_CONFIG.API_KEY,
      integrationIds: {
        CARD: parseInt(process.env.PAYMOB_CARD_INTEGRATION_ID || '0'),
        FAWRY: parseInt(process.env.PAYMOB_FAWRY_INTEGRATION_ID || '0')
      },
      baseUrl: PAYMOB_CONFIG.BASE_URL,
      isTestMode: false
    };
  }
};
