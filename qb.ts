#!/usr/bin/env deno run --allow-read

import { execute, createInterpreter } from "./lib/interpreter.ts";

async function readLine(): Promise<string | null> {
  const buf = new Uint8Array(1024);
  const n = await Deno.stdin.read(buf);
  if (n === null) return null;
  return new TextDecoder().decode(buf.subarray(0, n)).trim();
}

async function runREPL() {
  console.log("QB25 REPL Mode - Type EXIT to quit");
  const interpreter = createInterpreter();
  
  while (true) {
    console.log("Ready.");
    try {
      const line = await readLine();
      if (!line) break;
      
      const input = line.trim();
      if (input.toUpperCase() === 'EXIT') {
        console.log("Goodbye!");
        break;
      }
      
      if (input) {
        try {
          // Pass false to prevent state reset in REPL mode
          await interpreter.execute(input, false);
        } catch (error) {
          console.error(error instanceof Error ? error.message : "An unknown error occurred");
        }
      }
    } catch (error) {
      console.error(error instanceof Error ? error.message : "An unknown error occurred");
      // Don't break the REPL on errors
    }
  }
}

async function runFile(filename: string) {
  try {
    const source = await Deno.readTextFile(filename);
    const interpreter = createInterpreter();
    await interpreter.execute(source);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error("An unknown error occurred");
    }
    Deno.exit(1);
  }
}

export async function runQB(args: string[] = Deno.args): Promise<void> {
  if (args.length === 0) {
    await runREPL();
  } else {
    await runFile(args[0]);
  }
}

if (import.meta.main) {
  runQB();
}
