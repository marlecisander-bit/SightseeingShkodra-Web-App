import {getDayPlanner} from '@/modules/content/day-planner-server';
export async function GET(){return Response.json(await getDayPlanner(),{headers:{'Cache-Control':'no-store'}});}
