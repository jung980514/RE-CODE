// src/main/java/com/example/videosttbackend/filter/WebClientLoggingFilters.java
package com.ssafy.recode.global.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import reactor.core.publisher.Mono;

public class WebClientLoggingFilters {
  private static final Logger log = LoggerFactory.getLogger(WebClientLoggingFilters.class);

  public static ExchangeFilterFunction logRequest() {
    return ExchangeFilterFunction.ofRequestProcessor(req -> {
      log.info("⏩ Request: {} {}", req.method(), req.url());
      req.headers().forEach((name, values) ->
          values.forEach(value -> log.info("⏩ Header: {}={}", name, value))
      );
      return Mono.just(req);
    });
  }

  public static ExchangeFilterFunction logResponse() {
    return ExchangeFilterFunction.ofResponseProcessor(resp -> {
      log.info("⬅️ Response: {}", resp.statusCode());
      resp.headers().asHttpHeaders().forEach((name, values) ->
          values.forEach(value -> log.info("⬅️ Header: {}={}", name, value))
      );
      return Mono.just(resp);
    });
  }
}
