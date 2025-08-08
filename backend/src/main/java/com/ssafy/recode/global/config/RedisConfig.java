package com.ssafy.recode.global.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisPassword;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class RedisConfig {

  @Value("${spring.data.redis.host}")
  private String host;

  @Value("${spring.data.redis.port}")
  private int port;

  @Value("${spring.redis.password}")
  private String password;

  @Bean
  public RedisConnectionFactory redisConnectionFactory() {

//    return new LettuceConnectionFactory(host, port);
    RedisStandaloneConfiguration cfg = new RedisStandaloneConfiguration(host, port);
    cfg.setUsername("default");                   // Redis 6 ACL을 쓸 경우
    cfg.setPassword(RedisPassword.of(password));  // 비밀번호 설정
    return new LettuceConnectionFactory(cfg);
  }

  @Bean
  public RedisTemplate<String, Object> redisTemplate(ObjectMapper objectMapper) {
    RedisTemplate<String, Object> template = new RedisTemplate<>();
    template.setConnectionFactory(redisConnectionFactory());

    // Key 직렬화는 StringRedisSerializer 사용
    template.setKeySerializer(new StringRedisSerializer());

    // Value 직렬화는 House 객체를 JSON으로 변환할 수 있도록 Jackson2JsonRedisSerializer 사용
    Jackson2JsonRedisSerializer<Object> jacksonSerializer =
        new Jackson2JsonRedisSerializer<>(objectMapper, Object.class);
    // ObjectMapper 설정 (필요하면 추가 설정)
    template.setValueSerializer(jacksonSerializer);

    // Hash Key/Value 설정도 변경
    template.setHashKeySerializer(new StringRedisSerializer());
    template.setHashValueSerializer(jacksonSerializer);

    // 기본 serializer 설정
    template.setDefaultSerializer(jacksonSerializer);
    template.afterPropertiesSet();

    return template;
  }



}
