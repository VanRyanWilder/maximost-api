jest.mock('firebase-admin', () => ({
  credential: {
    cert: jest.fn(),
  },
  initializeApp: jest.fn(),
  firestore: () => ({
    collection: () => ({
      doc: () => ({
        collection: () => ({
          get: () => Promise.resolve({ docs: [] }),
          add: () => Promise.resolve({ id: '1' }),
          doc: () => ({
            update: () => Promise.resolve(),
            set: () => Promise.resolve(),
          }),
        }),
        get: () => Promise.resolve({ exists: true }),
      }),
    }),
  }),
  auth: () => ({
    verifyIdToken: () => Promise.resolve({ uid: 'test-user' }),
  }),
}));
