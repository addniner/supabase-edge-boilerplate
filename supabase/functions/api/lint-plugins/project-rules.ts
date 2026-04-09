/**
 * 프로젝트 커스텀 Lint 규칙
 *
 * Deno.test() 사용을 강제하고, describe/it (BDD) 스타일을 금지한다.
 */
const plugin: Deno.lint.Plugin = {
  name: "project-rules",
  rules: {
    "no-bdd-imports": {
      create(context) {
        return {
          ImportDeclaration(node) {
            const source = node.source;
            if (source.type === "Literal" && source.value === "@std/testing/bdd") {
              context.report({
                node,
                message:
                  "describe/it (BDD) 사용 금지 — Deno.test() 사용할 것",
              });
            }
          },
        };
      },
    },
  },
};

export default plugin;
