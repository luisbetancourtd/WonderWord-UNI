export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  host: '0.0.0.0',
  appUrl: process.env.APP_URL || 'https://wonderword.luisbetancourt.fr',
  jwtSecret: process.env.JWT_SECRET || 'wonderword-dev-secret-change-in-production',
  resendApiKey: process.env.RESEND_API_KEY || '',
  fromEmail: process.env.RESEND_FROM_EMAIL || 'WonderWord <onboarding@resend.dev>',
  database: {
    url: process.env.DATABASE_URL || 'postgresql://wonderword:wonderword@postgres:5432/wonderword',
  },
} as const;
