import { assertEquals } from "https://deno.land/std/testing/asserts.ts";

class MockConsole {
  output: string[] = [];
  errors: string[] = [];
  
  log(...args: any[]) {
    this.output.push(args.join(" "));
  }
  
  error(...args: any[]) {
    this.errors.push(args.join(" "));
  }
}

// Store original methods
const originalConsole = console;
const originalStdin = Deno.stdin;
const originalReadTextFile = Deno.readTextFile;

function setupMocks(inputs: string[]) {
  const mockConsole = new MockConsole();
  let inputIndex = 0;

  // Mock console
  globalThis.console = mockConsole as any;

  // Mock Deno.stdin
  const mockStdin = {
    read(p: Uint8Array): Promise<number | null> {
      if (inputIndex >= inputs.length) return Promise.resolve(null);
      const input = inputs[inputIndex++] + '\n';
      const encoder = new TextEncoder();
      const bytes = encoder.encode(input);
      p.set(bytes);
      return Promise.resolve(bytes.length);
    },
    close() {},
    readable: new ReadableStream(),
    setRaw() {},
    isTerminal() { return true; }
  };

  Object.defineProperty(Deno, "stdin", {
    value: mockStdin,
    configurable: true
  });

  return mockConsole;
}

function teardownMocks() {
  globalThis.console = originalConsole;
  Object.defineProperty(Deno, "stdin", {
    value: originalStdin,
    configurable: true
  });
  Deno.readTextFile = originalReadTextFile;
}

Deno.test("QB - File Mode", async () => {
  const mockConsole = setupMocks([]);
  
  try {
    Deno.readTextFile = async (path: string | URL, _options?: Deno.ReadFileOptions) => {
      const pathStr = path instanceof URL ? path.toString() : path;
      if (pathStr === "test.bas") {
        return 'PRINT "Hello from file"';
      }
      throw new Error("File not found");
    };
    
    const { runQB } = await import("../qb.ts");
    await runQB(["test.bas"]);
    
    assertEquals(mockConsole.output, ["Hello from file"]);
    assertEquals(mockConsole.errors, []);
  } finally {
    teardownMocks();
  }
});

Deno.test("QB - REPL Mode", async () => {
  const mockConsole = setupMocks([
    'PRINT "Hello REPL"',
    'LET x = 42',
    'PRINT x',
    'EXIT'
  ]);
  
  try {
    const { runQB } = await import("../qb.ts");
    await runQB([]);
    
    const expectedOutput = [
      "QB25 REPL Mode - Type EXIT to quit",
      "Ready.",
      "Hello REPL",
      "Ready.",
      "Ready.",
      "42",
      "Ready.",
      "Goodbye!"
    ];
    
    // Compare arrays element by element
    assertEquals(mockConsole.output.length, expectedOutput.length, 
      "Output length mismatch\nActual: " + JSON.stringify(mockConsole.output) + 
      "\nExpected: " + JSON.stringify(expectedOutput));
    mockConsole.output.forEach((line, i) => {
      assertEquals(line, expectedOutput[i], 
        `Line ${i} mismatch:\nActual: "${line}"\nExpected: "${expectedOutput[i]}"`);
    });
  } finally {
    teardownMocks();
  }
});

Deno.test("QB - REPL Error Recovery", async () => {
  const mockConsole = setupMocks([
    'PRINT "Start"',
    'DIM x AS INTEGER',
    'LET x = "string value"',  // This will cause type mismatch
    'PRINT "After error"',
    'EXIT'
  ]);
  
  try {
    const { runQB } = await import("../qb.ts");
    await runQB([]);
    
    // Verify error was logged
    const hasTypeError = mockConsole.errors.some(err => err.includes("Type mismatch"));
    assertEquals(hasTypeError, true, 
      "Expected 'Type mismatch' error\nActual errors: " + 
      JSON.stringify(mockConsole.errors));
    
    // Verify REPL continued after error
    assertEquals(mockConsole.output[0], "QB25 REPL Mode - Type EXIT to quit");
    assertEquals(mockConsole.output[1], "Ready.");
    assertEquals(mockConsole.output[2], "Start");
    assertEquals(mockConsole.output[mockConsole.output.length - 1], "Goodbye!");
  } finally {
    teardownMocks();
  }
});
