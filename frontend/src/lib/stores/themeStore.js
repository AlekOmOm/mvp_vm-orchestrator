import { writable } from 'svelte/store';
function getInitial(){
  if(typeof localStorage!=='undefined'&&localStorage.theme)return localStorage.theme;
  if(typeof window!=='undefined')return window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
  return 'light';
}
export const theme=writable(getInitial());
theme.subscribe(v=>{
  if(typeof document!=='undefined')document.documentElement.classList.toggle('dark',v==='dark');
  if(typeof localStorage!=='undefined')localStorage.theme=v;
}); 