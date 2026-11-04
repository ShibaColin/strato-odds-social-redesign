const files={trade:'strato-trade.wav',liquidity:'strato-liquidity.wav',win:'strato-win.wav'};
export function playSound(kind='trade',volume=.35){
 const audio=new Audio('audio/'+(files[kind]||files.trade));audio.volume=Math.max(0,Math.min(1,volume));audio.play().catch(()=>{});
}
