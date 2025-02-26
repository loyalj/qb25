/**
 * Represents the available data types in QBASIC.
 * These are the fundamental types that variables can be declared as.
 */
export enum QBType {
  INTEGER = 'INTEGER',
  SINGLE = 'SINGLE',
  DOUBLE = 'DOUBLE',
  STRING = 'STRING'
}

/**
 * Represents a typed variable in QBASIC.
 * Contains the variable's name, type, and current value.
 * Arrays are supported through the value property which can be an array.
 */
export interface TypedVariable {
  name: string;
  type: QBType;
  value: number | string | (number | string)[];  // Updated to support arrays
}

/**
 * Returns the default value for a given QBASIC type.
 * Numeric types default to 0, strings to empty string.
 * @param type The QBASIC type to get the default value for
 * @returns The default value for the specified type
 * @throws Error if an unknown type is provided
 */
export function getDefaultValue(type: QBType): number | string {
  switch (type) {
    case QBType.INTEGER: return 0;
    case QBType.SINGLE: return 0.0;
    case QBType.DOUBLE: return 0.0;
    case QBType.STRING: return "";
    default: throw new Error("Unknown type");
  }
}

/**
 * Validates that a value matches its declared QBASIC type.
 * Performs type checking and throws errors for mismatches.
 * @param type The expected QBASIC type
 * @param value The value to validate
 * @returns true if the value matches the type
 * @throws Error if there's a type mismatch or for array values
 */
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

/**
 * Internal helper function to validate individual values against their type.
 * Used by validateType to check non-array values.
 * @param type The expected QBASIC type
 * @param value The value to validate
 * @returns true if the value matches the type
 * @throws Error if the type is invalid
 */
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

/**
 * Checks if a string represents a valid QBASIC type.
 * Used for type validation during variable declaration.
 * @param type The type string to check
 * @returns true if the string is a valid QBASIC type
 */
export function isValidQBType(type: string): boolean {
  return Object.values(QBType).includes(type as QBType);
}
