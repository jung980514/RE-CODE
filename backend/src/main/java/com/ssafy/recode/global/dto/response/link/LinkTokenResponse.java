package com.ssafy.recode.global.dto.response.link;

public record LinkTokenResponse (
  String token,
  int expiresIn
){
}
