import {SE_CLASSES,seBoard} from './se-classes.js';
import {SE_ORDER} from './se-engine.js';
import {
  STUDENTS, ENROLMENTS, FEATURES, STARS, REGRESSION, LIFECYCLE, WBS_TASKS, BOOKS,
  queryStudents, joinEnrolments, nearest, mse, initialLesson, lessonGoals, reduceLesson
} from './lesson-engine.js';

export const LESSONS = [
  { id: 'db-query', subject: 'db', title: '데이터 탐정', subtitle: '행을 거르고, 열을 골라요', time: '3분', symbol: '▤',
    idea: '표에서 한 줄은 한 개체의 기록(행), 세로 항목은 특성(열)입니다. WHERE는 조건에 맞는 행을, SELECT는 보여줄 열을 고릅니다.',
    takeaway: 'WHERE = 행 선택, SELECT = 열 선택. 같은 원본 데이터도 보는 관점에 따라 결과가 달라집니다.', source: '데이터베이스_교안.pdf', pages: '29~38, 55~57, 80~83' },
  { id: 'db-key', subject: 'db', title: '열쇠를 지켜라', subtitle: '직접 등록하며 기본 키를 이해해요', time: '3분', symbol: '⚿',
    idea: '이름이 같아도 학번은 한 사람만 가리켜야 합니다. 기본 키(행을 식별하는 기준)는 중복되거나 비어 있을 수 없습니다.',
    takeaway: '기본 키는 유일해야 하고 NULL일 수 없습니다. 다른 속성의 입력 조건과는 구분합니다.', source: '데이터베이스_교안.pdf', pages: '43~47' },
  { id: 'db-join', subject: 'db', title: '끊어진 명단 잇기', subtitle: '두 표를 연결하고 NULL을 관찰해요', time: '3분', symbol: '⛓',
    idea: '학생 정보와 수강 내역은 따로 저장할 수 있습니다. 공통 학번으로 조인(표의 행을 연결)하면 누가 어떤 과목을 듣는지 알 수 있어요.',
    takeaway: 'INNER JOIN은 연결된 행만, LEFT JOIN은 왼쪽 표의 모든 행을 남깁니다. 한 학생이 여러 과목을 들으면 결과 행도 여러 개입니다.', source: '데이터베이스_교안.pdf', pages: '59~68, 84~85' },
  { id: 'ai-knn', subject: 'ai', title: '이웃 관측소', subtitle: 'K를 바꿔 분류의 변화를 봐요', time: '2분', symbol: '⌖',
    idea: '지도학습은 정답 레이블(분류 이름)이 있는 예로 배웁니다. K-NN은 새 점에서 가장 가까운 K개 이웃의 레이블로 투표합니다.',
    takeaway: 'K는 참고하는 이웃 수입니다. 같은 입력도 K에 따라 예측이 달라질 수 있습니다. 이 예제는 거리 기준의 단순 다수결입니다.', source: 'Chapter 3_Supervised Learning.pdf', pages: '2, 23' },
  { id: 'ai-kmeans', subject: 'ai', title: '별자리 공방', subtitle: '정답 없이 별들을 군집으로 묶어요', time: '3분', symbol: '✧',
    idea: '비지도학습은 정답 레이블 없이 구조를 찾습니다. K-means는 가까운 중심에 점을 배정하고, 각 묶음의 평균으로 중심을 옮기는 과정을 반복해요.',
    takeaway: '배정 → 평균으로 중심 이동 → 재배정을 반복합니다. 이 실습의 K=2는 군집 수이며 K-NN의 이웃 수와 다릅니다.', source: 'Chapter 4_UnSupervised Learning.pdf', pages: '2~5, 8~14' },
  { id: 'ai-regression', subject: 'ai', title: '오차를 줄여라', subtitle: '직선을 움직이며 회귀를 이해해요', time: '3분', symbol: '↗',
    idea: '회귀는 연속적인 숫자를 예측합니다. ŷ=ax+b에서 a는 기울기, b는 절편입니다. MSE(평균제곱오차)는 실제값과 예측값의 차이를 제곱해 평균낸 값이에요.',
    takeaway: '직선을 바꾸면 예측과 오차가 바뀝니다. 여기서는 직접 값을 조절하며 학습의 목표를 체험합니다. 경사하강법의 자동 갱신을 구현한 실습은 아닙니다.', source: 'Chapter 6_Linear Regression.pdf', pages: '3, 5~9' },
  { id: 'se-cycle', subject: 'se', title: '개발 공장 가동', subtitle: '산출물을 연결해 제품을 완성해요', time: '3분', symbol: '⚒',
    idea: '소프트웨어 개발은 코딩보다 넓습니다. 무엇을 만들지 분석하고, 설계·구현·시험을 거쳐 운영하며 유지보수합니다. 각 단계는 다음 단계가 쓸 산출물을 남겨요.',
    takeaway: '요구사항 분석 → 설계 → 구현 → 시험 → 유지보수. 이것은 이해를 위한 순차적 예시이며 모든 개발이 항상 한 번씩만 진행되는 것은 아닙니다.', source: '04 프로젝트 관리.pdf', pages: '27~28' },
  { id: 'se-wbs', subject: 'se', title: '작업 나무 키우기', subtitle: '큰 산출물을 작은 작업으로 나눠요', time: '3분', symbol: '♧',
    idea: 'WBS(작업 분류 체계)는 산출물 중심으로 일을 계층적으로 나눕니다. 작은 작업을 어느 결과물 아래에 둘지 정하면 범위를 공유하고 일정·원가를 추정하기 쉬워져요.',
    takeaway: '산출물 → 세부 작업으로 분해합니다. 이 나무는 개념을 위한 작은 예시이며 실제 WBS는 전체 범위를 빠짐없이 분해해야 합니다.', source: '05 프로젝트계획.pdf', pages: '12~14' },
  { id: 'se-check', subject: 'se', title: '고객의 진짜 소원', subtitle: '확인과 검증을 다른 행동으로 체험해요', time: '3분', symbol: '☷',
    idea: '확인(Validation)은 고객이 원하는 것을 제대로 이해했는지, 검증(Verification)은 이해한 요구를 제대로 반영했는지 점검합니다. 둘은 개발 전 과정에서 필요해요.',
    takeaway: '고객의 필요 ↔ 명세를 살피는 확인, 명세 ↔ 구현을 살피는 검증. 요구를 오해한 채 구현만 정확해도 원하는 제품이 되지 않습니다.', source: '05 프로젝트계획.pdf', pages: '18' },
  ...SE_CLASSES
].sort((a,b)=>{const rank={db:0,ai:1,se:2};return rank[a.subject]-rank[b.subject]||(a.subject==='se'?SE_ORDER.indexOf(a.id)-SE_ORDER.indexOf(b.id):0);});
const COLUMNS = { id: '학번', name: '이름', dept: '학과', course: '과목' };
const GROUPS = { requirements: '요구사항명세서', design: '설계서', test: '시험결과서' };

export function createLearning({ host, read, save, render, onOpen, onHome, onQuiz, subjects, esc, notify, sound }) {
  let activeId = null, filter = 'all', message = '', positive = true;
  const lesson = () => LESSONS.find(l => l.id === activeId);
  function progress(id) {
    const data = read();
    data.lessons ??= {};
    data.lessons[id] ??= { state: initialLesson(id), completed: false, lastAt: 0 };
    return data.lessons[id];
  }
  function table(rows, columns, caption) {
    return `<div class="lab-table-wrap"><table class="lab-table"><caption>${esc(caption)}</caption><thead><tr>${columns.map(c => `<th scope="col">${COLUMNS[c]}</th>`).join('')}</tr></thead><tbody>${rows.length ? rows.map(r => `<tr>${columns.map(c => `<td>${r[c] === null ? '<span class="null-value">NULL</span>' : esc(r[c])}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${columns.length}">대응하는 행이 없어요</td></tr>`}</tbody></table></div>`;
  }
  function plot(points, { centres = [], assignments = null, neighbours = [], query = false, oldCentres = [] } = {}) {
    const x = n => 20 + n * 2.8, y = n => 300 - n * 2.8;
    const colours = ['#c4f579', '#baa5ff'];
    const line = (a, b, colour, dash = '') => `<line x1="${x(a.x)}" y1="${y(a.y)}" x2="${x(b.x)}" y2="${y(b.y)}" stroke="${colour}" stroke-width="2" ${dash ? 'stroke-dasharray="5 5"' : ''}/>`;
    return `<svg class="lab-plot" viewBox="0 0 320 320" role="img" aria-label="${query ? '새 점과 정답 레이블 A, B가 있는 이웃 데이터. 선으로 선택한 이웃을 연결합니다.' : '네 개의 데이터 점과 두 군집 중심. 십자 표시는 중심입니다.'}"><path d="M20 20V300H300" stroke="#577084" fill="none"/>${[20,40,60,80,100].map(n => `<path d="M${x(n)} 20V300M20 ${y(n)}H300" stroke="#283b49" fill="none"/>`).join('')}${query ? neighbours.map(p => line({ x: 50, y: 50 }, p, '#a2b4c4', true)).join('') : assignments ? points.map((p, i) => line(p, centres[assignments[i]], colours[assignments[i]], true)).join('') : ''}${points.map((p, i) => { const colour = p.label ? colours[p.label === 'A' ? 0 : 1] : assignments ? colours[assignments[i]] : '#c0cdd7'; return `<circle cx="${x(p.x)}" cy="${y(p.y)}" r="9" fill="${colour}"/>${p.label ? `<text x="${x(p.x)}" y="${y(p.y)-15}" text-anchor="middle" fill="${colour}" font-size="13">${p.label}</text>` : ''}`; }).join('')}${oldCentres.map((p, i) => line(p, centres[i], colours[i])).join('')}${centres.map((p, i) => `<path d="M${x(p.x)-10} ${y(p.y)}h20M${x(p.x)} ${y(p.y)-10}v20" stroke="${colours[i]}" stroke-width="5"/><text x="${x(p.x)}" y="${y(p.y)-17}" fill="${colours[i]}" text-anchor="middle" font-size="12">C${i+1}</text>`).join('')}${query ? `<rect x="${x(50)-8}" y="${y(50)-8}" width="16" height="16" fill="#fff"/><text x="${x(50)}" y="${y(50)-17}" fill="#fff" text-anchor="middle" font-size="15">?</text>` : ''}<text x="288" y="316" fill="#9db1c0" font-size="10">x</text><text x="5" y="24" fill="#9db1c0" font-size="10">y</text></svg>`;
  }
  function button(action, value, label, extra = '') {
    return `<button type="button" class="secondary lab-control" data-lab-action="${action}" data-lab-value="${esc(value)}" ${extra}>${label}</button>`;
  }
  function board(l, s) {
    const extended=seBoard(l,s,{button,esc});if(extended!==null)return extended;
    if (l.id === 'db-query') {
      const rows = queryStudents(s.dept, s.columns);
      return `<label class="field">행 필터 · WHERE<select data-lab-change="dept" aria-label="학과 필터"><option value="all">모든 학과</option>${['컴퓨터','수학','통계'].map(d => `<option ${s.dept===d?'selected':''}>${d}</option>`).join('')}</select></label><p class="lab-label">보여줄 열 · SELECT (누르면 켜고 꺼져요)</p><div class="lab-chips">${['id','name','dept'].map(c => button('column',c,COLUMNS[c],`aria-pressed="${s.columns.includes(c)}"`)).join('')}</div><div class="lab-code" aria-label="현재 SQL">SELECT ${s.columns.map(c=>COLUMNS[c]).join(', ')}<br>FROM 학생${s.dept==='all'?'':`<br>WHERE 학과 = '${esc(s.dept)}'`};</div>${table(rows,s.columns,`조회 결과 · ${rows.length}행 × ${s.columns.length}열`)}<p class="muted">원본 학생 4명은 그대로입니다. 조회 결과만 달라져요.</p>`;
    }
    if (l.id === 'db-key') return `${table(s.rows,['id','name','dept'],'회원 명단 · 학번이 기본 키')}<div class="lab-examples"><span class="muted">실험할 값 채우기</span><div class="lab-chips"><button class="secondary" data-fill-key="duplicate">중복 학번</button><button class="secondary" data-fill-key="empty">빈 학번</button><button class="secondary" data-fill-key="new">새 학번</button></div></div><form id="lab-register"><div class="lab-form-grid"><label>학번<input id="member-id" inputmode="numeric" autocomplete="off" placeholder="예: 105"></label><label>이름<input id="member-name" autocomplete="off" placeholder="예: 나래"></label></div><button class="primary full" type="submit">회원 등록 시도</button></form>`;
    if (l.id === 'db-join') return `<div class="lab-two-tables">${table(STUDENTS,['id','name'],'왼쪽 · 학생')}${table(ENROLMENTS,['id','course'],'오른쪽 · 수강')}</div><label class="field">두 표를 연결할 공통 열<select id="join-key"><option value="id" ${s.key==='id'?'selected':''}>학번 ↔ 학번</option><option value="name" ${s.key==='name'?'selected':''}>이름 ↔ 이름 (수강 표에는 없음)</option></select></label>${button('connect','','두 명단 연결하기')}<div class="lab-chips" style="margin-top:14px">${[['inner','INNER JOIN'],['left','LEFT JOIN']].map(([v,name])=>button('join-kind',v,name,`aria-pressed="${s.kind===v}"`)).join('')}</div>${s.connected?table(joinEnrolments(s.kind,s.key),['id','name','course'],`연결 결과 · ${s.kind==='left'?'왼쪽 모든 학생 보존':'일치하는 행만'}`):'<p class="lab-empty">공통 학번으로 명단을 연결해 보세요.</p>'}`;
    if (l.id === 'ai-knn') { const vote=nearest(s.k); return `<div class="lab-chips">${[1,3,5].map(k=>button('k',k,`K = ${k}`,`aria-pressed="${s.k===k}"`)).join('')}</div>${plot(FEATURES,{query:true,neighbours:vote.neighbours})}<div class="lab-readout"><span>A ${vote.counts.A}표 · B ${vote.counts.B}표</span><strong>예측: ${vote.label}</strong></div><p class="muted">흰 네모 ?가 새 입력입니다. 선으로 연결된 가까운 이웃만 투표해요. 좌표 공간의 직선 거리로 계산합니다.</p><p class="lab-caption">K=1 → K=3 → K=5를 눌러 비교해 보세요.</p>`; }
    if (l.id === 'ai-kmeans') return `${plot(STARS,{centres:s.centres,assignments:s.assignments,oldCentres:s.oldCentres})}<div class="lab-readout"><span>K = 2 · 중심 이동 ${s.rounds}회</span><strong>${s.marks.stable?'수렴 확인':s.phase==='assign'?'① 배정할 차례':'② 이동할 차례'}</strong></div><div class="lab-chips">${button('assign','','① 가까운 중심에 배정',s.phase!=='assign'?'disabled':'')}${button('move','','② 평균으로 중심 이동',s.phase!=='move'?'disabled':'')}</div><p class="muted">점은 데이터, 십자 C1·C2는 중심입니다. 정답 레이블은 없어요. 가까운 점을 묶고 묶음의 평균을 계산합니다.</p><div class="lab-code">C1 = (${s.centres[0].x}, ${s.centres[0].y})<br>C2 = (${s.centres[1].x}, ${s.centres[1].y})</div>`;
    if (l.id === 'ai-regression') {
      const x=n=>32+n*80,y=n=>250-n*26,pred=p=>s.a*p.x+s.b;
      return `<svg class="lab-regression" viewBox="0 0 320 280" role="img" aria-label="실제 관측점 4개와 조절 중인 예측 직선. 세로 점선은 오차입니다."><defs><clipPath id="line-bounds"><rect x="30" y="12" width="270" height="240"/></clipPath></defs><path d="M32 12V250H300" stroke="#577084" fill="none"/>${[0,1,2,3].map(n=>`<text x="${x(n)}" y="269" fill="#a5b8c5" text-anchor="middle" font-size="12">${n}</text>`).join('')}<g clip-path="url(#line-bounds)"><path d="M${x(0)} ${y(s.b)}L${x(3.4)} ${y(s.a*3.4+s.b)}" stroke="#c4f579" stroke-width="3"/>${REGRESSION.map(p=>`<line x1="${x(p.x)}" y1="${y(p.y)}" x2="${x(p.x)}" y2="${y(pred(p))}" stroke="#ffb4a2" stroke-dasharray="5 4" stroke-width="2"/><circle cx="${x(p.x)}" cy="${y(p.y)}" r="7" fill="#baa5ff"/>`).join('')}</g></svg><div class="lab-readout"><span>ŷ = ${s.a}x + ${s.b}</span><strong>MSE ${mse(s.a,s.b).toFixed(2)}</strong></div><div class="lab-steppers">${[['a','기울기'],['b','절편']].map(([v,label])=>`<div><span>${label} ${v}</span><div>${button(v,-1,'−',`aria-label="${label} 줄이기" ${s[v]===0?'disabled':''}`)}<output>${s[v]}</output>${button(v,1,'+',`aria-label="${label} 늘리기" ${s[v]===4?'disabled':''}`)}</div></div>`).join('')}</div><p class="muted">보라색 점은 실제값, 초록선은 예측입니다. 분홍 점선(실제−예측)의 길이를 줄여 보세요.</p><div class="lab-code">제곱오차: ${REGRESSION.map(p=>(p.y-pred(p))**2).join(' + ')}<br>MSE = 제곱오차 합 ÷ 4 = ${mse(s.a,s.b).toFixed(2)}</div>`;
    }
    if (l.id === 'se-cycle') return `<div class="factory-track">${LIFECYCLE.map((stage,i)=>`<div class="factory-slot ${s.order.includes(i)?'filled':''}"><span>${String(i+1).padStart(2,'0')}</span><div><strong>${s.order.includes(i)?stage.name:'다음 단계 연결'}</strong><small>${s.order.includes(i)?stage.output:'아래 부품을 눌러 연결하세요'}</small></div>${i<4?'<span class="factory-arrow">↓</span>':''}</div>`).join('')}</div><div class="lab-chips">${[2,4,0,3,1].map(i=>button('stage',i,LIFECYCLE[i].name,s.order.includes(i)?'disabled':'')).join('')}</div>${button('undo','','한 단계 되돌리기',s.order.length?'':'disabled')}<p class="muted">순차적 개발을 단순화한 예시입니다. 실제로는 피드백에 따라 앞 단계를 다시 살피기도 합니다.</p>`;
    if (l.id === 'se-wbs') return `<p class="lab-label">① 작업 선택 → ② 산출물 폴더 누르기</p><div class="lab-chips task-pool">${WBS_TASKS.map(t=>button('task',t.id,`${s.placed[t.id]?'✓ ':''}${t.name}`,`aria-pressed="${s.selected===t.id}" ${s.placed[t.id]?'disabled':''}`)).join('')}</div><div class="wbs-root">도서 검색 서비스 프로젝트</div><div class="wbs-folders">${Object.entries(GROUPS).map(([g,name])=>`<div class="wbs-folder"><button class="secondary full" data-lab-action="folder" data-lab-value="${g}" ${s.selected?'':'disabled'}>▣ ${name}<small>여기에 선택한 작업 연결</small></button><ul>${WBS_TASKS.filter(t=>s.placed[t.id]===g).map(t=>`<li>${t.name}</li>`).join('')||'<li class="muted">아직 연결된 작업이 없어요</li>'}</ul></div>`).join('')}</div><p class="muted">이름이 비슷한 작업보다, 어떤 결과물을 만드는 작업인지 생각해 보세요.</p>`;
    if (l.id === 'se-check') return `<div class="check-chain"><div><span>고객의 필요</span><strong>${s.step>=1?'책 제목으로 검색하고 싶어요.':'검색 기능이 있으면 좋겠어요.'}</strong></div><span class="check-bridge">↕ 확인 · Validation</span><div class="${s.step===1?'mismatch':''}"><span>팀의 요구사항명세서</span><strong>${s.step>=2?'제목에 입력한 단어를 포함하는 책을 검색':'저자 이름으로 책을 검색'}</strong></div><span class="check-bridge">↕ 검증 · Verification</span><div class="${s.step===3?'mismatch':''}"><span>현재 구현</span><strong>${s.step>=4?'제목 검색창 + 검색 결과':'책 목록만 표시 (검색창 없음)'}</strong></div></div><div class="lab-chips check-actions">${[['talk','① 고객과 대화'],['spec','② 명세 수정'],['test','③ 시험 실행'],['build','④ 구현 수정']].map(([a,label],i)=>button(a,'',label,s.step===i?'':'disabled')).join('')}</div>${s.step>=4?`<form id="lab-search"><label class="lab-label" for="book-query">시험: 자료구조를 검색하면 1권이 나와야 해요.</label><input id="book-query" value="${esc(s.query)}" placeholder="자료구조" autocomplete="off"><button class="primary full" type="submit" ${s.step>=5?'disabled':''}>제목 검색 실행</button></form>`:''}<div class="book-demo"><strong>도서 서비스 미리보기</strong><ul>${BOOKS.filter(b=>s.step<5||b.includes(s.query)).map(b=>`<li>▤ ${b}</li>`).join('')}</ul></div>`;
    return '';
  }
  function draw(focus = true) {
    const l=lesson(), p=progress(l.id), s=p.state, goals=lessonGoals(l.id,s), done=goals.every(g=>g[1]);
    const firstCompletion=done&&!p.completed;
    if(firstCompletion){p.completed=true;p.completedAt=Date.now();read().xp+=30;save();sound(true);message='스테이지 완료! 개념을 직접 확인했어요. 첫 완료 보상 +30 XP';positive=true;}
    const seCourse=LESSONS.filter(item=>item.subject==='se');
    if(l.subject==='se'&&seCourse.every(item=>read().lessons?.[item.id]?.completed)&&!read().courseBadges?.se){
      read().courseBadges??={};read().courseBadges.se=true;read().xp+=100;save();message+=' 개발 길드 마스터 달성! 완주 보너스 +100 XP';
    }
    onOpen(l.subject);
    render(`<div class="page-heading lesson-heading"><button class="back" data-learn-subject="${l.subject}">← 개념 지도</button><div class="eyebrow">${l.subject==='se'?'CLASS '+String(SE_ORDER.indexOf(l.id)+1).padStart(2,'0')+' / 10':'CONCEPT QUEST'} · ${subjects[l.subject].name}</div><h1>${l.title}</h1><p>${l.subtitle} · 약 ${l.time}</p></div><section class="lesson-idea"><span class="idea-symbol" aria-hidden="true">${l.symbol}</span><div><strong>먼저, 이것만 알아두세요</strong><p>${l.idea}</p></div></section><div class="lesson-layout"><section class="panel lab-board" aria-label="${l.title} 실습"><h2>직접 움직여 보세요</h2><p class="lab-objective">${done?'발견 완료 · 자유롭게 더 실험해 보세요':'다음 발견 · '+esc(goals.find(g=>!g[1])?.[0]??'')}</p>${board(l,s)}</section><aside class="lesson-aside"><div class="panel mission-panel"><h2>이번 스테이지의 발견</h2><ul class="mission-list">${goals.map(([text,complete])=>`<li class="${complete?'done':''}"><span aria-hidden="true">${complete?'✓':'○'}</span>${text}</li>`).join('')}</ul><p class="muted">시간 제한 없음 · 실수해도 경험치가 줄지 않아요</p></div><div class="lab-feedback ${positive?'':'hint'}" role="status" aria-live="polite">${esc(message||(done?'이미 완료한 개념이에요. 처음부터 다시 실험하거나 다음 개념으로 이동해 보세요.':'위의 개념을 읽고, 실험 도구를 눌러 보세요. 각 조작이 결과를 어떻게 바꾸는지 관찰해요.'))}</div></aside></div>${done?`<section class="lesson-complete"><div class="eyebrow">CONCEPT UNLOCKED</div><h2>원리를 하나 발견했어요.</h2><p>${l.takeaway}</p><div class="actions"><button class="primary" data-next-lesson="${l.id}">다음 개념으로 →</button><button class="secondary" data-learn-quiz="${l.subject}">퀴즈로 기억 꺼내기</button></div></section>`:''}<details class="notice"><summary>핵심 정리와 강의자료</summary><p>${l.takeaway}</p><p>출처 · ${esc(l.source)} · PDF ${l.pages}쪽. 실습용 데이터와 상황은 이해를 돕기 위해 직접 만든 예시입니다.</p></details><button class="back" data-restart-lesson="${l.id}">↻ 이 실험 처음부터 (첫 완료 보상은 한 번만)</button>`,focus);
  }
  function catalog(subject='all') {
    activeId=null;filter=subjects[subject]?subject:'all';onOpen(filter);
    const all=read().lessons??{}, completed=LESSONS.filter(l=>all[l.id]?.completed).length;
    const items=LESSONS.filter(l=>filter==='all'||l.subject===filter);
    const seDone=LESSONS.filter(l=>l.subject==='se'&&all[l.id]?.completed).length;
    const nextSE=LESSONS.find(l=>l.subject==='se'&&!all[l.id]?.completed);
    const campaign=filter==='se'?`<section class="guild-campaign"><span class="eyebrow">SOFTWARE GUILD · 10 CLASSES</span><h2>${seDone===10?'개발 길드 마스터!':'작은 도서앱을 출시하는 10번의 모험'}</h2><p>요구를 이해하고, 팀을 움직이고, 출시까지. 매 클래스의 발견이 다음 선택의 힌트가 됩니다.</p><div class="class-route">${LESSONS.filter(l=>l.subject==='se').map((l,i)=>`<button class="${all[l.id]?.completed?'done':''}" data-lab="${l.id}" aria-label="${i+1}클래스 ${l.title}">${all[l.id]?.completed?'✓':String(i+1).padStart(2,'0')}</button>`).join('')}</div><p class="muted">완주 ${seDone}/10 · 첫 완주 보너스 100 XP</p>${nextSE?`<button class="primary full" data-lab="${nextSE.id}">추천 클래스 · ${nextSE.title} →</button>`:'<strong>🏅 개발 길드 마스터 배지 획득</strong>'}</section>`:'';
    render(`<div class="page-heading"><button class="back" data-action="home">← 세계 선택</button><div class="eyebrow">LEARN BY DOING</div><h1>개념 모험</h1><p>읽고, 움직이고, 발견하세요.<br>처음 배울 때는 퀴즈보다 이곳에서 시작해요.</p></div><div class="learning-summary"><span>개념 해금 <strong>${completed} / ${LESSONS.length}</strong></span><span>스테이지마다 첫 완료 +30 XP</span></div><div class="lab-chips learning-tabs">${[['all','전체'],...Object.entries(subjects).map(([id,s])=>[id,s.name])].map(([id,name])=>`<button class="secondary" data-learn-subject="${id}" aria-pressed="${filter===id}">${name}</button>`).join('')}</div>${campaign}<div class="lesson-cards">${items.map(l=>{const p=all[l.id], goals=lessonGoals(l.id,p?.state??initialLesson(l.id)),n=goals.filter(g=>g[1]).length;return `<button class="lesson-card" style="--accent:${subjects[l.subject].color}" data-lab="${l.id}"><div class="world-top"><span>${subjects[l.subject].name}${l.subject==='se'?' · CLASS '+String(SE_ORDER.indexOf(l.id)+1).padStart(2,'0'):''}</span><span>${p?.completed?'✓ 완료':n?'탐험 중':l.time}</span></div><span class="lesson-symbol" aria-hidden="true">${l.symbol}</span><h2>${l.title}</h2><p>${l.subtitle}</p><div class="mini-bar"><i style="width:${n/goals.length*100}%"></i></div><div class="card-foot"><span>${p?.completed?'다시 실험하기':n?'이어서 발견하기':'개념부터 시작하기'}</span><span class="arrow">→</span></div></button>`;}).join('')}</div><p class="notice">각 실습은 핵심 개념을 위한 작은 예시입니다. 개념을 익힌 뒤 과목별 퀴즈에서 기억을 꺼내 보세요. 실습 진행과 기존 퀴즈 기록은 따로 저장됩니다.</p>`);
  }
  function open(id) {
    const l=LESSONS.find(l=>l.id===id);if(!l)return;
    activeId=id;message='';positive=true;progress(id).lastAt=Date.now();read().activeLesson=id;save();draw();
  }
  function apply(action,value) {
    if(!activeId)return;
    const l=lesson(),p=progress(l.id),lastScroll=window.scrollY,wasDone=lessonGoals(l.id,p.state).every(g=>g[1]);
    const result=reduceLesson(l.id,p.state,action,value);
    p.state=result.state;p.lastAt=Date.now();message=result.message;positive=result.positive;save();draw(false);
    window.scrollTo({top:lastScroll,behavior:'auto'});
    if(!wasDone&&lessonGoals(l.id,p.state).every(g=>g[1]))host.querySelector('.lesson-complete')?.scrollIntoView({block:'nearest',behavior:'auto'});
  }
  host.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b||b.disabled)return;
    if(b.dataset.learnSubject)catalog(b.dataset.learnSubject);
    if(b.dataset.lab)open(b.dataset.lab);
    if(b.dataset.labAction){const value=b.dataset.labAction==='connect'?host.querySelector('#join-key').value:b.dataset.labValue;apply(b.dataset.labAction,value);}
    if(b.dataset.learnQuiz)onQuiz(b.dataset.learnQuiz);
    if(b.dataset.nextLesson){const i=LESSONS.findIndex(l=>l.id===b.dataset.nextLesson);if(i<LESSONS.length-1)open(LESSONS[i+1].id);else catalog(lesson().subject);}
    if(b.dataset.restartLesson){const p=progress(b.dataset.restartLesson);p.state=initialLesson(b.dataset.restartLesson);save();message='실험을 처음 상태로 돌렸어요. 다시 움직여 보세요.';positive=true;draw();}
    if(b.dataset.fillKey){const id=host.querySelector('#member-id'),name=host.querySelector('#member-name');id.value=b.dataset.fillKey==='duplicate'?'101':b.dataset.fillKey==='empty'?'':String(Math.max(...progress(activeId).state.rows.map(r=>Number(r.id)).filter(Number.isFinite))+1);name.value='나래';}
  });
  host.addEventListener('change',e=>{if(e.target.dataset.labChange)apply(e.target.dataset.labChange,e.target.value);});
  host.addEventListener('submit',e=>{
    if(e.target.id==='lab-register'){e.preventDefault();apply('register',{id:host.querySelector('#member-id').value,name:host.querySelector('#member-name').value});}
    if(e.target.id==='lab-search'){e.preventDefault();apply('search',host.querySelector('#book-query').value);}
  });
  return { catalog,open };
}
