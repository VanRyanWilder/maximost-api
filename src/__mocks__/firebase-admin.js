module.exports = {
  auth: () => ({
    verifyIdToken: jest.fn(),
  }),
  firestore: () => ({
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    get: jest.fn(),
    add: jest.fn(),
    update: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    where: jest.fn().mockReturnThis(),
    FieldValue: {
      serverTimestamp: jest.fn(() => 'MOCK_TIMESTAMP'),
      delete: jest.fn(() => 'MOCK_FIELD_DELETE'),
    },
  }),
};
