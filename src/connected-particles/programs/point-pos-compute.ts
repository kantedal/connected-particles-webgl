import { IUniforms, UniformTypes } from '../utils/shader'
import PingPongComputeShader from '../utils/pingpong-compute-shader'
import ComputeShader from '../utils/compute-shader'
import DataTexture from '../utils/data-texture'

// language=GLSL
const pointPosComputeShader = `#version 300 es
  precision highp float;

  in vec2 v_texCoord;
  out vec4 outColor;
  
  uniform vec2 inputSize;
  uniform sampler2D currentPosition;
  uniform sampler2D seeds;
  uniform float time;

  void main() {
    vec4 seed = texture(seeds, v_texCoord);
    vec3 currentPos = texture(currentPosition, v_texCoord).xyz;

    vec3 direction = vec3(sin(time * seed.x + seed.y), cos(time * seed.z + seed.w), 0.0);
    vec3 newPos = currentPos + 0.0025 * direction;
    outColor = vec4(newPos, 1.0);
  }
`

export default class PointPosCompute {
  private _sizeX: number
  private _sizeY: number
  private _computeShader: PingPongComputeShader
  private _computeShaderUniforms: IUniforms

  private _currentTime: number = 0.0

  constructor(private _numPoints: number) {
    this._sizeX = Math.sqrt(_numPoints)
    this._sizeY = Math.sqrt(_numPoints)
    this._computeShader = new PingPongComputeShader(pointPosComputeShader, this._sizeX, this._sizeY)

    this._computeShaderUniforms = {
      inputSize: { type: UniformTypes.Vec2, value: [this._sizeX, this._sizeY] },
      currentPosition: { type: UniformTypes.Texture2d, value: this.initializePositions() },
      seeds: { type: UniformTypes.Texture2d, value: this.initializeSeeds() },
      time: { type: UniformTypes.Float, value: 0.0 }
    }
    this._computeShader.uniforms = this._computeShaderUniforms
    this._computeShaderUniforms.currentPosition.value = this.initializePositions()
  }

  public compute() {
    this._currentTime += 0.01

    this._computeShader.compute() 
    this._computeShaderUniforms.currentPosition.value = this._computeShader.texture
    this._computeShaderUniforms.time.value = this._currentTime
  }

  private initializeSeeds(): WebGLTexture {
    const initSeeds = []
    for (let i = 0; i < this._numPoints; i++) {
      initSeeds.push(5.0 * (Math.random() - 0.5))
      initSeeds.push(5.0 * (Math.random() - 0.5))
      initSeeds.push(5.0 * (Math.random() - 0.5))
      initSeeds.push(5.0 * (Math.random() - 0.5))
    }
    return new DataTexture(this._sizeX, this._sizeY, new Float32Array(initSeeds)).texture
  }

  private initializePositions(): WebGLTexture {
    const initPositions = []
    for (let i = 0; i < this._numPoints; i++) {
      initPositions.push(2.0 * (Math.random() - 0.5))
      initPositions.push(2.0 * (Math.random() - 0.5))
      initPositions.push(2.0 * (Math.random() - 0.5))
      initPositions.push(0)
    }
    return new DataTexture(this._sizeX, this._sizeY, new Float32Array(initPositions)).texture
  }

  get result() { return this._computeShader.result }
  get texture() { return this._computeShader.texture }
}
