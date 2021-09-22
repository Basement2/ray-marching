export class RayMarching extends HTMLElement {
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
  beginAt: number;
  resizeObserver: ResizeObserver;
  intersectionObserver: IntersectionObserver;
  isIntersecting: boolean;

  static get observedAttributes() {
    return ['time'];
  }

  get time() {
    const time = this.getAttribute('time');
    return Number(time) || 0;
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.isIntersecting = false;
    this.shadowRoot.innerHTML = this.template();
    // Element
    this.$canvas = this.shadowRoot.querySelector('canvas');
    // Context
    this.gl = this.$canvas.getContext(`webgl`);
    if (this.gl === null) {
      throw new Error('WebGL not supported.');
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'time' && this.isIntersecting) {
      const time = Number(newValue) || 0;
      this.once(time);
    }
  }

  connectedCallback() {
    setTimeout(() => {
      this.setupShader();

      // Event
      this.resizeObserver = new ResizeObserver(this.handleResize.bind(this));
      this.resizeObserver.observe(this);
      this.intersectionObserver = new IntersectionObserver(
        this.handleIntersection.bind(this),
        {
          root: null,
        }
      );
      this.intersectionObserver.observe(this);

      this.addEventListener('mousemove', this.handleMousemove.bind(this));

      this.beginAt = Date.now();
    }, 0);
  }

  disconnectedCallback() {
    cancelAnimationFrame(this.requestID);
    this.resizeObserver.unobserve(this);
    this.intersectionObserver.unobserve(this);
  }

  handleResize(entries) {
    const { width, height } = entries[0].contentRect;
    this.$canvas.width = width / 2;
    this.$canvas.height = height / 2;
    this.gl.uniform2fv(this.uniformLocation.resolution, [
      this.$canvas.width,
      this.$canvas.height,
    ]);
  }

  handleIntersection(entries) {
    const isIntersecting = entries[0].isIntersecting;
    if (this.isIntersecting && !isIntersecting) {
      cancelAnimationFrame(this.requestID);
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

  handleMousemove(e) {
    this.gl.uniform2fv(this.uniformLocation.mouse, [
      Math.max(0, e.offsetX) / this.clientWidth,
      (this.clientHeight - e.offsetY) / this.clientHeight,
    ]);
  }

  setupShader() {
    const fShaderScript = this.querySelector('[type="x-shader/x-fragment"]');
    const vs = this.createShader(
      this.gl.VERTEX_SHADER,
      `attribute vec3 position;void main(){gl_Position=vec4(position,1.);}`
    );
    const fs = this.createShader(
      this.gl.FRAGMENT_SHADER,
      fShaderScript.textContent
    );
    this.program = this.createProgramObject(vs, fs);
    this.gl.useProgram(this.program);

    // Get location
    this.attribLocation = this.gl.getAttribLocation(this.program, 'position');
    this.uniformLocation = {
      resolution: this.gl.getUniformLocation(this.program, 'resolution'),
      mouse: this.gl.getUniformLocation(this.program, 'mouse'),
      time: this.gl.getUniformLocation(this.program, 'time'),
    };

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.gl.createBuffer());
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array([-1, 1, 0, -1, -1, 0, 1, 1, 0, 1, -1, 0]),
      this.gl.STATIC_DRAW
    );
    this.gl.enableVertexAttribArray(this.attribLocation);
    this.gl.vertexAttribPointer(
      this.attribLocation,
      3,
      this.gl.FLOAT,
      false,
      0,
      0
    );
  }

  template() {
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

  createShader(type, source): WebGLShader | string {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      return shader;
    }
    return this.gl.getShaderInfoLog(shader);
  }

  createProgramObject(vs, fs): WebGLProgram | string {
    const program = this.gl.createProgram();
    this.gl.attachShader(program, vs);
    this.gl.attachShader(program, fs);
    this.gl.linkProgram(program);
    this.gl.deleteShader(vs);
    this.gl.deleteShader(fs);
    if (this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      this.gl.useProgram(program);
      return program;
    }
    return this.gl.getProgramInfoLog(program);
  }

  once(time: number) {
    // Clear
    this.gl.viewport(0, 0, this.$canvas.width, this.$canvas.height);
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    this.gl.uniform1f(this.uniformLocation.time, time);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
  }

  render() {
    // Clear
    this.gl.viewport(0, 0, this.$canvas.width, this.$canvas.height);
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    // Sec.
    this.gl.uniform1f(
      this.uniformLocation.time,
      (Date.now() - this.beginAt) * 0.001
    );

    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    this.requestID = requestAnimationFrame(this.render.bind(this));
  }
}

window.customElements.define('ray-marching', RayMarching);
