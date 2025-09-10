export function parseFirestoreDoc(doc: any) {
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
      result[key] = parseFirestoreDoc({ fields: fields[key].mapValue.fields });
    } else if (fields[key].arrayValue !== undefined) {
      result[key] = fields[key].arrayValue.values.map((v: any) => {
        if (v.stringValue !== undefined) return v.stringValue;
        if (v.integerValue !== undefined) return parseInt(v.integerValue, 10);
        if (v.doubleValue !== undefined) return parseFloat(v.doubleValue);
        if (v.booleanValue !== undefined) return v.booleanValue;
        if (v.mapValue !== undefined) return parseFirestoreDoc({ fields: v.mapValue.fields });
        return null;
      });
    } else if (fields[key].timestampValue !== undefined) {
      result[key] = new Date(fields[key].timestampValue).toISOString();
    }
  }
  return {
    id: doc.name.split('/').pop(),
    ...result,
  };
}
