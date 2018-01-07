import DataTexture from './render-utils/data-texture'
import createProgram from './render-utils/create-program'
import createShader from './render-utils/create-shader'
import { gl } from './render-utils/render-context'
import Shader, { IUniform, IUniforms, UniformTypes } from './render-utils/shader'

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
    lineAlpha = max(0.15 - distanceToPair, 0.0) * 1.0;

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

    outColor = vec4(0.0, 0.0, 0.0, lineAlpha);
  }
`

export default class MouseLines {
  private _numPoints: number = 64
  private _linesShader: Shader
  private _linesShaderUniforms: IUniforms  
  private _shaderProgramLines: WebGLProgram

  // Buffers
  private _texCoordsBuffer: WebGLBuffer | null
  private _pointIdBuffer: WebGLBuffer | null

  // Point and line data
  private _lineTextureCoords: Float32Array
  private _pointId: Float32Array
  private _mousePosition: number[] = [0, 0]

  constructor() {
    this._linesShader = new Shader(vertexShaderLinesSrc, fragmentShaderLinesSrc)
    this._linesShaderUniforms = {
      mousePosition: { type: UniformTypes.Vec2, value: [1.0, 0.5] },      
      pointPositions: { type: UniformTypes.Texture2d, value: null }
    }
    this._linesShader.uniforms = this._linesShaderUniforms
    this._shaderProgramLines = createProgram(gl, this._linesShader) 
    
    const lineTextureCoords: number[] = []
    const pointId: number[] = []
    for (let x = 0; x < Math.sqrt(this._numPoints); x++) {
      for (let y = 0; y < Math.sqrt(this._numPoints); y++) {
        lineTextureCoords.push(x / 8.0), lineTextureCoords.push(y / 8.0)
        lineTextureCoords.push(x / 8.0), lineTextureCoords.push(y / 8.0)
        
        pointId.push(1), pointId.push(0)
        pointId.push(0), pointId.push(0)
      }
    }
    this._lineTextureCoords = new Float32Array(lineTextureCoords)
    this._pointId = new Float32Array(pointId)

    document.onmousemove = (e) => {
      this._mousePosition[0] = 2.0 * (e.clientX / window.innerWidth - 0.5)
      this._mousePosition[1] = -2.0 * (e.clientY / window.innerHeight - 0.5)
    }

    this._texCoordsBuffer = gl.createBuffer()
    this._pointIdBuffer = gl.createBuffer()
  }

  public render(pointPositions: WebGLTexture) {
    gl.useProgram(this._shaderProgramLines)

    this._linesShaderUniforms.pointPositions.value = pointPositions    
    this._linesShaderUniforms.mousePosition.value = this._mousePosition
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

    gl.enable(gl.DEPTH_TEST)
    gl.viewport(0, 0, window.innerWidth, window.innerHeight)
    gl.drawArrays(gl.LINES, 0, this._numPoints * 2)
  }
}
