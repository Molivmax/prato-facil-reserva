
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.fccf6453c58742bc85cdfca709b55825',
  appName: 'prato-facil-reserva',
  webDir: 'dist',
  server: {
    url: 'https://fccf6453-c587-42bc-85cd-fca709b55825.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  android: {
    buildOptions: {
      keystorePath: 'android.keystore',
      keystoreAlias: 'androiddebugkey',
      keystorePassword: 'android',
      keystoreKeyPassword: 'android',
    }
  }
};

export default config;
