import habitRoutes from './habitRoutes';
import { Hono } from 'hono';
import { Context, Next } from 'hono';
import { firestoreAPI } from '../lib/firestore-helper';

jest.mock('../lib/firestore-helper', () => ({
  firestoreAPI: jest.fn(),
}));

jest.mock('../middleware/auth', () => ({
  protect: jest.fn(async (c: any, next: any) => {
    c.set('user', {
      user_id: 'test-habit-user-uid',
    });
    await next();
  }),
}));

describe('Habit Routes', () => {
  let app: Hono;

  beforeEach(() => {
    jest.clearAllMocks();
    app = new Hono().route('/habits', habitRoutes);
    app.use('*', (c, next) => {
        c.env = { FIREBASE_PROJECT_ID: 'test-project', FIREBASE_API_KEY: 'test-api-key' };
        return next();
    });
  });

  it('should get habits', async () => {
    (firestoreAPI as jest.Mock).mockResolvedValue({
      documents: [
        { name: 'projects/test-project/databases/(default)/documents/users/test-habit-user-uid/habits/1', fields: { title: { stringValue: 'habit 1' } } },
        { name: 'projects/test-project/databases/(default)/documents/users/test-habit-user-uid/habits/2', fields: { title: { stringValue: 'habit 2' } } },
      ],
    });
    const res = await app.request('/habits', {
      headers: {
        Authorization: 'Bearer test-token',
      },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([
      { id: '1', title: 'habit 1' },
      { id: '2', title: 'habit 2' },
    ]);
  });

  it('should create a habit', async () => {
    (firestoreAPI as jest.Mock).mockResolvedValue({
        name: 'projects/test-project/databases/(default)/documents/users/test-habit-user-uid/habits/1',
        fields: {
            title: { stringValue: 'habit 1' },
        }
    });
    const res = await app.request('/habits', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
      body: JSON.stringify({
        title: 'habit 1',
        category: 'category 1',
        type: 'binary',
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe('1');
  });

  it('should update a habit', async () => {
    (firestoreAPI as jest.Mock).mockResolvedValue({
        name: 'projects/test-project/databases/(default)/documents/users/test-habit-user-uid/habits/1',
        fields: {
            title: { stringValue: 'habit 1 updated' },
        }
    });
    const res = await app.request('/habits/1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
      body: JSON.stringify({
        title: 'habit 1 updated',
      }),
    });
    expect(res.status).toBe(200);
  });

  it('should delete a habit', async () => {
    (firestoreAPI as jest.Mock).mockResolvedValue({});
    const res = await app.request('/habits/1', {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer test-token',
      },
    });
    expect(res.status).toBe(204);
  });

  it('should complete a habit', async () => {
    (firestoreAPI as jest.Mock)
      // Mock the GET request to check if the habit exists
      .mockResolvedValueOnce({
        name: 'projects/test-project/databases/(default)/documents/users/test-habit-user-uid/habits/1',
        fields: { title: { stringValue: 'habit 1' } },
      })
      // Mock the PUT request to create the completion document
      .mockResolvedValueOnce({
        name: 'projects/test-project/databases/(default)/documents/users/test-habit-user-uid/habits/1/completions/20240101',
        fields: {
          value: { integerValue: 1 },
          date: { stringValue: '2024-01-01' },
        },
      });

    const res = await app.request('/habits/1/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
      body: JSON.stringify({
        value: 1,
        date: '2024-01-01',
      }),
    });
    expect(res.status).toBe(200);
  });
});
