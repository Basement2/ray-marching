export declare class RayMarching extends HTMLElement {
    $canvas: HTMLCanvasElement;
    gl: WebGLRenderingContext;
    program: WebGLProgram;
    attribLocation: number;
    uniformLocation: {
        resolution: WebGLUniformLocation;
        mouse: WebGLUniformLocation;
        time: WebGLUniformLocation;
    };
    requestID: number;
    time: number;
    beginAt: number;
    resizeObserver: ResizeObserver;
    intersectionObserver: IntersectionObserver;
    isIntersecting: boolean;
    constructor();
    attributeChangedCallback(): void;
    connectedCallback(): void;
    disconnectedCallback(): void;
    handleResize(entries: any): void;
    handleIntersection(entries: any): void;
    handleMousemove(e: any): void;
    setupShader(): void;
    template(): string;
    createShader(type: any, source: any): WebGLShader | string;
    createProgramObject(vs: any, fs: any): WebGLProgram | string;
    render(): void;
}
