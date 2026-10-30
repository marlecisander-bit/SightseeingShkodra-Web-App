'use client';
import type {ReactNode} from 'react';
import {useMutationPending} from './mutation-form';
import styles from './editor-actions.module.css';
export function EditorActions({dirty,pending=false,scope,children}:{dirty:boolean;pending?:boolean;scope:string;children:ReactNode}){
 const mutationPending=useMutationPending(),saving=pending||mutationPending;
 return <div className={styles.bar} aria-label="Editor actions"><p role="status">{saving?'Saving…':dirty?'Unsaved changes':'Ready to edit'}</p><div className={styles.buttons}>{children}</div><small>{scope}</small></div>;
}
