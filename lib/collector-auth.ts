/** Private server operations require a dedicated key independently of Site visibility. */
export async function authorizeMetalsCollector(request:Request,expectedHash:string|undefined){
 const key=request.headers.get('X-Newsdesk-Metals-Key');
 if(!expectedHash||!/^[a-f0-9]{64}$/.test(expectedHash)||!key||!/^[a-f0-9]{64}$/.test(key))return false;
 const actual=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(key)));
 const expected=Uint8Array.from(expectedHash.match(/../g)!,part=>parseInt(part,16));
 let difference=0;for(let i=0;i<actual.length;i++)difference|=actual[i]^expected[i];return difference===0;
}
