import {
  familyFacts,
  personNames,
  type Person,
} from "../prolog-inference/model";
import { childrenOf } from "../prolog-inference/facts";
export type Member = Person | "yui";
export const names: Record<Member, string> = { ...personNames, yui: "結衣" };
export const facts: readonly { parent: Member; child: Member }[] = [
  ...familyFacts,
  { parent: "jiro", child: "yui" },
];
export type Predicate = "grandparent" | "ancestor";
export interface Query {
  pred: Predicate;
  from: Member;
  to: Member | "Y";
}
export const initial: Query = { pred: "ancestor", from: "taro", to: "Y" };
export const queryText = (q: Query) => `?- ${q.pred}(${q.from}, ${q.to}).`;
export const clauses = {
  grand: "grandparent(X,Z) :- parent(X,Y), parent(Y,Z).",
  direct: "ancestor(X,Y) :- parent(X,Y).",
  recursive: "ancestor(X,Z) :- parent(X,Y), ancestor(Y,Z).",
};
export interface Frame {
  message: string;
  rule: keyof typeof clauses | null;
  edges: number[];
  answers: Member[];
  done: boolean;
}
export function infer(q: Query): Frame[] {
  const answers: Member[] = [],
    frames: Frame[] = [];
  function record(
    message: string,
    rule: Frame["rule"],
    edges: number[],
    done = false,
  ) {
    frames.push({ message, rule, edges, answers: [...answers], done });
  }
  record(queryText(q), null, []);
  function match(person: Member, rule: keyof typeof clauses, path: number[]) {
    if (q.to !== "Y" && q.to !== person) {
      record(`候補 ${person} は指定した ${q.to} と一致しません。`, rule, path);
      return;
    }
    answers.push(person);
    record(
      q.to === "Y"
        ? `解 ${answers.length}：問い合わせの Y = ${person}（${names[person]}）。`
        : `指定した ${person} に到達しました。問い合わせが成立します。`,
      rule,
      path,
    );
  }
  // 固定の4世代の事実を、基本規則、再帰規則の順で照合する。
  function ancestors(person: Member, path: number[]) {
    const children = childrenOf(facts, person);
    record(`基本規則：parent(${person}, 子) を探します。`, "direct", path);
    for (const c of children) match(c.child, "direct", [...path, c.edge]);
    for (const c of children) {
      const next = [...path, c.edge];
      record(
        `再帰規則：parent(${person}, ${c.child}) が成立。次は ancestor(${c.child}, ${q.to}) を調べます。`,
        "recursive",
        next,
      );
      ancestors(c.child, next);
    }
    if (!children.length)
      record(
        `${person} の子を示す事実はありません。この枝の探索を終えます。`,
        "recursive",
        path,
      );
  }
  if (q.pred === "ancestor") ancestors(q.from, []);
  else {
    for (const c of childrenOf(facts, q.from)) {
      record(
        `規則内の中間人物 Y = ${c.child}。次に parent(${c.child}, Z) を照合します。`,
        "grand",
        [c.edge],
      );
      for (const d of childrenOf(facts, c.child))
        match(d.child, "grand", [c.edge, d.edge]);
    }
  }
  record(
    !answers.length
      ? "false：登録された事実と規則からは導けません。"
      : q.to === "Y"
        ? `列挙終了。問い合わせの Y に当てはまる人は${answers.length}人です。`
        : "true：問い合わせは成立します。",
    null,
    [],
    true,
  );
  return frames;
}
