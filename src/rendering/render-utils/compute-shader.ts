import Shader, {IUniform} from './shader'
import RenderTarget from './render-target'
import FBO from './fbo'

export default class ComputeShader {
  private _shader: Shader
  private _fbo: FBO

  constructor(computeShaderSource: string, private _sizeX: number, private _sizeY: number, private _channels?: number) {
    this._shader = new Shader(computeVertexSource, computeShaderSource)
    this._fbo = new FBO(this._shader, this._sizeX, this._sizeY, 4) // this._channels ? this._channels : 4)
    this._fbo.enableWriteToTexture()
  }

  public compute(): Float32Array {
    this._fbo.render()
    return this._fbo.textureData
  }

  public setUniform(id: string, data: IUniform) {
    this._shader.setUniform(id, data)
  }

  set uniforms(value: {[p: string]: IUniform}) { this._shader.uniforms = value }
  get sizeX() { return this._sizeX }
  get sizeY() { return this._sizeY }
  get result() { return this._fbo.textureData }
}

// language=GLSL
export const computeVertexSource = `#version 300 es
  precision highp float;

  in vec2 a_texCoord;
  in vec4 a_position;
  
  out vec2 v_texCoord;
  
  void main() {
    gl_Position = a_position;
    v_texCoord = a_texCoord;
  }
`
