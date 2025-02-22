#!/usr/bin/env deno run --allow-read

import { execute } from "./lib/interpreter.ts";

const filename = Deno.args[0];

if (!filename) {
  console.error("Usage: deno run main.ts <filename>");
  Deno.exit(1);
}

const source = await Deno.readTextFile(filename);
execute(source);
