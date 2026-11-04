export function makerAccrual(position,campaign,now=Date.now()){
 if(position.amount<campaign.minAmount||(position.spread||3)>campaign.maxSpread)return 0;
 const seconds=Math.max(0,(now-(position.claimedAt||position.time))/1000);
 const share=position.amount/(campaign.baseLiquidity+position.amount);
 const quality=Math.min(1,3/Math.max(1,position.spread||3));
 return campaign.daily*share*quality*Math.min(seconds,86400)/86400;
}
export function claimMaker(state,campaignFor,now=Date.now()){
 const s=structuredClone(state);let earned=0;
 for(const p of s.liquidity){const v=makerAccrual(p,campaignFor(p),now);earned+=v;p.claimedAt=now;}
 if(earned<.001)throw Error('Your liquidity rewards are still building.');
 s.balance+=earned;s.rewards.unshift({id:'maker-'+now,time:now,label:'Liquidity rewards',cash:earned});return s;
}
export function quoteQuality(spread){return Math.min(100,Math.round(300/Math.max(1,spread)));}

export function settleMakerPosition(state,marketId,campaign,now=Date.now()){
 const s=structuredClone(state),p=s.liquidity.find(p=>p.marketId===marketId);
 if(!p)throw Error('No liquidity position found.');
 const earned=makerAccrual(p,campaign,now);p.claimedAt=now;s.balance+=earned;
 if(earned>0)s.rewards.unshift({id:'maker-withdraw-'+now,time:now,label:'Liquidity rewards',cash:earned});
 return s;
}
