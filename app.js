'use strict';
(() => {
 const puzzles=window.BRAIN_PUZZLES;
 const $=id=>document.getElementById(id);
 const tabs=[...document.querySelectorAll('[data-puzzle]')];
 const states=puzzles.map(()=>({solved:false,revealed:false,hint:false,value:''}));
 let current=0;
 let language=document.documentElement.lang==='en'?'en':'ru';
 const messages={
  ru:{answer:'Ваш ответ',next:'Далее',check:'Проверить',solved:'Решено',correct:'Верно! Ты нашёл ответ.',revealed:'Решение открыто. Попробуй следующую задачу.',ready:'Есть идея? Проверь её.',first:'К первой задаче',nextPuzzle:'Следующая задача',empty:'Введи ответ, чтобы проверить идею.',wrong:'Пока не сходится. Попробуй посмотреть иначе.',typing:'Проверь свою идею.'},
  en:{answer:'Your answer',next:'Next',check:'Check',solved:'Solved',correct:'Correct! You found the answer.',revealed:'Solution revealed. Try the next puzzle.',ready:'Have an idea? Try it.',first:'Back to the first',nextPuzzle:'Next puzzle',empty:'Enter an answer to test your idea.',wrong:'Not quite. Try a different approach.',typing:'Test your idea.'}
 };
 const t=key=>messages[language][key];
 const localized=index=>language==='en'?{...puzzles[index],...window.BRAIN_PUZZLES_EN[index]}:puzzles[index];
 function applyLanguage(next){
  language=next==='en'?'en':'ru';document.documentElement.lang=language;
  document.querySelectorAll('[data-ru][data-en]').forEach(node=>{node.innerHTML=node.getAttribute('data-'+language);});
  ['content','aria-label','placeholder','alt','src'].forEach(attr=>document.querySelectorAll('[data-'+attr+'-ru][data-'+attr+'-en]').forEach(node=>node.setAttribute(attr,node.getAttribute('data-'+attr+'-'+language))));
  document.querySelectorAll('[data-language]').forEach(link=>link.setAttribute('aria-current',String(link.dataset.language===language)));
  images.forEach((img,index)=>{img.alt=localized(index).alt;});
  render();
 }
 document.querySelectorAll('[data-language]').forEach(link=>link.addEventListener('click',event=>{
  if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();states[current].value=$('answer').value;
  if(language===link.dataset.language)return;
  applyLanguage(link.dataset.language);
  const url=new URL(link.href,window.location.href);url.hash=window.location.hash;
  history.pushState(null,'',url.href);
 }));
 window.addEventListener('popstate',()=>{states[current].value=$('answer').value;applyLanguage(window.location.pathname.endsWith('/en.html')?'en':'ru');});
 // Keep every decoded image mounted: switching tasks makes no new request.
 const images=puzzles.map((p,index)=>{
  const img=index===0?$('puzzle-image'):document.createElement('img');
  img.src=p.image;img.alt=p.alt;img.width=720;img.height=720;img.hidden=index!==0;
  img.loading='eager';img.decoding='async';
  if(index!==0)$('puzzle-board').appendChild(img);
  if(img.decode)img.decode().catch(()=>{});
  return img;
 });
 const normalize=value=>String(value).normalize('NFKC').trim().toLowerCase().replace(/[−–—]/g,'-').replace(/\s+/g,'').replace(',','.');
 function feedback(text,kind=''){ $('feedback').textContent=text;$('feedback').className='player-feedback'+(kind?' '+kind:''); }
 function render(){
  const p=localized(current),s=states[current];
  images.forEach((img,index)=>{img.hidden=index!==current;});$('puzzle-tag').textContent=p.tag;
  $('answer').value=s.value;$('answer').inputMode='decimal';$('answer').placeholder=t('answer');$('answer').disabled=s.solved;$('check-button').disabled=false;$('check-button').textContent=s.solved?t('next'):t('check');
  $('solved-count').textContent=t('solved')+' '+states.filter(s=>s.solved).length+' / '+puzzles.length;
  tabs.forEach((t,i)=>{t.classList.toggle('active',i===current);t.classList.toggle('solved',states[i].solved);t.setAttribute('aria-pressed',String(i===current));});
  $('hint-panel').hidden=!(s.hint||s.solved||s.revealed);$('hint-text').textContent=s.solved||s.revealed?p.solution:p.hint;$('reveal-button').hidden=s.solved||s.revealed;
  $('finish-panel').hidden=!states.every(s=>s.solved);
  feedback(s.solved?t('correct'):s.revealed?t('revealed'):t('ready'),s.solved?'success':'');
  $('next-button').textContent=current===puzzles.length-1?t('first'):t('nextPuzzle');
 }
 function select(index){if(!Number.isInteger(index)||index<0||index>=puzzles.length)throw new Error('Unknown puzzle');states[current].value=$('answer').value;current=index;render();return {id:puzzles[current].id,solved:states[current].solved};}
 function check(answer){
  if(typeof answer!=='string'||answer.length>40)throw new Error('Answer must be a string of up to 40 characters');
  const s=states[current],p=puzzles[current];if(s.solved)return {correct:true,alreadySolved:true};
  s.value=answer;$('answer').value=answer;
  if(!normalize(answer)){feedback(t('empty'));$('answer').focus();return {correct:false,reason:'empty'};}
  const correct=p.answers.some(a=>normalize(a)===normalize(answer));
  if(correct){s.solved=true;render();$('play').classList.remove('celebrate');void $('play').offsetWidth;$('play').classList.add('celebrate');$('check-button').focus({preventScroll:true});}
  else{feedback(t('wrong'),'error');$('answer-form').classList.remove('shake');void $('answer-form').offsetWidth;$('answer-form').classList.add('shake');$('answer').focus();$('answer').select();}
  return {correct,solved:states.filter(x=>x.solved).length,total:puzzles.length};
 }
 tabs.forEach(t=>t.addEventListener('click',()=>select(Number(t.dataset.puzzle))));
 $('answer-form').addEventListener('submit',event=>{
  event.preventDefault();
  if(!states[current].solved){check($('answer').value);return;}
  const next=Array.from({length:puzzles.length},(_,i)=>(current+i+1)%puzzles.length).find(index=>!states[index].solved);
  if(next!==undefined){select(next);$('answer').focus({preventScroll:true});}
  else{navigateTo($('finish-panel'),$('finish-panel'));$('finish-panel').querySelector('a').focus({preventScroll:true});}
 });
 $('answer').addEventListener('input',()=>{states[current].value=$('answer').value;feedback(t('typing'));});
 $('hint-button').addEventListener('click',()=>{const s=states[current];s.hint=!s.hint;render();});
 $('reveal-button').addEventListener('click',()=>{states[current].revealed=true;render();});
 $('next-button').addEventListener('click',()=>{select((current+1)%puzzles.length);if(!$('answer').disabled)$('answer').focus();});
 $('reset-button').addEventListener('click',()=>{states.forEach(s=>Object.assign(s,{solved:false,revealed:false,hint:false,value:''}));current=0;render();$('play').scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});$('answer').focus({preventScroll:true});});
 let navigation=0;
 let highlightTimer;
 function highlight(element){
  document.querySelectorAll('.nav-highlight').forEach(node=>node.classList.remove('nav-highlight'));
  clearTimeout(highlightTimer);
  void element.offsetWidth;element.classList.add('nav-highlight');
  highlightTimer=setTimeout(()=>element.classList.remove('nav-highlight'),1450);
 }
 function navigateTo(target,highlightTarget){
  const generation=++navigation;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({block:target.id==='play'?'center':'start',behavior:reduced?'instant':'smooth'});
  if(reduced){highlight(highlightTarget);return;}
  let previous=window.scrollY,stable=0;
  const started=performance.now();
  function afterScroll(now){
   if(generation!==navigation)return;
   const position=window.scrollY;
   stable=Math.abs(position-previous)<.5?stable+1:0;previous=position;
   if((now-started>160&&stable>=5)||now-started>3000){highlight(highlightTarget);return;}
   requestAnimationFrame(afterScroll);
  }
  requestAnimationFrame(afterScroll);
 }
 document.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',event=>{
  if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const id=link.getAttribute('href').slice(1);
  if(!id)return;
  const target=$(id);if(!target)return;
  event.preventDefault();
  if(window.location.hash!=='#'+id)history.pushState(null,'','#'+id);
  const highlightTarget=target;
  navigateTo(target,highlightTarget);
 }));
 applyLanguage(language);
 // Progressive enhancement only; ordinary browsers use the same visible controls.
 if(document.modelContext?.registerTool){
  const lifecycle=new AbortController();
  const register=tool=>{try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}};
  register({name:'select_brain_blitz_puzzle',description:'Select a sample Brain Blitz puzzle and display it on the page.',inputSchema:{type:'object',properties:{index:{type:'integer',minimum:0,maximum:puzzles.length-1}},required:['index'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>select(input.index)});
  register({name:'check_brain_blitz_answer',description:'Check the answer to the current puzzle and update the visible result.',inputSchema:{type:'object',properties:{answer:{type:'string',maxLength:40}},required:['answer'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>check(input.answer)});
  window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
 }
})();
