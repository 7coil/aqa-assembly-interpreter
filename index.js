if (process && process.argv[2]) {
    const fs = require('fs');
    fs.readFile(process.argv[2], {
        encoding: 'UTF8'
    }, (err, data) => {
        if (err) {
            throw err;
        } else {
            parse(data);
        }
    })
}

class Instruction {
    /**
     * Create an instruction
     * @param {String} name The name of the instruction
     * @param {String} match The string format of the AQA instruction
     * @param {function} execute The function which performs the instruction
     * @prop {RegExp} regexp The regular expression which can be used to test if a command is valid
     */
    constructor(name, match, execute) {
        this.name = name;
        this.execute = execute || (() => ({}));

        // Convert the instruction string into a regular expression which can be parsed
        const regexString = match
            .replace(/<register>/g, 'R(\\d+)')
            .replace(/<memory>/g, '(\\d+)')
            .replace(/<operand>/g, '([R#])(\\d+)')
            .replace(/<label>/g, '([\\w\\d]+)')
            .replace(/\s/g, '(?:\\s)?')
        this.regexp = new RegExp(regexString);
    }

    run(memory, registers, labels, line) {
        const data = this.regexp.exec(line);
        return this.execute(memory, registers, labels, data);
    }
}

const instructions = [
    new Instruction('Load to register', 'LDR <register>, <memory>', (memory, registers, labels, data) => {
        registers[parseInt(data[1], 10)] = memory[parseInt(data[2], 10)];
        return {}; // End of processing instruction
    }),
    new Instruction('Store to memory', 'STR <register>, <memory>', (memory, registers, labels, data) => {
        memory[parseInt(data[2], 10)] = registers[parseInt(data[1], 10)];
        return {}; // End of processing instruction
    }),
    new Instruction('Add', 'ADD <register>, <register>, <operand>', (memory, registers, labels, data) => {
        // If the operand is a register, use the register.
        if (data[3] === 'R') {
            registers[parseInt(data[1], 10)] = registers[parseInt(data[2], 10)] + registers[parseInt(data[4], 10)];
        } else {
            // Otherwise use the actual number
            registers[parseInt(data[1], 10)] = registers[parseInt(data[2])] + parseInt(data[4], 10);
        }
        return {}; // End of processing instruction
    }),
    new Instruction('Subtract', 'SUB <register>, <register>, <operand>', (memory, registers, labels, data) => {
        // If the operand is a register, use the register.
        if (data[3] === 'R') {
            registers[parseInt(data[1], 10)] = registers[parseInt(data[2], 10)] - registers[parseInt(data[4], 10)];
        } else {
            // Otherwise use the actual number
            registers[parseInt(data[1], 10)] = registers[parseInt(data[2])] - parseInt(data[4], 10);
        }
        return {}; // End of processing instruction
    }),
    new Instruction('Copy to register', 'MOV <register>, <operand>', (memory, registers, labels, data) => {
        // If the operand is a register, use the register.
        if (data[2] === 'R') {
            registers[parseInt(data[1], 10)] = registers[parseInt(data[3], 10)]
        } else {
            // Otherwise use the actual number
            registers[parseInt(data[1], 10)] = parseInt(data[3], 10);
        }
        return {}; // End of processing instruction
    }),
    new Instruction('Compare', 'CMP <register>, <operand>', (memory, registers, labels, data) => {
        let opData = data[2] === 'R' ? registers[parseInt(data[3], 10)] : parseInt(data[3], 10);
        const registerData = registers[parseInt(data[1], 10)];

        if (registerData === opData) {
            registers.cmp = 'EQ';
        } else if (registerData > opData) {
            registers.cmp = 'GT';
        } else {
            registers.cmp = 'LT';
        }
        // NE when either GT or LT

        return {}; // End of processing instruction
    }),
    new Instruction('Branch if equal to', 'BEQ <label>', (memory, registers, labels, data) => {
        if (registers.cmp === 'EQ') return { goto: labels[data[1]] }
        return {};
    }),
    new Instruction('Branch if not equal to', 'BNE <label>', (memory, registers, labels, data) => {
        if (registers.cmp !== 'EQ') return { goto: labels[data[1]] }
        return {};
    }),
    new Instruction('Branch if greater than', 'BGT <label>', (memory, registers, labels, data) => {
        if (registers.cmp === 'GT') return { goto: labels[data[1]] }
        return {};
    }),
    new Instruction('Branch if less than', 'BLT <label>', (memory, registers, labels, data) => {
        if (registers.cmp === 'LT') return { goto: labels[data[1]] }
        return {};
    }),
    new Instruction('Branch', 'B <label>', (memory, registers, labels, data) => {
        return { goto: labels[data[1]] }
    }),
    new Instruction('AND', 'AND <register>, <register>, <operand>', (memory, registers, labels, data) => {
        // If the operand is a register, use the register.
        if (data[3] === 'R') {
            registers[parseInt(data[1], 10)] = registers[parseInt(data[2], 10)] & registers[parseInt(data[4], 10)];
        } else {
            // Otherwise use the actual number
            registers[parseInt(data[1], 10)] = registers[parseInt(data[2])] & parseInt(data[4], 10);
        }
        return {}; // End of processing instruction
    }),
    new Instruction('OR', 'ORR <register>, <register>, <operand>', (memory, registers, labels, data) => {
        // If the operand is a register, use the register.
        if (data[3] === 'R') {
            registers[parseInt(data[1], 10)] = registers[parseInt(data[2], 10)] | registers[parseInt(data[4], 10)];
        } else {
            // Otherwise use the actual number
            registers[parseInt(data[1], 10)] = registers[parseInt(data[2])] | parseInt(data[4], 10);
        }
        return {}; // End of processing instruction
    }),
    new Instruction('XOR', 'EOR <register>, <register>, <operand>', (memory, registers, labels, data) => {
        // If the operand is a register, use the register.
        if (data[3] === 'R') {
            registers[parseInt(data[1], 10)] = registers[parseInt(data[2], 10)] ^ registers[parseInt(data[4], 10)];
        } else {
            // Otherwise use the actual number
            registers[parseInt(data[1], 10)] = registers[parseInt(data[2])] ^ parseInt(data[4], 10);
        }
        return {}; // End of processing instruction
    }),
    new Instruction('NOT', 'MVN <register>, <operand>', (memory, registers, labels, data) => {
        // If the operand is a register, use the register.
        if (data[3] === 'R') {
            registers[parseInt(data[1], 10)] = ~registers[parseInt(data[4], 10)];
        } else {
            // Otherwise use the actual number
            registers[parseInt(data[1], 10)] = ~parseInt(data[4], 10);
        }
        return {}; // End of processing instruction
    }),
    new Instruction('Logically shift left', 'LSL <register>, <register>, <operand>', (memory, registers, labels, data) => {
        // If the operand is a register, use the register.
        if (data[3] === 'R') {
            registers[parseInt(data[1], 10)] = registers[parseInt(data[2], 10)] << registers[parseInt(data[4], 10)];
        } else {
            // Otherwise use the actual number
            registers[parseInt(data[1], 10)] = registers[parseInt(data[2])] << parseInt(data[4], 10);
        }
        return {}; // End of processing instruction
    }),
    new Instruction('Logically shift right', 'LSR <register>, <register>, <operand>', (memory, registers, labels, data) => {
        // If the operand is a register, use the register.
        if (data[3] === 'R') {
            registers[parseInt(data[1], 10)] = registers[parseInt(data[2], 10)] >> registers[parseInt(data[4], 10)];
        } else {
            // Otherwise use the actual number
            registers[parseInt(data[1], 10)] = registers[parseInt(data[2])] >> parseInt(data[4], 10);
        }
        return {}; // End of processing instruction
    }),
    new Instruction('Halt', 'HALT', () => {
        return {
            halt: true
        }
    }),
    // label: is not an instruction, but is parsed as one
    new Instruction('Label', '<label>:')
];

const parse = (input) => {
    // Read in each line, and split the lines
    // Then remove comments
    // Then remove empty lines
    const lines = input
        .split('\n')
        .map(line => line.replace(/\/\/(.+)/, '').trim())
        .filter(line => line !== '')

    const memory = JSON.parse(lines.shift());
    const registers = {};
    const labels = {};
    let i;
    let operations = 0;

    const program = lines
        .map(line => line.trim())
        .map((line) => {
            const operation = instructions.find(set => set.regexp.test(line));
            return {
                line,
                operation
            }
        });
    
    // Get the program counter position for labels
    for(i = 0; i < program.length; i++) {
        if (program[i].operation.name === 'Label') {
            const data = program[i].operation.regexp.exec(program[i].line);
            labels[data[1]] = i;
        }
    }

    for(i = 0; i < program.length; i++) {
        const result = program[i].operation.run(memory, registers, labels, program[i].line);
        operations++;
        console.log('==============');
        console.log('Instruction Counter: ', i);
        console.log('Operations: ', operations);
        console.log('Line: ', program[i].line);
        console.log('Type: ', program[i].operation.name);
        console.log('Memory: ', memory);
        console.log('Registers: ', registers);
        if (result.goto) {
            i = result.goto;
        } else if (result.halt) {
            break;
        }
    }
};
