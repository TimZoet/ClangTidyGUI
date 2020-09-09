export class Diagnostic {
    constructor(
        public sourceFile: string,
        public category: string,
        public issue: string,
        public offset: number,
        public line: number,
        public message: string
    ) {

    }
}