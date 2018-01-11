import DataTexture from '../utils/data-texture'
import createProgram from '../utils/create-program'
import createShader from '../utils/create-shader'
import { gl } from '../utils/render-context'
import Shader, { IUniform, IUniforms, UniformTypes } from '../utils/shader'

// language=GLSL
const vertexShaderLinesSrc = `#version 300 es
  in vec2 a_textureCoords;
  in vec3 a_pointId;

  uniform sampler2D pointPositions;
  uniform vec2 mousePosition;

  out float lineAlpha;

  float squaredDistance2d(vec2 p0, vec2 p1) {
    float dx = p1.x - p0.x;
    float dy = p1.y - p0.y;
    return dx * dx + dy * dy;
  }

  void main() {
    vec3 position = texture(pointPositions, a_textureCoords).xyz;
    float distanceToPair = squaredDistance2d(position.xy, mousePosition);
    lineAlpha = max(0.1 - distanceToPair, 0.0) * 1.0;

    float currentId = a_pointId.x;
    if (currentId == 1.0) {
      gl_Position = vec4(position, 1.0);
    }
    else {
      gl_Position = vec4(mousePosition, 0.0, 1.0);
    }
  }
`

// language=GLSL
const fragmentShaderLinesSrc = `#version 300 es
  precision highp float;
  
  in float lineAlpha;
  out vec4 outColor;

  uniform vec2 mousePosition;

  void main() {
    if (lineAlpha == 0.0) {
      discard;
    }

    outColor = vec4(0.0, 0.0, 0.0, lineAlpha * 1.5);
  }
`

export default class MouseLines {
  private _linesShader: Shader
  private _linesShaderUniforms: IUniforms  
  private _shaderProgramLines: WebGLProgram
  private _sizeX: number
  private _sizeY: number

  // Buffers
  private _texCoordsBuffer: WebGLBuffer | null
  private _pointIdBuffer: WebGLBuffer | null

  // Point and line data
  private _lineTextureCoords: Float32Array
  private _pointId: Float32Array

  constructor(private _numPoints: number) {
    this._sizeX = Math.ceil(Math.sqrt(_numPoints))
    this._sizeY = Math.ceil(Math.sqrt(_numPoints))

    this._linesShader = new Shader(vertexShaderLinesSrc, fragmentShaderLinesSrc)
    this._linesShaderUniforms = {
      mousePosition: { type: UniformTypes.Vec2, value: [10, 10] },      
      pointPositions: { type: UniformTypes.Texture2d, value: null }
    }
    this._linesShader.uniforms = this._linesShaderUniforms
    this._shaderProgramLines = createProgram(gl, this._linesShader) 
    
    const lineTextureCoords: number[] = []
    const pointId: number[] = []
    const texOffset = 1.0 / (this._sizeX * 2.0)
    for (let x = 0; x < this._sizeX; x++) {
      for (let y = 0; y < this._sizeY; y++) {
        lineTextureCoords.push(x / this._sizeX + texOffset), lineTextureCoords.push(y / this._sizeY + texOffset)
        lineTextureCoords.push(x / this._sizeX + texOffset), lineTextureCoords.push(y / this._sizeY + texOffset)
        
        pointId.push(1), pointId.push(0)
        pointId.push(0), pointId.push(0)
      }
    }
    this._lineTextureCoords = new Float32Array(lineTextureCoords)
    this._pointId = new Float32Array(pointId)

    this._texCoordsBuffer = gl.createBuffer()
    this._pointIdBuffer = gl.createBuffer()
  }

  public render(pointPositions: WebGLTexture, mousePosition: number[]) {
    gl.useProgram(this._shaderProgramLines)

    this._linesShaderUniforms.pointPositions.value = pointPositions    
    this._linesShaderUniforms.mousePosition.value = mousePosition
    this._linesShader.update()

    gl.bindBuffer(gl.ARRAY_BUFFER, this._texCoordsBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, this._lineTextureCoords, gl.STATIC_DRAW)
    const lineCoords = gl.getAttribLocation(this._shaderProgramLines, 'a_textureCoords')
    gl.vertexAttribPointer(lineCoords, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(lineCoords)

    gl.bindBuffer(gl.ARRAY_BUFFER, this._pointIdBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, this._pointId, gl.STATIC_DRAW)
    const pointIdLocation = gl.getAttribLocation(this._shaderProgramLines, 'a_pointId')
    gl.vertexAttribPointer(pointIdLocation, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(pointIdLocation)

    gl.viewport(0, 0, window.innerWidth, window.innerHeight)
    gl.drawArrays(gl.LINES, 0, this._numPoints * 2)
  }
}
