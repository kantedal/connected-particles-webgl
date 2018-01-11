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
  uniform sampler2D pointVelocity;
  uniform sampler2D currentPosition;
  uniform sampler2D seeds;
  uniform float time;
  uniform vec2 mousePosition;

  void main() {
    vec4 seed = texture(seeds, v_texCoord);

    vec3 seedVelocity =  vec3(sin(time * seed.x + seed.y), cos(time * seed.z + seed.w), 0.0);

    vec3 currentPos = texture(currentPosition, v_texCoord).xyz;
    vec3 velocity = texture(pointVelocity, v_texCoord).xyz;
    vec3 newPos = currentPos + 0.01 * velocity + 0.001 * seedVelocity;
    outColor = vec4(newPos, 1.0);
  }
`

export default class PointPosCompute {
  private _sizeX: number
  private _sizeY: number
  private _computeShader: PingPongComputeShader
  private _computeShaderUniforms: IUniforms

  constructor(private _numPoints: number) {
    this._sizeX = Math.ceil(Math.sqrt(_numPoints))
    this._sizeY = Math.ceil(Math.sqrt(_numPoints))
    this._computeShader = new PingPongComputeShader(pointPosComputeShader, this._sizeX, this._sizeY)

    this._computeShaderUniforms = {
      inputSize: { type: UniformTypes.Vec2, value: [this._sizeX, this._sizeY] },
      currentPosition: { type: UniformTypes.Texture2d, value: this.initializePositions() },
      seeds: { type: UniformTypes.Texture2d, value: this.initializeSeeds() },
      pointVelocity: { type: UniformTypes.Texture2d, value: null },      
      time: { type: UniformTypes.Float, value: 0.0 },
      mousePosition: { type: UniformTypes.Vec2, value: [10, 10]}
    }
    this._computeShader.uniforms = this._computeShaderUniforms
    this._computeShaderUniforms.currentPosition.value = this.initializePositions()
  }

  public compute(pointVelocity: WebGLTexture | null | Float32Array, time: number, mousePosition: number[]) {
  // public compute(pointVelocity: Float32Array, time: number, mousePosition: number[]) {
    this._computeShaderUniforms.pointVelocity.value = pointVelocity
    this._computeShaderUniforms.time.value = time
    this._computeShaderUniforms.mousePosition.value = mousePosition
    this._computeShader.compute() 
    // console.log('vel', pointVelocity)    
    // console.log('pos', this._computeShader.result)
    this._computeShaderUniforms.currentPosition.value = this._computeShader.texture
  }

  private initializeSeeds(): WebGLTexture {
    const initSeeds = []
    for (let i = 0; i < this._sizeX * this._sizeY; i++) {
      initSeeds.push(5.0 * (Math.random() - 0.5))
      initSeeds.push(5.0 * (Math.random() - 0.5))
      initSeeds.push(5.0 * (Math.random() - 0.5))
      initSeeds.push(5.0 * (Math.random() - 0.5))
    }
    return new DataTexture(this._sizeX, this._sizeY, new Float32Array(initSeeds)).texture
  }

  private initializePositions(): WebGLTexture {
    const initPositions = []
    for (let i = 0; i < this._sizeX * this._sizeY; i++) {
      initPositions.push(2.0 * (Math.random() - 0.5))
      initPositions.push(2.0 * (Math.random() - 0.5))
      initPositions.push(0.0)
      initPositions.push(0.0)
    }

    return new DataTexture(this._sizeX, this._sizeY, new Float32Array(initPositions)).texture
  }

  get result() { return this._computeShader.result }
  get texture() { return this._computeShader.texture }
}
