import assert from 'node:assert/strict';
import test from 'node:test';
import { readCurriculum } from '../scripts/import-curriculum.js';

test('maps the curriculum to source-keyed lessons and distinct graded quizzes', async () => {
  const modules = await readCurriculum();
  const lessons = modules.flatMap(module => module.lessons);
  const quizzes = modules.map(module => module.quiz);
  const questions = quizzes.flatMap(quiz => quiz.questions);
  const allKeys = [...modules, ...lessons, ...quizzes].map(row => row.source_key);
  assert.equal(new Set(allKeys).size, 37);
  assert.deepEqual(modules.map(module => module.lessons.length), [3, 4, 5, 4, 4, 5]);
  assert.equal(lessons.filter(lesson => lesson.learning_objective).length, 20);
  assert(lessons.every(lesson => lesson.reading_minutes >= 5 && lesson.reading_minutes <= 7));
  const practice = lessons.map(lesson => lesson.content.split('## Quick Self-Check\n')[1]);
  assert(practice.every(Boolean));
  assert.equal(practice.flatMap(section => [...section.matchAll(/^ +\* \*\*Answer\*\*/gm)]).length, 51);
  assert(lessons.some(lesson => lesson.content.includes('> [!CAUTION]')));
  assert(lessons.some(lesson => lesson.content.includes('| Hazard Type |')));
  assert(lessons.every(lesson => !lesson.content.includes('## 8. Canonical Troubleshooting Lab Scenarios')));
  assert.equal(questions.length, 18);
  assert.equal(questions.flatMap(question => question.choices).length, 54);
  assert(questions.every(question => question.choices.filter(choice => choice.is_correct).length === 1));
  assert(questions.every(question => !practice.some(section => section.includes(question.question_text))));
});
