import * as util from './util';
// <reference path='./unicorn'/>;
// <reference path='./keystone'/>;
// <reference path='./capstone'/>;
//import ks = require('keystone');
declare function sprintf(format: string, ...args: any[]): string;

const FONT_SIZE = 20;
const ARCHu = uc.ARCH_ARM;
const MODEu = uc.MODE_ARM;
const ARCHk = ks.ARCH_ARM;
const MODEk = ks.MODE_ARM;
const ARCHc = cs.ARCH_ARM;
const MODEc = cs.MODE_ARM;
const REGISTERS = [
    uc.ARM_REG_R0, uc.ARM_REG_R1, uc.ARM_REG_R2, uc.ARM_REG_R3, uc.ARM_REG_R4, uc.ARM_REG_R5, uc.ARM_REG_R6, uc.ARM_REG_R7,
    uc.ARM_REG_R8, uc.ARM_REG_R9, uc.ARM_REG_R10, uc.ARM_REG_R11, uc.ARM_REG_R12, uc.ARM_REG_R13, uc.ARM_REG_R14, uc.ARM_REG_R15,
];

const SCREEN_WIDTH = 160;
const SCREEN_HEIGHT = 144;
const SCREEN_MEM_START = 0x10000000;
const SCREEN_MEM_SIZE = SCREEN_HEIGHT*SCREEN_WIDTH*4;
const SCREEN_CTR_START = 0x20000000;
const SCREEN_CTR_SIZE = 0x1000;
const KEYBOARD_CTR_START = 0x30000000;
const KEYBOARD_CTR_SIZE = 0x1000;

class Executer {
    private runner: uc.Unicorn
    private memSize: number = 0x100000;
    private statusDiv: HTMLDivElement;
    private scrollContainerDiv: HTMLDivElement;
    private scrollContentDiv: HTMLDivElement;
    private scrollLines: HTMLDivElement[] = [];
    private screenCanvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private screenData: ImageData;

    public constructor(statusDiv: HTMLDivElement, scrollContainerDiv: HTMLDivElement, screenCanvas: HTMLCanvasElement, codeArea: HTMLTextAreaElement) {
        this.runner = new uc.Unicorn(ARCHu, MODEu);
        // Map the main memory
        this.runner.mem_map(0x0, this.memSize, uc.PROT_ALL);


        this.scrollContainerDiv = scrollContainerDiv;
        this.scrollContentDiv = document.createElement('div');
        this.scrollContainerDiv.appendChild(this.scrollContentDiv);
        this.statusDiv = statusDiv;

        this.screenCanvas = screenCanvas;
        screenCanvas.width = SCREEN_WIDTH;
        screenCanvas.height = SCREEN_HEIGHT;
        this.ctx = screenCanvas.getContext('2d')!;
        this.screenData = this.ctx.getImageData(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        // Set all alpha channels
        for (let i = 3; i < SCREEN_MEM_SIZE; i += 4)
            this.screenData.data[i] = 255;
        this.ctx.putImageData(this.screenData, 0, 0);

        // Map the screen memory
        this.runner.mem_map(SCREEN_MEM_START, SCREEN_MEM_SIZE, uc.PROT_ALL);
        this.runner.mem_map(SCREEN_CTR_START, SCREEN_CTR_SIZE, uc.PROT_WRITE);
        this.runner.hook_add(uc.HOOK_MEM_WRITE, (u: uc.Unicorn, a: number, address: number, b: number, size: number, value: number) => {
            address-=SCREEN_MEM_START;
            for (let i = 0; i < size; i++) {
                if (((address+i)&3) != 3)
                    this.screenData.data[address+i] = (value >> (8*i)) & 0xff;
            }
        }, null, SCREEN_MEM_START, SCREEN_MEM_START+SCREEN_MEM_SIZE);
        this.runner.hook_add(uc.HOOK_MEM_WRITE, (u: uc.Unicorn, a: number, address: number, b: number, size: number, value: number) => {
            this.ctx.putImageData(this.screenData, 0, 0);
        }, null, SCREEN_CTR_START, SCREEN_CTR_START+SCREEN_CTR_SIZE);

        // Map the keyboard
        this.runner.mem_map(KEYBOARD_CTR_START, KEYBOARD_CTR_SIZE, uc.PROT_READ);
        const keyDownValue = new Uint8Array([0xFF]);
        const keyUpValue = new Uint8Array([0x00]);
        let canvasActive = false;
        document.addEventListener('mousedown', e => {
            canvasActive = e.target === screenCanvas;
            if (canvasActive)
                screenCanvas.classList.add('active');
            else
                screenCanvas.classList.remove('active');
        });     
        document.addEventListener('keydown', e => {
            if (!canvasActive) return;
            e.preventDefault();
            this.runner.mem_write(KEYBOARD_CTR_START + e.keyCode, keyDownValue);
        });
        document.addEventListener('keyup', e => {
            if (!canvasActive) return;
            e.preventDefault();
            this.runner.mem_write(KEYBOARD_CTR_START + e.keyCode, keyUpValue);
        });

        this.scrollContainerDiv.addEventListener('scroll', e => this.updateUI());
    }
    public loadProgram(program: Uint8Array) {
        // Clear the heap
        this.runner.mem_write(0x0, new Uint8Array(this.memSize));
        // Clear the registers
        for (let i = 0; i < REGISTERS.length; i++)
            this.runner.reg_write_i32(REGISTERS[i], 0);
        // TODO
        this.runner.mem_write(0x0, program);

        this.updateUI();
    }
    public updateUI() {
        // Update status panel
        let lines: string[] = [];
        for (let i = 0; i < 8; i++)
            lines.push(sprintf('r%-2d: 0x%08X   r%-2d: 0x%08X', i, this.runner.reg_read_i32(REGISTERS[i]), i+8, this.runner.reg_read_i32(REGISTERS[i+8])));
            //lines.push(`r${i}: ${util.toHex(this.runner.reg_read_i32(REGISTERS[i]))}`);
        lines.push(`CPSR: 0x${util.toHex(this.runner.reg_read_i32(uc.ARM_REG_CPSR))}`);
        this.statusDiv.innerText = lines.join('\n');

        // Compute vertical space needed for the full heap
        const linesRequired = this.memSize/4;
        const height = linesRequired * FONT_SIZE;
        this.scrollContentDiv.style.height = `${height}px`;
        const scrollTop = this.scrollContainerDiv.scrollTop;
        const scrollBottom = scrollTop + this.scrollContainerDiv.clientHeight;
        const firstLine = scrollTop / FONT_SIZE |0;
        const lastLine = scrollBottom / FONT_SIZE |0;
        const pc = this.runner.reg_read_i32(uc.ARM_REG_PC);

        while (this.scrollContentDiv.firstChild)
            this.scrollContentDiv.removeChild(this.scrollContentDiv.firstChild);

        for (let i = 0; i < lastLine - firstLine; i++) {
            let line = document.createElement('div');
            line.classList.add('memoryLine');

            let codepoint = this.runner.mem_read((i + firstLine)*4, 4);//this.heapView.getUint32((i + firstLine)*4, true);
            let mnemonic: string;
            try {
                let disassembled = capstone.disasm(codepoint, 0)[0];
                mnemonic = sprintf('%8s %-s', disassembled.mnemonic, disassembled.op_str);//`${disassembled.mnemonic} ${disassembled.op_str}`;
            } catch (e) {
                mnemonic = ` unknown`;
            }
            let address = `0x${util.toHex((i + firstLine)*4)}`;
            let value = `0x${util.toHex(codepoint)}`;
            let text = `${address}: ${value} ${mnemonic}`;
            line.style.top = `${(i + firstLine)*FONT_SIZE}px`;
            if ((i + firstLine)*4 === (pc&~3))
                line.classList.add('pc');
            line.innerText = text;//`0x${util.toHex((i + firstLine)*4)}: 0x${util.toHex(codepoint)}`;

            this.scrollContentDiv.appendChild(line);
        }

    }
    public run(steps: number = 1, updateUI: boolean = true) {
        const pc = this.runner.reg_read_i32(uc.ARM_REG_PC);
        this.runner.emu_start(pc, this.memSize, 0, steps);
        //this.runner.runner.run(steps);
        //while (steps-- > 0)
            //this.runner.runner.step();
        if (updateUI)
            this.updateUI();
    }
}

let editor = document.getElementById('code')! as HTMLTextAreaElement;
let compileButton = document.getElementById('compile')!;
let stepButton = document.getElementById('step')!;
let runButton = document.getElementById('run')!;
let stopButton = document.getElementById('stop')!;
let freqSpan = document.getElementById('freq')!;
let screenCanvas = document.getElementById('screen')! as HTMLCanvasElement;

let heapDiv = document.getElementById('heapPanel')! as HTMLDivElement;
let statusDiv = document.getElementById('statusPanel')! as HTMLDivElement;

let executer = new Executer(statusDiv, heapDiv, screenCanvas, editor);
let keystone = new ks.Keystone(ARCHk, MODEk);
let capstone = new cs.Capstone(ARCHc, MODEc);

(window as any).executer = executer;
compileButton.addEventListener('click', e => {
    let program = keystone.asm(editor.value);
    executer.loadProgram(program);
    running = false;
});
stepButton.addEventListener('click', e => {
    executer.run();
});
let running = false;
runButton.addEventListener('click', e => {
    if (running)
        return;

    const timeHistory = 60;
    const times = new Array<number>(timeHistory).fill(new Date().getTime());
    let next = timeHistory;
    function frame() {
        const exec = 20000;
        executer.run(exec, next%timeHistory == 0);

        // Timing
        const now = new Date().getTime();
        const old = times[next % timeHistory];
        times[next % timeHistory] = now;
        next++;

        const freq = 1000/(now-old)*(timeHistory)*exec;
        const fps = 1000/(now-old)*timeHistory;
        freqSpan.innerText = sprintf('%1.2fMHz %2.0fFPS', freq/1e6, fps);
        //freqSpan.innerText = `${freq/1000|0}MHz, ${fps|0}FPS`;

        if (running)
            window.requestAnimationFrame(frame);
    }
    running = true;
    frame();
});
stopButton.addEventListener('click', e => {
    running = false;
});
