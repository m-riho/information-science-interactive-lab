export interface Book {
  readonly id: number;
  readonly title: string;
}
export const books: readonly Book[] = [
  { id: 1, title: "情報科学入門" },
  { id: 2, title: "コンピュータ科学概論" },
  { id: 3, title: "情報と社会" },
];
export type WebStage =
  | "ready"
  | "request"
  | "server"
  | "php"
  | "database"
  | "generate"
  | "response"
  | "browser";
export const stageNames: Record<WebStage, string> = {
  ready: "検索条件を準備",
  request: "HTTP Request",
  server: "Web Server",
  php: "PHP処理系",
  database: "Database",
  generate: "結果生成",
  response: "HTTP Response",
  browser: "Browserに表示",
};
export interface WebFrame {
  stage: WebStage;
  message: string;
  results: readonly Book[];
  status: 200 | 503 | null;
}
/** 架空データの文字列部分一致。空の検索語は全件を返す。 */
export function searchBooks(query: string): Book[] {
  const keyword = query.trim();
  return books.filter((book) => book.title.includes(keyword));
}
/** 実際の通信・PHP実行は行わず、有限のフローを返す。 */
export function createWebFlow(
  query: string,
  runtimeAvailable: boolean,
): WebFrame[] {
  const frames: WebFrame[] = [
    {
      stage: "ready",
      message:
        "検索条件を準備しました。1ステップでブラウザからリクエストを送ります。",
      results: [],
      status: null,
    },
    {
      stage: "request",
      message: "ブラウザが検索語を含むHTTPリクエストを送ります。",
      results: [],
      status: null,
    },
    {
      stage: "server",
      message:
        "Webサーバがリクエストを受け取り、検索用のPHPプログラムの実行を処理系へ依頼します。",
      results: [],
      status: null,
    },
  ];
  if (!runtimeAvailable)
    return [
      ...frames,
      {
        stage: "php",
        message:
          "PHP処理系が停止中です。検索処理を実行できないため、この検索サービスを提供できません。DB検索には進みません。",
        results: [],
        status: null,
      },
      {
        stage: "response",
        message:
          "Webサーバがサービス利用不可の応答（この教材では503）を返します。PHPプログラムが応答を生成したわけではありません。",
        results: [],
        status: 503,
      },
      {
        stage: "browser",
        message:
          "ブラウザはサービス利用不可を表示します。検索結果0件とは異なり、検索そのものを実行できていません。",
        results: [],
        status: 503,
      },
    ];
  const results = searchBooks(query);
  return [
    ...frames,
    {
      stage: "php",
      message:
        "PHP処理系がPHPで書かれた検索プログラムを動かし、検索語を使ってデータベースへ問い合わせます。",
      results: [],
      status: null,
    },
    {
      stage: "database",
      message: `データベースが書名を調べ、${results.length}件のデータをプログラムへ返します。`,
      results,
      status: null,
    },
    {
      stage: "generate",
      message: `PHPプログラムが検索結果${results.length}件を含む表示用HTMLを生成します。`,
      results,
      status: null,
    },
    {
      stage: "response",
      message:
        "Webサーバが生成されたHTMLをHTTPレスポンス（200）でブラウザへ返します。",
      results,
      status: 200,
    },
    {
      stage: "browser",
      message: `ブラウザがHTMLを解釈し、検索結果${results.length}件を表示します。PHPのソースコードをブラウザで動かすわけではありません。`,
      results,
      status: 200,
    },
  ];
}
