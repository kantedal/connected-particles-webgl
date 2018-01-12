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
  uniform sampler2D seeds;
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
    float maxDistance = 0.3;
    vec3 awayFromMouse = normalize(vec3(currentPos.xy - mousePosition, 0.0));
    return 150.0 * max(maxDistance - distanceToMouse, 0.0) * awayFromMouse;
  }

  vec3 calculateWallForce(vec3 currentPos) {
    vec3 force = vec3(0.0);
    float wallMargin = 0.05;
    float wallForce = 200.0;
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

  vec3 vectorFieldForce(vec3 currentPos) {
    vec3 fieldForce = vec3(0.0);
    //fieldForce += 5.0 * vec3(-currentPos.y, currentPos.x, 0.0);
    fieldForce += 0.1 * normalize(vec3(currentPos.x, currentPos.y, 0.0));
    return fieldForce;
  }

  vec3 calculateSeedForce(vec3 currentPos) {
    vec4 seed = texture(seeds, v_texCoord);
    return 8.0 * vec3(sin(time * seed.x + seed.y), cos(time * seed.z + seed.w), 0.0);
  }

  void main() {
    float delta = 0.02;
    float damping = 0.05;

    vec3 currentPos = texture(currentPosition, v_texCoord).xyz;
    vec3 lastPos = texture(lastPosition, v_texCoord).xyz;

    if (lastPos.x == 0.0 && lastPos.y == 0.0 && lastPos.z == 0.0) {
      outColor = vec4(currentPos, 1.0);
      return;
    }

    vec3 force = calculateMouseForce(currentPos);    
    force += calculateWallForce(currentPos);
    // force += vectorFieldForce(currentPos);
    force += calculateSeedForce(currentPos);

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
      seeds: { type: UniformTypes.Texture2d, value: this.initializeSeeds() },      
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

  get result() { return this._computeShader.result }
  get texture() { return this._computeShader.texture }
}
