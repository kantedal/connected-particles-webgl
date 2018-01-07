import {gl} from './render-context'
import Shader from './shader'

const createShader = (type: number, source: string): WebGLShader => {
  const shader = gl.createShader(type) as Shader
  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
  }

  return shader
}

export default createShader
