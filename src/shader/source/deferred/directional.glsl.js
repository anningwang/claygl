export default "@export clay.deferred.directional_light\n@import clay.deferred.chunk.light_head\n@import clay.deferred.chunk.light_equation\nuniform vec3 lightDirection;\nuniform vec3 lightColor;\nuniform vec3 eyePosition;\n#ifdef SHADOWMAP_ENABLED\nuniform sampler2D lightShadowMap;\nuniform float lightShadowMapSize;\nuniform mat4 lightMatrices[SHADOW_CASCADE];\nuniform float shadowCascadeClipsNear[SHADOW_CASCADE];\nuniform float shadowCascadeClipsFar[SHADOW_CASCADE];\n#endif\n@import clay.plugin.shadow_map_common\nvoid main()\n{\n    @import clay.deferred.chunk.gbuffer_read\n    vec3 L = -normalize(lightDirection);\n    vec3 V = normalize(eyePosition - position);\n    vec3 H = normalize(L + V);\n    float ndl = clamp(dot(N, L), 0.0, 1.0);\n    float ndh = clamp(dot(N, H), 0.0, 1.0);\n    float ndv = clamp(dot(N, V), 0.0, 1.0);\n    gl_FragColor.rgb = lightEquation(\n        lightColor, diffuseColor, specularColor, ndl, ndh, ndv, glossiness\n    );\n#ifdef SHADOWMAP_ENABLED\n    float shadowContrib = 1.0;\n    for (int _idx_ = 0; _idx_ < SHADOW_CASCADE; _idx_++) {{\n        if (\n            z >= shadowCascadeClipsNear[_idx_] &&\n            z <= shadowCascadeClipsFar[_idx_]\n        ) {\n            shadowContrib = computeShadowContrib(\n                lightShadowMap, lightMatrices[_idx_], position, lightShadowMapSize,\n                vec2(1.0 / float(SHADOW_CASCADE), 1.0),\n                vec2(float(_idx_) / float(SHADOW_CASCADE), 0.0)\n            );\n        }\n    }}\n    gl_FragColor.rgb *= shadowContrib;\n#endif\n    gl_FragColor.a = 1.0;\n}\n@end\n";
