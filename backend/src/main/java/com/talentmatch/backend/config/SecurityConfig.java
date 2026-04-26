package com.talentmatch.backend.config;

import com.talentmatch.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.List;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter      jwtFilter;
    private final UserRepository userRepository; // ← zdat

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .headers(headers -> headers.frameOptions(frame -> frame.disable()))
            .cors(cors -> cors.configurationSource(corsSource()))
            .sessionManagement(s -> s.sessionCreationPolicy(
                SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth 
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/applications/**").permitAll()
                .requestMatchers("/api/candidat/cv/**").permitAll() 
                
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/matching/**").hasAnyRole("RECRUTEUR","ADMIN")
                .requestMatchers("/api/offres/**").hasAnyRole("RECRUTEUR","ADMIN")
                .requestMatchers("/api/analytics/**").hasAnyRole("RECRUTEUR","ADMIN")
                .requestMatchers("/api/candidat/**").hasAnyRole("CANDIDAT","ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter,UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public UserDetailsService userDetailsService() { // ← zdat
        return email -> userRepository.findByEmail(email)
            .map(user ->
                org.springframework.security.core.userdetails.User
                    .withUsername(user.getEmail())
                    .password(user.getPassword())
                    .roles(user.getRole().name())
                    .build())
            .orElseThrow(() ->
                new UsernameNotFoundException("User non trouvé: " + email));
    }

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
            "http://localhost:3000",
            "http://127.0.0.1:3000"
        ));
        config.setAllowedMethods(List.of(
            "GET","POST","PUT","DELETE","OPTIONS"
        ));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source =
            new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}