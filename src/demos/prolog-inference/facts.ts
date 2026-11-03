/** 登録順を保って parent(親, 子) の候補と家族図の辺番号を返す。 */
export function childrenOf<T extends string>(
  facts: readonly { parent: T; child: T }[],
  parent: T,
) {
  return facts.flatMap((fact, edge) =>
    fact.parent === parent ? [{ child: fact.child, edge }] : [],
  );
}
