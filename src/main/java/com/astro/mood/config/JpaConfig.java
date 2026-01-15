package com.astro.mood.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.JpaVendorAdapter;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.PlatformTransactionManager;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;

@Configuration
@RequiredArgsConstructor
@EnableConfigurationProperties(DataSourceProperties.class)
@EntityScan(basePackages = "com.astro.mood.data.entity")
@EnableJpaRepositories(basePackages = "com.astro.mood.data.repository", entityManagerFactoryRef = "entityManagerFactoryBean", transactionManagerRef = "tmJpa")
public class JpaConfig {
    private final DataSourceProperties dataSourceProperties;

    @Autowired
    private Environment environment;

    @Bean
    public DataSource dataSource() {
        DriverManagerDataSource dataSource = new DriverManagerDataSource();
        dataSource.setUsername(dataSourceProperties.getUsername());
        dataSource.setPassword(dataSourceProperties.getPassword());
        dataSource.setDriverClassName(dataSourceProperties.getDriverClassName());
        dataSource.setUrl(dataSourceProperties.getUrl());
        return dataSource;
    }

    @Bean
    public LocalContainerEntityManagerFactoryBean entityManagerFactoryBean() {
        LocalContainerEntityManagerFactoryBean em = new LocalContainerEntityManagerFactoryBean();
        em.setDataSource(dataSource());
        em.setPackagesToScan("com.astro.mood.data.entity");

        JpaVendorAdapter vendorAdapter = new HibernateJpaVendorAdapter();
        em.setJpaVendorAdapter(vendorAdapter);

        Map<String, Object> properties = new HashMap<>();

        // Environment에서 ddl-auto 설정 읽어오기 (application-dev.yaml 또는
        // application-prod.yaml의 설정 사용)
        String ddlAuto = environment.getProperty("spring.jpa.hibernate.ddl-auto", "update");
        properties.put("hibernate.hbm2ddl.auto", ddlAuto);

        // 프로덕션 환경에서는 SQL 로깅 비활성화
        if (isProductionProfile()) {
            properties.put("hibernate.format_sql", "false");
            properties.put("hibernate.show_sql", "false");
            properties.put("hibernate.use_sql_comments", "false");
            // 추가적인 SQL 로깅 비활성화 설정
            properties.put("hibernate.generate_statistics", "false");
            properties.put("hibernate.session.events.log.LOG_QUERIES_SLOWER_THAN_MS", "0");
            System.out.println("Setting production Hibernate properties - SQL logging disabled, ddl-auto: " + ddlAuto);
        } else {
            // 개발 환경에서는 SQL 로깅 활성화
            properties.put("hibernate.format_sql", "true");
            properties.put("hibernate.show_sql", "true");
            properties.put("hibernate.use_sql_comments", "true");
            System.out.println("Setting development Hibernate properties - SQL logging enabled, ddl-auto: " + ddlAuto);
        }

        System.out.println("Hibernate properties: " + properties);
        em.setJpaPropertyMap(properties);
        return em;
    }

    /**
     * 현재 프로파일이 프로덕션인지 확인
     */
    private boolean isProductionProfile() {
        String[] activeProfiles = environment.getActiveProfiles();
        System.out.println("Active profiles: " + java.util.Arrays.toString(activeProfiles));
        for (String profile : activeProfiles) {
            if ("prod".equals(profile) || "production".equals(profile)) {
                System.out.println("Production profile detected: " + profile);
                return true;
            }
        }
        System.out.println("No production profile detected, using development settings");
        return false;
    }

    @Bean(name = "tmJpa")
    public PlatformTransactionManager transactionManager() {
        JpaTransactionManager transactionManager = new JpaTransactionManager();
        transactionManager.setEntityManagerFactory(entityManagerFactoryBean().getObject());
        return transactionManager;
    }

}
