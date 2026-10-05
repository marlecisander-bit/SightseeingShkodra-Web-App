'use client';
const languages:Record<string,string>={en:'English',sq:'Albanian',it:'Italian',de:'German',fr:'French',es:'Spanish',nl:'Dutch',pl:'Polish',el:'Greek',tr:'Turkish'};
export function ReviewLanguage({value,onChange}:{value:string;onChange:(value:string)=>void}) {
  return <div><label>Review language<select name="language" value={value} onChange={event=>onChange(event.target.value)}>
    <option value="">Not specified</option>{value&&!languages[value]&&<option value={value}>Other saved language</option>}
    {Object.entries(languages).map(([code,label])=><option key={code} value={code}>{label}</option>)}
  </select></label><details><summary>Advanced: other languages</summary><label>Language code<input value={value} onChange={event=>onChange(event.target.value)} placeholder="e.g. pt-BR"/></label></details></div>;
}
