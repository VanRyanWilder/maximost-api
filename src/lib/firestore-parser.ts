// server/src/lib/firestore-parser.ts

export const parseFirestoreDoc = (doc: any) => {
    const parsed: any = {};
    if (doc.name) {
        parsed.id = doc.name.split('/').pop();
    }
    for (const key in doc.fields) {
        const value = doc.fields[key];
        if (value.stringValue !== undefined) {
            parsed[key] = value.stringValue;
        } else if (value.integerValue !== undefined) {
            parsed[key] = parseInt(value.integerValue, 10);
        } else if (value.booleanValue !== undefined) {
            parsed[key] = value.booleanValue;
        } else if (value.timestampValue !== undefined) {
            parsed[key] = new Date(value.timestampValue);
        } else if (value.mapValue !== undefined) {
            parsed[key] = parseFirestoreDoc({ fields: value.mapValue.fields });
        } else if (value.arrayValue !== undefined) {
            parsed[key] = value.arrayValue.values.map((v: any) => {
                if (v.stringValue) return v.stringValue;
                if (v.integerValue) return parseInt(v.integerValue, 10);
                if (v.booleanValue) return v.booleanValue;
                if (v.timestampValue) return new Date(v.timestampValue);
                if (v.mapValue) return parseFirestoreDoc({ fields: v.mapValue.fields });
                return null;
            });
        }
    }
    return parsed;
};
