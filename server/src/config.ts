export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  host: '0.0.0.0',
  jwtSecret: process.env.JWT_SECRET || 'wonderword-dev-secret-change-in-production',
  database: {
    url: process.env.DATABASE_URL || 'postgresql://wonderword:wonderword@postgres:5432/wonderword',
  },
} as const;
