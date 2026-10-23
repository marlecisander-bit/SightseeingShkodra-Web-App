import Image from 'next/image';
import type {ReactNode} from 'react';
import styles from './stop-portrait.module.css';

/** Editorial presentation only; numbering follows the existing authoritative stop order. */
export function StopPortrait({number,name,image,alt,unoptimized=false,children}:{number:number;name:string;image?:string;alt?:string;unoptimized?:boolean;children?:ReactNode}) {
 return <span className={styles.portrait} data-stop-color={((number-1)%5)+1}>
  <span className={styles.frame}>{image?<Image src={image} alt={alt||name} width={240} height={240} sizes="(min-width: 1100px) 180px, 200px" unoptimized={unoptimized}/>:<span className={styles.placeholder}>Photo coming soon</span>}</span>
  <span className={styles.number}>{number}</span>
  <strong className={styles.name}>{name}</strong>
  {children}
 </span>;
}
