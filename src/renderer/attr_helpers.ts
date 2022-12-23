export function mapAttrs(attributes: NamedNodeMap): Record<string, any> {
  const attrs: Record<string, any> = {};
  for (const attr of attributes) {
    attrs[toCamelCase(attr.name)] = attr.value;
  }
  return attrs;
}

function toCamelCase(kebab: string) {
  return kebab.replace(/-./g, (x) => x[1].toUpperCase());
}
