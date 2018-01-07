import Shader, { IUniforms, UniformTypes } from '../utils/shader'
import RenderTarget from '../utils/render-target'

// language=GLSL
const vertBackgroundSrc = `#version 300 es
  in vec2 a_texCoord;
  in vec4 a_position;

  out vec2 v_texCoord;

  void main() {
    gl_Position = a_position;
    v_texCoord = a_texCoord;
  }
`

// language=GLSL
const fragBackgroundSrc = `#version 300 es
  precision highp float;

  in vec2 v_texCoord;
  out vec4 outColor;

  void main() {
    vec3 clr1 = vec3(0.616, 0.314, 0.733);
    vec3 clr2 = vec3(0.431, 0.282, 0.667);
    vec3 finalClr = mix(clr1, clr2, v_texCoord.y);
    outColor = vec4(finalClr, 1.0);
  }
`

export default class Background {
  private _renderTarget: RenderTarget
  private _shader: Shader
  private _uniforms: IUniforms 

  constructor() {
    this._shader = new Shader(vertBackgroundSrc, fragBackgroundSrc)
    this._uniforms = {}
    this._shader.uniforms = this._uniforms
    this._renderTarget = new RenderTarget(this._shader, window.innerWidth, window.innerHeight)
  }

  public render() { 
    this._renderTarget.render()
  }
}
