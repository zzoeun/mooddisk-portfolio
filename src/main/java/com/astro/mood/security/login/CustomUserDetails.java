package com.astro.mood.security.login;

import com.astro.mood.web.dto.auth.UserRole;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.Set;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomUserDetails  implements UserDetails {
    private Integer userIdx;
    private String nickname;
    private String email;
    private String profileImage;
    private Set<UserRole> authorities;
    private String role;


    public Integer getUserIdx() {
        return userIdx;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        if (role != null && role.equals("ROLE_ADMIN")) {
            return List.of(new SimpleGrantedAuthority("ROLE_ADMIN"));
        }
        return List.of(new SimpleGrantedAuthority("ROLE_USER"));
    }
    public Set<UserRole> getAuthoritySet() {
        return authorities;
    }
    @Override
    public String getPassword() {
        return "";
    }

    @Override
    public String getUsername() {
        return this.email;
    }

}
