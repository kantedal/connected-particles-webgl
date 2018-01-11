// language=GLSL
import DataTexture from '../utils/data-texture'
import { IUniforms, UniformTypes } from '../utils/shader'
import FBO from '../utils/fbo'
import ComputeShader from '../utils/compute-shader';

const pointForceComputeShader = `#version 300 es
  precision highp float;

  in vec2 v_texCoord;
  out vec4 outColor;
  
  uniform sampler2D currentPosition;  
  // uniform sampler2D currentVelocity;
  uniform float time;
  uniform vec2 mousePosition;

  float squaredDistance2d(vec2 p0, vec2 p1) {
    float dx = p1.x - p0.x;
    float dy = p1.y - p0.y;
    return dx * dx + dy * dy;
  }

  void main() {
    vec3 currentPos = texture(currentPosition, v_texCoord).xyz;
    // vec3 currentVel = texture(currentVelocity, v_texCoord).xyz * 0.9;

    // float distanceToMouse = squaredDistance2d(currentPos.xy, mousePosition);
    // float maxDistance = 0.1;
    // vec3 awayFromMouse = normalize(vec3(currentPos.xy - mousePosition, 0.0));
    // vec3 force = 500.0 * max(maxDistance - distanceToMouse, 0.0) * awayFromMouse;
    
    // outColor = vec4(currentVel + 0.1 * force, 1.0);
    // vec3 currentPos = texture(currentPosition, v_texCoord).xyz;    
    // float distanceToCenter = distance(currentPos.xy, vec2(0.0));
    // if (distanceToCenter < 0.6) {
    //   outColor = vec4(currentPos.xy, 0.0, 1.0);
    // }
    // else {
    //   outColor = vec4(0.0, 0.0, 0.0, 1.0);
    // }

    // if (abs(currentPos.x) < 0.2 && abs(currentPos.y) < 0.2) {
    //   outColor = vec4(currentVel.xy + 0.1 * currentPos.xy, 0.0, 1.0);      
    // }
    // else {
    //   outColor = vec4(currentVel.xy, 0.0, 0.0);
    // }
    // if (abs(currentPos.x) < 0.96) {
    //   outColor = vec4(currentVel.xy - 0.1 * vec2(1.0), 0.0, 1.0);         
    //   return;
    // }

    outColor = vec4(0.0);
  }
`

export default class Test {
  private _sizeX: number
  private _sizeY: number
  private _computeShader: ComputeShader
  private _computeShaderUniforms: IUniforms

  constructor(private _numPoints: number) {
    this._sizeX = Math.ceil(Math.sqrt(_numPoints))
    this._sizeY = Math.ceil(Math.sqrt(_numPoints))
    this._computeShader = new ComputeShader(pointForceComputeShader, this._sizeX, this._sizeY)

    const tempTex = new DataTexture(this._sizeX, this._sizeY, new Float32Array(this._sizeX * this._sizeY * 4))
    this._computeShaderUniforms = {
      mousePosition: { type: UniformTypes.Vec2, value: [10, 10]},
      time: { type: UniformTypes.Float, value: Math.PI },      
      currentPosition: { type: UniformTypes.Texture2d, value: tempTex.texture },            
    }
    this._computeShader.uniforms = this._computeShaderUniforms
    this._computeShaderUniforms.currentPosition.value = this.initializePositions()
  }

  public compute(pointPositions: WebGLTexture | null, time: number, mousePosition: number[]) {
    this._computeShaderUniforms.mousePosition.value = mousePosition    
    this._computeShaderUniforms.currentPosition.value = pointPositions
    this._computeShaderUniforms.time.value = time
    this._computeShader.compute()
  }

  private initializePositions(): WebGLTexture {
    const initPositions = []
    for (let i = 0; i < this._numPoints; i++) {
      initPositions.push(0.0 * (Math.random() - 0.5))
      initPositions.push(0.0 * (Math.random() - 0.5))
      initPositions.push(0.0)
      initPositions.push(0)
    }
    return new DataTexture(this._sizeX, this._sizeY, new Float32Array(initPositions)).texture
  }

  get result() { return this._computeShader.result }
  get texture() { return this._computeShader.texture }
}