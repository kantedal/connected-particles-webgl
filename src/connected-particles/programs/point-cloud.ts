import DataTexture from '../utils/data-texture'
import createProgram from '../utils/create-program'
import createShader from '../utils/create-shader'
import { gl } from '../utils/render-context'
import Shader, { IUniform, IUniforms, UniformTypes } from '../utils/shader'

// language=GLSL
const vertexShaderPointsSrc = `#version 300 es
  in vec2 a_textureCoords;
  in float a_pointSize;
  in vec3 a_randomParameters;

  uniform sampler2D pointPositions;
  uniform float time;

  void main() {
    vec3 pos = texture(pointPositions, a_textureCoords).xyz;
    gl_Position = vec4(pos, 1.0);
    
    float sizeDelay = a_randomParameters.x;
    float sizeChangeSpeed = a_randomParameters.y;
    float pointSize = a_pointSize + (sin(time * sizeChangeSpeed + sizeDelay) + 1.0);
    gl_PointSize = 10.0;
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
  private _pointsShader: Shader
  private _pointsShaderUniforms: IUniforms
  private _shaderProgramPoints: WebGLProgram
  private _sizeX: number
  private _sizeY: number

  // Point and line data
  private _pointTextureCoords: Float32Array
  private _pointTextureCoordsBuffer: WebGLBuffer | null
  private _pointSizes: Float32Array
  private _pointSizesBuffer: WebGLBuffer | null
  private _randomParameters: Float32Array
  private _randomParametersBuffer: WebGLBuffer | null
  
  constructor(private _numPoints: number) {
    this._sizeX = Math.ceil(Math.sqrt(_numPoints))
    this._sizeY = Math.ceil(Math.sqrt(_numPoints))

    this._pointsShader = new Shader(vertexShaderPointsSrc, fragmentShaderPointsSrc)
    this._pointsShaderUniforms = {
      pointPositions: { type: UniformTypes.Texture2d, value: null },
      time: { type: UniformTypes.Float, value: 0 },
    }
    this._pointsShader.uniforms = this._pointsShaderUniforms
    this._shaderProgramPoints = createProgram(gl, this._pointsShader)

    const pointTextureCoords: number[] = []
    const pointSizes: number[] = []
    const randomParameters: number[] = []
    const texOffset = 1.0 / (this._sizeX * this._sizeY)
    for (let x = 0; x < this._sizeX; x++) {
      for (let y = 0; y < this._sizeY; y++) {
        pointTextureCoords.push(x / this._sizeX + texOffset), pointTextureCoords.push(y / this._sizeY + texOffset)
        pointSizes.push(Math.random() * 2.0 + 3.0)
        
        randomParameters.push(5.0 * (Math.random() - 0.5))
        randomParameters.push(5.0 * (Math.random() - 0.5))
        randomParameters.push(5.0 * (Math.random() - 0.5))
      }
    }

    this._pointTextureCoords = new Float32Array(pointTextureCoords)
    this._pointSizes = new Float32Array(pointSizes)
    this._randomParameters = new Float32Array(randomParameters)

    this._pointTextureCoordsBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this._pointTextureCoordsBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, this._pointTextureCoords, gl.STATIC_DRAW)

    this._pointSizesBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this._pointSizesBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, this._pointSizes, gl.STATIC_DRAW)

    this._randomParametersBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this._randomParametersBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, this._randomParameters, gl.STATIC_DRAW)
  }

  public render(pointPositions: WebGLTexture, time: number) {
    gl.useProgram(this._shaderProgramPoints)

    this._pointsShaderUniforms.pointPositions.value = pointPositions
    this._pointsShaderUniforms.time.value = time
    this._pointsShader.update()

    gl.bindBuffer(gl.ARRAY_BUFFER, this._pointTextureCoordsBuffer)
    const textureCoordsPoints = gl.getAttribLocation(this._shaderProgramPoints, 'a_textureCoords')
    gl.vertexAttribPointer(textureCoordsPoints, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(textureCoordsPoints)

    gl.bindBuffer(gl.ARRAY_BUFFER, this._pointSizesBuffer)
    const pointSizesLocation = gl.getAttribLocation(this._shaderProgramPoints, 'a_pointSize')
    gl.vertexAttribPointer(pointSizesLocation, 1, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(pointSizesLocation)

    gl.bindBuffer(gl.ARRAY_BUFFER, this._randomParametersBuffer)
    const randomParametersLocation = gl.getAttribLocation(this._shaderProgramPoints, 'a_randomParameters')
    gl.vertexAttribPointer(randomParametersLocation, 3, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(randomParametersLocation)

    // gl.enable(gl.DEPTH_TEST)
    gl.viewport(0, 0, window.innerWidth, window.innerHeight)
    gl.drawArrays(gl.POINTS, 0, this._numPoints)
  }
}
