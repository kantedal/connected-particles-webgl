import { gl } from '../utils/render-context'
import { IUniforms, UniformTypes } from '../utils/shader'
import PingPongComputeShader from '../utils/pingpong-compute-shader'
import ComputeShader from '../utils/compute-shader'
import DataTexture from '../utils/data-texture'

// language=GLSL
const clothComputeShader = `#version 300 es
  precision highp float;

  in vec2 v_texCoord;
  out vec4 outColor;
  
  uniform sampler2D lastPosition;  
  uniform sampler2D currentPosition;  
  uniform float time;
  uniform vec2 mousePosition;
  uniform vec2 inputSize;

  float squaredDistance2d(vec2 p0, vec2 p1) {
    float dx = p1.x - p0.x;
    float dy = p1.y - p0.y;
    return dx * dx + dy * dy;
  }

  vec3 calculateMouseForce(vec3 currentPos) {
    float distanceToMouse = sqrt(squaredDistance2d(currentPos.xy, mousePosition));
    float maxDistance = 0.35;
    vec3 awayFromMouse = normalize(vec3(currentPos.xy - mousePosition, 0.0));
    return 200.0 * max(maxDistance - distanceToMouse, 0.0) * awayFromMouse;
  }

  vec3 calculateWallForce(vec3 currentPos) {
    vec3 force = vec3(0.0);
    float wallMargin = 0.1;
    float wallForce = 300.0;
    if (abs(currentPos.x) > 1.0 - wallMargin) {
      float distanceFromWall = (abs(currentPos.x) - (1.0 - wallMargin)) / wallMargin;
      force += wallForce * distanceFromWall * normalize(vec3(-currentPos.x, 0.0, 0.0));
    }
    if (abs(currentPos.y) > 1.0 - wallMargin) {
      float distanceFromWall = (abs(currentPos.y) - (1.0 - wallMargin)) / wallMargin;
      force += wallForce * distanceFromWall * normalize(vec3(0.0, -currentPos.y, 0.0));
    }
    return force;
  }

  void main() {
    float delta = 0.02;
    float damping = 0.2;

    vec3 currentPos = texture(currentPosition, v_texCoord).xyz;
    vec3 lastPos = texture(lastPosition, v_texCoord).xyz;

    if (lastPos.x == 0.0 && lastPos.y == 0.0 && lastPos.z == 0.0) {
      outColor = vec4(currentPos, 1.0);
      return;
    }

    vec3 force = calculateMouseForce(currentPos);    
    force += calculateWallForce(currentPos);
    vec3 velocity = currentPos - lastPos;
    currentPos += velocity * (1.0 - damping) + force * delta * delta;
    outColor = vec4(currentPos, 1.0);
  }
`

export default class ClothCompute {
  private _sizeX: number
  private _sizeY: number
  private _computeShader: PingPongComputeShader
  private _computeShaderUniforms: IUniforms

  constructor(private _numPoints: number) {
    this._sizeX = Math.ceil(Math.sqrt(_numPoints))
    this._sizeY = Math.ceil(Math.sqrt(_numPoints))
    this._computeShader = new PingPongComputeShader(clothComputeShader, this._sizeX, this._sizeY)

    const tempTex = new DataTexture(this._sizeX, this._sizeY, new Float32Array(this._sizeX * this._sizeY * 4))
    this._computeShaderUniforms = {
      inputSize: { type: UniformTypes.Vec2, value: [this._sizeX, this._sizeY] },
      mousePosition: { type: UniformTypes.Vec2, value: [10, 10]},
      time: { type: UniformTypes.Float, value: Math.PI },      
      lastPosition: { type: UniformTypes.Texture2d, value: tempTex.texture },      
      currentPosition: { type: UniformTypes.Texture2d, value: tempTex.texture },      
    }
    this._computeShader.uniforms = this._computeShaderUniforms
  }

  public compute(currentPositions: WebGLTexture | null, lastPositions: WebGLTexture | null, time: number, mousePosition: number[]) {
    this._computeShaderUniforms.mousePosition.value = mousePosition    
    this._computeShaderUniforms.currentPosition.value = currentPositions
    this._computeShaderUniforms.lastPosition.value = lastPositions
    this._computeShaderUniforms.time.value = time
    this._computeShader.compute()
  }

  get result() { return this._computeShader.result }
  get texture() { return this._computeShader.texture }
}
