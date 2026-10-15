import test from 'node:test';
import assert from 'node:assert/strict';
import {STUDENTS,STARS,queryStudents,insertStudent,joinEnrolments,nearest,assignClusters,updateCentres,mse,initialLesson,lessonGoals,reduceLesson,WBS_TASKS} from '../lesson-engine.js';
import {LESSONS} from '../lessons.js';
function apply(id, actions) {return actions.reduce((s,[a,v])=>reduceLesson(id,s,a,v).state,initialLesson(id));}
function done(id,s){return lessonGoals(id,s).every(g=>g[1]);}
test('nine concept quests, three per subject, each starts incomplete',()=>{
 assert.equal(LESSONS.length,9);for(const subject of ['db','ai','se'])assert.equal(LESSONS.filter(l=>l.subject===subject).length,3);
 for(const l of LESSONS){assert.ok(l.source.endsWith('.pdf'));assert.ok(l.pages);assert.equal(done(l.id,initialLesson(l.id)),false);}
});
test('SELECT/WHERE return actual row and column subsets without mutating originals',()=>{
 const before=JSON.stringify(STUDENTS);assert.deepEqual(queryStudents('컴퓨터',['name']),[{name:'하늘'},{name:'수아'}]);assert.equal(queryStudents('all',['id','name','dept']).length,4);assert.equal(JSON.stringify(STUDENTS),before);
 const id='db-query';assert.ok(done(id,apply(id,[['dept','컴퓨터'],['column','id'],['column','dept'],['dept','all'],['column','id'],['column','dept']])));
 const one=apply(id,[['column','id'],['column','dept']]);assert.equal(reduceLesson(id,one,'column','name').state.columns.length,1);
});
test('primary key rejects missing and duplicate IDs; successful insertion preserves originals',()=>{
 assert.equal(insertStudent(STUDENTS,{id:'101',name:'다른 사람'}).reason,'duplicate');assert.equal(insertStudent(STUDENTS,{id:' ',name:'나래'}).reason,'empty');const result=insertStudent(STUDENTS,{id:'105',name:'나래'});assert.equal(result.rows.length,5);assert.equal(STUDENTS.length,4);
 const id='db-key';assert.ok(done(id,apply(id,[['register',{id:'101',name:'나래'}],['register',{id:'',name:'나래'}],['register',{id:'105',name:'나래'}]])));
});
test('inner join expands multiple matches; left join also preserves unmatched students with null',()=>{
 assert.equal(joinEnrolments('inner').length,3);const left=joinEnrolments('left');assert.equal(left.length,5);assert.deepEqual(left.filter(r=>r.course===null).map(r=>r.id),['102','104']);assert.equal(left.filter(r=>r.id==='101').length,2);assert.deepEqual(joinEnrolments('inner','name'),[]);
 const id='db-join';assert.ok(done(id,apply(id,[['connect','id'],['join-kind','left']])));
});
test('K-NN votes change from A to B to A as neighbourhood grows',()=>{
 assert.deepEqual([1,3,5].map(k=>nearest(k).label),['A','B','A']);assert.deepEqual(nearest(3).counts,{A:1,B:2});assert.ok(nearest(3).neighbours.every((p,i,a)=>!i||p.distance>=a[i-1].distance));
 const id='ai-knn';assert.ok(done(id,apply(id,[['k',1],['k',3],['k',5]])));
});
test('K-means actually assigns, averages coordinates, and detects stable membership',()=>{
 const initial=[{x:20,y:70},{x:80,y:20}];const assigned=assignClusters(STARS,initial);assert.deepEqual(assigned,[0,0,1,1]);assert.deepEqual(updateCentres(STARS,assigned,initial),[{x:20,y:30},{x:75,y:70}]);assert.deepEqual(updateCentres([{x:1,y:1}],[0],initial),[{x:1,y:1},initial[1]]);
 const id='ai-kmeans';assert.equal(done(id,apply(id,[['assign'],['move']])),false);assert.ok(done(id,apply(id,[['assign'],['move'],['assign']])));
});
test('regression loss is computed from observations; tuning finds a=2,b=1',()=>{
 assert.equal(mse(0,0),21);assert.equal(mse(2,1),0);assert.equal(mse(2,0),1);const id='ai-regression';assert.ok(done(id,apply(id,[['a',1],['a',1],['b',1]])));assert.equal(reduceLesson(id,initialLesson(id),'a',-1).state.a,0);
});
test('lifecycle cannot skip analysis, WBS retains a task after a wrong folder, and V&V is ordered',()=>{
 const id='se-cycle';assert.equal(reduceLesson(id,initialLesson(id),'stage',2).state.order.length,0);assert.ok(done(id,apply(id,[0,1,2,3,4].map(i=>['stage',i]))));
 const w='se-wbs';let state=apply(w,[['task','interview'],['folder','design']]);assert.equal(state.selected,'interview');assert.equal(Object.keys(state.placed).length,0);state=initialLesson(w);for(const task of WBS_TASKS){state=reduceLesson(w,state,'task',task.id).state;state=reduceLesson(w,state,'folder',task.group).state;}assert.ok(done(w,state));
 const c='se-check';assert.equal(reduceLesson(c,initialLesson(c),'build').state.step,0);let v=apply(c,[['talk'],['spec'],['test'],['build']]);assert.equal(done(c,v),false);assert.equal(reduceLesson(c,v,'search','다른 검색어').state.step,4);assert.ok(done(c,reduceLesson(c,v,'search','자료구조').state));
});
