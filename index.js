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
    constructor(name, match) {
        this.name = name;

        // Convert the instruction string into a regular expression which can be parsed
        const regexString = match
            .replace(/<register>/g, 'R(\\d+)')
            .replace(/<memory>/g, '(\\d+)')
            .replace(/<operand>/g, '([R#])(\\d+)')
            .replace(/<label>/g, '([\\w\\d]+)')
            .replace(/\s/g, '(?:\\s)?')
        this.regexp = new RegExp(regexString);

        console.log(this.regexp);
    }

    run(memory, registers, labels, line) {
        const data = this.regexp.exec(line);
        this.execute(memory, registers, labels, data);
    }
}

const instructions = [
    new Instruction('Load to register', 'LDR <register>, <memory>'),
    new Instruction('Store to memory', 'STR <register>, <memory>'),
    new Instruction('Add', 'ADD <register>, <register>, <operand>'),
    new Instruction('Subtract', 'SUB <register>, <register>, <operand>'),
    new Instruction('Copy to register', 'MOV <register>, <operand>'),
    new Instruction('Compare', 'CMP <register>, <operand>'),
    new Instruction('Branch if equal to', 'BEQ <label>'),
    new Instruction('Branch if not equal to', 'BNE <label>'),
    new Instruction('Branch if greater than', 'BGT <label>'),
    new Instruction('Branch if less than', 'BLT <label>'),
    new Instruction('Branch', 'B <label>'),
    new Instruction('AND', 'AND <register>, <register>, <operand>'),
    new Instruction('OR', 'ORR <register>, <register>, <operand>'),
    new Instruction('XOR', 'EOR <register>, <register>, <operand>'),
    new Instruction('NOT', 'MVN <register>, <operand>'),
    new Instruction('Logically shift left', 'LSL <register>, <register>, <operand>'),
    new Instruction('Logically shift right', 'LSR <register>, <register>, <operand>'),
    new Instruction('Halt', 'HALT'),
    // label: is not an instruction, but is parsed as one
    new Instruction('Label', '<label>:')
]

const parse = (input) => {
    const memory = [];
    const registers = [];
    const labels = {};
    let i;

    const program = input
        .split('\n')
        .map(line => line.trim())
        .map((line) => {
            const operation = instructions.find(set => set.regexp.test(line));
            return {
                line,
                operation
            }
        })
        .forEach(op => console.log(op));

    for(i = 0; i < program.length; i++) {
        program.operation.run(memory, registers, labels, program.line);
    }
};
