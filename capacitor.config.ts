import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'Empath_AI',
  webDir: 'www',
  plugins: {
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    },
     GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '668475604293-cjo47a36ffalo0a253ivbm6q4revt70j.apps.googleusercontent.com', // from Google Cloud Console
      forceCodeForRefreshToken: false,
    },
      FacebookLogin: {
      appId: '1846725225845517',
    },
    
  }
  
};


export default config;