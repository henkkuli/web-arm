declare namespace uc {
    export var ARCH_ARM: number;
    export var MODE_ARM: number;
    export var ARM_REG_CPSR: number;
    export var ARM_REG_SPSR: number;
    export var ARM_REG_R0: number;
    export var ARM_REG_R1: number;
    export var ARM_REG_R2: number;
    export var ARM_REG_R3: number;
    export var ARM_REG_R4: number;
    export var ARM_REG_R5: number;
    export var ARM_REG_R6: number;
    export var ARM_REG_R7: number;
    export var ARM_REG_R8: number;
    export var ARM_REG_R9: number;
    export var ARM_REG_R10: number;
    export var ARM_REG_R11: number;
    export var ARM_REG_R12: number;
    export var ARM_REG_R13: number;
    export var ARM_REG_R14: number;
    export var ARM_REG_R15: number;
    export var ARM_REG_PC: number;

    export var PROT_ALL: number;

    export class Unicorn {
        public constructor(arch: number, mode: number);
        public _sizeof(): number;
        public errno(): number;
        public mem_map(addr: number, size: number, protection: number): void;
        public mem_write(addr: number, value: Uint8Array): void;
        public mem_read(addr: number, amount: number): Uint8Array;
        public reg_write_i32(reg: number, value: number): void;
        public reg_read_i32(reg: number): number;
        public emu_start(begin: number, until: number, timeout: number, count: number): void;
        public emu_stop(begin: number, until: number, timeout: number, count: number): void;
    }
}
