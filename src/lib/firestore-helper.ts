// This is our main helper for making requests to the Firestore REST API.
export async function firestoreAPI(env: any, userAuthToken: string | null, endpoint: string, method: string = 'GET', body: object | null = null) {
  const projectId = env.FIREBASE_PROJECT_ID;
  const apiKey = env.FIREBASE_API_KEY;

  if (!projectId || !apiKey) {
    throw new Error('Firebase environment variables not set.');
  }

  let url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents${endpoint}`;

  if (method === 'PATCH' && endpoint.includes('?documentId=')) {
    const [path, docId] = endpoint.split('?documentId=');
    url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents${path}/${docId}?key=${apiKey}`;
  } else {
    url = `${url}?key=${apiKey}`;
  }

  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };

  if (userAuthToken) {
    options.headers['Authorization'] = `Bearer ${userAuthToken}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Firestore API Error:', errorData);
    throw new Error(`Firestore API request failed: ${response.statusText}`);
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return { success: true };
  }
  return response.json();
}

export async function firestoreBatchWriteAPI(env: any, userAuthToken: string | null, writes: any[]) {
    const projectId = env.FIREBASE_PROJECT_ID;
    const apiKey = env.FIREBASE_API_KEY;

    if (!projectId || !apiKey) {
        throw new Error('Firebase environment variables not set.');
    }

    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:batchWrite?key=${apiKey}`;

    const options: RequestInit = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ writes }),
    };

    if (userAuthToken) {
        options.headers['Authorization'] = `Bearer ${userAuthToken}`;
    }

    const response = await fetch(url, options);

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Firestore Batch Write API Error:', errorData);
        throw new Error(`Firestore Batch Write API request failed: ${response.statusText}`);
    }

    return response.json();
}
