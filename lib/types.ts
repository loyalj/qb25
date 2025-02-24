export enum QBType {
  INTEGER = 'INTEGER',
  SINGLE = 'SINGLE',
  DOUBLE = 'DOUBLE',
  STRING = 'STRING'
}

export interface TypedVariable {
  name: string;
  type: QBType;
  value: number | string | (number | string)[];  // Updated to support arrays
}

export function getDefaultValue(type: QBType): number | string {
  switch (type) {
    case QBType.INTEGER: return 0;
    case QBType.SINGLE: return 0.0;
    case QBType.DOUBLE: return 0.0;
    case QBType.STRING: return "";
    default: throw new Error("Unknown type");
  }
}

export function validateType(type: QBType, value: any): boolean {
  // For arrays, check each element
  if (Array.isArray(value)) {
    return value.every(item => validateArrayValue(type, item));
  }

  // For single values
  if (!validateArrayValue(type, value)) {
    throw new Error("Type mismatch");  // Make sure we throw the error
  }
  return true;
}

export function validateArrayValue(type: QBType, value: any): boolean {
  switch (type) {
    case QBType.INTEGER:
      return typeof value === 'number' && Number.isInteger(value);
    case QBType.SINGLE:
    case QBType.DOUBLE:
      return typeof value === 'number';
    case QBType.STRING:
      return typeof value === 'string';
    default:
      throw new Error("Type mismatch");  // Change error message here too
  }
}

export function isValidQBType(type: string): boolean {
  return Object.values(QBType).includes(type as QBType);
}
