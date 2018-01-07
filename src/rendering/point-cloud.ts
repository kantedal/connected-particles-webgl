import DataTexture from './render-utils/data-texture'
import createProgram from './render-utils/create-program'
import createShader from './render-utils/create-shader'
import { gl } from './render-utils/render-context'
import Shader, { IUniform, IUniforms, UniformTypes } from './render-utils/shader'

// language=GLSL
const vertexShaderPointsSrc = `#version 300 es
  in vec2 a_textureCoords;

  uniform sampler2D pointPositions;

  void main() {
    vec3 pos = texture(pointPositions, a_textureCoords).xyz;
    gl_Position = vec4(pos, 1.0);
    gl_PointSize = 3.0;
  }
`

// language=GLSL
const fragmentShaderPointsSrc = `#version 300 es
  #extension GL_OES_standard_derivatives : enable
  precision highp float;

  out vec4 outColor;

  void main() {
    float r = 0.0, delta = 0.0, alpha = 1.0;
    vec2 cxy = 2.0 * gl_PointCoord - 1.0;
    r = dot(cxy, cxy);

    delta = fwidth(r);
    alpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);

    outColor = vec4(gl_PointCoord, 0.0, 1.0) * alpha;
  }
`

export default class PointCloud {
  private _numPoints: number = 64
  private _pointsShader: Shader
  private _pointsShaderUniforms: IUniforms
  private _shaderProgramPoints: WebGLProgram

  // Point and line data
  private _points: number[] = []
  private _pointTextureCoords: number[] = []

  constructor() {
    for (let i = 0; i < this._numPoints; i++) {
      this._points.push(Math.random() * 2.0 - 1.0)
      this._points.push(Math.random() * 2.0 - 1.0)
      this._points.push(Math.random() * 2.0 - 1.0)
    }

    this._pointsShader = new Shader(vertexShaderPointsSrc, fragmentShaderPointsSrc)
    this._pointsShaderUniforms = {
      pointPositions: { type: UniformTypes.Texture2d, value: null },
    }
    this._pointsShader.uniforms = this._pointsShaderUniforms
    this._shaderProgramPoints = createProgram(gl, this._pointsShader)

    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        this._pointTextureCoords.push(x / 8.0)
        this._pointTextureCoords.push(y / 8.0)
      }
    }
  }

  public render(pointPositions: WebGLTexture) {
    // Points
    gl.useProgram(this._shaderProgramPoints)

    this._pointsShader.setUniform('pointPositions', {
      type: UniformTypes.Texture2d,
      value: pointPositions
    })

    const vertexBufferTexCoords = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferTexCoords)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._pointTextureCoords), gl.STATIC_DRAW)
    const textureCoordsPoints = gl.getAttribLocation(this._shaderProgramPoints, 'a_textureCoords')
    gl.vertexAttribPointer(textureCoordsPoints, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(textureCoordsPoints)

    gl.enable(gl.DEPTH_TEST)
    gl.viewport(0, 0, window.innerWidth, window.innerHeight)
    gl.drawArrays(gl.POINTS, 0, this._numPoints)
  }
}
