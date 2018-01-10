export default "\n@export clay.lambert.vertex\nuniform mat4 worldViewProjection : WORLDVIEWPROJECTION;\nuniform mat4 worldInverseTranspose : WORLDINVERSETRANSPOSE;\nuniform mat4 world : WORLD;\nuniform vec2 uvRepeat : [1.0, 1.0];\nuniform vec2 uvOffset : [0.0, 0.0];\nattribute vec3 position : POSITION;\nattribute vec2 texcoord : TEXCOORD_0;\nattribute vec3 normal : NORMAL;\nattribute vec3 barycentric;\n#ifdef VERTEX_COLOR\nattribute vec4 a_Color : COLOR;\nvarying vec4 v_Color;\n#endif\n@import clay.chunk.skinning_header\nvarying vec2 v_Texcoord;\nvarying vec3 v_Normal;\nvarying vec3 v_WorldPosition;\nvarying vec3 v_Barycentric;\nvoid main()\n{\n    vec3 skinnedPosition = position;\n    vec3 skinnedNormal = normal;\n#ifdef SKINNING\n    @import clay.chunk.skin_matrix\n    skinnedPosition = (skinMatrixWS * vec4(position, 1.0)).xyz;\n    skinnedNormal = (skinMatrixWS * vec4(normal, 0.0)).xyz;\n#endif\n    gl_Position = worldViewProjection * vec4( skinnedPosition, 1.0 );\n    v_Texcoord = texcoord * uvRepeat + uvOffset;\n    v_Normal = normalize( ( worldInverseTranspose * vec4(skinnedNormal, 0.0) ).xyz );\n    v_WorldPosition = ( world * vec4( skinnedPosition, 1.0) ).xyz;\n    v_Barycentric = barycentric;\n#ifdef VERTEX_COLOR\n    v_Color = a_Color;\n#endif\n}\n@end\n@export clay.lambert.fragment\nvarying vec2 v_Texcoord;\nvarying vec3 v_Normal;\nvarying vec3 v_WorldPosition;\nuniform sampler2D diffuseMap;\nuniform sampler2D alphaMap;\nuniform vec3 color : [1.0, 1.0, 1.0];\nuniform vec3 emission : [0.0, 0.0, 0.0];\nuniform float alpha : 1.0;\n#ifdef ALPHA_TEST\nuniform float alphaCutoff: 0.9;\n#endif\nuniform float lineWidth : 0.0;\nuniform vec4 lineColor : [0.0, 0.0, 0.0, 0.6];\nvarying vec3 v_Barycentric;\n#ifdef VERTEX_COLOR\nvarying vec4 v_Color;\n#endif\n#ifdef AMBIENT_LIGHT_COUNT\n@import clay.header.ambient_light\n#endif\n#ifdef AMBIENT_SH_LIGHT_COUNT\n@import clay.header.ambient_sh_light\n#endif\n#ifdef POINT_LIGHT_COUNT\n@import clay.header.point_light\n#endif\n#ifdef DIRECTIONAL_LIGHT_COUNT\n@import clay.header.directional_light\n#endif\n#ifdef SPOT_LIGHT_COUNT\n@import clay.header.spot_light\n#endif\n@import clay.util.calculate_attenuation\n@import clay.util.edge_factor\n@import clay.util.rgbm\n@import clay.plugin.compute_shadow_map\n@import clay.util.ACES\nvoid main()\n{\n#ifdef RENDER_NORMAL\n    gl_FragColor = vec4(v_Normal * 0.5 + 0.5, 1.0);\n    return;\n#endif\n#ifdef RENDER_TEXCOORD\n    gl_FragColor = vec4(v_Texcoord, 1.0, 1.0);\n    return;\n#endif\n    gl_FragColor = vec4(color, alpha);\n#ifdef VERTEX_COLOR\n    gl_FragColor *= v_Color;\n#endif\n#ifdef DIFFUSEMAP_ENABLED\n    vec4 tex = texture2D( diffuseMap, v_Texcoord );\n#ifdef SRGB_DECODE\n    tex.rgb = pow(tex.rgb, vec3(2.2));\n#endif\n    gl_FragColor.rgb *= tex.rgb;\n#ifdef DIFFUSEMAP_ALPHA_ALPHA\n    gl_FragColor.a *= tex.a;\n#endif\n#endif\n    vec3 diffuseColor = vec3(0.0, 0.0, 0.0);\n#ifdef AMBIENT_LIGHT_COUNT\n    for(int _idx_ = 0; _idx_ < AMBIENT_LIGHT_COUNT; _idx_++)\n    {\n        diffuseColor += ambientLightColor[_idx_];\n    }\n#endif\n#ifdef AMBIENT_SH_LIGHT_COUNT\n    for(int _idx_ = 0; _idx_ < AMBIENT_SH_LIGHT_COUNT; _idx_++)\n    {{\n        diffuseColor += calcAmbientSHLight(_idx_, v_Normal) * ambientSHLightColor[_idx_];\n    }}\n#endif\n#ifdef POINT_LIGHT_COUNT\n#if defined(POINT_LIGHT_SHADOWMAP_COUNT)\n    float shadowContribsPoint[POINT_LIGHT_COUNT];\n    if( shadowEnabled )\n    {\n        computeShadowOfPointLights(v_WorldPosition, shadowContribsPoint);\n    }\n#endif\n    for(int i = 0; i < POINT_LIGHT_COUNT; i++)\n    {\n        vec3 lightPosition = pointLightPosition[i];\n        vec3 lightColor = pointLightColor[i];\n        float range = pointLightRange[i];\n        vec3 lightDirection = lightPosition - v_WorldPosition;\n        float dist = length(lightDirection);\n        float attenuation = lightAttenuation(dist, range);\n        lightDirection /= dist;\n        float ndl = dot( v_Normal, lightDirection );\n        float shadowContrib = 1.0;\n#if defined(POINT_LIGHT_SHADOWMAP_COUNT)\n        if( shadowEnabled )\n        {\n            shadowContrib = shadowContribsPoint[i];\n        }\n#endif\n        diffuseColor += lightColor * clamp(ndl, 0.0, 1.0) * attenuation * shadowContrib;\n    }\n#endif\n#ifdef DIRECTIONAL_LIGHT_COUNT\n#if defined(DIRECTIONAL_LIGHT_SHADOWMAP_COUNT)\n    float shadowContribsDir[DIRECTIONAL_LIGHT_COUNT];\n    if(shadowEnabled)\n    {\n        computeShadowOfDirectionalLights(v_WorldPosition, shadowContribsDir);\n    }\n#endif\n    for(int i = 0; i < DIRECTIONAL_LIGHT_COUNT; i++)\n    {\n        vec3 lightDirection = -directionalLightDirection[i];\n        vec3 lightColor = directionalLightColor[i];\n        float ndl = dot(v_Normal, normalize(lightDirection));\n        float shadowContrib = 1.0;\n#if defined(DIRECTIONAL_LIGHT_SHADOWMAP_COUNT)\n        if( shadowEnabled )\n        {\n            shadowContrib = shadowContribsDir[i];\n        }\n#endif\n        diffuseColor += lightColor * clamp(ndl, 0.0, 1.0) * shadowContrib;\n    }\n#endif\n#ifdef SPOT_LIGHT_COUNT\n#if defined(SPOT_LIGHT_SHADOWMAP_COUNT)\n    float shadowContribsSpot[SPOT_LIGHT_COUNT];\n    if(shadowEnabled)\n    {\n        computeShadowOfSpotLights(v_WorldPosition, shadowContribsSpot);\n    }\n#endif\n    for(int i = 0; i < SPOT_LIGHT_COUNT; i++)\n    {\n        vec3 lightPosition = -spotLightPosition[i];\n        vec3 spotLightDirection = -normalize( spotLightDirection[i] );\n        vec3 lightColor = spotLightColor[i];\n        float range = spotLightRange[i];\n        float a = spotLightUmbraAngleCosine[i];\n        float b = spotLightPenumbraAngleCosine[i];\n        float falloffFactor = spotLightFalloffFactor[i];\n        vec3 lightDirection = lightPosition - v_WorldPosition;\n        float dist = length(lightDirection);\n        float attenuation = lightAttenuation(dist, range);\n        lightDirection /= dist;\n        float c = dot(spotLightDirection, lightDirection);\n        float falloff;\n        falloff = clamp((c - a) /( b - a), 0.0, 1.0);\n        falloff = pow(falloff, falloffFactor);\n        float ndl = dot(v_Normal, lightDirection);\n        ndl = clamp(ndl, 0.0, 1.0);\n        float shadowContrib = 1.0;\n#if defined(SPOT_LIGHT_SHADOWMAP_COUNT)\n        if( shadowEnabled )\n        {\n            shadowContrib = shadowContribsSpot[i];\n        }\n#endif\n        diffuseColor += lightColor * ndl * attenuation * (1.0-falloff) * shadowContrib;\n    }\n#endif\n    gl_FragColor.rgb *= diffuseColor;\n    gl_FragColor.rgb += emission;\n    if(lineWidth > 0.)\n    {\n        gl_FragColor.rgb = mix(gl_FragColor.rgb, lineColor.rgb, (1.0 - edgeFactor(lineWidth)) * lineColor.a);\n    }\n#ifdef ALPHA_TEST\n    if (gl_FragColor.a < alphaCutoff) {\n        discard;\n    }\n#endif\n#ifdef TONEMAPPING\n    gl_FragColor.rgb = ACESToneMapping(gl_FragColor.rgb);\n#endif\n#ifdef SRGB_ENCODE\n    gl_FragColor = linearTosRGB(gl_FragColor);\n#endif\n    gl_FragColor = encodeHDR(gl_FragColor);\n}\n@end";
