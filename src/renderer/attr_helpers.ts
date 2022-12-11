export function mapAttrs(attributes: NamedNodeMap): Record<string, any> {
  const attrs: Record<string, any> = {};
  for (const attr of attributes) {
    attrs[attr.name] = attr.value;
  }
  return attrs;
}
