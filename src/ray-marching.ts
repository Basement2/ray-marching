export class RayMarching extends HTMLElement {
  $canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext | WebGL2RenderingContext;
  program?: WebGLProgram;
  attribLocation?: number;
  uniformLocation?: {
    resolution: WebGLUniformLocation | null;
    mouse: WebGLUniformLocation | null;
    time: WebGLUniformLocation | null;
  };
  requestID?: number;
  beginAt?: number;
  resizeObserver?: ResizeObserver;
  intersectionObserver?: IntersectionObserver;
  childObserver?: MutationObserver;
  isIntersecting: boolean;

  static get observedAttributes(): string[] {
    return ['time'];
  }

  get time(): number {
    const time = this.getAttribute('time');
    return Number(time) || 0;
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.isIntersecting = false;
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = this.template();
    }
    // Element
    const canvas = this.shadowRoot?.querySelector('canvas');
    if (!canvas) {
      throw new Error('Canvas element not found in shadow root.');
    }
    this.$canvas = canvas;
    // Context (WebGL 2.0 with WebGL 1.0 fallback)
    const gl = (this.$canvas.getContext('webgl2') ||
      this.$canvas.getContext('webgl')) as
      WebGLRenderingContext | WebGL2RenderingContext | null;
    if (gl === null) {
      throw new Error('WebGL not supported.');
    }
    this.gl = gl;
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void {
    if (name === 'time' && this.isIntersecting) {
      const time = Number(newValue) || 0;
      this.once(time);
    }
  }

  connectedCallback(): void {
    setTimeout(() => {
      this.setupShader();

      // Event
      this.resizeObserver = new ResizeObserver(this.handleResize.bind(this));
      this.resizeObserver.observe(this);
      this.intersectionObserver = new IntersectionObserver(
        this.handleIntersection.bind(this),
        {
          root: null,
        },
      );
      this.intersectionObserver.observe(this);

      this.addEventListener('mousemove', this.handleMousemove.bind(this));

      this.beginAt = Date.now();
    }, 0);
  }

  disconnectedCallback(): void {
    if (this.requestID !== undefined) {
      cancelAnimationFrame(this.requestID);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    if (this.childObserver) {
      this.childObserver.disconnect();
    }
  }

  handleResize(entries: ResizeObserverEntry[]): void {
    const { width, height } = entries[0].contentRect;
    this.$canvas.width = width / 2;
    this.$canvas.height = height / 2;
    if (this.gl && this.uniformLocation) {
      this.gl.uniform2fv(this.uniformLocation.resolution, [
        this.$canvas.width,
        this.$canvas.height,
      ]);
    }
  }

  handleIntersection(entries: IntersectionObserverEntry[]): void {
    const isIntersecting = entries[0].isIntersecting;
    if (this.isIntersecting && !isIntersecting) {
      if (this.requestID !== undefined) {
        cancelAnimationFrame(this.requestID);
      }
    }
    if (!this.isIntersecting && isIntersecting) {
      const time = this.getAttribute('time');
      if (!time) {
        this.render();
      } else {
        this.once(Number(time) || 0);
      }
    }
    this.isIntersecting = isIntersecting;
  }

  handleMousemove(e: MouseEvent): void {
    if (!this.gl || !this.uniformLocation) return;
    this.gl.uniform2fv(this.uniformLocation.mouse, [
      Math.max(0, e.offsetX) / this.clientWidth,
      (this.clientHeight - e.offsetY) / this.clientHeight,
    ]);
  }

  setupShader(): void {
    const fShaderScript = this.querySelector('[type="x-shader/x-fragment"]');
    if (!fShaderScript) {
      if (!this.childObserver) {
        this.childObserver = new MutationObserver(() => {
          const script = this.querySelector('[type="x-shader/x-fragment"]');
          if (script) {
            this.childObserver?.disconnect();
            this.setupShader();
          }
        });
        this.childObserver.observe(this, { childList: true });
      }
      return;
    }
    const vs = this.createShader(
      this.gl.VERTEX_SHADER,
      `attribute vec3 position;void main(){gl_Position=vec4(position,1.);}`,
    );
    const fs = this.createShader(
      this.gl.FRAGMENT_SHADER,
      fShaderScript.textContent || '',
    );
    if (!vs || !fs) {
      return;
    }
    const program = this.createProgramObject(vs, fs);
    if (!program) {
      return;
    }
    this.program = program;
    this.gl.useProgram(this.program);

    // Get location
    this.attribLocation = this.gl.getAttribLocation(this.program, 'position');
    if (this.attribLocation === -1) {
      console.error('Attribute "position" not found in shader.');
      return;
    }
    this.uniformLocation = {
      resolution: this.gl.getUniformLocation(this.program, 'resolution'),
      mouse: this.gl.getUniformLocation(this.program, 'mouse'),
      time: this.gl.getUniformLocation(this.program, 'time'),
    };

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.gl.createBuffer());
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array([-1, 1, 0, -1, -1, 0, 1, 1, 0, 1, -1, 0]),
      this.gl.STATIC_DRAW,
    );
    this.gl.enableVertexAttribArray(this.attribLocation);
    this.gl.vertexAttribPointer(
      this.attribLocation,
      3,
      this.gl.FLOAT,
      false,
      0,
      0,
    );
  }

  template(): string {
    return `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
        }
        .container {
        }
        canvas {
          width: 100%;
          height: 100%;
        }
      </style>
      <div class="container">
        <slot></slot>
        <canvas></canvas>
      </div>
    `;
  }

  createShader(type: GLenum, source: string): WebGLShader | null {
    const shader = this.gl.createShader(type);
    if (!shader) {
      console.error('Failed to create shader.');
      return null;
    }
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      return shader;
    }
    console.error('Shader compile error:', this.gl.getShaderInfoLog(shader));
    this.gl.deleteShader(shader);
    return null;
  }

  createProgramObject(vs: WebGLShader, fs: WebGLShader): WebGLProgram | null {
    const program = this.gl.createProgram();
    if (!program) {
      console.error('Failed to create program.');
      return null;
    }
    this.gl.attachShader(program, vs);
    this.gl.attachShader(program, fs);
    this.gl.linkProgram(program);
    this.gl.deleteShader(vs);
    this.gl.deleteShader(fs);
    if (this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      return program;
    }
    console.error('Program link error:', this.gl.getProgramInfoLog(program));
    this.gl.deleteProgram(program);
    return null;
  }

  once(time: number): void {
    if (!this.gl || !this.uniformLocation) return;
    // Clear
    this.gl.viewport(0, 0, this.$canvas.width, this.$canvas.height);
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    this.gl.uniform1f(this.uniformLocation.time, time);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
  }

  render(): void {
    if (!this.gl || !this.uniformLocation || this.beginAt === undefined) return;
    // Clear
    this.gl.viewport(0, 0, this.$canvas.width, this.$canvas.height);
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    // Sec.
    this.gl.uniform1f(
      this.uniformLocation.time,
      (Date.now() - this.beginAt) * 0.001,
    );

    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    this.requestID = requestAnimationFrame(this.render.bind(this));
  }
}

window.customElements.define('ray-marching', RayMarching);
