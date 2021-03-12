(()=>{var s=class extends HTMLElement{constructor(){super();if(this.attachShadow({mode:"open"}),this.isIntersecting=!1,this.shadowRoot.innerHTML=this.template(),this.$canvas=this.shadowRoot.querySelector("canvas"),this.gl=this.$canvas.getContext("webgl"),this.gl===null)throw new Error("WebGL not supported.")}attributeChangedCallback(){}connectedCallback(){setTimeout(()=>{this.setupShader(),this.resizeObserver=new ResizeObserver(this.handleResize.bind(this)),this.resizeObserver.observe(this),this.intersectionObserver=new IntersectionObserver(this.handleIntersection.bind(this),{root:null}),this.intersectionObserver.observe(this),this.addEventListener("mousemove",this.handleMousemove.bind(this)),this.beginAt=Date.now()},0)}disconnectedCallback(){cancelAnimationFrame(this.requestID),this.resizeObserver.unobserve(this),this.intersectionObserver.unobserve(this)}handleResize(e){let{width:i,height:t}=e[0].contentRect;this.$canvas.width=i/2,this.$canvas.height=t/2,this.gl.uniform2fv(this.uniformLocation.resolution,[this.$canvas.width,this.$canvas.height])}handleIntersection(e){let i=e[0].isIntersecting;this.isIntersecting&&!i&&cancelAnimationFrame(this.requestID),!this.isIntersecting&&i&&this.render(),this.isIntersecting=i}handleMousemove(e){this.gl.uniform2fv(this.uniformLocation.mouse,[Math.max(0,e.offsetX)/this.clientWidth,(this.clientHeight-e.offsetY)/this.clientHeight])}setupShader(){let e=this.querySelector('[type="x-shader/x-fragment"]'),i=this.createShader(this.gl.VERTEX_SHADER,"attribute vec3 position;void main(){gl_Position=vec4(position,1.);}"),t=this.createShader(this.gl.FRAGMENT_SHADER,e.textContent);this.program=this.createProgramObject(i,t),this.gl.useProgram(this.program),this.attribLocation=this.gl.getAttribLocation(this.program,"position"),this.uniformLocation={resolution:this.gl.getUniformLocation(this.program,"resolution"),mouse:this.gl.getUniformLocation(this.program,"mouse"),time:this.gl.getUniformLocation(this.program,"time")},this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.gl.createBuffer()),this.gl.bufferData(this.gl.ARRAY_BUFFER,new Float32Array([-1,1,0,-1,-1,0,1,1,0,1,-1,0]),this.gl.STATIC_DRAW),this.gl.enableVertexAttribArray(this.attribLocation),this.gl.vertexAttribPointer(this.attribLocation,3,this.gl.FLOAT,!1,0,0)}template(){return`
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
    `}createShader(e,i){let t=this.gl.createShader(e);return this.gl.shaderSource(t,i),this.gl.compileShader(t),this.gl.getShaderParameter(t,this.gl.COMPILE_STATUS)?t:this.gl.getShaderInfoLog(t)}createProgramObject(e,i){let t=this.gl.createProgram();return this.gl.attachShader(t,e),this.gl.attachShader(t,i),this.gl.linkProgram(t),this.gl.deleteShader(e),this.gl.deleteShader(i),this.gl.getProgramParameter(t,this.gl.LINK_STATUS)?(this.gl.useProgram(t),t):this.gl.getProgramInfoLog(t)}render(){this.gl.viewport(0,0,this.$canvas.width,this.$canvas.height),this.gl.clearColor(0,0,0,1),this.gl.clear(this.gl.COLOR_BUFFER_BIT),this.gl.uniform1f(this.uniformLocation.time,(Date.now()-this.beginAt)*.001),this.gl.drawArrays(this.gl.TRIANGLE_STRIP,0,4),this.requestID=requestAnimationFrame(this.render.bind(this))}};window.customElements.define("ray-marching",s);})();
//# sourceMappingURL=ray-marching.js.map
