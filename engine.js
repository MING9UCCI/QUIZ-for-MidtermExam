export function shuffle(values,random=Math.random){const a=[...values];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function normalize(value){return String(value??'').normalize('NFKC').toLowerCase().replace(/[\s\p{P}]/gu,'');}
export function makeQueue(questions,count,random=Math.random){return shuffle(questions,random).slice(0,count==='all'?questions.length:Math.min(count,questions.length)).map(q=>({id:q.id,options:q.type==='mc'?shuffle(q.options,random):[...q.options]}));}
export function gradeChoice(question,selected){return selected===question.answer;}
