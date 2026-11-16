package me.matta.amphi.common.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.DependsOn;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@DependsOn("entityManagerFactory")
public class SqliteSchemaPatch {

    private static final Logger log = LoggerFactory.getLogger(SqliteSchemaPatch.class);

    private final JdbcTemplate jdbcTemplate;

    public SqliteSchemaPatch(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void patchSchema() {
        try {
            ensureMembershipBannedColumn();
        } catch (Exception e) {
            log.warn("SQLite schema patch failed (may be harmless if schema already up to date): {}", e.getMessage());
        }
    }

    private void ensureMembershipBannedColumn() {
        if (!tableExists("memberships")) return;
        if (columnExists("memberships", "banned")) return;
        try {
            jdbcTemplate.execute("ALTER TABLE memberships ADD COLUMN banned BOOLEAN NOT NULL DEFAULT 0");
            log.info("Added missing column memberships.banned");
        } catch (Exception e) {
            try {
                jdbcTemplate.execute("ALTER TABLE memberships ADD COLUMN banned INTEGER NOT NULL DEFAULT 0");
                log.info("Added missing column memberships.banned (integer fallback)");
            } catch (Exception ex) {
                log.warn("Failed to add memberships.banned: {}", ex.getMessage());
            }
        }
    }

    private boolean tableExists(String table) {
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT name FROM sqlite_master WHERE type='table' AND lower(name)=lower(?)", table);
            return rows != null && !rows.isEmpty();
        } catch (Exception e) {
            return false;
        }
    }

    private boolean columnExists(String table, String column) {
        try {
            List<Map<String, Object>> cols = jdbcTemplate.queryForList("PRAGMA table_info(" + table + ")");
            for (Map<String, Object> c : cols) {
                Object name = c.get("name");
                if (name != null && column.equalsIgnoreCase(String.valueOf(name))) {
                    return true;
                }
            }
            return false;
        } catch (Exception e) {
            return true;
        }
    }
}
