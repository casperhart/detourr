export const VERTEX_SHADER_3D = `
attribute float size;
uniform float picking;
// shrink when picking with box, but not on hover
uniform float shrink; 

attribute vec3 color;
attribute float alpha;

// passed to fragment shader
varying vec3 vColor;
varying float vAlpha;
varying float vPicking;
varying float vShrink;

void main(){
    vColor = color;
    vAlpha = alpha;
    vPicking = picking;
    vShrink = shrink;
    
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = 2.0 * shrink + (200.0 * size / -mvPosition.z) * (1.0 - shrink);
}
`;
