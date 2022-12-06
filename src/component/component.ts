// todo: props type generic

export interface Component {
  name: string;
  filePath: string;
  source: Node[];
  content: Node[];
  scripts: HTMLScriptElement[];
  clientScripts: HTMLScriptElement[];
  styles: HTMLStyleElement[];
}
