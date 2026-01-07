const limits: Record<string, {count: number; time: number}> = {};

const LIMIT = 10;
const WINDOW = 60_000;

export function checkRateLimit(ip: string){
    const now = Date.now();

    if(!limits[ip]){
        limits[ip] = {count: 1, time: now};
        return false
    }

    if(now - limits[ip].time > WINDOW){
        limits[ip] = {count: 1, time: now};
        return false
    }

    if(limits[ip].count >= LIMIT){
        return true;
    }

    limits[ip].count += 1;
    return false
}