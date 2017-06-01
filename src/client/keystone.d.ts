declare namespace ks {
    export var ARCH_ARM: number;
    export var MODE_ARM: number;

    export class Keystone {
        public constructor(arch: number, mode: number);
        public readonly arch: number;
        public readonly mode: number;
        public readonly handle_ptr: number;
        public asm(assembly: string): Uint8Array;
        public close(): void;
        public errno(): number;
        public option(option: number, value: number): void;
    }
}
