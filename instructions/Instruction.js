export default class Instruction {
    constructor(name, regexp, execute) {
        this.name = name;
        this.data = null;
        this.regexp = new RegExp(regexp);
        this.execute = execute;
    }

    parse(input) {
        const result = this.regexp.exec(input);
        if (result) {
            this.data = result;
            return true;
        } else {
            return false;
        }
    }

    execute(memory) {
        if (!this.data) {
            throw new Error('This instruction has not been parsed yet');
        }
    }
}