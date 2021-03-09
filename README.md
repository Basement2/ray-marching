# ray-marching

Embedding ray marching in html files only

## Install

From NPM
```shell
npm i ray-marching
```
or CDN
```html
<script src="https://unpkg.com/ray-marching@1.0.0/lib/ray-marching.js"></script>
```

## Usage

```html
<ray-marching>
  <script type="x-shader/x-fragment">
    precision mediump float;
    uniform float time;
    uniform vec2  mouse;
    uniform vec2  resolution;

    void main( void ) {
      vec2 p = gl_FragCoord.xy / max(resolution.x, resolution.y);
      gl_FragColor = vec4(p, mouse.x, 1.0);
    }
  </script>
</ray-marching>
```

![sc](https://user-images.githubusercontent.com/9010553/110488345-bda4b200-8131-11eb-914a-a051d7adae29.png)