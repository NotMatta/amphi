package me.matta.amphi.common.bootstrap;

import me.matta.amphi.user.entity.Role;
import me.matta.amphi.user.entity.User;
import me.matta.amphi.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminBootstrapRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrapRunner.class);

    private final Environment environment;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ConfigurableApplicationContext context;

    public AdminBootstrapRunner(
            Environment environment,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            ConfigurableApplicationContext context
    ) {
        this.environment = environment;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.context = context;
    }

    @Override
    public void run(ApplicationArguments args) {
        boolean enabled = Boolean.parseBoolean(environment.getProperty("app.admin.enabled", "false"));
        if (!enabled) {
            return;
        }

        String resolvedEmail = firstNonBlank(
                environment.getProperty("app.admin.email"),
                environment.getProperty("app.admin.username"),
                environment.getProperty("ADMIN_EMAIL"),
                environment.getProperty("ADMIN_USERNAME")
        );
        String resolvedPassword = firstNonBlank(
                environment.getProperty("app.admin.password"),
                environment.getProperty("ADMIN_PASSWORD"),
                environment.getProperty("APP_ADMIN_PASSWORD")
        );
        String resolvedFirstName = firstNonBlank(
                environment.getProperty("app.admin.first-name"),
                environment.getProperty("ADMIN_FIRST_NAME"),
                environment.getProperty("APP_ADMIN_FIRST_NAME")
        );
        String resolvedLastName = firstNonBlank(
                environment.getProperty("app.admin.last-name"),
                environment.getProperty("ADMIN_LAST_NAME"),
                environment.getProperty("APP_ADMIN_LAST_NAME")
        );

        if (resolvedEmail.isBlank() || resolvedPassword.isBlank()) {
            log.error("Admin bootstrap failed: provide admin email/username and password via root .env (APP_ADMIN_EMAIL/APP_ADMIN_PASSWORD or ADMIN_EMAIL/ADMIN_PASSWORD), apps/api/admin.properties, apps/api/.env, environment variables, or -PadminEmail/-PadminPassword.");
            SpringApplication.exit(context, () -> 1);
            return;
        }

        resolvedEmail = resolvedEmail.toLowerCase().trim();
        try {
            User user = userRepository.findByEmail(resolvedEmail).orElse(null);
            if (user == null) {
                User created = new User();
                created.setEmail(resolvedEmail);
                created.setPasswordHash(passwordEncoder.encode(resolvedPassword));
                created.setFirstName(defaultIfBlank(resolvedFirstName, "Admin"));
                created.setLastName(defaultIfBlank(resolvedLastName, "User"));
                created.setRole(Role.ADMIN);
                userRepository.save(created);
                log.info("Admin user created: {}", resolvedEmail);
            } else {
                user.setPasswordHash(passwordEncoder.encode(resolvedPassword));
                user.setRole(Role.ADMIN);
                userRepository.save(user);
                log.info("Admin user updated (password/role): {}", resolvedEmail);
            }
            SpringApplication.exit(context, () -> 0);
        } catch (Exception e) {
            log.error("Admin bootstrap failed for {}: {}", resolvedEmail, e.getMessage(), e);
            SpringApplication.exit(context, () -> 1);
        }
    }

    private static String firstNonBlank(String... values) {
        if (values == null) return "";
        for (String value : values) {
            if (value != null && !value.trim().isEmpty()) {
                return value.trim();
            }
        }
        return "";
    }

    private static String defaultIfBlank(String value, String fallback) {
        return (value == null || value.trim().isEmpty()) ? fallback : value.trim();
    }
}