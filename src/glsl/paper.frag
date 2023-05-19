precision highp float;

uniform sampler2D tDiffuse;
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 bgColor;
uniform mat4 viewMatrix;

varying vec2 vUv;
varying vec3 vViewPosition;
varying vec3 vNormal;

#include <common>
#include <bsdfs>
#include <lights_pars_begin>

void main(void) {
  vec4 texl = texture2D(tDiffuse, vUv);
  texl.rgb = vec3(1.0, 1.0, 1.0);
  if(texl.a <= 0.1) {
    discard;
  }

  vec3 mvPosition = vViewPosition;
  vec3 transformedNormal = vNormal;

  GeometricContext geometry;
  geometry.position = mvPosition.xyz;
  geometry.normal = normalize(transformedNormal);
  geometry.viewDir = (normalize(-mvPosition.xyz));
  vec3 lightFront = vec3(0.0);
  vec3 indirectFront = vec3(0.0);
  IncidentLight directLight;
  float dotNL;
  vec3 directLightColor_Diffuse;

  #if NUM_POINT_LIGHTS > 0
  #pragma unroll_loop_start
  for (int i = 0; i < NUM_POINT_LIGHTS; i++) {
    getPointLightInfo(pointLights[ i ], geometry, directLight);
    dotNL = dot(geometry.normal, directLight.direction);
    directLightColor_Diffuse = PI * directLight.color;
    lightFront += saturate(dotNL) * directLightColor_Diffuse;
  }
  #pragma unroll_loop_end
  #endif

  vec4 diffuseColor = vec4(diffuse, 1.0);
  ReflectedLight reflectedLight = ReflectedLight(vec3(0.0),vec3(0.0),vec3(0.0),vec3(0.0));
  vec3 totalEmissiveRadiance = emissive;
  reflectedLight.indirectDiffuse = getAmbientLightIrradiance(ambientLightColor);
  reflectedLight.indirectDiffuse += indirectFront;
  reflectedLight.indirectDiffuse *= BRDF_Lambert(diffuseColor.rgb);
  reflectedLight.directDiffuse = lightFront;
  reflectedLight.directDiffuse *= BRDF_Lambert(diffuseColor.rgb);
  vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;

  vec3 color = texl.rgb;

  // 裏側は見せない
  if(gl_FrontFacing == false) {
    color = vec3(1.0, 0.0, 0.0) * 0.25;
    // texl.a *= 0.0;
  } else {
    color = vec3(1.0, 0.0, 0.0);
  }


  vec3 last = color;

  gl_FragColor = vec4(last, texl.a);
}
