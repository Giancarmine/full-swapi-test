const fs = require("fs");
const YAML = require("yaml");

const resolvePointer = (doc, pointer) => {
  if (!pointer.startsWith("#/")) {
    throw new Error(`Unsupported $ref (only local refs are supported): ${pointer}`);
  }

  return pointer
    .slice(2)
    .split("/")
    .map((token) => token.replace(/~1/g, "/").replace(/~0/g, "~"))
    .reduce((node, token) => (node == null ? undefined : node[token]), doc);
};

const dereferenceNode = (node, doc, seen) => {
  if (Array.isArray(node)) {
    return node.map((item) => dereferenceNode(item, doc, seen));
  }

  if (!node || typeof node !== "object") {
    return node;
  }

  if (typeof node.$ref === "string") {
    const target = resolvePointer(doc, node.$ref);
    if (target === undefined) {
      throw new Error(`Unresolvable $ref: ${node.$ref}`);
    }
    // Leave genuinely circular references untouched rather than recursing forever.
    if (seen.has(node.$ref)) {
      return { $ref: node.$ref };
    }
    const nextSeen = new Set(seen).add(node.$ref);
    return dereferenceNode(target, doc, nextSeen);
  }

  const result = {};
  for (const [key, value] of Object.entries(node)) {
    result[key] = dereferenceNode(value, doc, seen);
  }
  return result;
};

const dereferenceFile = (filePath) => {
  const doc = YAML.parse(fs.readFileSync(filePath, "utf8"));
  return dereferenceNode(doc, doc, new Set());
};

module.exports = {
  dereferenceFile,
};
