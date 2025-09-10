import userRoutes from './userRoutes';
import type { Hono } from 'hono';
import { Context, Next } from 'hono';
import { firestoreAPI } from '../lib/firestore-helper';

jest.mock('../lib/firestore-helper', () => ({
  firestoreAPI: jest.fn(),
}));

jest.mock('../middleware/auth', () => ({
  protect: jest.fn(async (c: any, next: any) => {
    c.set('user', {
      user_id: 'test-user-uid',
      email: 'user@example.com',
      name: 'Test User', // The new JWT payload uses 'name'
    });
    await next();
  }),
}));

describe('User Routes', () => {
  let app: Hono;

  beforeEach(() => {
    jest.clearAllMocks();
    app = new Hono().route('/users', userRoutes);
    app.use('*', (c, next) => {
        c.env = { FIREBASE_PROJECT_ID: 'test-project', FIREBASE_API_KEY: 'test-api-key' };
        return next();
    });
  });

  it('should initialize a new user', async () => {
    (firestoreAPI as jest.Mock).mockResolvedValue({
        name: 'projects/test-project/databases/(default)/documents/users/test-user-uid',
        fields: {
            email: { stringValue: 'user@example.com' },
            displayName: { stringValue: 'Test User' },
        }
    });
    const res = await app.request('/users/initialize', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-token',
      },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.email).toBe('user@example.com');
  });

  it('should return an existing user', async () => {
    (firestoreAPI as jest.Mock).mockResolvedValue({
        name: 'projects/test-project/databases/(default)/documents/users/test-user-uid',
        fields: {
            email: { stringValue: 'user@example.com' },
            displayName: { stringValue: 'Test User' },
        }
    });
    const res = await app.request('/users/initialize', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-token',
      },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.email).toBe('user@example.com');
  });
});
