import type { Sheet } from "./sheet";

const MAX_QUADS = 4096;
const STRIDE = 5;

const VERTEX = `#version 300 es
uniform vec2 uScreen;

layout(location = 0) in vec2 aPosition;
layout(location = 1) in vec2 aUv;
layout(location = 2) in vec4 aTint;

out vec2 vUv;
out vec4 vTint;

void main() {
  vec2 clip = aPosition / uScreen * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  vUv = aUv;
  vTint = aTint;
}`;

const FRAGMENT = `#version 300 es
precision mediump float;

uniform sampler2D uTexture;

in vec2 vUv;
in vec4 vTint;

out vec4 color;

void main() {
  color = texture(uTexture, vUv) * vTint;
}`;

export class Renderer {
  private readonly gl: WebGL2RenderingContext;
  private readonly data = new ArrayBuffer(MAX_QUADS * 4 * STRIDE * 4);
  private readonly floats = new Float32Array(this.data);
  private readonly colors = new Uint32Array(this.data);
  private readonly textures = new WeakMap<HTMLImageElement, WebGLTexture>();

  private image: HTMLImageElement | null = null;
  private texture: WebGLTexture | null = null;
  private start = 0;
  private quads = 0;

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2", { alpha: false, antialias: false });
    if (!gl) throw new Error("WebGL2 not supported");

    this.gl = gl;

    const program = link(gl, VERTEX, FRAGMENT);
    gl.useProgram(program);
    gl.uniform2f(
      gl.getUniformLocation(program, "uScreen"),
      canvas.width,
      canvas.height,
    );

    gl.bindVertexArray(gl.createVertexArray());

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, this.data.byteLength, gl.DYNAMIC_DRAW);

    const bytes = STRIDE * 4;
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, bytes, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, bytes, 8);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 4, gl.UNSIGNED_BYTE, true, bytes, 16);

    const indices = new Uint16Array(MAX_QUADS * 6);
    for (let quad = 0; quad < MAX_QUADS; quad++) {
      const i = quad * 6;
      const v = quad * 4;

      indices[i] = v;
      indices[i + 1] = v + 1;
      indices[i + 2] = v + 2;
      indices[i + 3] = v;
      indices[i + 4] = v + 2;
      indices[i + 5] = v + 3;
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  begin(background: number): void {
    const { gl } = this;

    this.start = 0;
    this.quads = 0;

    gl.clearColor(
      ((background >> 16) & 255) / 255,
      ((background >> 8) & 255) / 255,
      (background & 255) / 255,
      1,
    );
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  draw(
    sheet: Sheet,
    cell: number,
    x: number,
    y: number,
    flip = false,
    tint = 0xffffff,
  ): void {
    if (sheet.image !== this.image) {
      this.flush();
      this.image = sheet.image;
      this.texture = this.upload(sheet.image);
    }

    if (this.quads === MAX_QUADS) {
      this.flush();
      this.start = 0;
      this.quads = 0;
    }

    const { cellWidth, cellHeight, columns, uvWidth, uvHeight } = sheet;

    const left = (cell % columns) * uvWidth;
    const right = left + uvWidth;
    const u0 = flip ? right : left;
    const u1 = flip ? left : right;
    const v0 = Math.floor(cell / columns) * uvHeight;
    const v1 = v0 + uvHeight;

    const x0 = Math.round(x);
    const y0 = Math.round(y);
    const x1 = x0 + cellWidth;
    const y1 = y0 + cellHeight;

    const color =
      (0xff000000 |
        ((tint & 0xff) << 16) |
        (tint & 0xff00) |
        ((tint >> 16) & 0xff)) >>>
      0;

    const { floats, colors } = this;
    const i = this.quads * 4 * STRIDE;

    floats[i] = x0;
    floats[i + 1] = y0;
    floats[i + 2] = u0;
    floats[i + 3] = v0;
    colors[i + 4] = color;

    floats[i + 5] = x1;
    floats[i + 6] = y0;
    floats[i + 7] = u1;
    floats[i + 8] = v0;
    colors[i + 9] = color;

    floats[i + 10] = x1;
    floats[i + 11] = y1;
    floats[i + 12] = u1;
    floats[i + 13] = v1;
    colors[i + 14] = color;

    floats[i + 15] = x0;
    floats[i + 16] = y1;
    floats[i + 17] = u0;
    floats[i + 18] = v1;
    colors[i + 19] = color;

    this.quads++;
  }

  end(): void {
    this.flush();
  }

  private flush(): void {
    const { gl, start } = this;
    const count = this.quads - start;

    if (count === 0) return;

    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.bufferSubData(
      gl.ARRAY_BUFFER,
      start * 4 * STRIDE * 4,
      this.floats,
      start * 4 * STRIDE,
      count * 4 * STRIDE,
    );
    gl.drawElements(gl.TRIANGLES, count * 6, gl.UNSIGNED_SHORT, start * 6 * 2);

    this.start = this.quads;
  }

  private upload(image: HTMLImageElement): WebGLTexture {
    let texture = this.textures.get(image);
    if (texture) return texture;

    const { gl } = this;

    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    this.textures.set(image, texture);
    return texture;
  }
}

function link(
  gl: WebGL2RenderingContext,
  vertex: string,
  fragment: string,
): WebGLProgram {
  const program = gl.createProgram();

  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vertex));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragment));
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) ?? "Program failed");
  }

  return program;
}

function compile(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Shader failed");

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) ?? "Shader failed");
  }

  return shader;
}
