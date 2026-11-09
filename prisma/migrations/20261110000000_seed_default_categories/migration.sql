-- Default categories are inserted once by this migration instead of on every start-up,
-- so a default category the user deletes is never recreated.
INSERT IGNORE INTO `categories` (`name`, `icon`, `sort_order`) VALUES
    ('網站會員', '🌐', 10),
    ('影音串流', '🎬', 20),
    ('軟體訂閱', '💻', 30),
    ('電信費', '📱', 40),
    ('保險費', '🛡️', 50),
    ('水電瓦斯', '💡', 60),
    ('其他', '📦', 999);
