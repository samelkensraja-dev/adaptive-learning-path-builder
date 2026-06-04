package com.nilaapps.adaptive.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                // Allow any localhost port — Angular dev server may start on 4200, 4201,
                // or a random port (e.g. 49816) when 4200 is busy.
                // allowedOriginPatterns supports wildcards; allowedOrigins does NOT.
                registry.addMapping("/api/**")
                        .allowedOriginPatterns(
                            "http://localhost:*",
                            "http://127.0.0.1:*"
                        )
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("Content-Type", "Authorization", "X-Requested-With", "X-Encrypted")
                        .allowCredentials(false)
                        .maxAge(3600);
            }
        };
    }
}
