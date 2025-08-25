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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const userRoutes_1 = __importDefault(require("./userRoutes")); // Your Hono app from userRoutes.ts
const firebaseAdmin_1 = require("../config/firebaseAdmin"); // This will be the mocked version due to jest.setup.ts
// MockAdmin type and mockedAdmin variable are no longer needed due to refined jest.setup.ts
describe('User Routes (/api/users)', () => {
    describe('POST /initialize', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });
        it('should create a new user if one does not exist', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockUserData = { uid: 'test-uid-new', email: 'new@example.com', name: 'New User Name', displayName: 'New User DisplayName' };
            const mockDecodedToken = Object.assign(Object.assign({}, mockUserData), { aud: 'app-id', exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000), iss: 'firebase-issuer', sub: mockUserData.uid, auth_time: Math.floor(Date.now() / 1000), firebase: { sign_in_provider: 'custom', identities: {} } });
            firebaseAdmin_1.admin.auth().verifyIdToken.mockResolvedValue(mockDecodedToken);
            const mockFirestoreDoc = firebaseAdmin_1.admin.firestore().collection('users').doc(mockUserData.uid);
            mockFirestoreDoc.get.mockResolvedValue({ exists: false });
            const mockSetFn = jest.fn().mockResolvedValue(undefined);
            mockFirestoreDoc.set.mockImplementation(mockSetFn);
            // Corrected FieldValue access - FieldValue is on admin.firestore (namespace), not on admin.firestore() (instance)
            firebaseAdmin_1.admin.firestore.FieldValue.serverTimestamp.mockReturnValue('mock-timestamp');
            const req = new Request('http://localhost/initialize', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer test-token' },
            });
            const res = yield userRoutes_1.default.request(req);
            const responseBody = yield res.json();
            expect(res.status).toBe(201);
            expect(firebaseAdmin_1.admin.auth().verifyIdToken).toHaveBeenCalledWith('test-token');
            expect(firebaseAdmin_1.admin.firestore().collection).toHaveBeenCalledWith('users');
            expect(firebaseAdmin_1.admin.firestore().collection('users').doc).toHaveBeenCalledWith(mockUserData.uid);
            expect(mockFirestoreDoc.get).toHaveBeenCalled();
            expect(mockSetFn).toHaveBeenCalledWith({
                userId: mockUserData.uid,
                email: mockUserData.email,
                displayName: mockUserData.displayName,
                createdAt: 'mock-timestamp',
            });
            expect(responseBody).toEqual(expect.objectContaining({
                userId: mockUserData.uid,
                email: mockUserData.email,
                displayName: mockUserData.displayName,
            }));
        }));
        it('should return existing user data if user already exists', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockUserData = { uid: 'test-uid-existing', email: 'existing@example.com', name: 'Existing User Name', displayName: 'Existing User DisplayName' };
            const mockDecodedToken = Object.assign(Object.assign({}, mockUserData), { aud: 'app-id', exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000), iss: 'firebase-issuer', sub: mockUserData.uid, auth_time: Math.floor(Date.now() / 1000), firebase: { sign_in_provider: 'custom', identities: {} } });
            const existingFirestoreData = {
                userId: mockUserData.uid,
                email: mockUserData.email,
                displayName: mockUserData.displayName,
                createdAt: 'some-past-timestamp'
            };
            firebaseAdmin_1.admin.auth().verifyIdToken.mockResolvedValue(mockDecodedToken);
            const mockFirestoreDoc = firebaseAdmin_1.admin.firestore().collection('users').doc(mockUserData.uid);
            mockFirestoreDoc.get.mockResolvedValue({ exists: true, data: () => existingFirestoreData });
            const mockSetFn = jest.fn();
            mockFirestoreDoc.set.mockImplementation(mockSetFn);
            const req = new Request('http://localhost/initialize', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer test-token-existing' },
            });
            const res = yield userRoutes_1.default.request(req);
            if (res.status !== 200) {
                console.log('Raw response text for existing user (status not 200):', yield res.text());
            }
            const responseBody = yield res.json();
            expect(res.status).toBe(200);
            expect(firebaseAdmin_1.admin.auth().verifyIdToken).toHaveBeenCalledWith('test-token-existing');
            expect(firebaseAdmin_1.admin.firestore().collection).toHaveBeenCalledWith('users');
            expect(firebaseAdmin_1.admin.firestore().collection('users').doc).toHaveBeenCalledWith(mockUserData.uid);
            expect(mockFirestoreDoc.get).toHaveBeenCalled();
            expect(mockSetFn).not.toHaveBeenCalled();
            expect(responseBody).toEqual(existingFirestoreData);
        }));
        it('should return 403/401 if token is invalid or not provided', () => __awaiter(void 0, void 0, void 0, function* () {
            firebaseAdmin_1.admin.auth().verifyIdToken.mockRejectedValueOnce(new Error('Invalid token'));
            const reqInvalid = new Request('http://localhost/initialize', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer invalid-token' },
            });
            let res = yield userRoutes_1.default.request(reqInvalid);
            // This expectation might be the one failing if the Hono error handling or middleware setup in test is off
            // For now, let's assume honoProtectWithFirebase correctly returns 403 for invalid tokens post-bearer
            expect(res.status).toBe(403);
            let responseBody = yield res.json();
            expect(responseBody.message).toContain('Forbidden: Invalid token.');
            const reqNoToken = new Request('http://localhost/initialize', {
                method: 'POST',
            });
            res = yield userRoutes_1.default.request(reqNoToken);
            expect(res.status).toBe(401);
            responseBody = yield res.json();
            expect(responseBody.message).toContain('Unauthorized: No token provided or invalid format.');
        }));
    });
});
//# sourceMappingURL=userRoutes.test.js.map