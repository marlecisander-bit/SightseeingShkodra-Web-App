export const passengerKeys = ["adult", "child", "infant"] as const;
export type PassengerKey = typeof passengerKeys[number];
export type PassengerCounts = Record<PassengerKey,number>;
export type PassengerCategories = Record<PassengerKey,{min:number;max:number|null;price:number|null}>;
export type PassengerSnapshot = {version:1;counts:PassengerCounts;categories:PassengerCategories;currency:"EUR";subtotal:number;total:number;lines:{category:PassengerKey;quantity:number;unitPrice:number;basePrice:number;total:number;minAge:number;maxAge:number|null;offer:{name:string;label:string}|null}[]};
export const passengerLabels = {adult:"Adults",child:"Children",infant:"Infants"};
export const adultRequired = "At least one adult is required when booking for children or infants.";
export function passengerCount(value:PassengerCounts) {
  if(!value || passengerKeys.some(k=>!Number.isSafeInteger(value[k])||value[k]<0))throw Error("Invalid passenger quantities.");
  if(value.adult<1&&(value.child>0||value.infant>0))throw Error(adultRequired);
  const total=passengerKeys.reduce((n,k)=>n+value[k],0);
  if(total<1||total>100000)throw Error("Choose at least one passenger.");return total;
}
export function ageLabel(category:{min:number;max:number|null}) {return category.max===null?`Age ${category.min}+`:`Ages ${category.min}–${category.max}`;}
