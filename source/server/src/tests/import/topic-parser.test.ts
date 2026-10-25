import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import { parseTopicHtml } from '../../import/topic-parser.js';
import { AppError } from '../../shared/api-response.js';

const templatePath = path.resolve(process.cwd(), '../.ai/content/template/fruits.html');
const html = await readFile(templatePath, 'utf8');

function expectCode(source: string, code: string): void {
  assert.throws(() => parseTopicHtml(source), (error: unknown) => error instanceof AppError && error.code === code);
}

test('parses the real topic template with source fidelity and ordering', () => {
  const parsed = parseTopicHtml(html);
  assert.equal(parsed.topic.id, 'fruits-vn');
  assert.equal(parsed.topic.title, 'Trái cây Việt Nam');
  assert.equal(parsed.words.length, 30);
  assert.equal(parsed.words[0].id, 'mango');
  assert.equal(parsed.words[1].id, 'banana');
  assert.deepEqual(parsed.words[0], {
    id: 'mango',
    imageUrl: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=400&q=80',
    nameVi: 'Xoài',
    chunk: 'a ripe mango',
    ipa: '/ə raɪp ˈmæŋ.ɡoʊ/',
    meaningVi: 'Một quả xoài chín',
    exampleEn: 'This [[a ripe mango]] smells amazing.',
    exampleVi: 'Quả xoài chín này thơm thật.',
  });
  assert.equal(parsed.topic.description, 'Học từ vựng trực quan với hình ảnh thực tế chính xác từng loại quả, ghi nhớ tự nhiên qua các cụm từ (chunks) và câu ngữ cảnh thông dụng.');
  assert.deepEqual(parsed.warnings, []);
});

test('reports count mismatch without dropping source items', () => {
  const parsed = parseTopicHtml(html.replace('name="topic-count"    content="30"', 'name="topic-count"    content="29"'));
  assert.equal(parsed.words.length, 30);
  assert.equal(parsed.warnings[0]?.code, 'COUNT_MISMATCH');
});

test('rejects missing required metadata and conflicting metadata', () => {
  expectCode(html.replace(/\s*<meta name="topic-title"[^>]*>/, ''), 'METADATA_MISSING');
  expectCode(html.replace('content="Trái cây Việt Nam"', 'content="Tiêu đề sai"'), 'METADATA_CONFLICT');
});

test('rejects duplicate word IDs and executable expressions', () => {
  expectCode(html.replace('id: "banana"', 'id: "mango"'), 'DUPLICATE_ITEM_ID');
  expectCode(html.replace('const VOCAB_DATA = [', 'const VOCAB_DATA = getWords(['), 'HTML_PARSE_FAILED');
});
