import {
  GAN_MAX, TULIP, ganFake, ganVerdict, MOORE_MAX_YEARS, mooreAt, moorePoints,
  DIFFUSION_STEPS, diffusionGrid, promptMatch, MEMORY_TIERS, LINKS, TRANSFER_BLOCKS, transferTicks
} from './sg-engine.js';

const SRC = (w, s) => `반도체와 생성형 AI 디자인_${w}주차 ${s}차시.pdf`;
export const SG_CLASSES = [
  { id: 'sg-gan', subject: 'sg', title: '위조 화가와 감정사', subtitle: '생성자와 판별자를 번갈아 학습시켜요', time: '3분', symbol: '⚔',
    idea: 'GAN은 두 신경망의 경쟁입니다. 생성자(Generator)는 진짜 같은 가짜를 만들고, 판별자(Discriminator)는 진짜와 가짜를 구별해요. 한쪽이 지면 그 결과(손실)가 피드백이 되어 다음 학습으로 이어집니다.',
    takeaway: '잡히면 생성자가 배우고, 속으면 판별자가 배웁니다. 이 경쟁(Minimax Game)이 반복되며 생성자는 원본 데이터의 분포에 가까워져요. 단계 숫자와 그림은 원리를 보여 주기 위한 단순화입니다.',
    source: SRC(3, 2), pages: '3 (2주차 3차시 15, 16쪽 함께 참고)' },
  { id: 'sg-moore', subject: 'sg', title: '무어의 시계', subtitle: '2년씩 넘기며 로그 스케일을 체험해요', time: '2분', symbol: '⌛',
    idea: '무어의 법칙은 약 2년마다 칩의 트랜지스터 수가 2배가 된다는 관찰입니다. 강의는 그 결과 트랜지스터당 가격이 약 2년마다 절반이 되어 온 점을 핵심으로 봐요. 매번 2배씩 늘어나는 값은 그래프 스케일에 따라 전혀 다르게 보입니다.',
    takeaway: '등차 눈금(선형)에서는 큰 값에 묻혀 초반 변화가 보이지 않고, 등비 눈금(로그)에서는 기하급수적 증가가 직선이 됩니다. 이 시계는 2년마다 정확히 2배인 이상적 모델이며, 실제 제품과 시기마다 변화율은 다릅니다.',
    source: SRC(4, 2), pages: '3, 6, 8 (4주차 1차시 14~17쪽 함께 참고)' },
  { id: 'sg-diffusion', subject: 'sg', title: '노이즈 정원사', subtitle: '시드·스텝·CFG로 별을 피워요', time: '4분', symbol: '✺',
    idea: '디퓨전 모델은 노이즈에서 시작해 단계(스텝)마다 노이즈를 걷어내며 이미지를 만듭니다. 시드는 출발 노이즈를 정하고, CFG는 프롬프트를 얼마나 엄격하게 따를지 정해요. 이 실습의 프롬프트는 "반짝이는 별"입니다.',
    takeaway: '같은 시드·같은 설정이면 같은 결과(재현성), 다른 시드면 다른 결과(다양성). 스텝을 끝까지 진행해야 세밀해지고, CFG가 높을수록 프롬프트에 가깝습니다. 격자 그림과 일치도 수치는 개념을 위한 단순화입니다.',
    source: SRC(6, 2), pages: '14, 16~18' },
  { id: 'sg-memory', subject: 'sg', title: '기억의 집', subtitle: '메모리 계층과 HBM의 통로를 비교해요', time: '3분', symbol: '▥',
    idea: '연산 장치는 데이터를 메모리에서 가져와야 합니다. 가까울수록 빠르지만 비싸고 작아요(SRAM → DRAM → NAND Flash). AI 학습처럼 엄청난 양을 옮길 때는 한 번에 얼마나 많이 나를 수 있는지, 즉 대역폭이 병목이 됩니다.',
    takeaway: '책상(SRAM)·책장(DRAM)·도서관(NAND)의 속도와 용량은 서로 맞바꿉니다. 기존 DRAM은 통로를 빠르게, HBM은 통로 수(I/O)를 크게 늘려요. 시간 단위와 통로 수는 비교를 위한 게임 가정입니다.',
    source: SRC(7, 1), pages: '12~13 (7주차 3차시 6~7쪽 함께 참고)' }
];

const GAN_COLOURS = ['#1b2833', '#ff9bc2', '#7da96b', '#8c7a6b'];
function pixels(cells, cols, colour, label) {
  return `<div class="sg-pixels" style="--cols:${cols}" role="img" aria-label="${label}">${cells.map(c => `<i style="background:${colour(c)}"></i>`).join('')}</div>`;
}
const DIFF_COLOURS = { n0: '#3b4a56', n1: '#5c6b77', s: '#ffd36b', k: '#1d3047', x: '#baa5ff' };

export function sgBoard(l, s, { button, esc }) {
  if (l.id === 'sg-gan') {
    const verdict = ganVerdict(s.g, s.d);
    const meter = (name, value) => `<div class="sg-meter"><span>${name}</span><div class="mini-bar"><i style="width:${value / GAN_MAX * 100}%"></i></div><b>${value}/${GAN_MAX}</b></div>`;
    return `<div class="sg-gan-stage"><figure><figcaption>진짜 튤립 (학습 데이터)</figcaption>${pixels(TULIP, 7, c => GAN_COLOURS[c], '실제 튤립 픽셀 그림')}</figure><span class="sg-versus" aria-hidden="true">VS</span><figure><figcaption>생성자의 그림</figcaption>${pixels(ganFake(s.g), 7, c => GAN_COLOURS[c], `생성자 ${s.g}단계가 그린 튤립`)}</figure></div>
<div class="lab-readout"><span>판별자의 판정</span><strong>${s.g === 0 && s.d === 0 ? '아직 학습 전' : verdict === 'fooled' ? '“진짜다!” → 속았어요' : '“가짜다!” → 잡아냈어요'}</strong></div>
${meter('생성자 G', s.g)}${meter('판별자 D', s.d)}
<div class="lab-chips">${button('gan-gen', '', '🎨 생성자 학습', s.g >= GAN_MAX ? 'disabled' : '')}${button('gan-disc', '', '🔍 판별자 학습', s.d >= GAN_MAX ? 'disabled' : '')}</div>
<div class="lab-code">학습 기록 · ${s.history.length ? s.history.join(' → ') : '아직 없음'}</div><p class="muted">G가 D보다 높으면 판별자가 속고, 같거나 낮으면 가짜가 잡힙니다. 이긴 쪽이 아니라 진 쪽이 피드백을 받아 배워요.</p>`;
  }
  if (l.id === 'sg-moore') {
    const now = mooreAt(s.years), points = moorePoints(MOORE_MAX_YEARS), max = 2 ** (MOORE_MAX_YEARS / 2);
    const x = year => 42 + year * 25, y = count => s.scale === 'log' ? 230 - Math.log2(count) / Math.log2(max) * 200 : 230 - count / max * 200;
    const shown = points.filter(p => p.year <= s.years);
    const ticks = s.scale === 'log' ? [1, 2, 4, 8, 16, 32] : [0, 8, 16, 24, 32];
    const path = shown.map((p, i) => `${i ? 'L' : 'M'}${x(p.year)} ${y(p.count)}`).join('');
    return `<div class="lab-chips">${button('scale', 'linear', '선형 스케일 (등차)', `aria-pressed="${s.scale === 'linear'}"`)}${button('scale', 'log', '로그 스케일 (등비)', `aria-pressed="${s.scale === 'log'}"`)}</div>
<svg class="sg-chart" viewBox="0 0 320 260" role="img" aria-label="${s.scale === 'log' ? '로그' : '선형'} 스케일의 트랜지스터 수 그래프, ${s.years}년까지 표시"><path d="M42 20V230H300" stroke="#577084" fill="none"/>${ticks.map(t => `<path d="M42 ${y(Math.max(t, s.scale === 'log' ? 1 : 0))}H300" stroke="#283b49"/><text x="34" y="${y(Math.max(t, s.scale === 'log' ? 1 : 0)) + 4}" text-anchor="end" fill="#a5b8c5" font-size="11">${t}</text>`).join('')}${points.map(p => `<text x="${x(p.year)}" y="250" text-anchor="middle" fill="#a5b8c5" font-size="11">${p.year}</text>`).join('')}${path ? `<path d="${path}" stroke="#ffc46b" stroke-width="3" fill="none"/>` : ''}${shown.map(p => `<circle cx="${x(p.year)}" cy="${y(p.count)}" r="6" fill="#ffc46b"/>`).join('')}<text x="300" y="16" text-anchor="end" fill="#a5b8c5" font-size="11">세로: 트랜지스터 수 (배)</text></svg>
<div class="lab-readout"><span>${s.years}년 후 · 2배 × ${now.doublings}회</span><strong>트랜지스터 ×${now.count} · 1개당 가격 1/${now.count}</strong></div>
<div class="lab-chips">${button('moore-step', '', '⏩ 2년 후', s.years >= MOORE_MAX_YEARS ? 'disabled' : '')}${button('moore-reset', '', '↺ 처음으로', s.years ? '' : 'disabled')}</div>
<p class="muted">10년이면 2배가 다섯 번: 2⁵ = 32배. 같은 데이터를 두 스케일로 번갈아 보세요.</p>`;
  }
  if (l.id === 'sg-diffusion') {
    const grid = diffusionGrid(s.seed, s.steps, s.cfg), match = Math.round(promptMatch(grid) * 100);
    return `<div class="sg-prompt"><span>PROMPT</span><strong>반짝이는 별</strong></div>${pixels(grid, 10, c => DIFF_COLOURS[c], `시드 ${s.seed}, 스텝 ${s.steps}, CFG ${s.cfg}의 생성 중인 이미지`)}
<div class="lab-readout"><span>시드 ${s.seed} · 스텝 ${s.steps}/${DIFFUSION_STEPS} · 계산 ${s.steps}단위</span><strong>${s.steps === DIFFUSION_STEPS ? `프롬프트 일치 ${match}%` : '노이즈 제거 중'}</strong></div>
<p class="lab-label">시드 (출발 노이즈) · 누르면 처음부터 다시 생성</p><div class="lab-chips">${[1, 2, 3].map(n => button('seed', n, `시드 ${n}`, `aria-pressed="${s.seed === n}"`)).join('')}</div>
<p class="lab-label">CFG (프롬프트를 따르는 정도)</p><div class="lab-chips">${[['low', '낮음'], ['mid', '중간'], ['high', '높음']].map(([v, name]) => button('cfg', v, name, `aria-pressed="${s.cfg === v}"`)).join('')}</div>
${button('denoise', '', `✦ 스텝 진행 · 노이즈 걷어내기 (${s.steps}/${DIFFUSION_STEPS})`, s.steps >= DIFFUSION_STEPS ? 'disabled' : '')}
<div class="lab-code">완료한 생성 · ${s.completed.length ? s.completed.map(c => { const [seed, cfg] = c.split(':'); return `시드${seed}/CFG ${{ low: '낮음', mid: '중간', high: '높음' }[cfg]}`; }).join(', ') : '아직 없음'}</div>
<p class="muted">노란 칸은 별, 남색은 하늘, 회색은 남은 노이즈, 보라는 프롬프트에서 벗어난 창의적 변형입니다.</p>`;
  }
  if (l.id === 'sg-memory') {
    const last = s.last ? MEMORY_TIERS[s.last] : null;
    const lanes = kind => { const n = kind === 'hbm' ? 32 : 1; return `<div class="sg-lanes ${kind}" aria-hidden="true">${Array.from({ length: n }, () => '<i></i>').join('')}</div>`; };
    return `<p class="lab-label">① 공부 노트를 어디에서 꺼낼까요?</p><div class="sg-tiers">${Object.entries(MEMORY_TIERS).map(([key, tier]) => `<button type="button" class="secondary ${s.fetched.includes(key) ? 'done' : ''}" data-lab-action="fetch" data-lab-value="${key}" aria-pressed="${s.last === key}"><strong>${tier.name}</strong><small>시간 ${tier.time}단위 · 용량 ${tier.capacity}</small></button>`).join('')}</div>
<div class="lab-readout"><span>${last ? `${esc(last.place)}에서 꺼냄` : 'CPU가 노트를 기다리는 중'}</span><strong>${last ? `${last.time}단위 시간` : '-'}</strong></div>
<p class="lab-label">② 모델 데이터 ${TRANSFER_BLOCKS.toLocaleString('ko-KR')}묶음을 GPU로 옮겨요</p><div class="sg-links">${Object.entries(LINKS).map(([key, link]) => `<div class="sg-link"><strong>${link.name}</strong><small>통로 ${link.lanes}개 · 통로 속도 ×${link.speed}</small>${lanes(key)}<span>${s.transfers[key] ? `${s.transfers[key]}번 만에 완료` : '아직 전송 전'}</span>${button('transfer', key, `${link.name}으로 전송`, '')}</div>`).join('')}</div>
${s.transfers.dram && s.transfers.hbm ? `<div class="lab-code">일반 DRAM ${transferTicks('dram')}번 ↔ HBM ${transferTicks('hbm')}번 · HBM은 TSV(실리콘 관통 전극)로 I/O를 늘리고 DRAM을 8~12층 쌓아 용량도 키웁니다.</div>` : ''}
<p class="muted">SRAM에 모두 두기엔 너무 비싸고, 일반 DRAM은 통로가 좁아 연산 장치가 데이터를 기다립니다(폰 노이만 병목). 그래서 HBM이 필요해요.</p>`;
  }
  return null;
}
