import parse from "./parser.js";
import analyze from "./analyzer.js";
import optimize from "./optimizer.js";
import generate from "./generator.js";
import * as fs from "fs";
import * as path from "path";

export default function compile(source, outputType) {
  if (
    !["parsed", "analyzed", "optimized", "js", "generate"].includes(outputType)
  ) {
    throw new Error("Unknown output type");
  }
  const match = parse(source);
  if (outputType === "parsed") return "Syntax is ok";
  const analyzed = analyze(match);
  if (outputType === "analyzed") return analyzed;
  const optimized = optimize(analyzed);
  if (outputType === "optimized") return optimized;
  const jsCode = generate(optimized);
  if (outputType === "generate") {
    const jsFileName = "generated.js";
    const folderPath = path.join("generated");
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    const fullPath = path.join(folderPath, jsFileName);
    fs.writeFileSync(fullPath, jsCode);
    return "Generated JavaScript code written to " + jsFileName;
  }
  return generate(optimized);
}
