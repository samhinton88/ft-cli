export interface TreeNode {
  type: "dir" | "file";
  children: TreeNode[];
  name: string;
  language?: string;
  loop?: any;
}

export interface TreeNodeView extends TreeNode {
  open?: boolean;
}

export const toDirectoryTree: (snippets: any[]) => TreeNodeView[] = (
  snippets
) => {
  const memo: TreeNodeView[] = [];

  for (const snippet of snippets) {
    const splitPath = snippet.target.split("/");

    let target = memo;

    for (let i = 0; i < splitPath.length; i++) {
      const pathPart = splitPath[i];
      const entry = target.find(({ name }) => pathPart === name);
      const isFile = i === splitPath.length - 1;

      if (!entry) {
        const newEntry = {
          name: pathPart,
          children: [],
          type: (isFile ? "file" : "dir") as "dir" | "file",
          language: snippet.language,
          loop: snippet.loop,
        };

        target.push(newEntry);
        target = newEntry.children;
      } else {
        // already an entry, make target this entry's children
        if (isFile) {
          const newEntry = {
            name: pathPart,
            children: [],
            type: "file" as "file",
            language: snippet.language,
            loop: snippet.loop,
          };
          entry.children.push(newEntry);
        } else {
          target = entry.children;
        }
      }
    }

    target = memo;
  }

  return memo;
};

export const buildTree = (
  tree: TreeNodeView,
  memo: string = "",
  depth: number = 0
): string => {
  let output = `${`  `.repeat(depth)}${tree.name}${
    tree.type === "dir" ? "/" : ""
  }\n`;

  if (tree.children.length) {
    output += tree.children.map((t) => buildTree(t, memo, depth + 1)).join("");
  }

  return output;
};

export const printTree = (tree: TreeNodeView, depth: number = 0) => {
  console.log(
    `${`  `.repeat(depth)}${tree.name}${tree.type === "dir" ? "/" : ""}`
  );
  tree.children?.forEach((t) => printTree(t, depth + 1));
};
