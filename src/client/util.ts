export function toHex(val: number): string
export function toHex(val: Uint8Array): string
export function toHex(val: number|Uint8Array): string {
    if (typeof val === 'number') {
        if (val < 0)
            val = 0xFFFFFFFF + val + 1;
        return `00000000${val.toString(16)}`.substr(-8);
    } else {
        const res = Array.from(val).map(b => `0${b.toString(16)}`.substr(-2)).join('');
        return res;
    }
}

