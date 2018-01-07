import DataTexture from './render-utils/data-texture'
import createProgram from './render-utils/create-program'
import createShader from './render-utils/create-shader'
import { gl } from './render-utils/render-context'
import Shader, { IUniform, IUniforms, UniformTypes } from './render-utils/shader'

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

    lineAlpha = max(0.05 - distanceToPair, 0.0) * 1.0;

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

    outColor = vec4(0.0, 0.0, 0.0, lineAlpha);
  }
`

export default class LineNetwork {
  private _numPoints: number = 64
  private _linesShader: Shader
  private _linesShaderUniforms: IUniforms  
  private _shaderProgramLines: WebGLProgram

  // Point and line data
  private _pointTextureCoords: number[] = []
  private _lineTextureCoords: number[] = []
  private _inversedLineTextureCoords: number[] = []
  private _lines: number[] = []
  private _lineLengths: number[] = []

  constructor() {
    this._linesShader = new Shader(vertexShaderLinesSrc, fragmentShaderLinesSrc)
    this._linesShaderUniforms = {
      pointPositions: { type: UniformTypes.Texture2d, value: null },
    }
    this._linesShader.uniforms = this._linesShaderUniforms
    this._shaderProgramLines = createProgram(gl, this._linesShader) 
    
    for (let i = 0; i < this._numPoints * 3; i += 3) {
      for (let j = i + 3; j < this._numPoints * 3; j += 3) {
        this._lines.push(0), this._lines.push(0), this._lines.push(0)
        this._lines.push(0), this._lines.push(0), this._lines.push(0)
      }
    }

    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        this._pointTextureCoords.push(x / 8.0)
        this._pointTextureCoords.push(y / 8.0)
      }
    }

    for (let i = 0; i < this._pointTextureCoords.length; i += 2) {
      for (let j = i + 2; j < this._pointTextureCoords.length; j += 2) {
        this._lineTextureCoords.push(this._pointTextureCoords[i + 0]), this._lineTextureCoords.push(this._pointTextureCoords[i + 1])
        this._lineTextureCoords.push(this._pointTextureCoords[j + 0]), this._lineTextureCoords.push(this._pointTextureCoords[j + 1])
        
        this._inversedLineTextureCoords.push(this._pointTextureCoords[j + 0]), this._inversedLineTextureCoords.push(this._pointTextureCoords[j + 1])
        this._inversedLineTextureCoords.push(this._pointTextureCoords[i + 0]), this._inversedLineTextureCoords.push(this._pointTextureCoords[i + 1])
      }
    }

    console.log(this._lineTextureCoords.length, this._lines.length)
  }

  public render(pointPositions: WebGLTexture) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.clearColor(1.0, 1.0, 1.0, 1.0)

    gl.useProgram(this._shaderProgramLines)

    this._linesShader.setUniform('pointPositions', { type: UniformTypes.Texture2d, value: pointPositions })

    const texCoordsBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordsBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._lineTextureCoords), gl.STATIC_DRAW)
    const lineCoords = gl.getAttribLocation(this._shaderProgramLines, 'a_textureCoords')
    gl.vertexAttribPointer(lineCoords, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(lineCoords)

    const inversedTexCoordsBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, inversedTexCoordsBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._inversedLineTextureCoords), gl.STATIC_DRAW)
    const inversedLineCoords = gl.getAttribLocation(this._shaderProgramLines, 'a_inversedTextureCoords')
    gl.vertexAttribPointer(inversedLineCoords, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(inversedLineCoords)

    gl.enable(gl.DEPTH_TEST)
    gl.viewport(0, 0, window.innerWidth, window.innerHeight)
    gl.drawArrays(gl.LINES, 0, this._lines.length / 3)
  }
}
