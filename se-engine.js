// Deterministic classroom simulations. Costs, durations and scenarios are examples.
export const SE_ORDER = ['se-cycle','se-waterfall','se-prototype','se-risk','se-scrum','se-refactor','se-wbs','se-planning','se-change','se-check'];
export const SPRINT_TASKS = [
  {id:'search',name:'제목 검색',effort:3,priority:'핵심'},
  {id:'reserve',name:'도서 예약',effort:2,priority:'핵심'},
  {id:'theme',name:'화면 꾸미기',effort:2,priority:'나중'},
  {id:'stats',name:'통계 대시보드',effort:3,priority:'나중'}
];
export const PLAN_TASKS = [
  {id:'A',name:'요구 정리',duration:2,deps:[]},
  {id:'B',name:'검색 구현',duration:3,deps:['A']},
  {id:'C',name:'화면 제작',duration:2,deps:['A']},
  {id:'D',name:'통합 시험',duration:1,deps:['B','C']}
];
export function initialSE(id){
  const states={
    'se-waterfall':{stage:0,pending:false,rework:0,effort:0,marks:{}},
    'se-prototype':{step:0,features:[],marks:{}},
    'se-risk':{planned:false,scanned:false,reduced:[],phase:'plan',marks:{}},
    'se-scrum':{selected:[],phase:'plan',remaining:5,day:0,history:[5],newRequest:false,reviewed:false,retro:false,marks:{}},
    'se-refactor':{extracted:false,discount:false,results:null,marks:{}},
    'se-planning':{day:0,crew:1,running:[],finished:[],history:[],marks:{}},
    'se-change':{patched:false,requested:false,impact:false,approved:false,links:[],released:false,marks:{}}
  };
  return states[id]??null;
}
export function riskScore(s){return (s.reduced.includes('api')?0.1:0.6)*10+(s.reduced.includes('ui')?0.1:0.2)*2;}
export function sprintEffort(s){return SPRINT_TASKS.filter(t=>s.selected.includes(t.id)).reduce((n,t)=>n+t.effort,0);}
export function refactorTests(s){return [1,2,5].map(q=>({input:q,expected:q*1000,actual:q*(s.discount?900:1000)}));}
export function seGoals(id,s){
  switch(id){
    case 'se-waterfall':return [['초기 요구 검토 비용 관찰',!!s.marks.early],['완성 후 변경의 재작업 관찰',!!s.marks.late],['관련 산출물 수정 완료',!!s.marks.reworked]];
    case 'se-prototype':return [['고객의 모호한 요구 듣기',s.step>=1],['검색 시제품으로 첫 피드백 받기',s.step>=2],['예약 요청을 반영해 두 번째 평가',s.step>=3]];
    case 'se-risk':return [['목표를 정하고 위험 찾기',s.planned&&s.scanned],['핵심 위험을 실험으로 낮추기',s.reduced.includes('api')],['개발 결과를 고객과 평가',!!s.marks.evaluated]];
    case 'se-scrum':return [['용량 안에서 핵심 기능 계획',!!s.marks.planned],['새 요청을 다음 백로그에 기록',s.newRequest],['남은 작업량을 0으로',s.phase!=='plan'&&s.remaining===0],['제품 검토와 팀 회고',s.reviewed&&s.retro]];
    case 'se-refactor':return [['기존 동작을 시험으로 기록',!!s.marks.before],['중복을 공통 함수로 추출',s.extracted],['기능 변경을 시험 실패로 구별',!!s.marks.failed],['기존 결과를 복구하고 시험 통과',!!s.marks.after]];
    case 'se-planning':return [['선행 작업 뒤에 후행 작업 시작',!!s.marks.dependency],['독립 작업을 두 명으로 병렬 진행',!!s.marks.parallel],['주어진 조건에서 6일 내 완료',s.finished.length===4&&s.day<=6]];
    case 'se-change':return [['코드·문서 불일치 위험 비교',!!s.marks.drift||s.impact],['변경 요청과 영향 검토',s.requested&&s.impact],['승인 후 명세·설계·코드·시험 연결',s.approved&&s.links.length===4],['일관된 버전으로 출시',s.released]];
    default:return null;
  }
}
export function reduceSE(id,previous,action,value){
  const s=structuredClone(previous);let message='',positive=true;
  const hint=text=>{message=text;positive=false;};
  if(id==='se-waterfall'){
    if(action==='early-review'){s.marks.early=true;message='같은 요구를 처음 확인했다면 예시 비용은 1칸입니다. 아직 관련 설계와 코드가 없어서 고칠 대상이 적어요.';}
    if(action==='water-build'&&s.stage<4&&!s.pending){s.stage++;s.effort++;message=['','요구사항을 정리했습니다.','요구에 맞는 설계를 만들었습니다.','설계대로 구현했습니다.','제품을 시험했습니다. 이제 뒤늦은 변경이 어떤 영향을 주는지 살펴보세요.'][s.stage];}
    if(action==='late-change'){
      if(s.stage===4){s.pending=true;s.rework=4;s.marks.late=true;message='완성 후 검색 방식이 바뀌었어요. 명세·설계·코드·시험, 네 곳을 다시 살펴야 합니다. 예시 재작업 4칸!';}
      else hint('먼저 네 개발 단계를 완료해 늦게 발견한 변경을 비교해 보세요.');
    }
    if(action==='water-rework'&&s.pending){s.effort+=s.rework;s.pending=false;s.marks.reworked=true;message='연관된 산출물을 고치고 다시 시험했습니다. 이 비용 숫자는 효과를 보여 주는 가정이며 실제 프로젝트의 고정 비율이 아닙니다.';}
  }
  if(id==='se-prototype'){
    if(action==='interview'){s.step=Math.max(1,s.step);message='고객: 예쁜 화면보다 책 제목을 빨리 찾는 것이 먼저예요. 검색 기능만 작게 만들어 보여 주세요.';}
    if(action==='feature'&&['search','reserve','polish'].includes(value)){s.features=s.features.includes(value)?s.features.filter(f=>f!==value):[...s.features,value];message='시제품 미리보기가 바뀌었어요. 외형 완성보다 확인할 핵심 요구에 집중해 보세요.';}
    if(action==='prototype-review'){
      if(!s.step)hint('먼저 고객과 대화해 무엇을 확인할 시제품인지 알아보세요.');
      else if(!s.features.includes('search'))hint('고객: 아직 책을 검색할 수 없어요. 제목 검색을 추가해 주세요.');
      else if(s.step===1){s.step=2;message='첫 평가: 검색은 좋아요! 책을 찾은 자리에서 예약도 하고 싶어요. 이 피드백으로 다음 시제품을 고쳐 보세요.';}
      else if(!s.features.includes('reserve'))hint('두 번째 요구는 도서 예약이에요. 예약 버튼을 붙여 다시 보여 주세요.');
      else{s.step=3;message='두 번째 평가 통과! 요구를 조금씩 구체화했습니다. 이 화면은 학습용 시제품이며 실제 예약을 전송하지 않습니다.';}
    }
  }
  if(id==='se-risk'){
    if(action==='risk-plan'){s.planned=true;s.phase='risk';message='목표는 안정적인 도서 검색입니다. 제약과 위험을 확인하고 진행 여부를 결정하세요.';}
    if(action==='risk-scan'){if(s.planned){s.scanned=true;message='API 장애: 가능성 0.6 × 영향 10 = 6. 화면 혼란: 0.2 × 2 = 0.4. 이 숫자는 비교용 예시입니다.';}else hint('먼저 이번 주기의 목표를 정해 주세요.');}
    if(action==='risk-test'){
      if(!s.scanned)hint('위험을 먼저 발견하고 어떤 가설을 시험할지 정해 주세요.');
      else if(['api','ui'].includes(value)){if(!s.reduced.includes(value))s.reduced.push(value);message=value==='api'?'API 실험과 대안 검토로 장애 가능성 가정을 0.1로 낮췄어요. 이 실습에서 가장 큰 위험을 먼저 줄였습니다.':'화면 사용 실험으로 혼란 가능성 가정을 0.1로 낮췄어요. API 위험도 함께 확인하세요.';}
    }
    if(action==='risk-develop'){if(s.planned&&s.scanned&&s.reduced.includes('api')){s.phase='develop';message='위험 검토 후 개발을 진행(Go)합니다. 위험 분석 결과를 바탕으로 다음 투자를 결정합니다.';}else hint('핵심 API 위험이 아직 큽니다. 지금은 보류(No-Go)하고 실험으로 불확실성을 낮춰 보세요.');}
    if(action==='risk-evaluate'&&s.phase==='develop'){s.marks.evaluated=true;s.phase='evaluate';message='고객 평가 완료! 피드백은 다음 계획의 입력이 됩니다. 계획 → 위험 분석 → 개발 → 고객 평가의 한 바퀴를 돌았습니다.';}
  }
  if(id==='se-scrum'){
    if(action==='sprint-pick'&&s.phase==='plan'&&SPRINT_TASKS.some(t=>t.id===value)){
      if(s.selected.includes(value))s.selected=s.selected.filter(id=>id!==value);
      else{const task=SPRINT_TASKS.find(t=>t.id===value);if(sprintEffort(s)+task.effort>5)hint('이번 용량은 5칸이에요. 새 작업을 넣으려면 기존 작업을 빼거나 다음 반복으로 미뤄야 합니다.');else s.selected.push(value);}
    }
    if(action==='sprint-start'&&s.phase==='plan'){
      if(s.selected.includes('search')&&s.selected.includes('reserve')&&sprintEffort(s)<=5){s.phase='work';s.remaining=sprintEffort(s);s.history=[s.remaining];s.marks.planned=true;message='이번 목표는 검색과 예약입니다. 1일 작업 버튼으로 남은 작업량을 줄여 보세요.';}
      else hint('고객의 이번 목표는 제목 검색과 예약이에요. 두 핵심 기능을 용량 5칸 안에 계획해 보세요.');
    }
    if(action==='sprint-day'&&s.phase==='work'&&s.remaining>0){s.day++;s.remaining=Math.max(0,s.remaining-2);s.history.push(s.remaining);message=s.remaining?'작업을 진행했어요. 번다운 차트의 남은 작업량이 줄었습니다.':'예정 작업이 끝났어요. 사용자에게 제품을 검토받고, 팀의 일하는 방식도 회고하세요.';}
    if(action==='sprint-request'&&s.day>=1){s.newRequest=true;message='새 추천 기능 요청을 제품 백로그에 기록했습니다. 이번 목표를 무조건 늘리지 않고 다음 계획에서 우선순위를 검토합니다. 실제 스크럼의 범위는 목표를 지키며 협의할 수 있습니다.';}
    if(action==='sprint-review'&&s.remaining===0&&s.phase==='work'){s.reviewed=true;message='제품 검토: 검색과 예약을 보여 주고 사용자의 피드백을 받았습니다.';}
    if(action==='sprint-retro'&&s.reviewed){s.retro=true;message='팀 회고: 다음에는 작업을 더 작게 나누기로 했어요. 제품 검토와 과정 회고는 서로 다른 대상에 집중합니다.';}
  }
  if(id==='se-refactor'){
    if(action==='refactor-tests'){
      s.results=refactorTests(s);const all=s.results.every(r=>r.actual===r.expected);
      if(!s.extracted&&all)s.marks.before=true;
      if(s.discount&&!all)s.marks.failed=true;
      if(s.extracted&&!s.discount&&s.marks.failed&&all)s.marks.after=true;
      message=all?'시험 통과! 입력 1·2·5의 결과가 기존 약속과 같습니다.':'시험 실패! 할인 추가는 외부 결과를 바꾸는 기능 변경입니다. 리팩토링의 동작 보존과 구분하세요.';positive=all;
    }
    if(action==='extract'){if(s.marks.before){s.extracted=true;s.results=null;message='중복 계산을 공통 함수로 추출했어요. 계산 규칙은 그대로입니다.';}else hint('구조를 바꾸기 전에 기존 결과를 시험해 기준으로 남겨 주세요.');}
    if(action==='discount'&&s.extracted){s.discount=true;s.results=null;message='실험: 10% 할인 기능을 추가했습니다. 기존 동작과 같을까요? 시험을 실행해 차이를 관찰하세요.';}
    if(action==='restore-price'&&s.extracted){s.discount=false;s.results=null;message='기존 가격 규칙으로 복구했습니다. 공통 함수 구조는 유지하고 다시 시험해 보세요.';}
  }
  if(id==='se-planning'){
    if(action==='crew'){if(!s.running.length)s.crew=Number(value)===2?2:1;else hint('실습에서는 작업 중인 날의 자원 수는 바꾸지 않습니다. 진행 중인 작업이 끝난 뒤 조정하세요.');}
    if(action==='plan-start'){
      const task=PLAN_TASKS.find(t=>t.id===value);
      if(task&&!s.finished.includes(value)&&!s.running.some(t=>t.id===value)){
        if(!task.deps.every(d=>s.finished.includes(d)))hint(`선행 작업 ${task.deps.join(', ')}가 먼저 끝나야 합니다. 사람 수를 늘려도 의존관계는 사라지지 않아요.`);
        else if(s.running.length>=s.crew)hint('담당 인력이 부족해요. 현재 작업을 끝내거나, 작업이 없는 시점에 2명으로 계획해 보세요.');
        else{s.running.push({id:task.id,left:task.duration});if(task.deps.length)s.marks.dependency=true;if(s.running.length>=2)s.marks.parallel=true;message=`${task.name} 시작! 선후관계와 자원 수를 함께 고려했습니다.`;}
      }
    }
    if(action==='plan-day'&&s.running.length){s.day++;s.history.push({day:s.day,active:s.running.map(t=>t.id)});s.running.forEach(t=>t.left--);s.finished.push(...s.running.filter(t=>t.left===0).map(t=>t.id));s.running=s.running.filter(t=>t.left>0);message=s.finished.length===4?(s.day<=6?'6일 안에 완료했어요! A→B→D 경로의 2+3+1일이 이 조건의 최소 기간입니다.':'완료했지만 병렬화할 기회가 있었어요. 다시 계획해 6일에 도전해 보세요.'):'하루가 지났어요. 새로 시작할 수 있는 작업이 생겼는지 살펴보세요.';}
    if(action==='replan')return {state:initialSE(id),message:'일정만 다시 계획합니다. 두 명이 동시에 할 수 있는 독립 작업을 찾아보세요.',positive:true};
  }
  if(id==='se-change'){
    if(action==='direct-patch'){s.patched=true;s.marks.drift=true;message='코드에 예약 버튼만 추가했어요. 명세·설계·시험과 어긋난 상태라 출시 검토에서 막힙니다.';positive=false;}
    if(action==='change-request'){s.requested=true;message='요청 기록: 도서 예약 기능 추가. 누가 왜 원하는지와 변경 내용을 남겼어요.';}
    if(action==='change-impact'){if(s.requested){s.impact=true;message='영향 검토: 명세·설계·코드·시험이 모두 관련됩니다. 일정·비용·품질 영향도 검토해야 합니다.';}else hint('검토할 변경 요청부터 기록해 주세요.');}
    if(action==='change-approve'){if(s.impact){s.approved=true;s.links=['requirements'];message='승인된 변경을 명세에 반영했습니다. 이어서 관련 설계·코드·시험의 추적 연결을 완성하세요.';}else hint('승인 전에 영향 범위를 먼저 검토하세요.');}
    if(action==='sync-link'){
      const order=['requirements','design','code','test'],i=order.indexOf(value);
      if(s.approved&&i===s.links.length){s.links.push(value);if(value==='code')s.patched=true;message='관련 산출물을 변경 요청과 연결했습니다. 코드만 바꾸는 것과 문서·시험까지 일치시키는 것은 다릅니다.';}
      else hint('승인된 명세를 바탕으로 설계 → 코드 → 시험을 순서대로 맞춰 보세요.');
    }
    if(action==='release'){if(s.approved&&s.links.length===4){s.released=true;message='출시 통과! 승인된 요구와 명세·설계·코드·시험의 일관성을 확인했습니다.';}else hint('출시 보류: 승인과 관련 산출물의 연결이 아직 끝나지 않았어요.');}
  }
  return {state:s,message,positive};
}
