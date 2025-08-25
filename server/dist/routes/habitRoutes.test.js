"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const habitRoutes_1 = __importDefault(require("./habitRoutes")); // Hono app from habitRoutes.ts
const firebaseAdmin_1 = require("../config/firebaseAdmin"); // This will be the mocked version due to jest.setup.ts
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
        firebaseAdmin_1.admin.auth().verifyIdToken.mockResolvedValue(mockUserToken);
        // Global mock for serverTimestamp for consistency in habit tests
        firebaseAdmin_1.admin.firestore.FieldValue.serverTimestamp.mockReturnValue(MOCK_DATE_ISO);
    });
    describe('POST / (Create Habit)', () => {
        it('should create a new binary habit successfully', () => __awaiter(void 0, void 0, void 0, function* () {
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
                data: () => (Object.assign(Object.assign({}, habitData), { userId: mockUserToken.uid, isActive: true, completions: [], streak: 0, createdAt: MOCK_DATE_ISO })),
            });
            const mockHabitRef = { id: 'new-habit-id', get: mockGetAfterAdd };
            firebaseAdmin_1.admin.firestore().collection('habits').add.mockResolvedValue(mockHabitRef);
            const req = new Request('http://localhost/', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer test-token',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(habitData),
            });
            const res = yield habitRoutes_1.default.request(req);
            const responseBody = yield res.json();
            expect(res.status).toBe(201);
            expect(firebaseAdmin_1.admin.firestore().collection).toHaveBeenCalledWith('habits');
            expect(firebaseAdmin_1.admin.firestore().collection('habits').add).toHaveBeenCalledWith(expect.objectContaining(Object.assign(Object.assign({}, habitData), { userId: mockUserToken.uid, isActive: true, completions: [], streak: 0, createdAt: MOCK_DATE_ISO })));
            expect(responseBody).toEqual(expect.objectContaining(Object.assign({ habitId: 'new-habit-id' }, habitData)));
        }));
        it('should create a new quantitative habit successfully', () => __awaiter(void 0, void 0, void 0, function* () {
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
                data: () => (Object.assign(Object.assign({}, habitData), { userId: mockUserToken.uid, isActive: true, completions: [], streak: 0, createdAt: MOCK_DATE_ISO })),
            });
            const mockHabitRef = { id: 'quant-habit-id', get: mockGetAfterAdd };
            firebaseAdmin_1.admin.firestore().collection('habits').add.mockResolvedValue(mockHabitRef);
            const req = new Request('http://localhost/', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer test-token',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(habitData),
            });
            const res = yield habitRoutes_1.default.request(req);
            const responseBody = yield res.json();
            expect(res.status).toBe(201);
            expect(firebaseAdmin_1.admin.firestore().collection('habits').add).toHaveBeenCalledWith(expect.objectContaining(Object.assign(Object.assign({}, habitData), { userId: mockUserToken.uid })));
            expect(responseBody).toEqual(expect.objectContaining({
                habitId: 'quant-habit-id',
                targetValue: 2,
                targetUnit: 'Liters',
            }));
        }));
        it('should return 400 for missing required fields', () => __awaiter(void 0, void 0, void 0, function* () {
            const req = new Request('http://localhost/', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer test-token',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title: 'Incomplete Habit' }), // Missing category and type
            });
            const res = yield habitRoutes_1.default.request(req);
            expect(res.status).toBe(400);
            const responseBody = yield res.json();
            expect(responseBody.message).toContain('Missing required fields');
        }));
    });
    describe('GET / (Fetch Habits)', () => {
        it('should fetch active habits for the user', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockHabits = [
                { habitId: 'h1', title: 'Habit 1', userId: mockUserToken.uid, isActive: true, type: 'binary', completions: [], createdAt: MOCK_DATE_ISO },
                { habitId: 'h2', title: 'Habit 2', userId: mockUserToken.uid, isActive: true, type: 'quantitative', targetValue: 10, targetUnit: 'km', completions: [], createdAt: MOCK_DATE_ISO },
            ];
            const mockDocs = mockHabits.map(h => ({ id: h.habitId, data: () => h }));
            // Mock the chained where().where().get() call
            const mockGetFn = jest.fn().mockResolvedValue({ empty: false, docs: mockDocs });
            const mockWhere2Fn = jest.fn(() => ({ get: mockGetFn }));
            const mockWhere1Fn = jest.fn(() => ({ where: mockWhere2Fn }));
            firebaseAdmin_1.admin.firestore().collection('habits').where.mockImplementation(mockWhere1Fn);
            const req = new Request('http://localhost/', {
                method: 'GET',
                headers: { 'Authorization': 'Bearer test-token' },
            });
            const res = yield habitRoutes_1.default.request(req);
            const responseBody = yield res.json();
            expect(res.status).toBe(200);
            expect(firebaseAdmin_1.admin.firestore().collection).toHaveBeenCalledWith('habits');
            expect(firebaseAdmin_1.admin.firestore().collection('habits').where).toHaveBeenCalledWith('userId', '==', mockUserToken.uid);
            expect(mockWhere1Fn).toHaveBeenCalledWith('userId', '==', mockUserToken.uid);
            expect(mockWhere2Fn).toHaveBeenCalledWith('isActive', '==', true);
            expect(mockGetFn).toHaveBeenCalled();
            expect(responseBody).toEqual(mockHabits);
        }));
        it('should return an empty array if no active habits found', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockGetFn = jest.fn().mockResolvedValue({ empty: true, docs: [] });
            const mockWhere2Fn = jest.fn(() => ({ get: mockGetFn }));
            firebaseAdmin_1.admin.firestore().collection('habits').where.mockImplementationOnce(() => ({ where: mockWhere2Fn }));
            const req = new Request('http://localhost/', {
                method: 'GET',
                headers: { 'Authorization': 'Bearer test-token' },
            });
            const res = yield habitRoutes_1.default.request(req);
            const responseBody = yield res.json();
            expect(res.status).toBe(200);
            expect(responseBody).toEqual([]);
        }));
    });
    describe('DELETE /:habitId (Archive Habit)', () => {
        it('should archive an active habit successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const habitId = 'habit-to-archive';
            const mockHabitData = { userId: mockUserToken.uid, title: 'Test Habit', isActive: true };
            const mockDocRef = firebaseAdmin_1.admin.firestore().collection('habits').doc(habitId);
            mockDocRef.get.mockResolvedValue({ exists: true, data: () => mockHabitData });
            mockDocRef.update.mockResolvedValue(undefined);
            const req = new Request(`http://localhost/${habitId}`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer test-token' },
            });
            const res = yield habitRoutes_1.default.request(req);
            const responseBody = yield res.json();
            expect(res.status).toBe(200);
            expect(firebaseAdmin_1.admin.firestore().collection('habits').doc).toHaveBeenCalledWith(habitId);
            expect(mockDocRef.get).toHaveBeenCalled();
            expect(mockDocRef.update).toHaveBeenCalledWith({ isActive: false });
            expect(responseBody.message).toContain('Habit archived successfully');
        }));
        it('should return 403 if habit does not belong to user', () => __awaiter(void 0, void 0, void 0, function* () {
            const habitId = 'other-user-habit';
            firebaseAdmin_1.admin.firestore().collection('habits').doc(habitId).get.mockResolvedValue({
                exists: true,
                data: () => ({ userId: 'another-uid' }),
            });
            const req = new Request(`http://localhost/${habitId}`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer test-token' },
            });
            const res = yield habitRoutes_1.default.request(req);
            expect(res.status).toBe(403);
        }));
        it('should return 404 if habit not found', () => __awaiter(void 0, void 0, void 0, function* () {
            const habitId = 'non-existent-habit';
            firebaseAdmin_1.admin.firestore().collection('habits').doc(habitId).get.mockResolvedValue({ exists: false });
            const req = new Request(`http://localhost/${habitId}`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer test-token' },
            });
            const res = yield habitRoutes_1.default.request(req);
            expect(res.status).toBe(404);
        }));
    });
    describe('POST /:habitId/complete (Log Completion)', () => {
        const habitId = 'habit-to-complete';
        it('should add a new completion entry if none exists for today', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockHabitData = {
                userId: mockUserToken.uid,
                title: 'Test Habit',
                completions: [],
                type: 'binary'
            };
            const mockDocRef = firebaseAdmin_1.admin.firestore().collection('habits').doc(habitId);
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
            const res = yield habitRoutes_1.default.request(req);
            const responseBody = yield res.json();
            expect(res.status).toBe(200);
            const updateCallArgs = mockDocRef.update.mock.calls[0][0];
            expect(updateCallArgs.completions.length).toBe(1);
            expect(updateCallArgs.completions[0]).toEqual(expect.objectContaining({
                date: new Date().toISOString().split('T')[0], // getCurrentDateString format
                value: completionValue,
                timestamp: MOCK_DATE_ISO,
            }));
            expect(responseBody.message).toContain('Habit completion logged successfully');
        }));
        it('should update existing completion entry for today', () => __awaiter(void 0, void 0, void 0, function* () {
            const todayStr = new Date().toISOString().split('T')[0];
            const mockHabitData = {
                userId: mockUserToken.uid,
                title: 'Test Habit Quant',
                type: 'quantitative',
                completions: [{ date: todayStr, value: 5, timestamp: 'old-timestamp' }]
            };
            const mockDocRef = firebaseAdmin_1.admin.firestore().collection('habits').doc(habitId);
            mockDocRef.get.mockResolvedValue({ exists: true, data: () => mockHabitData });
            mockDocRef.update.mockResolvedValue(undefined);
            const newCompletionValue = 10;
            const req = new Request(`http://localhost/${habitId}/complete`, {
                method: 'POST',
                headers: { 'Authorization': 'Bearer test-token', 'Content-Type': 'application/json' },
                body: JSON.stringify({ value: newCompletionValue }),
            });
            const res = yield habitRoutes_1.default.request(req);
            expect(res.status).toBe(200);
            const updateCallArgs = mockDocRef.update.mock.calls[0][0];
            expect(updateCallArgs.completions.length).toBe(1);
            expect(updateCallArgs.completions[0]).toEqual({
                date: todayStr,
                value: newCompletionValue,
                timestamp: MOCK_DATE_ISO,
            });
        }));
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
            quantHabitData = Object.assign(Object.assign({}, originalHabitData), { type: 'quantitative', targetValue: 10, targetUnit: 'mins' });
        });
        it('should update habit fields successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            // Orphaned lines (category, type, etc.) that were here have been removed.
            const mockInitialDocRef = firebaseAdmin_1.admin.firestore().collection('habits').doc(habitId);
            mockInitialDocRef.get.mockResolvedValueOnce({
                exists: true,
                data: () => originalHabitData, // Uses originalHabitData from beforeEach
            });
            mockInitialDocRef.update.mockResolvedValue(undefined);
            const updatedFields = { title: 'New Title', description: 'New Desc' };
            // For fetch after update
            firebaseAdmin_1.admin.firestore().collection('habits').doc(habitId).get.mockResolvedValueOnce({
                exists: true,
                data: () => (Object.assign(Object.assign({}, originalHabitData), updatedFields)), // Uses originalHabitData from beforeEach
            });
            const req = new Request(`http://localhost/${habitId}`, {
                method: 'PUT',
                headers: { 'Authorization': 'Bearer test-token', 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedFields),
            });
            const res = yield habitRoutes_1.default.request(req);
            const responseBody = yield res.json();
            expect(res.status).toBe(200);
            const deleteFieldValue = 'MOCK_FIELD_DELETE'; // From jest.setup.ts
            expect(mockInitialDocRef.update).toHaveBeenCalledWith(Object.assign(Object.assign({}, updatedFields), { 
                // Since original habit is binary and not a bad habit, these are expected to be deleted
                targetValue: deleteFieldValue, targetUnit: deleteFieldValue, trigger: deleteFieldValue, replacementHabit: deleteFieldValue }));
            expect(responseBody.title).toBe('New Title');
            expect(responseBody.description).toBe('New Desc');
        }));
        it('should correctly handle type change from quantitative to binary (delete target fields)', () => __awaiter(void 0, void 0, void 0, function* () {
            // quantHabitData is now initialized in beforeEach
            const mockInitialDocRef = firebaseAdmin_1.admin.firestore().collection('habits').doc(habitId);
            mockInitialDocRef.get.mockResolvedValueOnce({
                exists: true, data: () => quantHabitData // Uses quantHabitData from beforeEach
            });
            mockInitialDocRef.update.mockResolvedValue(undefined);
            // For fetch after update
            const { targetValue, targetUnit } = quantHabitData, restOfQuantHabitData = __rest(quantHabitData, ["targetValue", "targetUnit"]); // Uses quantHabitData from beforeEach
            const expectedDataAfterUpdate = Object.assign(Object.assign({}, restOfQuantHabitData), { type: 'binary' });
            firebaseAdmin_1.admin.firestore().collection('habits').doc(habitId).get.mockResolvedValueOnce({
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
            const res = yield habitRoutes_1.default.request(req);
            const responseBody = yield res.json();
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
        }));
    });
});
//# sourceMappingURL=habitRoutes.test.js.map