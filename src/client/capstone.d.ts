declare namespace cs {
    export var ARCH_ARM: number;
    export var MODE_ARM: number;

    export class Capstone {
        public constructor(arch: number, mode: number);
        public readonly arch: number;
        public readonly mode: number;
        public readonly handle_ptr: number;
        public disasm(buffer: Uint8Array, offset: number): Instruction[];
        public close(): void;
        public errno(): number;
        public option(option: number, value: number): void;
    }

    export interface Instruction {
        address: number;
        mnemonic: string;
        op_str: string;
    }
}
