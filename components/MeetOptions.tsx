'use client';
import {useId} from 'react';
const options=[['woman','Women'],['man','Men'],['everyone','Everyone'],['nonbinary','Nonbinary people']] as const;
export default function MeetOptions({selected,onChange,disabled=false,multiple=false,name}:{selected:string[];onChange:(next:string[])=>void;disabled?:boolean;multiple?:boolean;name?:string}){
  const id=useId();
  function choose(value:string){
    if(!multiple||value==='everyone'){onChange([value]);return;}
    const specific=selected.filter(item=>item!=='everyone');
    const next=specific.includes(value)?specific.filter(item=>item!==value):[...specific,value];
    onChange(next.length?next:['everyone']);
  }
  return <fieldset className="meet-options" disabled={disabled}><legend>Who would you like to meet?</legend><div className="meet-option-grid">{options.map(([value,label])=>{const checked=(multiple||selected.length===1)&&(value==='everyone'?selected.includes('everyone'):!selected.includes('everyone')&&selected.includes(value));return <label className={checked?'chosen':''} key={value}><input type={multiple?'checkbox':'radio'} name={name||id} value={value} checked={checked} onChange={()=>choose(value)}/><span>{label}</span></label>;})}</div></fieldset>;
}
