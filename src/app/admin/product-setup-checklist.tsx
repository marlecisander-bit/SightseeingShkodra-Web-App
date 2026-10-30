import Link from 'next/link';
import {productSetupSteps} from '@/modules/booking/product-setup';
import styles from './products.module.css';
export function ProductSetupChecklist({root,productId,blockers}:{root:string;productId:string;blockers:string[]}){
 return <section className={styles.checklist} aria-label="Product setup checklist"><h2>Product setup</h2><p>Based on saved settings. Save your draft to refresh this checklist.</p><ol>{productSetupSteps(blockers).map(step=><li key={step.tab}><Link prefetch={false} href={`${root}?product=${productId}&tab=${step.tab}`}><strong>{step.label}</strong><span>{step.issues.length?'Needs setup':'Ready'}</span></Link>{step.issues.length>0&&<ul>{step.issues.map(issue=><li key={issue}>{issue}</li>)}</ul>}</li>)}</ol></section>;
}
