import {gl} from './render-context'

export interface IUniform {
  value: any
  type: number
  location?: WebGLUniformLocation
}

export interface IUniforms {
  [name: string]: IUniform
}

export enum UniformTypes { Float, Integer, Vec2, Vec3, Vec4, Texture2d, Texture3d }

export default class Shader {
  needsUpdate: boolean = false
  private _vertexShader: WebGLShader
  private _fragmentShader: WebGLShader
  private _program: WebGLProgram
  private _uniforms: {[name: string]: IUniform}

  constructor(vertexSource: string, fragmentSource: string) {
    this._vertexShader = this.createShader(gl.VERTEX_SHADER, vertexSource)
    this._fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentSource)
    this._uniforms = {}
  }

  public update() {
    let textureCount = 0

    for (const uniformName in this._uniforms) {
      if (uniformName) {   
        const uniform = this._uniforms[uniformName] as IUniform
        if (uniform) {
          // if (uniformName === 'mousePos') {
          //   console.log(uniformName, uniform.location)
          // }
          if (uniform.location != null) {
            if (uniform.type === UniformTypes.Float) { gl.uniform1f(uniform.location, uniform.value) }
            else if (uniform.type === UniformTypes.Vec2) { 
              // console.log('vec2', uniform.value)
              gl.uniform2fv(uniform.location, uniform.value) 
            }
            else if (uniform.type === UniformTypes.Vec3) { gl.uniform3fv(uniform.location, uniform.value) }
            else if (uniform.type === UniformTypes.Integer) { gl.uniform1i(uniform.location, uniform.value) }
            else if (uniform.type === UniformTypes.Texture2d || uniform.type === UniformTypes.Texture3d) {
              gl.uniform1i(uniform.location, textureCount)
              this.setActiveTexture(textureCount)

              if (uniform.type === UniformTypes.Texture2d) { gl.bindTexture(gl.TEXTURE_2D, uniform.value) }
              else if (uniform.type === UniformTypes.Texture3d) { gl.bindTexture(gl.TEXTURE_3D, uniform.value) }

              textureCount++
            }
          }
        }
      }
    }
  }

  public setUniform(id: string, data: IUniform) {
    this._uniforms[id] = data
    this.updateUniforms()
    this.needsUpdate = true
  }

  private createShader(type: number, source: string): WebGLShader  {
    const shader = gl.createShader(type) as WebGLShader

    gl.shaderSource(shader, source)
    gl.compileShader(shader)

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn(gl.getShaderInfoLog(shader))
      gl.deleteShader(shader)
    }

    return shader
  }

  private setActiveTexture(textureCount: number) {
    if (textureCount === 0) { gl.activeTexture(gl.TEXTURE0) }
    else if (textureCount === 1) { gl.activeTexture(gl.TEXTURE1) }
    else if (textureCount === 2) { gl.activeTexture(gl.TEXTURE2) }
    else if (textureCount === 3) { gl.activeTexture(gl.TEXTURE3) }
    else if (textureCount === 4) { gl.activeTexture(gl.TEXTURE4) }
    else if (textureCount === 5) { gl.activeTexture(gl.TEXTURE5) }
    else if (textureCount === 6) { gl.activeTexture(gl.TEXTURE6) }
    else if (textureCount === 7) { gl.activeTexture(gl.TEXTURE7) }
    else if (textureCount === 8) { gl.activeTexture(gl.TEXTURE8) }
    else if (textureCount === 9) { gl.activeTexture(gl.TEXTURE9) }
    else if (textureCount === 10) { gl.activeTexture(gl.TEXTURE10) }
  }

  private updateUniforms() {
    if (this._program) {
      for (const name in this._uniforms) {
        if (name) {
          const uniform = this._uniforms[name] as IUniform
          uniform.location = gl.getUniformLocation(this._program, name) as WebGLUniformLocation
          // if (name === 'mousePosition') {
          //   console.log(name, uniform.location)
          // }
        }
      }
    }
  }

  set uniforms(value: {[p: string]: IUniform}) {
    this._uniforms = value
    console.log(this._uniforms)
    this.updateUniforms()
  }

  get uniforms() { return this._uniforms }

  set program(value: WebGLProgram) {
    this._program = value
    this.updateUniforms()
  }

  get fragmentShader(): WebGLShader { return this._fragmentShader }
  get vertexShader(): WebGLShader { return this._vertexShader }
}
