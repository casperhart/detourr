export const FRAGMENT_SHADER = `
varying float vSize;
varying vec3 vColor;

void main(){
    gl_FragColor = vec4( vColor, 1.0 );

    // make points circular
    float distance = length(2.0 * gl_PointCoord - 1.0);
    if (distance > 1.0) {
        discard;
    }
}
`

export const VERTEX_SHADER_3D = `
uniform float size;
attribute vec3 color;
varying vec3 vColor;

void main(){
    vColor=color;
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = 200.0 * size / -mvPosition.z;
}
`

export const VERTEX_SHADER_2D = `
uniform float size;
uniform float zoom;

attribute vec3 color;
varying vec3 vColor;

void main(){
    vColor=color;
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = 100.0 * size * sqrt(zoom);
}
`