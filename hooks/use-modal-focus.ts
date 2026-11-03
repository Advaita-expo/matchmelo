'use client';
import {useEffect,useRef} from 'react';
export function useModalFocus(key:string,onClose:()=>void){
  const ref=useRef<HTMLElement>(null),close=useRef(onClose);close.current=onClose;
  useEffect(()=>{if(!key)return;const dialog=ref.current,previous=document.activeElement instanceof HTMLElement?document.activeElement:null;if(!dialog)return;
    const elements=()=>Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')).filter(element=>element.getClientRects().length>0);
    const first=elements()[0]||dialog;first.focus();
    function handle(event:KeyboardEvent){if(event.key==='Escape'){event.preventDefault();close.current();}if(event.key==='Tab'){const all=elements(),first=all[0]||dialog!,last=all[all.length-1]||dialog!;if(!all.length){event.preventDefault();first.focus();}else if(event.shiftKey&&(document.activeElement===first||!dialog!.contains(document.activeElement))){event.preventDefault();last.focus();}else if(!event.shiftKey&&(document.activeElement===last||!dialog!.contains(document.activeElement))){event.preventDefault();first.focus();}}}
    const oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';document.addEventListener('keydown',handle);
    return()=>{document.body.style.overflow=oldOverflow;document.removeEventListener('keydown',handle);if(previous?.isConnected)previous.focus();};
  },[key]);return ref;
}
