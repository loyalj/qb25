import { execute } from "../lib/interpreter.ts";

export async function captureOutput(source: string): Promise<string[]> {
  const output: string[] = [];
  const originalLog = console.log;
  
  // Replace console.log with our capture function
  console.log = (...args: unknown[]) => {
    output.push(args.map(arg => String(arg)).join(" "));
  };

  try {
    await execute(source);
    return output;
  } finally {
    // Restore original console.log
    console.log = originalLog;
  }
}
