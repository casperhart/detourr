export const FRAGMENT_SHADER = `
void main(){
    gl_FragColor = vec4(1.);
}
`

export const VERTEX_SHADER = `
uniform float size;

void main(){
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0);
    gl_PointSize=50.0*size;
}
`