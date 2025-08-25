import app from './habitRoutes'; // Hono app from habitRoutes.ts
import { admin } from '../config/firebaseAdmin'; // This will be the mocked version due to jest.setup.ts
// MockAdmin type and mockedAdmin variable are no longer needed
// Mock Date for consistent createdAt/updatedAt
const MOCK_DATE_ISO = new Date().toISOString();
describe('Habit Routes (/api/habits)', () => {
    let mockUserToken;
    beforeEach(() => {
        jest.clearAllMocks();
        // mockUserToken needs to satisfy DecodedIdToken structure
        mockUserToken = {
            uid: 'test-habit-user-uid',
            email: 'habituser@example.com',
            aud: 'app-id', exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000),
            iss: 'firebase-issuer', sub: 'test-habit-user-uid', auth_time: Math.floor(Date.now() / 1000) - 60,
            firebase: { sign_in_provider: 'custom', identities: {} }, // Required nested property
        };
        admin.auth().verifyIdToken.mockResolvedValue(mockUserToken);
        // Global mock for serverTimestamp for consistency in habit tests
        admin.firestore.FieldValue.serverTimestamp.mockReturnValue(MOCK_DATE_ISO);
    });
    describe('POST / (Create Habit)', () => {
        it('should create a new binary habit successfully', async () => {
            const habitData = {
                title: 'Read Book',
                category: 'Personal Growth',
                type: 'binary',
                description: 'Read 10 pages daily',
                icon: 'book-icon',
                // ... other relevant fields
            };
            const mockGetAfterAdd = jest.fn().mockResolvedValue({
                id: 'new-habit-id',
                exists: true,
                data: () => ({
                    ...habitData,
                    userId: mockUserToken.uid,
                    isActive: true,
                    completions: [],
                    streak: 0,
                    createdAt: MOCK_DATE_ISO,
                }),
            });
            const mockHabitRef = { id: 'new-habit-id', get: mockGetAfterAdd };
            admin.firestore().collection('habits').add.mockResolvedValue(mockHabitRef);
            const req = new Request('http://localhost/', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer test-token',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(habitData),
            });
            const res = await app.request(req);
            const responseBody = await res.json();
            expect(res.status).toBe(201);
            expect(admin.firestore().collection).toHaveBeenCalledWith('habits');
            expect(admin.firestore().collection('habits').add).toHaveBeenCalledWith(expect.objectContaining({
                ...habitData,
                userId: mockUserToken.uid,
                isActive: true,
                completions: [],
                streak: 0,
                createdAt: MOCK_DATE_ISO,
            }));
            expect(responseBody).toEqual(expect.objectContaining({
                habitId: 'new-habit-id',
                ...habitData,
            }));
        });
        it('should create a new quantitative habit successfully', async () => {
            const habitData = {
                title: 'Drink Water',
                category: 'Health',
                type: 'quantitative',
                description: 'Drink 2L of water',
                targetValue: 2,
                targetUnit: 'Liters',
                icon: 'water-icon',
            };
            const mockGetAfterAdd = jest.fn().mockResolvedValue({
                id: 'quant-habit-id',
                exists: true,
                data: () => ({
                    ...habitData,
                    userId: mockUserToken.uid,
                    isActive: true,
                    completions: [],
                    streak: 0,
                    createdAt: MOCK_DATE_ISO,
                }),
            });
            const mockHabitRef = { id: 'quant-habit-id', get: mockGetAfterAdd };
            admin.firestore().collection('habits').add.mockResolvedValue(mockHabitRef);
            const req = new Request('http://localhost/', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer test-token',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(habitData),
            });
            const res = await app.request(req);
            const responseBody = await res.json();
            expect(res.status).toBe(201);
            expect(admin.firestore().collection('habits').add).toHaveBeenCalledWith(expect.objectContaining({
                ...habitData,
                userId: mockUserToken.uid,
            }));
            expect(responseBody).toEqual(expect.objectContaining({
                habitId: 'quant-habit-id',
                targetValue: 2,
                targetUnit: 'Liters',
            }));
        });
        it('should return 400 for missing required fields', async () => {
            const req = new Request('http://localhost/', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer test-token',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title: 'Incomplete Habit' }), // Missing category and type
            });
            const res = await app.request(req);
            expect(res.status).toBe(400);
            const responseBody = await res.json();
            expect(responseBody.message).toContain('Missing required fields');
        });
    });
    describe('GET / (Fetch Habits)', () => {
        it('should fetch active habits for the user', async () => {
            const mockHabits = [
                { habitId: 'h1', title: 'Habit 1', userId: mockUserToken.uid, isActive: true, type: 'binary', completions: [], createdAt: MOCK_DATE_ISO },
                { habitId: 'h2', title: 'Habit 2', userId: mockUserToken.uid, isActive: true, type: 'quantitative', targetValue: 10, targetUnit: 'km', completions: [], createdAt: MOCK_DATE_ISO },
            ];
            const mockDocs = mockHabits.map(h => ({ id: h.habitId, data: () => h }));
            // Mock the chained where().where().get() call
            const mockGetFn = jest.fn().mockResolvedValue({ empty: false, docs: mockDocs });
            const mockWhere2Fn = jest.fn(() => ({ get: mockGetFn }));
            const mockWhere1Fn = jest.fn(() => ({ where: mockWhere2Fn }));
            admin.firestore().collection('habits').where.mockImplementation(mockWhere1Fn);
            const req = new Request('http://localhost/', {
                method: 'GET',
                headers: { 'Authorization': 'Bearer test-token' },
            });
            const res = await app.request(req);
            const responseBody = await res.json();
            expect(res.status).toBe(200);
            expect(admin.firestore().collection).toHaveBeenCalledWith('habits');
            expect(admin.firestore().collection('habits').where).toHaveBeenCalledWith('userId', '==', mockUserToken.uid);
            expect(mockWhere1Fn).toHaveBeenCalledWith('userId', '==', mockUserToken.uid);
            expect(mockWhere2Fn).toHaveBeenCalledWith('isActive', '==', true);
            expect(mockGetFn).toHaveBeenCalled();
            expect(responseBody).toEqual(mockHabits);
        });
        it('should return an empty array if no active habits found', async () => {
            const mockGetFn = jest.fn().mockResolvedValue({ empty: true, docs: [] });
            const mockWhere2Fn = jest.fn(() => ({ get: mockGetFn }));
            admin.firestore().collection('habits').where.mockImplementationOnce(() => ({ where: mockWhere2Fn }));
            const req = new Request('http://localhost/', {
                method: 'GET',
                headers: { 'Authorization': 'Bearer test-token' },
            });
            const res = await app.request(req);
            const responseBody = await res.json();
            expect(res.status).toBe(200);
            expect(responseBody).toEqual([]);
        });
    });
    describe('DELETE /:habitId (Archive Habit)', () => {
        it('should archive an active habit successfully', async () => {
            const habitId = 'habit-to-archive';
            const mockHabitData = { userId: mockUserToken.uid, title: 'Test Habit', isActive: true };
            const mockDocRef = admin.firestore().collection('habits').doc(habitId);
            mockDocRef.get.mockResolvedValue({ exists: true, data: () => mockHabitData });
            mockDocRef.update.mockResolvedValue(undefined);
            const req = new Request(`http://localhost/${habitId}`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer test-token' },
            });
            const res = await app.request(req);
            const responseBody = await res.json();
            expect(res.status).toBe(200);
            expect(admin.firestore().collection('habits').doc).toHaveBeenCalledWith(habitId);
            expect(mockDocRef.get).toHaveBeenCalled();
            expect(mockDocRef.update).toHaveBeenCalledWith({ isActive: false });
            expect(responseBody.message).toContain('Habit archived successfully');
        });
        it('should return 403 if habit does not belong to user', async () => {
            const habitId = 'other-user-habit';
            admin.firestore().collection('habits').doc(habitId).get.mockResolvedValue({
                exists: true,
                data: () => ({ userId: 'another-uid' }),
            });
            const req = new Request(`http://localhost/${habitId}`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer test-token' },
            });
            const res = await app.request(req);
            expect(res.status).toBe(403);
        });
        it('should return 404 if habit not found', async () => {
            const habitId = 'non-existent-habit';
            admin.firestore().collection('habits').doc(habitId).get.mockResolvedValue({ exists: false });
            const req = new Request(`http://localhost/${habitId}`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer test-token' },
            });
            const res = await app.request(req);
            expect(res.status).toBe(404);
        });
    });
    describe('POST /:habitId/complete (Log Completion)', () => {
        const habitId = 'habit-to-complete';
        it('should add a new completion entry if none exists for today', async () => {
            const mockHabitData = {
                userId: mockUserToken.uid,
                title: 'Test Habit',
                completions: [],
                type: 'binary'
            };
            const mockDocRef = admin.firestore().collection('habits').doc(habitId);
            mockDocRef.get.mockResolvedValue({ exists: true, data: () => mockHabitData });
            mockDocRef.update.mockResolvedValue(undefined);
            const completionValue = 1; // For binary habit
            const req = new Request(`http://localhost/${habitId}/complete`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer test-token',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ value: completionValue }),
            });
            const res = await app.request(req);
            const responseBody = await res.json();
            expect(res.status).toBe(200);
            const updateCallArgs = mockDocRef.update.mock.calls[0][0];
            expect(updateCallArgs.completions.length).toBe(1);
            expect(updateCallArgs.completions[0]).toEqual(expect.objectContaining({
                date: new Date().toISOString().split('T')[0], // getCurrentDateString format
                value: completionValue,
                timestamp: MOCK_DATE_ISO,
            }));
            expect(responseBody.message).toContain('Habit completion logged successfully');
        });
        it('should update existing completion entry for today', async () => {
            const todayStr = new Date().toISOString().split('T')[0];
            const mockHabitData = {
                userId: mockUserToken.uid,
                title: 'Test Habit Quant',
                type: 'quantitative',
                completions: [{ date: todayStr, value: 5, timestamp: 'old-timestamp' }]
            };
            const mockDocRef = admin.firestore().collection('habits').doc(habitId);
            mockDocRef.get.mockResolvedValue({ exists: true, data: () => mockHabitData });
            mockDocRef.update.mockResolvedValue(undefined);
            const newCompletionValue = 10;
            const req = new Request(`http://localhost/${habitId}/complete`, {
                method: 'POST',
                headers: { 'Authorization': 'Bearer test-token', 'Content-Type': 'application/json' },
                body: JSON.stringify({ value: newCompletionValue }),
            });
            const res = await app.request(req);
            expect(res.status).toBe(200);
            const updateCallArgs = mockDocRef.update.mock.calls[0][0];
            expect(updateCallArgs.completions.length).toBe(1);
            expect(updateCallArgs.completions[0]).toEqual({
                date: todayStr,
                value: newCompletionValue,
                timestamp: MOCK_DATE_ISO,
            });
        });
    });
    describe('PUT /:habitId (Update Habit)', () => {
        const habitId = 'habit-to-update';
        let originalHabitData; // Define type here
        let quantHabitData; // Define type here
        beforeEach(() => {
            // Initialize here, where mockUserToken is defined
            const mockTimestamp = {
                toDate: () => new Date(MOCK_DATE_ISO),
                seconds: Date.parse(MOCK_DATE_ISO) / 1000,
                nanoseconds: 0,
            };
            originalHabitData = {
                userId: mockUserToken.uid, // mockUserToken is available here
                title: 'Original Title',
                description: 'Original Desc',
                category: 'Old Category',
                type: 'binary',
                isActive: true,
                createdAt: mockTimestamp,
                completions: [],
                isBadHabit: false,
            };
            quantHabitData = {
                ...originalHabitData,
                type: 'quantitative',
                targetValue: 10,
                targetUnit: 'mins'
            };
        });
        it('should update habit fields successfully', async () => {
            // Orphaned lines (category, type, etc.) that were here have been removed.
            const mockInitialDocRef = admin.firestore().collection('habits').doc(habitId);
            mockInitialDocRef.get.mockResolvedValueOnce({
                exists: true,
                data: () => originalHabitData, // Uses originalHabitData from beforeEach
            });
            mockInitialDocRef.update.mockResolvedValue(undefined);
            const updatedFields = { title: 'New Title', description: 'New Desc' };
            // For fetch after update
            admin.firestore().collection('habits').doc(habitId).get.mockResolvedValueOnce({
                exists: true,
                data: () => ({ ...originalHabitData, ...updatedFields }), // Uses originalHabitData from beforeEach
            });
            const req = new Request(`http://localhost/${habitId}`, {
                method: 'PUT',
                headers: { 'Authorization': 'Bearer test-token', 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedFields),
            });
            const res = await app.request(req);
            const responseBody = await res.json();
            expect(res.status).toBe(200);
            const deleteFieldValue = 'MOCK_FIELD_DELETE'; // From jest.setup.ts
            expect(mockInitialDocRef.update).toHaveBeenCalledWith({
                ...updatedFields,
                // Since original habit is binary and not a bad habit, these are expected to be deleted
                targetValue: deleteFieldValue,
                targetUnit: deleteFieldValue,
                trigger: deleteFieldValue,
                replacementHabit: deleteFieldValue,
            });
            expect(responseBody.title).toBe('New Title');
            expect(responseBody.description).toBe('New Desc');
        });
        it('should correctly handle type change from quantitative to binary (delete target fields)', async () => {
            // quantHabitData is now initialized in beforeEach
            const mockInitialDocRef = admin.firestore().collection('habits').doc(habitId);
            mockInitialDocRef.get.mockResolvedValueOnce({
                exists: true, data: () => quantHabitData // Uses quantHabitData from beforeEach
            });
            mockInitialDocRef.update.mockResolvedValue(undefined);
            // For fetch after update
            const { targetValue, targetUnit, ...restOfQuantHabitData } = quantHabitData; // Uses quantHabitData from beforeEach
            const expectedDataAfterUpdate = {
                ...restOfQuantHabitData,
                type: 'binary'
            };
            admin.firestore().collection('habits').doc(habitId).get.mockResolvedValueOnce({
                exists: true, data: () => expectedDataAfterUpdate
            });
            // FieldValue.delete() is already mocked in jest.setup.ts
            // We expect that mock to be called.
            const deleteFieldValue = 'MOCK_FIELD_DELETE'; // This value comes from jest.setup.ts mock
            const req = new Request(`http://localhost/${habitId}`, {
                method: 'PUT',
                headers: { 'Authorization': 'Bearer test-token', 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'binary' }),
            });
            const res = await app.request(req);
            const responseBody = await res.json();
            expect(res.status).toBe(200);
            expect(mockInitialDocRef.update).toHaveBeenCalledWith({
                type: 'binary',
                targetValue: deleteFieldValue,
                targetUnit: deleteFieldValue,
                // Since original quantHabitData was based on originalHabitData (isBadHabit: false)
                // these should also be deleted.
                trigger: deleteFieldValue,
                replacementHabit: deleteFieldValue,
            });
            expect(responseBody.type).toBe('binary');
            expect(responseBody.targetValue).toBeUndefined();
            expect(responseBody.targetUnit).toBeUndefined();
        });
    });
});
