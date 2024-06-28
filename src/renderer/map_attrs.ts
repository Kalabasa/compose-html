export function mapAttrs(attributes: NamedNodeMap): Record<string, any> {
  const attrs: Record<string, any> = {};
  for (const attr of attributes) {
    attrs[attr.name] = attr.value;
  }
  return attrs;
}

export function mapAttrsForScript(
  attributes: Record<string, any>
): Record<string, any> {
  const attrs: Record<string, any> = {};
  for (const [name, value] of Object.entries(attributes)) {
    attrs[toCamelCase(name)] = value;
  }
  return attrs;
}

export function mapAttrsFromScript(
  attributes: Record<string, any>
): Record<string, any> {
  const attrs: Record<string, any> = {};
  for (const [name, value] of Object.entries(attributes)) {
    attrs[toKebabCase(name)] = value;
  }
  return attrs;
}

function toCamelCase(kebab: string) {
  return kebab.replace(/-./g, (x) => x[1].toUpperCase());
}

function toKebabCase(camel: string) {
  return camel.replace(/[A-Z]/g, (x) => "-" + x.toLowerCase());
}
