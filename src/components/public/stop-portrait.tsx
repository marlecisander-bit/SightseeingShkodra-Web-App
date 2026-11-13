'use client';
import Image from 'next/image';
import {useState,type ReactNode} from 'react';
import styles from './stop-portrait.module.css';

/** Editorial presentation only; numbering follows the existing authoritative stop order. */
export function StopPortrait({number,name,image,alt,unoptimized=false,compact=false,card=false,children}:{number:number;name:string;image?:string;alt?:string;unoptimized?:boolean;compact?:boolean;card?:boolean;children?:ReactNode}) {
 const [failed,setFailed]=useState<string>();
 return <span className={`${styles.portrait} ${compact?styles.compact:''} ${card?styles.card:''}`} data-stop-color={((number-1)%5)+1}>
  <span className={styles.frame}>{image&&failed!==image?<Image src={image} alt={alt||name} width={card?480:240} height={card?320:240} sizes={card?"(max-width: 700px) 82vw, (max-width: 1000px) 30vw, 220px":"(min-width: 1100px) 180px, 200px"} unoptimized={unoptimized} onError={()=>setFailed(image)}/>:<span className={styles.placeholder}>Photo coming soon</span>}</span>
  <span className={styles.number}>{number}</span>
  <strong className={styles.name}>{name}</strong>
  {children}
 </span>;
}
