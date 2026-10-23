// Deterministic classroom simulations for 반도체와 생성형 AI 디자인.
// Numbers such as time units, lane counts and match rates are teaching assumptions, not measurements.
export const SG_ORDER = ['sg-gan', 'sg-moore', 'sg-diffusion', 'sg-memory'];

/* ── 위조 화가와 감정사 (GAN) ── */
export const GAN_MAX = 5;
// 7×7 tulip. 1 = petal, 2 = stem/leaf, 0 = background.
export const TULIP = [
  '0101010',
  '0111110',
  '0111110',
  '0011100',
  '2001002',
  '0201020',
  '0022200'
].join('').split('').map(Number);
export function ganVerdict(g, d) { return g > d ? 'fooled' : 'caught'; }
// Fake image: a pixel keeps the real tulip value when its fixed rank is below the generator level.
export function ganFake(g) {
  return TULIP.map((value, i) => (hash(7, i) < g / GAN_MAX ? value : hash(11, i) < 0.5 ? 3 : 0));
}

/* ── 무어의 시계 ── */
export const MOORE_MAX_YEARS = 10;
export function mooreAt(years) {
  const doublings = Math.floor(years / 2);
  return { doublings, count: 2 ** doublings, price: 1 / 2 ** doublings };
}
export function moorePoints(years) {
  return Array.from({ length: Math.floor(years / 2) + 1 }, (_, i) => ({ year: i * 2, count: 2 ** i }));
}

/* ── 노이즈 정원사 (Diffusion) ── */
export const DIFFUSION_STEPS = 10;
export const CFG_DRIFT = { low: 0.32, mid: 0.12, high: 0.03 };
// 10×10 star prompt. 1 = star, 0 = sky.
export const STAR = [
  '0000110000',
  '0000110000',
  '0001111000',
  '1111111111',
  '0111111110',
  '0011111100',
  '0011111100',
  '0111001110',
  '0110000110',
  '0100000010'
].join('').split('').map(Number);
export function hash(seed, i) {
  let x = (Math.imul(seed + 1, 0x9e3779b1) ^ Math.imul(i + 1, 0x85ebca6b)) >>> 0;
  x ^= x >>> 15; x = Math.imul(x, 0x2c1b3c6d) >>> 0; x ^= x >>> 12; x = Math.imul(x, 0x297a2d39) >>> 0; x ^= x >>> 15;
  return (x >>> 0) / 4294967296;
}
// Cell codes: 'n0'/'n1' noise, 's' star, 'k' sky, 'x' creative drift away from the prompt.
export function diffusionGrid(seed, steps, cfg) {
  const drift = CFG_DRIFT[cfg] ?? CFG_DRIFT.mid;
  return STAR.map((target, i) => {
    if (hash(seed * 3 + 1, i) >= steps / DIFFUSION_STEPS) return hash(seed * 3 + 2, i) < 0.5 ? 'n0' : 'n1';
    if (hash(seed * 3 + 3, i) < drift) return 'x';
    return target ? 's' : 'k';
  });
}
export function promptMatch(grid) {
  return grid.filter((cell, i) => (STAR[i] ? cell === 's' : cell === 'k')).length / STAR.length;
}
const signature = s => `${s.seed}:${s.cfg}`;

/* ── 기억의 집 (메모리 계층 · HBM) ── */
export const MEMORY_TIERS = {
  sram: { name: 'SRAM · 책상 위 노트', place: '책상', time: 1, capacity: '아주 작음', note: '바로 손에 닿지만 몇 장밖에 못 올려요. CPU 안의 캐시입니다.' },
  dram: { name: 'DRAM · 거실 책장', place: '책장', time: 10, capacity: '적당함', note: '조금 걸어가야 하지만 꽤 많이 꽂아 둘 수 있어요. 전원이 꺼지면 사라지는 메인 메모리입니다.' },
  nand: { name: 'NAND Flash · 도서관', place: '도서관', time: 1000, capacity: '아주 큼', note: '다녀오는 데 오래 걸리지만 가장 많이 보관해요. 전원이 꺼져도 남는 저장 장치입니다.' }
};
export const TRANSFER_BLOCKS = 1024;
export const LINKS = {
  dram: { name: '일반 DRAM', lanes: 32, speed: 2 },
  hbm: { name: 'HBM', lanes: 1024, speed: 1 }
};
export function transferTicks(kind) {
  const link = LINKS[kind];
  return Math.ceil(TRANSFER_BLOCKS / (link.lanes * link.speed));
}

export function initialSG(id) {
  const states = {
    'sg-gan': { g: 0, d: 0, history: [], marks: {} },
    'sg-moore': { years: 0, scale: 'linear', marks: {} },
    'sg-diffusion': { seed: 1, steps: 0, cfg: 'mid', completed: [], marks: {} },
    'sg-memory': { fetched: [], last: null, transfers: {}, marks: {} }
  };
  return states[id] ? structuredClone(states[id]) : null;
}

export function sgGoals(id, s) {
  switch (id) {
    case 'sg-gan': return [
      ['판별자가 가짜를 잡아내는 모습 관찰', !!s.marks.caught],
      ['피드백을 받은 생성자가 판별자를 속이기', !!s.marks.fooled],
      ['번갈아 학습해 둘 다 5단계에 도달', s.g === GAN_MAX && s.d === GAN_MAX]
    ];
    case 'sg-moore': return [
      ['2년씩 넘기며 10년 추적', s.years >= MOORE_MAX_YEARS],
      ['선형 스케일에서 초반 변화가 묻히는 모습 관찰', !!s.marks.linear],
      ['로그 스케일로 바꿔 직선 확인', !!s.marks.log]
    ];
    case 'sg-diffusion': return [
      ['스텝을 끝까지 진행해 노이즈 걷어내기', !!s.marks.complete],
      ['같은 시드로 다시 생성해 똑같은 결과 확인', !!s.marks.reproduced],
      ['다른 시드로 다른 결과 비교', !!s.marks.varied],
      ['CFG 낮음·높음의 프롬프트 일치도 비교', !!(s.marks.cfglow && s.marks.cfghigh)]
    ];
    case 'sg-memory': return [
      ['책상·책장·도서관에서 각각 꺼내 보기', ['sram', 'dram', 'nand'].every(t => s.fetched.includes(t))],
      ['일반 DRAM으로 1,024묶음 전송', !!s.transfers.dram],
      ['HBM으로 같은 양을 전송해 비교', !!s.transfers.hbm]
    ];
    default: return null;
  }
}

export function reduceSG(id, previous, action, value) {
  const s = structuredClone(previous);
  let message = '', positive = true;
  const hint = text => { message = text; positive = false; };

  if (id === 'sg-gan') {
    if (action === 'gan-gen') {
      if (s.g >= GAN_MAX) hint('생성자는 이미 최고 단계예요. 판별자도 끝까지 따라오게 해 보세요.');
      else if (s.g > s.d) hint('판별자가 이미 속고 있어서 생성자에게 돌아오는 피드백(손실)이 거의 없어요. 판별자를 먼저 학습시켜 경쟁을 이어가세요.');
      else { s.g++; s.history.push('G'); }
    }
    if (action === 'gan-disc') {
      if (s.d >= GAN_MAX) hint('판별자는 이미 최고 단계예요.');
      else if (s.d > s.g) hint('판별자는 지금 모든 가짜를 잡고 있어요. 이제 생성자가 피드백을 받아 배울 차례입니다.');
      else { s.d++; s.history.push('D'); }
    }
    if (positive && (action === 'gan-gen' || action === 'gan-disc')) {
      const verdict = ganVerdict(s.g, s.d);
      if (verdict === 'fooled') { s.marks.fooled = true; message = `생성자 ${s.g}단계 > 판별자 ${s.d}단계: 판별자가 가짜를 진짜로 판정했어요. 판별자의 손실이 커졌으니 판별자가 배울 차례입니다.`; }
      else if (s.g > 0) { s.marks.caught = true; message = `판별자 ${s.d}단계 ≥ 생성자 ${s.g}단계: 가짜를 잡아냈어요. 이 결과(손실)가 생성자에게 피드백으로 돌아갑니다.`; }
      else message = '판별자가 아무렇게나 칠한 그림을 쉽게 가려냈어요. 생성자를 학습시켜 보세요.';
      if (s.g === GAN_MAX && s.d === GAN_MAX) message = '둘 다 최고 단계! 서로를 이기려는 경쟁(Minimax Game) 덕분에 생성자는 진짜 튤립 분포에 가까운 그림을 그리게 되었어요.';
    }
  }

  if (id === 'sg-moore') {
    if (action === 'moore-step') {
      if (s.years >= MOORE_MAX_YEARS) hint('10년을 모두 추적했어요. 스케일을 바꿔 그래프 모양을 비교해 보세요.');
      else { s.years += 2; const m = mooreAt(s.years); message = `${s.years}년 후: 트랜지스터 수 ×${m.count}, 트랜지스터 1개당 가격 1/${m.count}. 2년마다 2배가 반복되면 기하급수적으로 늘어납니다.`; }
    }
    if (action === 'scale' && ['linear', 'log'].includes(value)) {
      s.scale = value;
      message = value === 'log' ? '로그 스케일: 눈금이 1, 2, 4, 8…처럼 일정한 비율로 늘어나요. 매번 2배씩 늘어나는 변화가 직선으로 보입니다.' : '선형 스케일: 눈금 간격이 일정해요. 마지막 값이 너무 커서 초반의 변화가 바닥에 붙어 보입니다.';
    }
    if (action === 'moore-reset') { s.years = 0; message = '처음으로 돌아왔어요. 다시 2년씩 넘겨 보세요.'; }
    if (s.years >= MOORE_MAX_YEARS) s.marks[s.scale] = true;
  }

  if (id === 'sg-diffusion') {
    if (action === 'seed' && [1, 2, 3].includes(Number(value))) {
      s.seed = Number(value); s.steps = 0;
      message = `시드 ${s.seed}로 새 노이즈를 만들었어요. 같은 시드는 언제나 같은 노이즈에서 출발합니다.`;
    }
    if (action === 'cfg' && CFG_DRIFT[value] !== undefined) {
      s.cfg = value; s.steps = 0;
      message = `CFG를 '${{ low: '낮음', mid: '중간', high: '높음' }[value]}'으로 바꾸고 처음부터 다시 생성합니다. CFG는 프롬프트를 얼마나 엄격하게 따를지 정해요.`;
    }
    if (action === 'denoise') {
      if (s.steps >= DIFFUSION_STEPS) hint('이미 모든 스텝을 마쳤어요. 시드나 CFG를 바꿔 다시 생성해 보세요.');
      else {
        s.steps++;
        message = `스텝 ${s.steps}/${DIFFUSION_STEPS}: 노이즈를 조금 더 걷어냈어요. 스텝이 많을수록 세밀해지지만 계산 시간도 늘어납니다.`;
        if (s.steps === DIFFUSION_STEPS) {
          const sig = signature(s), match = Math.round(promptMatch(diffusionGrid(s.seed, s.steps, s.cfg)) * 100);
          const repeated = s.completed.includes(sig);
          const otherSeed = s.completed.some(other => other.split(':')[1] === s.cfg && other !== sig);
          s.marks.complete = true;
          if (repeated) s.marks.reproduced = true;
          if (otherSeed) s.marks.varied = true;
          s.marks[`cfg${s.cfg}`] = true;
          if (!repeated) s.completed.push(sig);
          message = `생성 완료! 프롬프트 일치도 ${match}%. ` + (repeated ? '이전과 똑같은 그림이에요. 같은 시드·같은 설정이면 결과가 그대로 재현됩니다.'
            : otherSeed ? '같은 CFG라도 시드가 다르니 세부가 달라졌어요. 시드는 다양성을 만듭니다.'
            : '시드나 CFG를 바꾸면 결과가 어떻게 달라지는지 비교해 보세요.');
        }
      }
    }
  }

  if (id === 'sg-memory') {
    if (action === 'fetch' && MEMORY_TIERS[value]) {
      const tier = MEMORY_TIERS[value];
      if (!s.fetched.includes(value)) s.fetched.push(value);
      s.last = value;
      message = `${tier.place}에서 노트를 꺼냈어요: ${tier.time}단위 시간. ${tier.note}`;
    }
    if (action === 'transfer' && LINKS[value]) {
      const link = LINKS[value], ticks = transferTicks(value);
      s.transfers[value] = ticks;
      message = value === 'hbm'
        ? `HBM: 통로 ${link.lanes}개로 ${TRANSFER_BLOCKS}묶음을 ${ticks}번 만에 옮겼어요. 통로 하나는 느려도 통로 수(I/O)가 많아 한꺼번에 나릅니다.`
        : `일반 DRAM: 빠른 통로 ${link.lanes}개로 ${TRANSFER_BLOCKS}묶음을 옮기는 데 ${ticks}번 왕복했어요. 통로가 적으면 연산 장치가 데이터를 기다립니다.`;
    }
  }
  return { state: s, message, positive };
}
