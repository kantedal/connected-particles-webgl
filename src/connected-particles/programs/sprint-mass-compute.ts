import { gl } from '../utils/render-context'
import { IUniforms, UniformTypes } from '../utils/shader'
import PingPongComputeShader from '../utils/pingpong-compute-shader'
import ComputeShader from '../utils/compute-shader'
import DataTexture from '../utils/data-texture'

// language=GLSL
const pointForceComputeShader = `#version 300 es
  precision highp float;

  in vec2 v_texCoord;
  out vec4 outColor;
  
  uniform sampler2D lastPosition;  
  uniform float time;
  uniform vec2 screenProportions;
  uniform vec2 mousePosition;
  uniform vec2 inputSize;

  void main() {
    float restingDistance = 0.2;
    float pointRadius = 0.15;

    vec2 pointPosA = texture(lastPosition, v_texCoord).xy * screenProportions;
    vec2 newPos = pointPosA;
    
    for (int x = 0; x < int(inputSize.x); x++) {
      for (int y = 0; y < int(inputSize.y); y++) {
        vec2 pointPosB = texelFetch(lastPosition, ivec2(x, y), 0).xy * screenProportions;
        if (pointPosA.x != pointPosB.x && pointPosA.y != pointPosB.y) {
          float distance = distance(pointPosA, pointPosB);

          if (distance < restingDistance) {
            vec2 offset = normalize(pointPosB - pointPosA) * (distance - restingDistance);
            newPos += 0.05 * offset;
          }

          if (distance < pointRadius + restingDistance && distance > restingDistance + 0.005) {
            vec2 offset = normalize(pointPosB - pointPosA) * (distance - restingDistance);
            newPos += 0.005 * offset;
          }
        }
      }
    }

    outColor = vec4(newPos / screenProportions, 0.0, 1.0);
  }
`

export default class SpringMassCompute {
  private _sizeX: number
  private _sizeY: number
  private _computeShader: PingPongComputeShader
  private _computeShaderUniforms: IUniforms
  private _firstIteration: boolean = true

  constructor(private _numPoints: number) {
    this._sizeX = Math.ceil(Math.sqrt(_numPoints))
    this._sizeY = Math.ceil(Math.sqrt(_numPoints))
    this._computeShader = new PingPongComputeShader(pointForceComputeShader, this._sizeX, this._sizeY)

    const tempTex = new DataTexture(this._sizeX, this._sizeY, new Float32Array(this._sizeX * this._sizeY * 4))
    this._computeShaderUniforms = {
      inputSize: { type: UniformTypes.Vec2, value: [this._sizeX, this._sizeY] },
      screenProportions: { type: UniformTypes.Vec2, value: [1.0, 1.0] },
      mousePosition: { type: UniformTypes.Vec2, value: [10, 10]},
      time: { type: UniformTypes.Float, value: Math.PI },      
      lastPosition: { type: UniformTypes.Texture2d, value: tempTex.texture },      
    }
    this._computeShader.uniforms = this._computeShaderUniforms
    this._computeShaderUniforms.lastPosition.value = this.initializePositions()
  }

  public compute(pointPositions: WebGLTexture | null, time: number, mousePosition: number[]) {
    if (!this._firstIteration) { this._computeShaderUniforms.lastPosition.value = pointPositions }
    else { this._firstIteration = false }

    this._computeShaderUniforms.mousePosition.value = mousePosition    
    this._computeShaderUniforms.time.value = time
    this._computeShader.compute()
  }

  public setProportions(width: number, height: number) {
    this._computeShaderUniforms.screenProportions.value = [width, height]
  }

  private initializePositions(): WebGLTexture {
    const initPositions = []
    for (let i = 0; i < this._numPoints; i++) {
      initPositions.push(2.0 * (Math.random() - 0.5))
      initPositions.push(2.0 * (Math.random() - 0.5))
      initPositions.push(0.0)
      initPositions.push(0)
    }
    return new DataTexture(this._sizeX, this._sizeY, new Float32Array(initPositions)).texture
  }

  get result() { return this._computeShader.result }
  get texture() { return this._computeShader.texture }
}
