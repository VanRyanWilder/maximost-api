import app from '../index'; // Import the actual configured app instance
import { supabase } from '../lib/supabaseClient';

// Mock the Supabase client
jest.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  },
}));

// Mock the JWT middleware by mocking the secret.
// This is a bit of a trick. We let the real jwt middleware run,
// but we don't provide a valid token in the test request.
// The middleware would throw an error.
// A better approach for a real app might be more complex, but for this,
// let's just assume the middleware is tested by Hono and we just need to test our routes.
// The easiest way to "bypass" it for testing our handlers is to mock the module
// and have it automatically provide the payload.
jest.mock('hono/jwt', () => ({
    jwt: jest.fn(() => (c, next) => {
      c.set('jwtPayload', { sub: 'test-user-id', aud: 'authenticated' });
      return next();
    }),
}));


describe('Habit API Routes', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test for GET /api/habits
  it('should get all habits for a user', async () => {
    const mockHabits = [{ id: 1, name: 'Read a book', user_id: 'test-user-id' }];
    (supabase.select as jest.Mock).mockResolvedValueOnce({ data: mockHabits, error: null });

    const res = await app.request('/api/habits');

    expect(supabase.from).toHaveBeenCalledWith('habits');
    expect(supabase.select).toHaveBeenCalledWith('*');
    expect(supabase.eq).toHaveBeenCalledWith('user_id', 'test-user-id');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(mockHabits);
  });

  // Test for GET /api/habits/:id
  it('should get a single habit by ID', async () => {
      const mockHabit = { id: 1, name: 'Read a book', user_id: 'test-user-id' };
      (supabase.single as jest.Mock).mockResolvedValueOnce({ data: mockHabit, error: null });

      const res = await app.request('/api/habits/1');

      expect(supabase.from).toHaveBeenCalledWith('habits');
      expect(supabase.select).toHaveBeenCalledWith('*');
      expect(supabase.eq).toHaveBeenCalledWith('id', '1');
      expect(supabase.eq).toHaveBeenCalledWith('user_id', 'test-user-id');
      expect(supabase.single).toHaveBeenCalled();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual(mockHabit);
  });

  // Test for POST /api/habits
  it('should create a new habit', async () => {
    const newHabitPayload = { name: 'Go for a run', start_date: '2025-01-01', frequency_type: 'daily' };
    const createdHabit = { ...newHabitPayload, id: 2, user_id: 'test-user-id' };
    (supabase.single as jest.Mock).mockResolvedValueOnce({ data: createdHabit, error: null });

    const res = await app.request('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newHabitPayload),
    });

    expect(supabase.from).toHaveBeenCalledWith('habits');
    expect(supabase.insert).toHaveBeenCalledWith(expect.objectContaining({ ...newHabitPayload, user_id: 'test-user-id' }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toEqual(createdHabit);
  });

  // Test for PUT /api/habits/:id
  it('should update a habit', async () => {
    const updatePayload = { name: 'Go for a long run' };
    const updatedHabit = { id: 1, name: 'Go for a long run', user_id: 'test-user-id' };
    (supabase.single as jest.Mock).mockResolvedValueOnce({ data: updatedHabit, error: null });

    const res = await app.request('/api/habits/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
    });

    expect(supabase.from).toHaveBeenCalledWith('habits');
    expect(supabase.update).toHaveBeenCalledWith(updatePayload);
    expect(supabase.eq).toHaveBeenCalledWith('id', '1');
    expect(supabase.eq).toHaveBeenCalledWith('user_id', 'test-user-id');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(updatedHabit);
  });

  // Test for DELETE /api/habits/:id
  it('should delete a habit', async () => {
    (supabase.delete as jest.Mock).mockReturnThis(); // Make it chainable for .eq
    (supabase.eq as jest.Mock).mockResolvedValueOnce({ error: null, count: 1 });

    const res = await app.request('/api/habits/1', {
      method: 'DELETE',
    });

    expect(supabase.from).toHaveBeenCalledWith('habits');
    expect(supabase.delete).toHaveBeenCalled();
    expect(supabase.eq).toHaveBeenCalledWith('id', '1');
    expect(supabase.eq).toHaveBeenCalledWith('user_id', 'test-user-id');
    expect(res.status).toBe(204);
  });

  // Test for GET /api/habits/:id/completions
  it('should get all completions for a habit', async () => {
    const mockCompletions = [
      { id: 1, habit_id: 1, user_id: 'test-user-id', completed_at: '2025-09-06' },
      { id: 2, habit_id: 1, user_id: 'test-user-id', completed_at: '2025-09-05' },
    ];
    // Mock the check for the habit's existence
    (supabase.single as jest.Mock).mockResolvedValueOnce({ data: { id: 1 }, error: null });
    // Mock the fetching of completions
    (supabase.select as jest.Mock).mockResolvedValueOnce({ data: mockCompletions, error: null });

    const res = await app.request('/api/habits/1/completions');

    expect(supabase.from).toHaveBeenCalledWith('habits');
    expect(supabase.from).toHaveBeenCalledWith('completions');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(mockCompletions);
  });

  // Test for POST /api/habits/:id/complete
  describe('POST /api/habits/:id/complete', () => {
    beforeEach(() => {
        // Mock the check for the habit's existence for all completion tests
        (supabase.single as jest.Mock).mockResolvedValueOnce({ data: { id: 1 }, error: null });
    });

    it('should log a simple completion', async () => {
        const newCompletion = { id: 1, habit_id: 1, user_id: 'test-user-id' };
        // Mock the insert call
        (supabase.single as jest.Mock).mockResolvedValueOnce({ data: newCompletion, error: null });

        const res = await app.request('/api/habits/1/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        });

        expect(supabase.from).toHaveBeenCalledWith('completions');
        expect(supabase.insert).toHaveBeenCalledWith({ habit_id: 1, user_id: 'test-user-id' });
        expect(res.status).toBe(201);
        const body = await res.json();
        expect(body).toEqual(newCompletion);
    });

    it('should log a completion with quantity and date', async () => {
        const payload = { quantity: 10, completed_at: '2025-09-01' };
        const newCompletion = { id: 2, habit_id: 1, user_id: 'test-user-id', ...payload };
        // Mock the insert call
        (supabase.single as jest.Mock).mockResolvedValueOnce({ data: newCompletion, error: null });

        const res = await app.request('/api/habits/1/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        expect(supabase.insert).toHaveBeenCalledWith({ habit_id: 1, user_id: 'test-user-id', ...payload });
        expect(res.status).toBe(201);
        const body = await res.json();
        expect(body).toEqual(newCompletion);
    });
  });
});
