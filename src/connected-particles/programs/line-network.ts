import DataTexture from '../utils/data-texture'
import createProgram from '../utils/create-program'
import createShader from '../utils/create-shader'
import { gl } from '../utils/render-context'
import Shader, { IUniform, IUniforms, UniformTypes } from '../utils/shader'

// language=GLSL
const vertexShaderLinesSrc = `#version 300 es
  in float distances;
  in vec2 a_textureCoords;
  in vec2 a_inversedTextureCoords;

  uniform sampler2D pointPositions;

  out float lineAlpha;

  float squaredDistance2d(vec2 p0, vec2 p1) {
    float dx = p1.x - p0.x;
    float dy = p1.y - p0.y;
    return dx * dx + dy * dy;
  }

  void main() {
    vec3 position = texture(pointPositions, a_textureCoords).xyz;
    vec3 pairPosition = texture(pointPositions, a_inversedTextureCoords).xyz;
    float distanceToPair = squaredDistance2d(position.xy, pairPosition.xy);

    lineAlpha = max(0.05 - distanceToPair, 0.0);

    gl_Position = vec4(position, 1.0);
  }
`

// language=GLSL
const fragmentShaderLinesSrc = `#version 300 es
  precision highp float;

  in float lineAlpha;
  out vec4 outColor;

  void main() {
    if (lineAlpha == 0.0) {
      discard;
    }

    outColor = vec4(0.0, 0.0, 0.0, lineAlpha * 1.5);
  }
`

export default class LineNetwork {
  private _linesShader: Shader
  private _linesShaderUniforms: IUniforms  
  private _shaderProgramLines: WebGLProgram
  private _sizeX: number
  private _sizeY: number

  // Buffers
  private _texCoordsBuffer: WebGLBuffer | null
  private _pairTexCoordsBuffer: WebGLBuffer | null

  // Point and line data
  private _lineTextureCoords: Float32Array
  private _pairLineTextureCoords: Float32Array
  private _lineCount: number = 0

  constructor(private _numPoints: number) {
    this._sizeX = Math.ceil(Math.sqrt(_numPoints))
    this._sizeY = Math.ceil(Math.sqrt(_numPoints))

    this._linesShader = new Shader(vertexShaderLinesSrc, fragmentShaderLinesSrc)
    this._linesShaderUniforms = {
      pointPositions: { type: UniformTypes.Texture2d, value: null },
    }
    this._linesShader.uniforms = this._linesShaderUniforms
    this._shaderProgramLines = createProgram(gl, this._linesShader) 
    
    for (let i = 0; i < this._sizeX * this._sizeY; i++) {
      for (let j = i + 1; j < this._sizeX * this._sizeY; j++) {
        this._lineCount += 2
      }
    }

    const texCoords: number[] = []
    for (let x = 0; x < this._sizeX; x++) {
      for (let y = 0; y < this._sizeY; y++) {
        texCoords.push(x / this._sizeX), texCoords.push(y / this._sizeY)
      }
    }

    const lineTextureCoords: number[] = []
    const pairLineTextureCoords: number[] = []
    for (let i = 0; i < texCoords.length; i += 2) {
      for (let j = i + 2; j < texCoords.length; j += 2) {
        lineTextureCoords.push(texCoords[i + 0]), lineTextureCoords.push(texCoords[i + 1])
        lineTextureCoords.push(texCoords[j + 0]), lineTextureCoords.push(texCoords[j + 1])
        
        pairLineTextureCoords.push(texCoords[j + 0]), pairLineTextureCoords.push(texCoords[j + 1])
        pairLineTextureCoords.push(texCoords[i + 0]), pairLineTextureCoords.push(texCoords[i + 1])
      }
    }
    this._lineTextureCoords = new Float32Array(lineTextureCoords)
    this._pairLineTextureCoords = new Float32Array(pairLineTextureCoords)

    this._texCoordsBuffer = gl.createBuffer()
    this._pairTexCoordsBuffer = gl.createBuffer()
  }

  public render(pointPositions: WebGLTexture) {
    gl.useProgram(this._shaderProgramLines)

    this._linesShader.setUniform('pointPositions', { type: UniformTypes.Texture2d, value: pointPositions })

    gl.bindBuffer(gl.ARRAY_BUFFER, this._texCoordsBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, this._lineTextureCoords, gl.STATIC_DRAW)
    const lineCoords = gl.getAttribLocation(this._shaderProgramLines, 'a_textureCoords')
    gl.vertexAttribPointer(lineCoords, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(lineCoords)

    gl.bindBuffer(gl.ARRAY_BUFFER, this._pairTexCoordsBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, this._pairLineTextureCoords, gl.STATIC_DRAW)
    const inversedLineCoords = gl.getAttribLocation(this._shaderProgramLines, 'a_inversedTextureCoords')
    gl.vertexAttribPointer(inversedLineCoords, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(inversedLineCoords)

    // gl.enable(gl.DEPTH_TEST)
    gl.viewport(0, 0, window.innerWidth, window.innerHeight)
    gl.drawArrays(gl.LINES, 0, this._lineCount)
  }
}
