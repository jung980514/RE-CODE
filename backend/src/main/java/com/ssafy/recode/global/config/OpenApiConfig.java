package com.ssafy.recode.global.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

@OpenAPIDefinition(
        servers = {
                @Server(url = "https://i13e105.p.ssafy.io/", description = "EC2 Docker Container"),
                @Server(url = "https://recode-my-life.site/", description = "EC2 Docker Container")
        }
)
@Configuration
public class OpenApiConfig { }
