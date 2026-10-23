import "server-only";
import {cache} from "react";
import { authorizeStaff, AuthorizationError, type Membership } from "./authorization";
import type { Permission } from "./roles";
import { createSessionClient } from "./supabase-server";

// React cache is scoped to one server render, never a process-wide session cache.
const verifiedUser=cache(async()=>{
 const client=await createSessionClient();const {data,error}=await client.auth.getUser();
 return error||!data.user?null:{id:data.user.id};
});
const membershipFor=cache(async(userId:string,operatorId:string)=>{
 const client=await createSessionClient();
 const {data,error}=await client.from('staff_profiles').select('id,operator_id,auth_user_id,role,is_active').eq('operator_id',operatorId).eq('auth_user_id',userId).maybeSingle();
 if(error)throw new AuthorizationError('UNAVAILABLE');
 return data as Membership|null;
});
// Every protected page/action/handler still checks its own permission.
export async function requirePermission(operatorId:string,permission:Permission){
 try{return await authorizeStaff({getVerifiedUser:verifiedUser,getMembership:membershipFor},operatorId,permission);}
 catch(error){if(error instanceof AuthorizationError)throw error;throw new AuthorizationError('UNAVAILABLE');}
}
