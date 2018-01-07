import DataTexture from '../utils/data-texture'
import createProgram from '../utils/create-program'
import createShader from '../utils/create-shader'
import { gl } from '../utils/render-context'
import Shader, { IUniform, IUniforms, UniformTypes } from '../utils/shader'

// language=GLSL
const vertexShaderPointsSrc = `#version 300 es
  in vec2 a_textureCoords;
  in float a_pointSize;

  uniform sampler2D pointPositions;

  void main() {
    vec3 pos = texture(pointPositions, a_textureCoords).xyz;
    gl_Position = vec4(pos, 1.0);
    gl_PointSize = a_pointSize;
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

    outColor = vec4(1.0, 1.0, 1.0, 0.1) * alpha;
  }
`

export default class PointCloud {
  private _numPoints: number = 64
  private _pointsShader: Shader
  private _pointsShaderUniforms: IUniforms
  private _shaderProgramPoints: WebGLProgram

  // Point and line data
  private _pointTextureCoords: Float32Array
  private _pointTextureCoordsBuffer: WebGLBuffer | null
  private _pointSizes: Float32Array
  private _pointSizesBuffer: WebGLBuffer | null
  
  constructor() {
    this._pointsShader = new Shader(vertexShaderPointsSrc, fragmentShaderPointsSrc)
    this._pointsShaderUniforms = {
      pointPositions: { type: UniformTypes.Texture2d, value: null },
    }
    this._pointsShader.uniforms = this._pointsShaderUniforms
    this._shaderProgramPoints = createProgram(gl, this._pointsShader)

    const pointTextureCoords: number[] = []
    const pointSizes: number[] = []
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        pointTextureCoords.push(x / 8.0), pointTextureCoords.push(y / 8.0)
        pointSizes.push(Math.random() * 5.0 + 2.0)
      }
    }
    this._pointTextureCoords = new Float32Array(pointTextureCoords)
    this._pointSizes = new Float32Array(pointSizes)

    this._pointTextureCoordsBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this._pointTextureCoordsBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, this._pointTextureCoords, gl.STATIC_DRAW)

    this._pointSizesBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this._pointSizesBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, this._pointSizes, gl.STATIC_DRAW)
  }

  public render(pointPositions: WebGLTexture) {
    gl.useProgram(this._shaderProgramPoints)

    this._pointsShaderUniforms.pointPositions.value = pointPositions

    gl.bindBuffer(gl.ARRAY_BUFFER, this._pointTextureCoordsBuffer)
    const textureCoordsPoints = gl.getAttribLocation(this._shaderProgramPoints, 'a_textureCoords')
    gl.vertexAttribPointer(textureCoordsPoints, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(textureCoordsPoints)

    gl.bindBuffer(gl.ARRAY_BUFFER, this._pointSizesBuffer)
    const pointSizesLocation = gl.getAttribLocation(this._shaderProgramPoints, 'a_pointSize')
    gl.vertexAttribPointer(pointSizesLocation, 1, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(pointSizesLocation)

    // gl.enable(gl.DEPTH_TEST)
    gl.viewport(0, 0, window.innerWidth, window.innerHeight)
    gl.drawArrays(gl.POINTS, 0, this._numPoints)
  }
}
