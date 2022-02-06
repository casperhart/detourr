export const VERTEX_SHADER_3D = `
uniform float size;
uniform float picking;

attribute vec3 color;
attribute float alpha;

// passed to fragment shader
varying vec3 vColor;
varying float vAlpha;
varying float vPicking;

void main(){
    vColor = color;
    vAlpha = alpha;
    vPicking = picking;
    
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = 200.0 * size / -mvPosition.z;
}
`;
