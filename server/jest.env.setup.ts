import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from root .env file for testing
// This path is relative to this file (server/jest.env.setup.ts)
dotenv.config({ path: path.resolve(__dirname, '../.env') });
