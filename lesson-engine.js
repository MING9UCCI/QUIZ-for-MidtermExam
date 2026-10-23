import {initialSE,seGoals,reduceSE} from './se-engine.js';
import {initialSG,sgGoals,reduceSG} from './sg-engine.js';
// Small, deterministic teaching simulations; no general-purpose SQL execution.
export const STUDENTS = [
  { id: '101', name: '하늘', dept: '컴퓨터' },
  { id: '102', name: '민수', dept: '수학' },
  { id: '103', name: '수아', dept: '컴퓨터' },
  { id: '104', name: '지훈', dept: '통계' }
];
export const ENROLMENTS = [{ id: '101', course: '자료구조' }, { id: '101', course: '데이터베이스' }, { id: '103', course: '인공지능' }];
export const FEATURES = [
  { x: 47, y: 50, label: 'A' }, { x: 40, y: 44, label: 'B' },
  { x: 59, y: 57, label: 'B' }, { x: 28, y: 35, label: 'A' }, { x: 76, y: 70, label: 'A' }
];
export const STARS = [{ x: 15, y: 25 }, { x: 25, y: 35 }, { x: 70, y: 65 }, { x: 80, y: 75 }];
export const REGRESSION = [{ x: 0, y: 1 }, { x: 1, y: 3 }, { x: 2, y: 5 }, { x: 3, y: 7 }];
export const LIFECYCLE = [
  { name: '요구사항 분석', output: '무엇을 만들까요? → 요구사항명세서' },
  { name: '설계', output: '어떻게 만들까요? → 설계서' },
  { name: '구현', output: '설계를 동작하게 → 코드' },
  { name: '시험', output: '요구대로 동작할까요? → 시험결과서' },
  { name: '유지보수', output: '운영하며 고치고 개선 → 변경 기록' }
];
export const WBS_TASKS = [
  { id: 'interview', name: '사용자 인터뷰 정리', group: 'requirements' },
  { id: 'screen', name: '화면 설계 작성', group: 'design' },
  { id: 'cases', name: '시험 시나리오 작성', group: 'test' },
  { id: 'needs', name: '기능 요구사항 정리', group: 'requirements' },
  { id: 'database', name: '테이블 구조 설계', group: 'design' },
  { id: 'report', name: '시험 수행 결과 기록', group: 'test' }
];
export const BOOKS = ['자료구조 입문', '인공지능의 기초', '데이터베이스 첫걸음'];
export function queryStudents(dept, columns) {
  return STUDENTS.filter(row => dept === 'all' || row.dept === dept)
    .map(row => Object.fromEntries(columns.map(col => [col, row[col]])));
}
export function insertStudent(rows, candidate) {
  const row = { id: String(candidate.id ?? '').trim(), name: String(candidate.name ?? '').trim(), dept: '컴퓨터' };
  if (!row.id) return { ok: false, reason: 'empty', rows };
  if (rows.some(r => r.id === row.id)) return { ok: false, reason: 'duplicate', rows };
  if (!row.name) return { ok: false, reason: 'name', rows };
  return { ok: true, rows: [...rows, row] };
}
export function joinEnrolments(kind = 'inner', key = 'id') {
  if (key !== 'id') return [];
  return STUDENTS.flatMap(student => {
    const matches = ENROLMENTS.filter(e => e.id === student.id);
    return matches.length ? matches.map(e => ({ ...student, course: e.course }))
      : kind === 'left' ? [{ ...student, course: null }] : [];
  });
}
export function nearest(k) {
  const neighbours = FEATURES.map((point, index) => ({ ...point, index, distance: Math.hypot(point.x - 50, point.y - 50) }))
    .sort((a, b) => a.distance - b.distance).slice(0, k);
  const counts = { A: 0, B: 0 };
  neighbours.forEach(p => counts[p.label]++);
  return { neighbours, counts, label: counts.A > counts.B ? 'A' : counts.B > counts.A ? 'B' : null };
}
export function assignClusters(points, centres) {
  return points.map(p => centres.reduce((best, c, i) =>
    Math.hypot(p.x - c.x, p.y - c.y) < Math.hypot(p.x - centres[best].x, p.y - centres[best].y) ? i : best, 0));
}
export function updateCentres(points, assignments, previous) {
  return previous.map((centre, i) => {
    const members = points.filter((_, j) => assignments[j] === i);
    return members.length ? {
      x: members.reduce((sum, p) => sum + p.x, 0) / members.length,
      y: members.reduce((sum, p) => sum + p.y, 0) / members.length
    } : { ...centre };
  });
}
export function mse(a, b) {
  return REGRESSION.reduce((sum, p) => sum + (p.y - (a * p.x + b)) ** 2, 0) / REGRESSION.length;
}
export function initialLesson(id) {
  const extended=initialSE(id)??initialSG(id);if(extended)return extended;
  const states = {
    'db-query': { dept: 'all', columns: ['id', 'name', 'dept'], marks: {} },
    'db-key': { rows: STUDENTS.map(r => ({ ...r })), marks: {} },
    'db-join': { key: 'id', kind: 'inner', connected: false, marks: {} },
    'ai-knn': { k: 1, marks: {} },
    'ai-kmeans': { centres: [{ x: 20, y: 70 }, { x: 80, y: 20 }], assignments: null, phase: 'assign', rounds: 0, marks: {} },
    'ai-regression': { a: 0, b: 0, marks: {} },
    'se-cycle': { order: [], marks: {} },
    'se-wbs': { selected: null, placed: {}, marks: {} },
    'se-check': { step: 0, query: '', marks: {} }
  };
  return states[id] ?? null;
}
export function lessonGoals(id, s) {
  const extended=seGoals(id,s)??sgGoals(id,s);if(extended)return extended;
  const goals = {
    'db-query': [['컴퓨터학과 행만 남기기', !!s.marks.filtered], ['이름 열만 남기기', !!s.marks.projected], ['필터와 열을 모두 원래대로 돌리기', !!s.marks.restored]],
    'db-key': [['중복 학번이 거절되는 모습 관찰', !!s.marks.duplicate], ['빈 학번이 거절되는 모습 관찰', !!s.marks.empty], ['새 학번으로 회원 등록', !!s.marks.inserted]],
    'db-join': [['학번으로 수강생 연결', !!s.marks.inner], ['LEFT JOIN으로 미수강생도 보존', !!s.marks.left]],
    'ai-knn': [[ 'K=1의 판단 관찰', !!s.marks[1]], ['K=3의 판단 관찰', !!s.marks[3]], ['K=5의 판단 관찰', !!s.marks[5]]],
    'ai-kmeans': [['가까운 중심에 별 배정', !!s.marks.assigned], ['군집 평균으로 중심 이동', !!s.marks.moved], ['다시 배정해 수렴 확인', !!s.marks.stable]],
    'ai-regression': [['기울기와 절편을 바꿔 보기', !!s.marks.changed], ['평균제곱오차를 0으로 만들기', mse(s.a, s.b) === 0]],
    'se-cycle': [['분석과 설계 연결', (s.order?.length ?? 0) >= 2], ['구현과 시험 연결', (s.order?.length ?? 0) >= 4], ['유지보수까지 공장 완성', s.order?.length === 5]],
    'se-wbs': [['요구사항명세서 작업 2개', Object.values(s.placed ?? {}).filter(g => g === 'requirements').length === 2], ['설계서 작업 2개', Object.values(s.placed ?? {}).filter(g => g === 'design').length === 2], ['시험결과서 작업 2개', Object.values(s.placed ?? {}).filter(g => g === 'test').length === 2]],
    'se-check': [['고객과 대화해 요구 확인', s.step >= 1], ['명세를 실제 요구에 맞게 수정', s.step >= 2], ['시험 후 구현 수정', s.step >= 4], ['제목 검색이 동작하는지 확인', s.step >= 5]]
  };
  return goals[id] ?? [];
}
export function reduceLesson(id, previous, action, value) {
  if(initialSE(id))return reduceSE(id,previous,action,value);
  if(initialSG(id))return reduceSG(id,previous,action,value);
  const s = structuredClone(previous);
  let message = '', positive = true;
  if (id === 'db-query') {
    if (action === 'dept') s.dept = ['all', '컴퓨터', '수학', '통계'].includes(value) ? value : 'all';
    if (action === 'column' && ['id', 'name', 'dept'].includes(value)) {
      if (s.columns.includes(value)) {
        if (s.columns.length === 1) return { state: s, message: '표에 보여줄 열은 하나 이상 남겨 주세요.', positive: false };
        s.columns = s.columns.filter(c => c !== value);
      } else s.columns = ['id', 'name', 'dept'].filter(c => c === value || s.columns.includes(c));
    }
    if (s.dept === '컴퓨터') s.marks.filtered = true;
    if (s.dept === '컴퓨터' && s.columns.length === 1 && s.columns[0] === 'name') s.marks.projected = true;
    if (s.marks.projected && s.dept === 'all' && s.columns.length === 3) s.marks.restored = true;
    message = `행 조건은 WHERE, 보여줄 열은 SELECT입니다. 지금은 ${queryStudents(s.dept, s.columns).length}행 · ${s.columns.length}열이에요.`;
  }
  if (id === 'db-key' && action === 'register') {
    const result = insertStudent(s.rows, value);
    if (result.ok) { s.rows = result.rows; s.marks.inserted = true; message = '등록 성공! 새로운 학번이 한 사람을 유일하게 가리킵니다.'; }
    else {
      positive = false;
      if (result.reason === 'duplicate') { s.marks.duplicate = true; message = '등록 거절: 이미 있는 학번이에요. 기본 키는 행을 유일하게 식별해야 합니다.'; }
      if (result.reason === 'empty') { s.marks.empty = true; message = '등록 거절: 기본 키는 비워 둘 수 없어요. 이것이 개체 무결성입니다.'; }
      if (result.reason === 'name') message = '이 실습에서는 이름도 입력해 주세요. 이 조건은 실습용 회원 등록 규칙입니다.';
    }
  }
  if (id === 'db-join') {
    if (action === 'connect') { s.key = value; s.connected = true; }
    if (action === 'join-kind') s.kind = value === 'left' ? 'left' : 'inner';
    if (s.connected && s.key === 'id') {
      s.marks[s.kind] = true;
      message = s.kind === 'left' ? '왼쪽 학생 표를 모두 보존했어요. 수강 내역이 없는 학생의 과목은 NULL(대응 값 없음)입니다.' : '같은 학번을 연결했어요. INNER JOIN에서는 수강 내역이 있는 학생만 나타납니다.';
    } else { message = '수강 표에는 이름 열이 없어요. 두 표에 공통으로 있는 학번을 연결해 보세요.'; positive = false; }
  }
  if (id === 'ai-knn' && action === 'k') {
    s.k = [1, 3, 5].includes(Number(value)) ? Number(value) : 1;
    s.marks[s.k] = true;
    const vote = nearest(s.k);
    message = `가까운 ${s.k}개 이웃의 투표: A ${vote.counts.A}표, B ${vote.counts.B}표 → 새 점은 ${vote.label}로 분류됩니다. K는 이웃 수예요.`;
  }
  if (id === 'ai-kmeans') {
    if (action === 'assign' && s.phase === 'assign') {
      const assigned = assignClusters(STARS, s.centres);
      const stable = s.assignments !== null && assigned.every((v, i) => v === s.assignments[i]);
      s.assignments = assigned; s.phase = 'move'; s.marks.assigned = true;
      if (stable && s.marks.moved) { s.marks.stable = true; message = '소속이 더 이상 바뀌지 않아요. 이 예제는 수렴했습니다!'; }
      else message = '각 별을 가장 가까운 중심에 배정했어요. 이제 각 묶음의 평균으로 중심을 옮겨 보세요.';
    }
    if (action === 'move' && s.phase === 'move' && s.assignments) {
      s.oldCentres = s.centres; s.centres = updateCentres(STARS, s.assignments, s.centres);
      s.rounds++; s.phase = 'assign'; s.marks.moved = true;
      message = '중심이 군집의 평균 위치로 이동했어요. 다시 배정해서 소속이 변하는지 확인하세요.';
    }
  }
  if (id === 'ai-regression' && (action === 'a' || action === 'b')) {
    const next = Math.max(0, Math.min(4, s[action] + Number(value)));
    if (next !== s[action]) s.marks.changed = true;
    s[action] = next;
    message = mse(s.a, s.b) === 0 ? '모든 관측점을 지나는 직선을 찾았어요! 이 작은 예제의 MSE는 0입니다. 실제 데이터에는 오차가 남는 경우가 많아요.' : '직선을 바꾸면 예측값과 실제값의 차이가 변합니다. 제곱오차의 평균이 작아지는 방향을 찾아보세요.';
  }
  if (id === 'se-cycle') {
    if (action === 'stage') {
      const i = Number(value);
      if (i === s.order.length) { s.order.push(i); message = LIFECYCLE[i].output; }
      else { positive = false; message = `지금은 ${LIFECYCLE[s.order.length]?.name ?? '완료'} 단계예요. ${s.order.length === 0 ? '만들 대상을 먼저 이해해야 합니다.' : '앞 단계의 산출물을 받아 다음 작업을 진행합니다.'}`; }
    }
    if (action === 'undo') { s.order.pop(); message = '한 단계 되돌렸어요. 산출물의 연결을 다시 살펴보세요.'; }
  }
  if (id === 'se-wbs') {
    if (action === 'task' && WBS_TASKS.some(t => t.id === value) && !s.placed[value]) s.selected = value;
    if (action === 'folder' && s.selected) {
      const task = WBS_TASKS.find(t => t.id === s.selected);
      if (task.group === value) { s.placed[task.id] = value; s.selected = null; message = '작업을 산출물 아래에 묶었어요. 큰 결과물을 작은 작업으로 나누면 범위와 비용을 추정하기 쉬워집니다.'; }
      else { positive = false; message = `이 작업은 ${task.group === 'requirements' ? '사용자 요구를 명세하는' : task.group === 'design' ? '구현 방법을 설계하는' : '동작을 시험하고 결과를 남기는'} 산출물에 연결해 보세요.`; }
    }
  }
  if (id === 'se-check') {
    const expected = ['talk', 'spec', 'test', 'build', 'search'][s.step];
    if (action === expected) {
      if (action === 'search') {
        s.query = String(value ?? '').trim();
        if (s.query !== '자료구조') return { state: s, message: '시험 시나리오대로 검색창에 자료구조를 입력해 보세요.', positive: false };
      }
      s.step++;
      message = [
        '', '고객 대화: 원한 것은 저자 검색이 아니라 제목 검색이었어요. 요구를 올바르게 이해하는 확인(Validation)입니다.',
        '명세를 제목 검색으로 고쳤어요. 고객의 필요와 팀의 약속이 일치합니다.',
        '시험 실패: 명세에는 검색이 있지만 구현에는 검색창이 없어요. 명세대로 만들었는지 보는 검증(Verification)입니다.',
        '제목 검색창을 구현했어요. 마지막으로 자료구조를 검색해 시험 결과를 확인하세요.',
        '시험 통과: 자료구조 입문 1권이 나타났어요. 고객이 원하는 것을, 명세대로 구현했습니다.'
      ][s.step];
    }
  }
  return { state: s, message, positive };
}
