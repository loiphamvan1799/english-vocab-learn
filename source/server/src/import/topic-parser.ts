import { parse as parseJavaScript } from 'acorn';
import * as cheerio from 'cheerio';

import { AppError } from '../shared/api-response.js';
import { parsedTopicSchema, type ImportWarning } from './schemas.js';
import type { Node } from 'acorn';

type LiteralValue = string | number | boolean | null | LiteralValue[] | { [key: string]: LiteralValue };
type AcornNode = Node & Record<string, any>;

const MAX_HTML_BYTES = 2 * 1024 * 1024;
const MAX_SCRIPT_BYTES = 1024 * 1024;
const MAX_DEPTH = 12;
const MAX_ITEMS = 2000;

function fail(code: string, message: string, status = 422): never {
  throw new AppError(status, code, message);
}

function parseLiteral(node: AcornNode, depth = 0): LiteralValue {
  if (depth > MAX_DEPTH) fail('DATA_SCRIPT_UNSAFE', 'Khối dữ liệu lồng quá sâu; không thể import an toàn.');
  switch (node.type) {
    case 'Literal':
      if (typeof node.value === 'string' || typeof node.value === 'number' || typeof node.value === 'boolean' || node.value === null) return node.value;
      return fail('DATA_SCRIPT_UNSAFE', 'Khối dữ liệu chứa literal không được hỗ trợ.');
    case 'ArrayExpression':
      if (node.elements.length > MAX_ITEMS) fail('ITEMS_LIMIT_EXCEEDED', 'Tệp có quá nhiều mục từ vựng.');
      return node.elements.map((element: AcornNode | null) => {
        if (!element || element.type === 'SpreadElement') return fail('DATA_SCRIPT_UNSAFE', 'Mảng dữ liệu chứa cú pháp không được hỗ trợ.');
        return parseLiteral(element, depth + 1);
      });
    case 'ObjectExpression': {
      const result: Record<string, LiteralValue> = Object.create(null) as Record<string, LiteralValue>;
      for (const property of node.properties as AcornNode[]) {
        if (property.type !== 'Property' || property.kind !== 'init' || property.method || property.computed) {
          return fail('DATA_SCRIPT_UNSAFE', 'Đối tượng dữ liệu chứa cú pháp không được hỗ trợ.');
        }
        const keyNode = property.key as AcornNode;
        if (keyNode.type !== 'Identifier' && keyNode.type !== 'Literal') return fail('DATA_SCRIPT_UNSAFE', 'Tên trường dữ liệu không hợp lệ.');
        const key = String(keyNode.name ?? keyNode.value);
        if (Object.prototype.hasOwnProperty.call(result, key)) fail('DATA_SCRIPT_UNSAFE', 'Đối tượng có trường bị lặp.');
        result[key] = parseLiteral(property.value as AcornNode, depth + 1);
      }
      return result;
    }
    default:
      return fail('DATA_SCRIPT_UNSAFE', 'Khối dữ liệu chứa biểu thức không được hỗ trợ; không thực thi script.');
  }
}

function readDeclaration(ast: AcornNode, name: string): LiteralValue {
  const declarations: AcornNode[] = [];
  for (const statement of ast.body as AcornNode[]) {
    if (statement.type === 'VariableDeclaration') {
      for (const declaration of statement.declarations as AcornNode[]) {
        if (declaration.id?.type === 'Identifier' && declaration.id.name === name) declarations.push(declaration);
      }
    }
  }
  if (declarations.length === 0) fail('DATA_SCRIPT_MISSING', 'Không tìm thấy khối dữ liệu cần thiết trong tệp HTML.');
  if (declarations.length > 1) fail('DATA_SCRIPT_UNSAFE', 'Tệp có nhiều khai báo dữ liệu trùng tên; không thể import an toàn.');
  if (!declarations[0].init) return fail('DATA_SCRIPT_UNSAFE', 'Khối dữ liệu không có literal khởi tạo.');
  return parseLiteral(declarations[0].init as AcornNode);
}

function readMeta($: cheerio.CheerioAPI, name: string): string | undefined {
  const value = $(`meta[name="${name}"]`).attr('content');
  return value?.trim() || undefined;
}

function assertMetadataMatches(meta: Record<string, string | undefined>, literal: Record<string, unknown>): void {
  const pairs: Array<[string, string]> = [
    ['topic-id', 'id'],
    ['topic-title', 'title'],
    ['topic-category', 'category'],
    ['topic-level', 'level'],
    ['topic-lang', 'lang'],
  ];
  for (const [metaKey, literalKey] of pairs) {
    const fromMeta = meta[metaKey];
    const fromLiteral = literal[literalKey];
    if (fromMeta !== undefined && fromLiteral !== undefined && fromMeta.trim() !== String(fromLiteral).trim()) {
      fail('METADATA_CONFLICT', 'Metadata trong HTML không khớp với dữ liệu nhúng. Hãy sửa tệp để hai phần giống nhau.');
    }
    if (fromMeta === undefined && (literalKey === 'id' || literalKey === 'title')) {
      meta[metaKey] = String(fromLiteral ?? '');
    }
  }
}

export function parseTopicHtml(html: string): ReturnType<typeof parsedTopicSchema.parse> {
  if (Buffer.byteLength(html, 'utf8') > MAX_HTML_BYTES) fail('UPLOAD_TOO_LARGE', 'Tệp vượt quá dung lượng cho phép.', 413);
  let $: cheerio.CheerioAPI;
  try {
    $ = cheerio.load(html, { scriptingEnabled: false });
  } catch {
    return fail('HTML_PARSE_FAILED', 'Không đọc được cấu trúc HTML. Hãy kiểm tra tệp theo template.');
  }
  const scripts = $('script:not([src])').toArray().map((element) => $(element).text()).filter(Boolean);
  let metadata: LiteralValue | undefined;
  let words: LiteralValue | undefined;
  let metadataDeclarations = 0;
  let wordDeclarations = 0;
  try {
    for (const script of scripts) {
      if (Buffer.byteLength(script, 'utf8') > MAX_SCRIPT_BYTES) fail('UPLOAD_TOO_LARGE', 'Khối script trong tệp vượt quá dung lượng cho phép.', 413);
      if (!/\b(?:const|let|var)\s+TOPIC_METADATA\b/.test(script) && !/\b(?:const|let|var)\s+VOCAB_DATA\b/.test(script)) continue;
      const ast = parseJavaScript(script, { ecmaVersion: 'latest', sourceType: 'script', allowHashBang: false }) as unknown as AcornNode;
      if (/\b(?:const|let|var)\s+TOPIC_METADATA\b/.test(script)) {
        metadataDeclarations += 1;
        metadata = readDeclaration(ast, 'TOPIC_METADATA');
      }
      if (/\b(?:const|let|var)\s+VOCAB_DATA\b/.test(script)) {
        wordDeclarations += 1;
        words = readDeclaration(ast, 'VOCAB_DATA');
      }
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    fail('HTML_PARSE_FAILED', 'Không đọc được cấu trúc HTML. Hãy kiểm tra tệp theo template.');
  }
  if (metadataDeclarations > 1 || wordDeclarations > 1) fail('DATA_SCRIPT_UNSAFE', 'Tệp có nhiều khối dữ liệu trùng tên; không thể import an toàn.');
  if (!metadata || !words) fail('DATA_SCRIPT_MISSING', 'Không tìm thấy khối dữ liệu cần thiết trong tệp HTML.');
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata) || !Array.isArray(words)) {
    fail('DATA_SCRIPT_UNSAFE', 'Khối dữ liệu không đúng cấu trúc literal được hỗ trợ.');
  }
  const $meta = {
    'topic-id': readMeta($, 'topic-id'),
    'topic-title': readMeta($, 'topic-title'),
    'topic-category': readMeta($, 'topic-category'),
    'topic-level': readMeta($, 'topic-level'),
    'topic-lang': readMeta($, 'topic-lang'),
  };
  if (!$meta['topic-id'] || !$meta['topic-title'] || metadata.id === undefined || metadata.title === undefined) {
    fail('METADATA_MISSING', 'Tệp đang thiếu mã định danh hoặc tên chủ đề.');
  }
  assertMetadataMatches($meta, metadata);
  const id = $meta['topic-id'];
  const title = $meta['topic-title'];
  if (!id || !title) fail('METADATA_MISSING', 'Tệp đang thiếu mã định danh hoặc tên chủ đề.');
  if (words.length === 0) fail('ITEMS_EMPTY', 'Tệp không có từ vựng để import.');
  const normalizedWords = words.map((word, index) => {
    if (!word || typeof word !== 'object' || Array.isArray(word)) fail('DATA_SCRIPT_UNSAFE', `Mục ${index + 1} không phải đối tượng literal.`);
    return word;
  });
  const parsed = parsedTopicSchema.safeParse({
    topic: {
      id,
      title,
      category: $meta['topic-category'] ?? (metadata.category as string | undefined),
      level: $meta['topic-level'] ?? (metadata.level as string | undefined),
      lang: $meta['topic-lang'] ?? (metadata.lang as string | undefined),
      description: $('.page-header .page-desc').first().text(),
    },
    words: normalizedWords,
    warnings: [],
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path.slice(-1)[0] ?? 'dữ liệu';
    fail('FIELD_MISSING', `Một mục đang thiếu trường bắt buộc: ${String(field)}.`);
  }
  const ids = new Set<string>();
  for (const word of parsed.data.words) {
    if (ids.has(word.id)) fail('DUPLICATE_ITEM_ID', `Tệp có mã từ bị trùng: ${word.id}.`);
    ids.add(word.id);
  }
  const warnings: ImportWarning[] = [];
  const declaredCount = Number(readMeta($, 'topic-count'));
  if (Number.isFinite(declaredCount) && declaredCount !== parsed.data.words.length) {
    warnings.push({ code: 'COUNT_MISMATCH', message: `Số lượng khai báo (${declaredCount}) khác số mục tìm thấy (${parsed.data.words.length}); hệ thống sẽ giữ đúng số mục trong dữ liệu.` });
  }
  parsed.data.words.forEach((word, index) => {
    if (!word.imageUrl) warnings.push({ code: 'MEDIA_NOT_FOUND', message: `Mục ${index + 1} (${word.id}) chưa có ảnh; giao diện sẽ dùng ảnh thay thế.` });
  });
  return { ...parsed.data, warnings };
}
