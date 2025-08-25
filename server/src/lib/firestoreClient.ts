// server/src/lib/firestoreClient.ts

const FIRESTORE_BASE_URL = "https://firestore.googleapis.com/v1/projects";

// Helper to construct Firestore URLs
function getFirestoreUrl(projectId: string, path?: string, apiKey?: string): string {
  let url = `${FIRESTORE_BASE_URL}/${projectId}/databases/(default)/documents`;
  if (path) {
    url += `/${path}`;
  }
  if (apiKey) {
    url += `?key=${apiKey}`;
  }
  return url;
}

// Helper to transform Firestore document data (fields) to a plain JS object
// and extract document ID from the name.
function transformFirestoreDocument(doc: any): any {
  if (!doc || !doc.fields) {
    return { id: doc.name ? doc.name.split('/').pop() : undefined };
  }
  const fields = doc.fields;
  const result: any = {};
  for (const key in fields) {
    if (fields[key].stringValue !== undefined) {
      result[key] = fields[key].stringValue;
    } else if (fields[key].integerValue !== undefined) {
      result[key] = parseInt(fields[key].integerValue, 10);
    } else if (fields[key].doubleValue !== undefined) {
      result[key] = parseFloat(fields[key].doubleValue);
    } else if (fields[key].booleanValue !== undefined) {
      result[key] = fields[key].booleanValue;
    } else if (fields[key].mapValue !== undefined) {
      result[key] = transformFirestoreDocument({ fields: fields[key].mapValue.fields }); // Recursively transform maps
    } else if (fields[key].arrayValue !== undefined) {
      result[key] = fields[key].arrayValue.values?.map((v: any) => {
        // Handle different types within an array
        if (v.stringValue !== undefined) return v.stringValue;
        if (v.integerValue !== undefined) return parseInt(v.integerValue, 10);
        if (v.doubleValue !== undefined) return parseFloat(v.doubleValue);
        if (v.booleanValue !== undefined) return v.booleanValue;
        if (v.mapValue !== undefined) return transformFirestoreDocument({ fields: v.mapValue.fields });
        // Add other types as needed
        return null;
      }) || [];
    } else if (fields[key].timestampValue !== undefined) {
      result[key] = new Date(fields[key].timestampValue).toISOString();
    }
    // Add other type handlers as needed (e.g., nullValue, geoPointValue)
  }
  if (doc.name) {
    result.id = doc.name.split('/').pop();
  }
  if (doc.createTime) result.createTime = doc.createTime;
  if (doc.updateTime) result.updateTime = doc.updateTime;
  return result;
}

// Helper to transform a plain JS object to Firestore document fields
function objectToFirestoreFields(data: any): any {
  const fields: any = {};
  for (const key in data) {
    const value = data[key];
    if (typeof value === 'string') {
      fields[key] = { stringValue: value };
    } else if (typeof value === 'number' && Number.isInteger(value)) {
      fields[key] = { integerValue: String(value) };
    } else if (typeof value === 'number') {
      fields[key] = { doubleValue: value };
    } else if (typeof value === 'boolean') {
      fields[key] = { booleanValue: value };
    } else if (value instanceof Date) {
      fields[key] = { timestampValue: value.toISOString() };
    } else if (Array.isArray(value)) {
      fields[key] = {
        arrayValue: {
          values: value.map(item => {
            if (typeof item === 'string') return { stringValue: item };
            if (typeof item === 'number' && Number.isInteger(item)) return { integerValue: String(item) };
            if (typeof item === 'number') return { doubleValue: item };
            if (typeof item === 'boolean') return { booleanValue: item };
            // Add other types for array items if needed
            return { nullValue: null }; // Default for unhandled types in array
          })
        }
      };
    } else if (typeof value === 'object' && value !== null) {
      fields[key] = { mapValue: { fields: objectToFirestoreFields(value) } };
    }
    // Add other type handlers (null, etc.)
  }
  return fields;
}


export async function listDocuments(collectionPath: string, apiKey: string, projectId: string, idToken?: string): Promise<any[]> {
  const url = getFirestoreUrl(projectId, collectionPath, apiKey);
  console.log(`Firestore Client: Listing documents from ${url}`);

  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Unknown error listing documents." }));
    console.error(`Firestore Client Error: ${response.status}`, errorData);
    throw { status: response.status, message: "Error listing documents from Firestore.", details: errorData };
  }

  const responseData = await response.json();
  return responseData.documents?.map(transformFirestoreDocument) || [];
}

export async function addDocument(collectionPath: string, data: any, apiKey: string, projectId: string, idToken?: string): Promise<any> {
  // Firestore auto-generates an ID if documentId is not part of collectionPath
  const url = getFirestoreUrl(projectId, collectionPath, apiKey);
  console.log(`Firestore Client: Adding document to ${url}`);

  const firestoreDocument = { fields: objectToFirestoreFields(data) };
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(firestoreDocument),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Unknown error creating document." }));
    console.error(`Firestore Client Error during POST: ${response.status}`, errorData);
    throw { status: response.status, message: "Error creating document in Firestore.", details: errorData };
  }

  const createdDocument = await response.json();
  return transformFirestoreDocument(createdDocument);
}

export async function getDocument(documentPath: string, apiKey: string, projectId: string, idToken?: string): Promise<any | null> {
  const url = getFirestoreUrl(projectId, documentPath, apiKey);
  console.log(`Firestore Client: Getting document from ${url}`);

  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: headers,
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null; // Document not found
    }
    const errorData = await response.json().catch(() => ({ message: "Unknown error getting document." }));
    console.error(`Firestore Client Error: ${response.status}`, errorData);
    throw { status: response.status, message: "Error getting document from Firestore.", details: errorData };
  }
  const responseData = await response.json();
  return transformFirestoreDocument(responseData);
}

export async function updateDocument(documentPath: string, data: any, apiKey: string, projectId: string, idToken?: string, updateMask: string[] = []): Promise<any> {
  let url = getFirestoreUrl(projectId, documentPath, apiKey);
  if (updateMask.length > 0) {
    const maskParams = updateMask.map(field => `updateMask.fieldPaths=${field}`).join('&');
    // Ensure apiKey is part of the base URL if adding maskParams, or add it separately
    if (url.includes('?key=')) {
        url = `${url}&${maskParams}`;
    } else {
        url = `${url}?key=${apiKey}&${maskParams}`;
    }
  }
   console.log(`Firestore Client: Updating document at ${url}`);

  const firestoreDocument = { fields: objectToFirestoreFields(data) };
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }

  const response = await fetch(url, {
    method: 'PATCH',
    headers: headers,
    body: JSON.stringify(firestoreDocument),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Unknown error updating document." }));
    console.error(`Firestore Client Error during PATCH: ${response.status}`, errorData);
    throw { status: response.status, message: "Error updating document in Firestore.", details: errorData };
  }

  const updatedDocument = await response.json();
  return transformFirestoreDocument(updatedDocument);
}

export async function deleteDocument(documentPath: string, apiKey: string, projectId: string, idToken?: string): Promise<void> {
  const url = getFirestoreUrl(projectId, documentPath, apiKey);
  console.log(`Firestore Client: Deleting document at ${url}`);

  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }

  const response = await fetch(url, {
    method: 'DELETE',
    headers: headers,
  });

  if (!response.ok) {
    // Firestore returns an empty body for successful DELETE, but error for failure.
    // Status 200 or 204 means success.
    const errorData = await response.json().catch(() => ({ message: "Unknown error deleting document." }));
    console.error(`Firestore Client Error during DELETE: ${response.status}`, errorData);
    throw { status: response.status, message: "Error deleting document in Firestore.", details: errorData };
  }
  // Successful delete returns empty body, or status 200/204
}

// TODO: Implement other necessary Firestore operations as needed.
// For example:
// - Querying documents (requires different endpoint and request body structure)
// - Batch writes
// - Transactions (more complex, typically needs server-side SDK or careful REST API orchestration)

// Example of how to structure a query (for future reference, not fully implemented here)
/*
export async function queryDocuments(collectionPath: string, queryOptions: any, apiKey: string, projectId: string): Promise<any[]> {
  const url = `${FIRESTORE_BASE_URL}/${projectId}/databases/(default)/documents:runQuery?key=${apiKey}`;

  // queryOptions would be an object structured according to Firestore REST API for queries
  // e.g., { structuredQuery: { from: [{ collectionId: collectionPath }], where: ..., orderBy: ..., select: ... }}
  const body = {
    structuredQuery: {
      from: [{ collectionId: collectionPath.split('/').pop() }], // Assuming collectionPath is like 'users/USER_ID/habits'
      // where: { ... }, // Define filters here
      // orderBy: [ ... ], // Define ordering here
      // select: { fields: [ ... ] } // Define fields to select
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Unknown error querying documents." }));
    throw { status: response.status, message: "Error querying documents.", details: errorData };
  }

  const responseDataArray = await response.json(); // runQuery returns an array of document objects or error objects
  // Each object in the array needs to be checked if it's a document or an error if the query was part of a transaction.
  // For simple queries, it's usually an array of { document: {...} } objects.
  return responseDataArray.map((item: any) => item.document ? transformFirestoreDocument(item.document) : item);
}
*/
