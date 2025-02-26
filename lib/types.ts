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
  // Handle arrays separately
  if (Array.isArray(value)) {
    throw new Error("Type mismatch in array");
  }

  // Handle single values
  switch (type) {
    case QBType.INTEGER:
      if (typeof value !== 'number' || !Number.isInteger(value)) {
        throw new Error("Type mismatch: expected INTEGER");
      }
      break;
    case QBType.SINGLE:
    case QBType.DOUBLE:
      if (typeof value !== 'number') {
        throw new Error(`Type mismatch: expected ${type}`);
      }
      break;
    case QBType.STRING:
      if (typeof value !== 'string') {
        throw new Error("Type mismatch: expected STRING");
      }
      break;
    default:
      throw new Error("Invalid type");
  }
  return true;
}

function validateValue(type: QBType, value: any): boolean {
  switch (type) {
    case QBType.INTEGER:
      return typeof value === 'number' && Number.isInteger(value);
    case QBType.SINGLE:
    case QBType.DOUBLE:
      return typeof value === 'number';
    case QBType.STRING:
      return typeof value === 'string';
    default:
      throw new Error("Invalid type");
  }
}

export function isValidQBType(type: string): boolean {
  return Object.values(QBType).includes(type as QBType);
}
