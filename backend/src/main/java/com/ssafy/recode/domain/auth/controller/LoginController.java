package com.ssafy.recode.domain.auth.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/api/user")
public class LoginController {

  /**
   * 로그인 페이지
   * @param model
   * @return
   */
  @GetMapping("/login/page")
  public String loginPage(Model model){
    return "login";
  }

  /**
   * 회원가입 페이지
   * @return
   */
  @GetMapping("/register")
  public String register() {
    return "register";
  }
}
